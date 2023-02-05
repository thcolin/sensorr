import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'refresh',
  desc: '🔌 Refresh Sensorr data with TMDB changes',
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
      <Tasks handlers={handlers} state={{ metadata: { job }, logger, tmdb }}>
        <FetchTMDBChangesTask />
        <ComputeSensorrAffectedChangesTask />
        <ApplyChangesTask type='movie' />
        <ApplyChangesTask type='person' dependencies={['apply-movie-changes']} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchTMDBChangesTask = ({ ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: `fetch-tmdb-changes`,
    title: `📡 Fetch TMDB latest changes...`,
  }, { dependencies: [] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      let length = 0

      for (const type of ['movie', 'person']) {
        try {
          setStatus('loading')
          const { results } = await state.tmdb.fetch(`${type}/changes`, {})
          setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{results.length}</Text> {type} changes available</Text>) }))
          length += results.length
          setState((state) =>  ({ ...state, [type]: { results } }))
        } catch (error) {
          setStatus('error')
          setTask((task) => ({ ...task, error: error.message || error }))
          handleError(error)
        }
      }

      setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{length}</Text> total changes available</Text>) }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}

const ComputeSensorrAffectedChangesTask = ({ ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: `compute-sensorr-affected-changes`,
    title: `🗄️  Compute Sensorr affected changes...`,
  }, { dependencies: ['fetch-tmdb-changes'] })

  useEffect(() => {
    if (!ready) {
      return
    }

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
          const changes = (state?.[type]?.results || []).filter((result) => Object.keys(metadata).includes(`${result.id}`))
          setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{changes.length}</Text> {type}s affected changes</Text>) }))
          length += changes.length
          setState((state) => ({ ...state, [type]: { ...state?.[type], changes } }))
        } catch (error) {
          setStatus('error')
          setTask((task) => ({ ...task, error: error.message || error }))
          handleError(error)
        }
      }

      state.logger.info({ message: `🗄️ ${length} affected changes`, metadata: { ...state.metadata, summary: { changes: length } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{length}</Text> total affected changes</Text>) }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}

const ApplyChangesTask = ({ type = 'movie', dependencies = [], ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state } } = useTask({
    id: `apply-${type}-changes`,
    title: `${{ movie: '🎞️ ', person: '🎭' }[type]} Apply ${type} changes on Sensorr...`,
  }, { dependencies: [`compute-sensorr-affected-changes`, ...dependencies] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      let success = 0, warning = 0
      setStatus('loading')

      for (let change of (state?.[type]?.changes || [])) {
        try {
          setTask((task) => ({
            ...task,
            title: (
              <Text>
                {{ movie: '🎞️ ', person: '🎭' }[type]} Apply {type} changes on Sensorr {(
                  <Text color='grey'>({state?.[type]?.changes.findIndex((c) => c === change) + 1}/{state?.[type]?.changes.length})</Text>
                )}
              </Text>
            ),
            output: `Fetch TMDB ${type} #${change.id} data...`,
          }))

          const entity = await state.tmdb.fetch(`${type}/${change.id}`, {
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
          state.logger.warn({ message: `⚠️ "${type}" "${change.id}", error during refresh: "${error?.message || error}"`, metadata: { ...state.metadata, type, entity: change.id, warning: error } })
          warning++
        }
      }

      state.logger.info({ message: `${{ movie: '🎞️ ', person: '🎭' }[type]} Applied ${success} changes on Sensorr`, metadata: { ...state.metadata, summary: { [type]: { success, warning } } } })
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
