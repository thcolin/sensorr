import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { editionOf } from '@sensorr/sensorr'
import { Task, Tasks, useTask, StdinMock } from '../components/Taskink'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'wrapped',
  desc: '🎞️ Import the Plex watch history from Tautulli and freeze the closed wrapped editions',
  builder: {},
}

const TIME_ZONE = 'Europe/Paris'
const PAGE = 1000

const Tautulli = ({ url, key }) => async (cmd, params = {}) => {
  const uri = new URL('api/v2', url.replace(/\/?$/, '/'))
  uri.search = new URLSearchParams(Object.entries({ apikey: key, cmd, ...params }).filter(([, value]) => value !== undefined)).toString()
  const res = await fetch(uri)
  const body = await res.json()

  if (body?.response?.result !== 'success') {
    throw new Error(body?.response?.message || `Tautulli "${cmd}" failed with status ${res.status}`)
  }

  return body.response.data
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    if (!config.get('tautulli.url') || !config.get('tautulli.key')) {
      throw new Error('Tautulli is not configured, fill its URL and API key on the "Tautulli" Settings page')
    }

    const tautulli = Tautulli({ url: config.get('tautulli.url'), key: config.get('tautulli.key') })

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, tautulli }}>
        <ImportViewersTask />
        <ImportPlaysTask />
        <ImportTitlesTask />
        <FreezeEditionsTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const ImportViewersTask = () => {
  const { task, setTask, status, setStatus, context: { state, handleError } } = useTask({
    id: 'import-viewers',
    title: '👥 Import Tautulli users...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const users = await state.tautulli('get_users')
        const viewers = users.map(({ user_id, email, username, friendly_name }) => ({ user_id, email, username, friendly_name }))
        const { uri, params, init } = api.query.wrapped.postViewers({ body: viewers })
        await api.fetch(uri, params, init)
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{viewers.length}</Text> Tautulli users imported</Text> }))
        setStatus('done')
        state.logger.info({ message: `👥 ${viewers.length} Tautulli users imported`, metadata: { ...state.metadata, summary: { viewers: viewers.length } } })
      } catch (error) {
        setStatus('error')
        setTask((task) => ({ ...task, error: error.message || error }))
        handleError(error)
      }
    }

    cb()
  }, [])

  return (
    <Task {...task} status={status} />
  )
}

const ImportPlaysTask = () => {
  const { task, setTask, status, setStatus, ready, context: { state, setState, handleError } } = useTask({
    id: 'import-plays',
    title: '🍿 Import Tautulli history...',
  },
  {
    dependencies: ['import-viewers'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')

      try {
        const last = api.query.wrapped.getLastPlay()
        const { started } = await api.fetch(last.uri, last.params, last.init)
        // Two days back: a grouped row keeps growing while its sessions go on
        const after = started ? new Date((started - 2 * 86400) * 1000).toISOString().slice(0, 10) : undefined
        const titles = {}
        let imported = 0
        let earliest = null
        let total = 0

        for (let start = 0; start === 0 || start < total; start += PAGE) {
          const { data, recordsFiltered } = await state.tautulli('get_history', { grouping: 1, order_column: 'date', order_dir: 'asc', start, length: PAGE, after })
          total = recordsFiltered

          // A session still playing has no id yet, the next run imports it
          const plays = data
            .filter((row) => row.reference_id && ['movie', 'episode'].includes(row.media_type))
            .map((row) => {
              const movie = row.media_type === 'movie'
              const title = movie ? row.guid : `show:${row.grandparent_rating_key}`
              titles[title] = { rating_key: movie ? row.rating_key : row.grandparent_rating_key, media_type: movie ? 'movie' : 'show', title: movie ? row.title : row.grandparent_title }
              return { id: row.reference_id, user_id: row.user_id, media_type: row.media_type, title, started: row.started, stopped: row.stopped, play_duration: row.play_duration }
            })

          if (plays.length) {
            const { uri, params, init } = api.query.wrapped.postPlays({ body: plays })
            await api.fetch(uri, params, init)
            imported += plays.length
            earliest = Math.min(earliest ?? Infinity, ...plays.map((play) => play.started))
          }

          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{imported}</Text> plays imported{after ? ` since ${after}` : ''}</Text> }))
        }

        setState((state) => ({ ...state, titles, earliest }))
        setStatus('done')
        state.logger.info({ message: `🍿 ${imported} plays imported${after ? ` since ${after}` : ''}`, metadata: { ...state.metadata, summary: { plays: imported } } })
      } catch (error) {
        setStatus('error')
        setTask((task) => ({ ...task, error: error.message || error }))
        handleError(error)
      }
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}

const ImportTitlesTask = () => {
  const { task, setTask, status, setStatus, ready, context: { state, handleError } } = useTask({
    id: 'import-titles',
    title: '🎬 Import watched movies and shows metadata...',
  },
  {
    dependencies: ['import-plays'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')

      try {
        const existing = api.query.wrapped.getTitles()
        const known = new Set(await api.fetch(existing.uri, existing.params, existing.init))
        const missing = Object.entries(state.titles).filter(([key]) => !known.has(key))
        const titles = []

        for (const [key, { rating_key, media_type, title }] of missing) {
          setTask((task) => ({ ...task, output: `Look at "${title}" (${titles.length + 1}/${missing.length})` }))
          let metadata = {}

          try {
            metadata = await state.tautulli('get_metadata', { rating_key })
          } catch (error) {
            state.logger.warn({ message: `Unable to read "${title}" metadata from Tautulli: "${error.message || error}"`, metadata: { ...state.metadata, title: key } })
          }

          const tmdb = (metadata.guids || []).find((guid) => guid.startsWith('tmdb://'))
          titles.push({
            key,
            media_type,
            title: metadata.title || title,
            year: Number(metadata.year) || undefined,
            genres: metadata.genres || [],
            directors: metadata.directors || [],
            tmdb_id: tmdb ? Number(tmdb.replace('tmdb://', '')) : undefined,
            thumb: metadata.thumb,
            art: metadata.art,
            duration: metadata.duration ? Math.round(Number(metadata.duration) / 1000) : undefined,
          })

          if (titles.length % 100 === 0 || titles.length === missing.length) {
            const { uri, params, init } = api.query.wrapped.postTitles({ body: titles.slice(-(titles.length % 100 || 100)) })
            await api.fetch(uri, params, init)
          }
        }

        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{titles.length}</Text> new movies and shows</Text> }))
        setStatus('done')
        state.logger.info({ message: `🎬 ${titles.length} new movies and shows`, metadata: { ...state.metadata, summary: { titles: titles.length } } })
      } catch (error) {
        setStatus('error')
        setTask((task) => ({ ...task, error: error.message || error }))
        handleError(error)
      }
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}

const FreezeEditionsTask = () => {
  const { task, setTask, status, setStatus, ready, context: { state, handleError } } = useTask({
    id: 'freeze-editions',
    title: '🧊 Freeze closed editions...',
  },
  {
    dependencies: ['import-titles'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')

      try {
        const now = Date.now() / 1000
        const current = editionOf(now, TIME_ZONE)
        const frozen = []

        // Every edition closed since the earliest play just imported, the freeze leaves an edition already frozen as it is
        for (let year = Math.min(editionOf(state.earliest ?? now, TIME_ZONE), current - 1); year < current; year++) {
          const { uri, params, init } = api.query.wrapped.postFreeze({ body: { year } })
          const res = await api.fetch(uri, params, init)

          if (res.frozen) {
            frozen.push(`${year} (${res.frozen} users)`)
          }
        }

        setTask((task) => ({ ...task, output: frozen.length ? <Text>Froze <Text bold={true}>{frozen.join(', ')}</Text></Text> : 'No edition to freeze' }))
        setStatus('done')
        state.logger.info({ message: `🧊 ${frozen.length ? `Froze ${frozen.join(', ')}` : 'No edition to freeze'}`, metadata: { ...state.metadata, summary: { frozen: frozen.length } } })
      } catch (error) {
        setStatus('error')
        setTask((task) => ({ ...task, error: error.message || error }))
        handleError(error)
      }
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}
