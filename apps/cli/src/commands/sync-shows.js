import React, { useEffect } from 'react'
import fs from 'node:fs/promises'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Plex } from '@sensorr/plex'
import { Task, Tasks, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'
import { showFilesOf } from '../utils/plex'
import { fetchShow, fetchSensorrShows } from '../utils/shows'

const meta = {
  command: 'sync',
  type: 'show',
  desc: '🔗 Sync Sensorr shows with registered Plex server',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    if (!config.get('plex.url')) {
      throw new Error('You need to register a Plex server with Sensorr settings page before sync to it !')
    }

    const app = JSON.parse(await fs.readFile(new URL('../../../../package.json', import.meta.url)))
    // Use the installation's unique, persisted X-Plex-Client-Identifier
    app.plex = config.get('plex.client_identifier') || app.plex
    const plex = Plex(config.get('plex'), app)
    const tmdb = new TMDB({
      key: config.get('tmdb'),
      region: config.get('region') || 'en-US',
      adult: config.get('adult'),
    })

    await tmdb.init()

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command, type: meta.type }, logger, plex, tmdb }}>
        <FetchSensorrShowsTask />
        <FetchPlexShowsTask />
        <CheckSensorrShowsTask />
        <ComputeSensorrMissingEpisodesTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchSensorrShowsTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sensorr-shows',
    title: '🗄️  Fetch Sensorr library shows...',
  }, { dependencies: [] })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const library = await fetchSensorrShows(api, { fields: 'id|name|genres|poster_path|vote_average' })
        const { uri, params, init } = api.query.episodes.getEpisodes({ params: { fields: 'id|show_id|season_number|episode_number|files' } })
        const { results } = await api.fetch(uri, { ...params, limit: '' }, init)
        const episodes = results.reduce((acc, episode) => ({ ...acc, [episode.show_id]: [...(acc[episode.show_id] || []), episode] }), {})
        setState((state) => ({ ...state, library, episodes }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{library.length}</Text> shows and <Text bold={true}>{results.length}</Text> episodes found</Text> }))
        setStatus('done')
        state.logger.info({ message: `🗄️  ${library.length} shows and ${results.length} episodes in Sensorr library`, metadata: { ...state.metadata, summary: { shows: library.length, episodes: results.length } } })
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

const FetchPlexShowsTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-plex-shows',
    title: '📡 Fetch Plex library shows...',
  })

  useEffect(() => {
    const cb = async () => {
      let shows = 0, episodes = 0
      setStatus('loading')

      try {
        const { MediaContainer: { machineIdentifier: server } } = await state.plex.query('/')
        const raw = await state.plex.query('/library/sections')
        const sections = raw.MediaContainer.Directory.filter((dir) => dir.type === 'show')
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{sections.length}</Text> section(s) found on Plex Server <Text bold={true}>{server}</Text></Text> }))

        for (const section of sections) {
          const { MediaContainer: { Metadata: distant = [] } } = await state.plex.query(`/library/sections/${section.key}/all?includeGuids=1`)
          const { MediaContainer: { Metadata: items = [] } } = await state.plex.query(`/library/sections/${section.key}/all?type=4`)
          shows += distant.length
          episodes += items.length
          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{shows}</Text> shows and <Text bold={true}>{episodes}</Text> episodes found on <Text bold={true}>{sections.length}</Text> section(s) on Plex Server <Text bold={true}>{server}</Text></Text> }))
          setState((state) => ({ ...state, distant: [...(state.distant || []), ...distant], items: [...(state.items || []), ...items] }))
        }

        setStatus('done')
        state.logger.info({ message: `📡 ${shows} shows and ${episodes} episodes available on Plex server`, metadata: { ...state.metadata, summary: { plex: { shows, episodes } } } })
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

const CheckSensorrShowsTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, ready, context: { state, setState } } = useTask({
    id: 'check-sensorr-shows',
    title: '🔎 Check Sensorr shows...',
  },
  {
    dependencies: ['fetch-sensorr-shows', 'fetch-plex-shows'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      const corrections = [], created = [], warning = []
      let missing = 0, unmatched = 0
      setStatus('loading')

      // Plex may hold one TMDB show in several items, their episodes are read together
      const distant = (state.distant || []).reduce((acc, payload) => {
        const tmdb = ((payload.Guid || []).find(({ id }) => id.startsWith('tmdb://'))?.id || '').replace('tmdb://', '')

        if (!tmdb) {
          state.logger.warn({ message: `⚠️ Error, Plex show "${payload.title}" without TMDB id, not associatable`, metadata: { ...state.metadata, group: 'corrections', payload } })
          warning.push(payload.key)
          return acc
        }

        return { ...acc, [tmdb]: { title: payload.title, keys: [...(acc[tmdb]?.keys || []), `${payload.ratingKey}`] } }
      }, {})

      setState((state) => ({ ...state, processed: Object.keys(distant).map(Number) }))

      for (const [tmdb, { title, keys }] of Object.entries(distant)) {
        try {
          setTask((task) => ({
            ...task,
            title: (
              <Text>
                🔎 Check Sensorr shows {(
                  <Text color='grey'>({Object.keys(distant).indexOf(tmdb) + 1}/{Object.keys(distant).length})</Text>
                )}
              </Text>
            ),
            output: <Text><Text bold={true}>{title}</Text> - Match Plex episodes files</Text>,
          }))

          const items = (state.items || []).filter((item) => keys.includes(`${item.grandparentRatingKey}`))
          let show = (state.library || []).find((show) => `${show.id}` === tmdb)
          const unknown = !show
          let episodes = state.episodes?.[tmdb] || []

          if (unknown) {
            const fetched = await fetchShow(state.tmdb, tmdb)
            show = fetched.show
            episodes = fetched.episodes.map((episode) => ({ ...episode, monitored: false }))
            const { uri, params, init } = api.query.shows.postShows({ body: { [show.id]: { ...show, state: 'archived', monitored: false, refreshed_at: new Date() } } })
            await api.fetch(uri, params, init)
            state.logger.info({ message: `🩹 Add "${show.name}" show from Plex (archived)`, metadata: { ...state.metadata, group: 'corrections', show: lighten.show(show) } })
            created.push(show.id)
          }

          const synced = showFilesOf(episodes, items)
          const changes = synced.episodes.filter((episode, index) => JSON.stringify(episode.files) !== JSON.stringify(episodes[index].files || []))
          const lost = changes.filter(({ files }) => !files.length).length
          unmatched += synced.unmatched

          if (unknown || changes.length) {
            const { uri, params, init } = api.query.episodes.postEpisodes({
              body: (unknown ? synced.episodes : changes).reduce((acc, episode) => ({
                ...acc,
                [episode.id]: unknown ? episode : { files: episode.files },
              }), {}),
            })
            await api.fetch(uri, params, init)
            corrections.push(show.id)
            state.logger.info({ message: `🩹 Fix ${changes.length} "${show.name}" episodes files with Plex metadata`, metadata: { ...state.metadata, group: 'corrections', show: lighten.show(show), changes: changes.length, unmatched: synced.unmatched } })
          }

          if (lost) {
            missing += lost
            state.logger.warn({ message: `💊 ${lost} "${show.name}" episodes no longer on Plex`, metadata: { ...state.metadata, group: 'missings', show: lighten.show(show), missing: lost } })
          }

          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{show.name}</Text> - {changes.length} episodes files fixed</Text> }))
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message}` }))
          state.logger.warn({ message: `⚠️ Error on "${title}" Plex show, "${error.message}"`, metadata: { ...state.metadata, group: 'corrections', error, tmdb } })
          warning.push(tmdb)
        }
      }

      setState((state) => ({ ...state, missing }))
      await new Promise(resolve => setTimeout(resolve, 500))
      state.logger.info({ message: `🩹 ${corrections.length} Fixed shows with Plex metadata`, metadata: { ...state.metadata, summary: { corrections: { success: corrections.length, warning: warning.length }, created: created.length, unmatched } } })
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{corrections.length}</Text> shows fixed with Plex metadata, <Text bold={true}>{created.length}</Text> added (<Text bold={true}>archived</Text>)</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}

const ComputeSensorrMissingEpisodesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, ready, context: { state } } = useTask({
    id: 'compute-sensorr-missing-episodes',
    title: '💊 Compute Sensorr "missing" episodes...',
  },
  {
    dependencies: ['check-sensorr-shows'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      let missing = state.missing || 0
      const warning = []
      setStatus('loading')

      for (const show of (state.library || []).filter(({ id }) => !(state.processed || []).includes(id))) {
        const lost = (state.episodes?.[show.id] || []).filter(({ files }) => files?.length)

        if (!lost.length) {
          continue
        }

        try {
          const { uri, params, init } = api.query.episodes.postEpisodes({ body: lost.reduce((acc, { id }) => ({ ...acc, [id]: { files: [] } }), {}) })
          await api.fetch(uri, params, init)
          missing += lost.length
          state.logger.warn({ message: `💊 ${lost.length} "${show.name}" episodes no longer on Plex`, metadata: { ...state.metadata, group: 'missings', show: lighten.show(show), missing: lost.length } })
          setTask((task) => ({ ...task, output: <Text>Show <Text bold={true}>{show.name}</Text> not found on Plex, <Text bold={true}>{lost.length}</Text> episodes "missing"</Text> }))
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message}` }))
          state.logger.warn({ message: `⚠️ Error on "${show.name}" Plex show, "${error.message}"`, metadata: { ...state.metadata, group: 'missings', error, show: lighten.show(show) } })
          warning.push(show.id)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      state.logger.info({ message: `💊 ${missing} Missing episodes in Sensorr but no longer on Plex`, metadata: { ...state.metadata, summary: { missings: { success: missing, warning: warning.length } } } })
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{missing}</Text> episodes no longer on Plex, now <Text bold={true}>missing</Text> on Sensorr</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}
