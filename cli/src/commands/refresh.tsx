import React, { useEffect, useMemo } from 'react'
import { render, Text } from 'ink'
import { Command, flags } from '@oclif/command'
import { nanoid } from '@sensorr/sensorr'
import api from '../store/api'
import tmdb from '../store/tmdb'
import createLogger from '../store/logger'
import { Tasks, Task, useTask } from '../components/Taskink'
import { Head } from '../components/Head'

export default class Refresh extends Command {
  static description = 'refresh API with tmdb yesterday changes'

  static examples = [
    `$ sensorr refresh
 ✔ 🎞️  Refresh movie data from TMDB
  ✔ 2530 movies changes available
  ✔ 83 movies from API, 14 changed in last 24 hours
  ✔ 14 movies refreshed !
 ✔ 🎭 Refresh person data from TMDB
  ✔ 2169 persons changes available
  ✔ 162 persons from API, 35 changed in last 24 hours
  ✔ 35 persons refreshed !
 ✔ 🔌 Refreshed 49 API data from TMDB`,
  ]

  // TODO: Should add "full" flag to refresh all data
  static flags = {
    help: flags.help({ char: 'h' }),
  }

  static args = []

  async run() {
    const job = nanoid()
    const logger = createLogger({})

    logger.info({ message: '🔌 Refresh API data', metadata: { job, command: 'refresh', summary: true } })

    try {
      const { waitUntilExit } = render(
        <Tasks job={job} logger={logger} head={<Head />}>
          <RefreshTMDBDataTask type='movie' />
          <RefreshTMDBDataTask type='person' />
          <SummaryTask />
        </Tasks>
      )

      await waitUntilExit()
    } catch (error) {
      console.error(error)
      logger.end()
      process.exitCode = 1
    } finally {
      logger.end()
      process.exitCode = 0
    }
  }
}

const SummaryTask = ({ ...props }) => {
  const { ready, task, status, setStatus, context: { state, logger, job } } = useTask({
    id: `refresh-tmdb-data`,
    title: '',
  }, { dependencies: ['refresh-movie-tmdb-data', 'refresh-person-tmdb-data'] })

  const total_results = state.movie?.changes?.length + state.person?.changes?.length

  useEffect(() => {
    if (ready) {
      logger.info({ message: `Refreshed "${total_results}" API data from TMDB`, metadata: { job, summary: true, total_results, done: true } })
      setStatus('done')
    }
  }, [ready])

  return ready ? (
    <Task
      {...task}
      status={status}
      title={<Text>🔌 Refreshed <Text bold={true}>{total_results}</Text> API data from TMDB</Text>}
    />
  ) : null
}

const RefreshTMDBDataTask = ({ type = 'movie', ...props }) => {
  const { ready, task, status, setStatus, context: { tasks } } = useTask({
    id: `refresh-${type}-tmdb-data`,
    title: `${{ movie: '🎞️ ', person: '🎭' }[type]} Refresh ${type} data from TMDB`,
  }, { dependencies: { movie: [], person: ['refresh-movie-tmdb-data'] }[type] })

  const done = useMemo(() => [
    tasks[`fetch-tmdb-${type}-latest-change`] || 'waiting',
    tasks[`fetch-api-${type}-metadata`] || 'waiting',
    tasks[`refresh-${type}-data`] || 'waiting',
  ].every(status => ['done', 'warning', 'error'].includes(status)), [tasks])

  useEffect(() => {
    if (!ready) {
      return
    }

    setStatus('loading')
  }, [ready])

  useEffect(() => {
    if (done) {
      setStatus('done')
    }
  }, [done])

  return (
    <>
      <Task {...props} {...task} status={status} />
      {ready && (
        <>
          <FetchTMDBLatestChangesTask type={type} depth={1} />
          <FetchAPIMetadataTask type={type} depth={1} />
          <RefreshDataTask type={type} depth={1} />
        </>
      )}
    </>
  )
}

const FetchTMDBLatestChangesTask = ({ type = 'movie', ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { setState, logger } } = useTask({
    id: `fetch-tmdb-${type}-latest-change`,
    title: `Fetch TMDB latest ${type} changes...`,
  }, { dependencies: [] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')
      const { results } = await tmdb.fetch(`${type}/changes`)
      setState((state: any) =>  ({ ...state, [type]: { results } }))
      setTask((task: any) => ({ ...task, title: (<Text><Text bold={true}>{results.length}</Text> {type}s changes available</Text>) }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}

const FetchAPIMetadataTask = ({ type = 'movie', ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state, setState, job, logger } } = useTask({
    id: `fetch-api-${type}-metadata`,
    title: `Fetch API ${type} metadata...`,
  }, { dependencies: [`fetch-tmdb-${type}-latest-change`] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')
      const { uri, params, init } = {
        movie: api.query.movies.getMetadata({}),
        person: api.query.persons.getMetadata({}),
      }[type] as any

      const metadata = await api.fetch(uri, params, init)
      const changes = state[type].results.filter((result: any) => Object.keys(metadata).includes(`${result.id}`))
      logger.info({ message: `Refresh ${changes.length} ${type}s`, metadata: { job, summary: true, [type]: changes.length } })
      setState((state: any) => ({ ...state, [type]: { ...state[type], changes } }))
      setTask((task: any) => ({ ...task, title: (<Text><Text bold={true}>{Object.keys(metadata).length}</Text> {type}s from API, <Text bold={true}>{changes.length}</Text> changed in last 24 hours</Text>) }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}

const RefreshDataTask = ({ type = 'movie', ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state, logger, job } } = useTask({
    id: `refresh-${type}-data`,
    title: `Refresh ${type} data...`,
  }, { dependencies: [`fetch-api-${type}-metadata`] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')

      for (let change of state[type].changes) {
        const index = state[type].changes.findIndex((c: any) => c === change) + 1

        setTask((task: any) => ({ ...task, output: `${index}/${state[type].changes.length} Refresh ${type} #${change.id} data...` }))
        const entity = await tmdb.fetch(`${type}/${change.id}`, {
          movie: {
            append_to_response: 'alternative_titles,release_dates',
          },
          person: {},
        })

        if (type === 'movie') {
          // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
          entity.release_dates = {
            results: (entity.release_dates?.results || [])
              .filter(({ type }: any) => type === 3)
              .reduce((acc: any, raw: any) => acc.map(({ release_date }: any) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])
          }
        }

        // TODO: Should update sensorr computed "terms"

        setTask((task: any) => ({ ...task, output: `${index}/${state[type].changes.length} Refresh ${type} "'${entity.title || entity.name}'" data...` }))
        const { uri, params, init } = {
          movie: api.query.movies.postMovie({ body: entity }),
          person: api.query.persons.postPerson({ body: entity }),
        }[type] as any
        await api.fetch(uri, params, init)
        logger.info({ message: `Refresh "${entity.title || entity.name}" data`, metadata: { job, type, entity: entity } })
      }

      setTask((task: any) => ({ ...task, title: (<Text><Text bold={true}>{state[type].changes.length}</Text> {type}s refreshed !</Text>), output: null }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}
