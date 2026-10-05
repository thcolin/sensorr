import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { editionOf, WRAPPED_TIME_ZONE as TIME_ZONE } from '@sensorr/sensorr'
import { TMDB } from '@sensorr/tmdb'
import { Task, Tasks, useTask, StdinMock } from '../components/Taskink'
import api from '../store/api'
import command from '../utils/command'
import { isOldGuid, sameMovieOf, tmdbOf } from '../utils/wrapped'

const meta = {
  command: 'wrapped',
  desc: '🎞️ Import the Plex watch history from Tautulli and freeze the closed wrapped editions',
  builder: {},
}

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
    const tmdb = new TMDB({ key: config.get('tmdb'), region: config.get('region') || 'en-US', adult: config.get('adult') })
    await tmdb.init()

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, tautulli, tmdb }}>
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
        // The whole history every time: Tautulli filters sessions by date before grouping them, so a
        // date window would split a play resumed days later into two rows
        const plays = []
        const latest = {}
        let total = 0

        for (let start = 0; start === 0 || start < total; start += PAGE) {
          const { data, recordsFiltered } = await state.tautulli('get_history', { grouping: 1, order_column: 'date', order_dir: 'asc', start, length: PAGE })
          total = recordsFiltered

          // A session still playing has no id yet, the next run imports it
          for (const row of data.filter((row) => row.id && ['movie', 'episode'].includes(row.media_type))) {
            const movie = row.media_type === 'movie'
            const rating_key = movie ? row.rating_key : row.grandparent_rating_key
            latest[`${row.media_type}:${rating_key}`] = { guid: row.guid, title: movie ? row.title : row.grandparent_title }
            // The first session of a group stays while the group grows, `reference_id` can point to a session years older
            const sessions = String(row.group_ids || row.id).split(',').map(Number)
            plays.push({
              id: Math.min(...sessions),
              seen: state.metadata.job,
              user_id: row.user_id,
              media_type: row.media_type,
              title: movie ? row.guid : `show:${rating_key}`,
              rating_key,
              started: row.started,
              stopped: row.stopped,
              play_duration: row.play_duration,
              ...(movie ? {} : { parent_media_index: Number(row.parent_media_index) || undefined, media_index: Number(row.media_index) || undefined }),
            })
          }

          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{plays.length}</Text> plays read</Text> }))
        }

        const titles = {}

        // Tautulli keeps the guid a movie had when it was played: one the new agent matched since takes the guid of its last play
        for (const play of plays) {
          const movie = play.media_type === 'movie'
          const last = latest[`${play.media_type}:${play.rating_key}`]
          play.title = movie && isOldGuid(play.title) && last.guid.startsWith('plex://') ? last.guid : play.title
          titles[play.title] = { rating_key: play.rating_key, media_type: movie ? 'movie' : 'show', title: last.title }
          delete play.rating_key
        }

        for (let start = 0; start < plays.length; start += PAGE) {
          const { uri, params, init } = api.query.wrapped.postPlays({ body: plays.slice(start, start + PAGE) })
          await api.fetch(uri, params, init)
          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{Math.min(start + PAGE, plays.length)}</Text> plays imported</Text> }))
        }

        const imported = plays.length

        const prune = api.query.wrapped.prunePlays({ body: { seen: state.metadata.job } })
        const { deleted } = await api.fetch(prune.uri, prune.params, prune.init)
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{imported}</Text> plays imported, <Text bold={true}>{deleted}</Text> gone from Tautulli removed</Text> }))
        setState((state) => ({ ...state, titles }))
        setStatus('done')
        state.logger.info({ message: `🍿 ${imported} plays imported, ${deleted} gone from Tautulli removed`, metadata: { ...state.metadata, summary: { plays: imported, deleted } } })
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
        let failed = 0

        const flush = async () => {
          if (titles.length) {
            const { uri, params, init } = api.query.wrapped.postTitles({ body: titles.splice(0) })
            await api.fetch(uri, params, init)
          }
        }

        for (const [index, [key, { rating_key, media_type, title }]] of missing.entries()) {
          setTask((task) => ({ ...task, output: `Look at "${title}" (${index + 1}/${missing.length})` }))
          let metadata

          try {
            metadata = await state.tautulli('get_metadata', { rating_key }) || {}

            // Its rating key now belongs to another movie
            if (media_type === 'movie' && !sameMovieOf(key, metadata)) {
              metadata = {}
            }
          } catch (error) {
            state.logger.warn({ message: `Unable to read "${title}" metadata from Tautulli: "${error.message || error}"`, metadata: { ...state.metadata, title: key } })

            // Tautulli or Plex unreachable: left out, so the next run looks it up again
            if (!/^Unable to retrieve metadata/.test(error.message)) {
              failed++
              continue
            }

            // Gone from Plex: TMDB describes it, else only the name from the history holds
            metadata = {}
          }

          if (media_type === 'movie' && !metadata.guid) {
            try {
              metadata = await tmdbOf(state.tmdb, key)
            } catch (error) {
              failed++
              state.logger.warn({ message: `Unable to read "${title}" metadata from TMDB: "${error.message || error}"`, metadata: { ...state.metadata, title: key } })
            }
          }

          const tmdb = (metadata.guids || []).find((guid) => guid.startsWith('tmdb://'))
          titles.push({
            key,
            media_type,
            title: metadata.title || title,
            year: Number(metadata.year) || undefined,
            genres: metadata.genres || [],
            directors: metadata.directors || [],
            actors: (metadata.actors || []).slice(0, 5),
            tmdb_id: tmdb ? Number(tmdb.replace('tmdb://', '')) : undefined,
            thumb: metadata.thumb,
            art: metadata.art,
            duration: metadata.duration ? Math.round(Number(metadata.duration) / 1000) : undefined,
            episode_count: media_type === 'show' ? Number(metadata.children_count) || undefined : undefined,
          })

          if (titles.length === 100) {
            await flush()
          }
        }

        await flush()
        const found = missing.length - failed
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{found}</Text> new movies and shows{failed ? `, ${failed} left for the next run` : ''}</Text> }))
        setStatus('done')
        state.logger.info({ message: `🎬 ${found} new movies and shows${failed ? `, ${failed} left for the next run` : ''}`, metadata: { ...state.metadata, summary: { titles: found, failed } } })
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
        const range = api.query.wrapped.getPlaysRange()
        const { first } = await api.fetch(range.uri, range.params, range.init)
        const frozen = []

        // Every closed edition since the first play, the freeze leaves an edition already frozen as it is
        for (let year = first ? editionOf(first, TIME_ZONE) : current; year < current; year++) {
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
