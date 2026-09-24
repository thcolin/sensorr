import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'
import { fetchShow, fetchSensorrShows, isRefreshDue, monitoredOf } from '../utils/shows'

const meta = {
  command: 'refresh-shows',
  desc: '🔌 Refresh Sensorr shows and their episodes with TMDB latest changes',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const tmdb = new TMDB({
      key: config.get('tmdb'),
      region: config.get('region') || 'en-US',
      adult: config.get('adult'),
    })

    await tmdb.init()

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, tmdb }}>
        <FetchAPIShowsTask />
        <FetchTMDBShowsChangesTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchAPIShowsTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-shows',
    title: '🗄️ Fetch shows from API...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const shows = await fetchSensorrShows(api, { fields: 'id|name|status|refreshed_at|monitored|monitor_new_seasons' })
        const now = Date.now()
        const due = shows.filter((show) => isRefreshDue(show, now))
        setState((state) => ({ ...state, shows: due }))
        state.logger.info({ message: `🗄️ ${due.length} of ${shows.length} shows due for a refresh`, metadata: { ...state.metadata, summary: { entities: shows.length, due: due.length } } })
        await new Promise(resolve => setTimeout(resolve, 600))
        setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{due.length}</Text> of <Text bold={true}>{shows.length}</Text> shows due for a refresh</Text>) }))
        setStatus('done')
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

const FetchTMDBShowsChangesTask = ({ ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state } } = useTask({
    id: 'fetch-show-changes',
    title: '📺 Fetch show changes on Sensorr...',
  }, { dependencies: ['fetch-api-shows'] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      let success = 0, warning = 0, episodes = 0
      setStatus('loading')

      for (const entity of (state.shows || [])) {
        let title = entity.name || `#${entity.id}`
        const link = `https://www.themoviedb.org/tv/${entity.id}`

        try {
          setTask((task) => ({
            ...task,
            title: (
              <Text>
                📺 Fetch show changes on Sensorr {(
                  <Text color='grey'>({state.shows.indexOf(entity) + 1}/{state.shows.length})</Text>
                )}
              </Text>
            ),
            output: `Fetch TMDB show "${title}" data...`,
          }))

          const { show, episodes: fetched } = await fetchShow(state.tmdb, entity.id)
          title = show.name || title

          const { uri: episodesUri, params: episodesParams, init: episodesInit } = api.query.shows.getShowEpisodes({ params: { id: entity.id } })
          const known = await api.fetch(episodesUri, episodesParams, episodesInit)
          const ids = new Set(known.map(({ id }) => id))
          const added = fetched.filter(({ id }) => !ids.has(id))

          setTask((task) => ({ ...task, output: `Refresh Sensorr show "${title}" data...` }))
          const shows = api.query.shows.postShows({ body: { [entity.id]: { ...show, refreshed_at: new Date() } } })
          await api.fetch(shows.uri, shows.params, shows.init)

          if (fetched.length) {
            const { uri, params, init } = api.query.episodes.postEpisodes({
              body: fetched.reduce((acc, episode) => ({
                ...acc,
                [episode.id]: ids.has(episode.id) ? episode : { ...episode, monitored: monitoredOf(episode, entity, known) },
              }), {}),
            })
            await api.fetch(uri, params, init)
          }

          state.logger.info({ message: `Refresh "${title}" data${added.length ? `, ${added.length} new episodes` : ''}`, metadata: { ...state.metadata, group: entity.id, type: 'show', entity: lighten.show(show), added: added.length } })
          episodes += added.length
          success++
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
          state.logger.warn({ message: `⚠️ Error during show "${title}" (${link}) refresh from TMDB: "${error?.message || error}"`, metadata: { ...state.metadata, group: entity.id, type: 'show', entity: { id: Number(entity.id), name: title, link }, warning: error } })
          warning++
        }
      }

      state.logger.info({ message: `📺 Applied ${success} show changes on Sensorr, ${episodes} new episodes`, metadata: { ...state.metadata, summary: { show: { success, warning, episodes } } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{success}</Text> show changes applied, <Text bold={true}>{episodes}</Text> new episodes</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}
