import React, { useEffect, useRef, useState } from 'react'
import path from 'path'
import fs from 'fs'
import stream from 'stream'
import { render, Text } from 'ink'
import unzipper from 'unzipper'
import JsonlParser from 'stream-json/jsonl/Parser'
import { TMDB } from '@sensorr/tmdb'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'migrate <archive>',
  desc: '🚚 Migrate data from legacy Sensorr dump',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ argv, config, logger }) => {
    const tmdb = new TMDB({
      key: config.get('tmdb'),
      region: config.get('region') || 'en-US',
      adult: config.get('adult'),
    })

    await tmdb.init()

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: 'migrate' }, logger, tmdb }}>
        <ExtractDumpTask archive={path.resolve(argv.archive)} />
        <FetchSensorrMetadataTask />
        <MigrateDocumentsDumpTask type='movies' />
        <MigrateDocumentsDumpTask type='persons' dependencies={['migrate-movies-dump']} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const ExtractDumpTask = ({ archive, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'extract-dump-task',
    title: '📦 Extract dump from archive...',
  })

  const documents = useRef({ movies: {}, stars: {} })
  const [movies, setMovies] = useState(false)
  const [stars, setStars] = useState(false)

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      setTask((task) => ({ ...task, output: <Text>Look up for dump files from <Text bold={true}>{archive}</Text> archive...</Text> }))

      try {
        if (!fs.existsSync(archive)) {
          throw new Error(`Archive ${archive} does not exist`)
        }

        fs.createReadStream(archive)
          .pipe(unzipper.Parse())
          .pipe(stream.Transform({
            objectMode: true,
            transform: function(entry, e, callback) {
              if (!['movies.txt', 'stars.txt'].includes(entry.path)) {
                entry.autodrain()
                callback()
                return
              }

              entry.pipe(new JsonlParser())
                .on('data', data => {
                  if (!data.value) {
                    return
                  }

                  if (!data.value.docs) {
                    return
                  }

                  documents.current[entry.path.slice(0, -4)] = {
                    ...documents.current[entry.path.slice(0, -4)],
                    ...data.value.docs.reduce((acc, { id, state }) => ({ ...acc, [id]: { stalked: 'followed' }[state] || state }), {}),
                  }

                  setTask((task) => ({ ...task, output: <Text>Looking at <Text bold={true}>{entry.path}</Text> dump file in archive, found <Text bold={true}>{Object.keys(documents.current[entry.path.slice(0, -4)]).length}</Text> {entry.path.slice(0, -4)}...</Text> }))
                })
                .on('end', () => {
                  if (entry.path === 'movies.txt') {
                    setMovies(true)
                  } else if (entry.path === 'stars.txt') {
                    setStars(true)
                  }

                  callback()
                })
            }
          }))
      } catch (error) {
        setTask((task) => ({ ...task, error: error.message || error }))
        setStatus('error')
        handleError(error)
      }
    }

    cb()
  }, [])

  useEffect(() => {
    if (movies && stars) {
      setState((state) => ({ ...state, dump: { movies: documents.current.movies, persons: documents.current.stars }, }))
      setTask((task) => ({ ...task, output: <Text>Found <Text bold={true}>{Object.keys(documents.current.movies).length + Object.keys(documents.current.stars).length}</Text> documents in dump (<Text bold={true}>{Object.keys(documents.current.movies).length}</Text> movies and <Text bold={true}>{Object.keys(documents.current.stars).length}</Text> persons)</Text> }))
      setStatus('done')
      state.logger.info({ message: `📦 ${Object.keys(documents.current.movies).length + Object.keys(documents.current.stars).length} documents found in dump (${Object.keys(documents.current.movies).length} movies and ${Object.keys(documents.current.stars).length} persons)`, metadata: { ...state.metadata, summary: { dump: { movies: Object.keys(documents.current.movies).length, persons: Object.keys(documents.current.stars).length } } } })
    }
  }, [movies, stars])

  return (
    <Task {...task} status={status} />
  )
}

const FetchSensorrMetadataTask = ({ onError, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sensorr-metadata',
    title: '🗄️  Fetch Sensorr metadata...',
  }, { dependencies: [] })

  useEffect(() => {
    const cb = async () => {
      const length = { total: 0, movies: 0, persons: 0 }

      for (const type of ['movies', 'persons']) {
        try {
          setStatus('loading')
          setTask((task) => ({ ...task, output: <Text>Fetch Sensorr {type} metadata...</Text> }))
          let local = {}
          let total_pages = null
          let page = 0
          do {
            const { uri, params, init } = api.query[type].getMetadata({ params: { page: page++ } })
            const raw = await api.fetch(uri, params, init)
            total_pages = raw.total_pages
            local = { ...local, ...raw.results }
          } while (!total_pages || page <= total_pages)
          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{Object.keys(local).length}</Text> Sensorr {type} metadata found</Text> }))
          await new Promise(resolve => setTimeout(resolve, 600))
          length.total += Object.keys(local).length
          length[type] = Object.keys(local).length
          setState((state) => ({ ...state, local: { ...state.local, [type]: local } }))
        } catch (error) {
          setTask((task) => ({ ...task, error: error.message || error }))
          setStatus('error')
          await new Promise(resolve => setTimeout(resolve, 600))
          handleError(error)
        }
      }

      state.logger.info({ message: `🗄️ ${length.total} Sensorr metadata found`, metadata: { ...state.metadata, summary: { local: length } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: (<Text><Text bold={true}>{length.total}</Text> Sensorr metadata found (<Text bold={true}>{length.movies}</Text> movies and <Text bold={true}>{length.persons}</Text> persons)</Text>) }))
      setStatus('done')
    }

    cb()
  }, [])

  return (
    <Task {...task} status={status} />
  )
}

const MigrateDocumentsDumpTask = ({ type = 'movies', dependencies = [], ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state } } = useTask({
    id: `migrate-${type}-dump`,
    title: `${{ movies: '🎞️ ', persons: '🎭' }[type]} Migrate ${type} dump...`,
  }, { dependencies: ['extract-dump-task', 'fetch-sensorr-metadata', ...dependencies] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      let success = 0, ignored = 0, warning = 0
      setStatus('loading')

      for (const [id, value] of Object.entries(state.dump[type])) {
        if (!id || value === 'ignored') {
          continue
        }

        try {
          if (state.local[type][id]?.state && state.local[type][id]?.state !== 'ignored') {
            setTask((task) => ({ ...task, output: `${{ movies: 'Movie', persons: 'Person' }[type]} #${id} already "${state.local[type][id].state}", ignore dump value "${value}"` }))
            state.logger.info({ message: `${{ movies: 'Movie', persons: 'Person' }[type]} #${id} already "${state.local[type][id].state}", ignore dump value "${value}"`, metadata: { ...state.metadata, type, entity: id, ignored: true } })
            ignored++
            continue
          }

          setTask((task) => ({ ...task, output: `Unknown ${type.slice(0, -1)} #${id}, fetch TMDB data...` }))

          const entity = await state.tmdb.fetch(`/${type.slice(0, -1)}/${id}`, {
            movies: { append_to_response: 'alternative_titles,release_dates' },
            persons: {},
          }[type])

          if (type === 'movies') {
            // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
            entity.release_dates = {
              results: (entity.release_dates?.results || [])
                .filter(({ type }) => type === 3)
                .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])
            }
          }

          entity.state = value
          entity.updated_at = new Date().getTime()

          setTask((task) => ({ ...task, output: `Migrate ${type.slice(0, -1)} "${entity.title || entity.name}" from dump as "${entity.state}"...` }))
          const { uri, params, init } = {
            movies: api.query.movies.postMovie({ body: entity }),
            persons: api.query.persons.postPerson({ body: entity }),
          }[type]
          await api.fetch(uri, params, init)
          state.logger.info({ message: `Migrate "${entity.title || entity.name}" as "${entity.state}"`, metadata: { ...state.metadata, type, entity: lighten[type.slice(0, -1)](entity) } })
          success++
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
          state.logger.warn({ message: `⚠️ "${type}" "${id}", error during document migration: "${error?.message || error}"`, metadata: { ...state.metadata, type, entity: id, warning: error } })
          warning++
        }
      }

      state.logger.info({ message: `${{ movies: '🎞️ ', persons: '🎭' }[type]} Migrated ${success} documents from dump`, metadata: { ...state.metadata, summary: { [type]: { success, warning } } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{success}</Text> {type} documents migrated</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}
