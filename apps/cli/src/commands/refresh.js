import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'refresh',
  desc: '🔌 Refresh Sensorr entities with TMDB latest changes',
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
        <FetchAPIEntitiesTask />
        <FetchTMDBChangesTask type='movie' />
        <FetchTMDBChangesTask type='person' dependencies={['fetch-movie-changes']} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchAPIEntitiesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-entities',
    title: '🗄️ Fetch entities from API...',
  })

  useEffect(() => {
    const cb = async () => {
      let length = 0

      for (const type of ['movie', 'person']) {
        try {
          setStatus('loading')
          let metadata = {}
          let total_pages = null
          let page = 0
          do {
            const { uri, params, init } = api.query[`${type}s`].getMetadata({ params: { page: page++ } })
            const raw = await api.fetch(uri, params, init)
            total_pages = raw.total_pages
            metadata = { ...metadata, ...raw.results }
          } while (!total_pages || page <= total_pages)
          setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{Object.keys(metadata).length}</Text> {type}s</Text>) }))
          length += Object.keys(metadata).length
          setState((state) => ({ ...state, [type]: { ...state?.[type], entities: Object.keys(metadata) } }))
        } catch (error) {
          setStatus('error')
          setTask((task) => ({ ...task, error: error.message || error }))
          handleError(error)
        }
      }

      state.logger.info({ message: `🗄️ ${length} entities`, metadata: { ...state.metadata, summary: { entities: length } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{length}</Text> total entities</Text>) }))
      setStatus('done')
    }

    cb()
  }, [])

  return (
    <Task {...task} status={status} />
  )
}

const FetchTMDBChangesTask = ({ type = 'movie', dependencies = [], ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state } } = useTask({
    id: `fetch-${type}-changes`,
    title: `${{ movie: '🎞️', person: '⭐️' }[type]} Fetch ${type} changes on Sensorr...`,
  }, { dependencies: [`fetch-api-entities`, ...dependencies] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      let success = 0, warning = 0
      setStatus('loading')

      for (let id of (state?.[type]?.entities || [])) {
        try {
          setTask((task) => ({
            ...task,
            title: (
              <Text>
                {{ movie: '🎞️ ', person: '⭐️' }[type]} Fetch {type} changes on Sensorr {(
                  <Text color='grey'>({state?.[type]?.entities.findIndex((c) => c === id) + 1}/{state?.[type]?.entities.length})</Text>
                )}
              </Text>
            ),
            output: `Fetch TMDB ${type} #${id} data...`,
          }))

          const entity = await state.tmdb.fetch(`${type}/${id}`, {
            movie: {
              append_to_response: 'alternative_titles,release_dates',
            },
            person: {},
          })

          if (type === 'movie') {
            // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
            entity.release_dates = {
              results: (entity.release_dates?.results || [])
                .filter(({ type }) => type === 3)
                .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])
            }
          }

          // TODO: Should update sensorr computed "terms"

          setTask((task) => ({ ...task, output: `Refresh Sensorr ${type} "${entity.title || entity.name}" data...` }))
          const { uri, params, init } = {
            movie: api.query.movies.postMovie({ body: entity }),
            person: api.query.persons.postPerson({ body: entity }),
          }[type]
          await api.fetch(uri, params, init)
          state.logger.info({ message: `Refresh "${entity.title || entity.name}" data`, metadata: { ...state.metadata, type, entity: lighten[type](entity) } })
          success++
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
          state.logger.warn({ message: `⚠️ Error during ${type} "${id}" refresh from TMDB: "${error?.message || error}"`, metadata: { ...state.metadata, type, entity: id, warning: error } })
          warning++
        }
      }

      state.logger.info({ message: `${{ movie: '🎞️ ', person: '⭐️' }[type]} Applied ${success} changes on Sensorr`, metadata: { ...state.metadata, summary: { [type]: { success, warning } } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{success}</Text> {type} changes applied</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}
