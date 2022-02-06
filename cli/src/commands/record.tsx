import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { Command, flags } from '@oclif/command'
import { Policy, nanoid } from '@sensorr/sensorr'
import api from '../store/api'
import sensorr, { SENSORR_POLICIES } from '../store/sensorr'
import createLogger from '../store/logger'
import { Tasks, Task, useTask } from '../components/Taskink'
import { Head } from '../components/Head'

export default class RecordCommand extends Command {
  static description = 'record wished movies from API'

  static examples = [
    `$ sensorr record
 ✔ 🍿 Fetch wished movies from API...
  → 4 found
 ✔ 📼 Recorded movies
  → 1 recorded
   ✔ "Vous ne l'emporterez pas avec vous" (1938)
    → Vous.Ne.L.Emporterez.Pas.Avec.Vous.1938.MULTI.1080p.HDRip.x264.AAC-mHDgz (ZNAB)
 ⚠ 🚨 Dropped movies releases
  → 1 dropped
   ⚠ "Brève rencontre" (1945)
    → Dropped by policy (source=DVDRip): Breve.Rencontre.1945.MULTI.DVDRip.XviD.AC3-afrique31
 ✖ 💩 Mismatch movies releases
  → 1 mismatch
   ✖ "Monsieur Joe" (1949)
    → Release year (1998) different from movie release years (1949, 1950):
   Mon.Ami.Joe.1998.MULTI.1080p.WEB-DL.x264-PopHD
 ✖ 📭 Missing movies releases
  → 1 missing
   ✖ "¡A volar, joven!" (1947)
    → "a volar joven" (1947, 1949)`,
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  static args = []

  async run() {
    const job = nanoid()
    const logger = createLogger({})

    logger.info({ message: '📹 Record wished movies', metadata: { job, command: 'record', summary: true } })

    try {
      const { waitUntilExit } = render(
        <Tasks logger={logger} job={job} head={<Head />}>
          <FetchAPIMoviesTask
            onDone={({ error, total_results }: any) => (error ?
              logger.error({ message: '⚠️ Error', metadata: { job, error } }) :
              logger.info({ message: `🍿 ${total_results} Wished movies`, metadata: { job, total_results, summary: true } })
            )}
          />
          <RecordWishedMoviesTask
            onDone={({ error, results }: any) => (error ?
              logger.error({ message: '⚠️ Error', metadata: { job, error } }) :
              Object.entries(results)
                .filter(([type, movies]) => (movies as any).length)
                .forEach(([type, movies]) => logger.info({
                  message: ({
                    recorded: `📼 ${(movies as any).length} Recorded movies`,
                    dropped: `🚨 ${(movies as any).length} Dropped movies releases`,
                    mismatch: `💩 ${(movies as any).length} Mismatch movies releases`,
                    missing: `📭 ${(movies as any).length} Missing movies releases`,
                    disturbed: `⚠️ ${(movies as any).length}  Disturbed during process`,
                  }[type] || ''),
                  [type]: (movies as any).length,
                  metadata: { job, summary: true, done: true, [type]: (movies as any).length },
                }))
            )}
          />
        </Tasks>
      )

      await waitUntilExit()
    } catch (error) {
      console.error(error)
      logger.error({ message: '⚠️ Error', metadata: { job, error } })
      logger.end()
      process.exitCode = 1
    } finally {
      logger.end()
      process.exitCode = 0
    }
  }
}

const FetchAPIMoviesTask = ({ onDone, ...props }: any) => {
  const { task, setTask, status, setStatus, context: { setState } } = useTask({
    id: 'fetch-api-movies',
    title: '🍿 Fetch wished movies from API...',
  })

  useEffect(() => {
    const cb = async  () => {
      setStatus('loading')
      const { uri, params, init } = api.query.movies.getMovies({ params: { state: 'wished' } })

      try {
        const { results, total_results } = await api.fetch(uri, { ...params, limit: '' }, init)
        setState((state: any) => ({ ...state, movies: results.reduce((acc: any, movie: any) => ({ ...acc, [movie.id]: movie }), {}) }))
        setTask((task: any) => ({ ...task, output: <Text><Text bold={true}>{total_results}</Text> found</Text> }))
        setStatus('done')
        onDone({ total_results })
      } catch (e: any) {
        setTask((task: any) => ({ ...task, error: e.message }))
        setStatus('error')
        onDone({ error: e })
      }
    }

    cb()
  }, [])

  return (
    <Task {...task} status={status} />
  )
}

const RecordWishedMoviesTask = ({ onDone, ...props }: any) => {
  const { ready, task, setTask, status, setStatus, context: { tasks, state } } = useTask(
    {
      id: 'record-wished-movies',
      title: `📼 Record wished movies`,
      status: 'waiting',
    },
    {
      dependencies: ['fetch-api-movies'],
    },
  )
  const subtasks = Object.entries(tasks).filter(([id, status]) => new RegExp(/^record-wished-movie-/).test(id))
  const index = subtasks.findIndex(([id, status]: any) => ['loading', 'waiting'].includes(status))

  useEffect(() => {
    if (!ready) {
      return
    }

    setStatus(Object.keys(state?.movies || {}).length ? 'loading' : 'done')
  }, [ready])

  useEffect(() => {
    if (!ready || !subtasks.length) {
      return
    }

    setTask((task: any) => ({ ...task, title: (
      <Text>
        📹 Record wished movies {!!subtasks.length && (
          <Text color='grey'>({subtasks.filter(([id, status]: any) => ['done', 'warning', 'error'].includes(status)).length}/{subtasks.length})</Text>
        )}
      </Text>
    ) }))

    if (subtasks.every(([id, status]: any) => ['done', 'warning', 'error'].includes(status))) {
      setStatus('done')
    }
  }, [ready, subtasks.map(value => value.join(':')).join(',')])

  const results = {
    recorded: Object.values(state?.movies || {}).filter((movie: any) => movie.release?.valid),
    dropped: Object.values(state?.movies || {}).filter((movie: any) => !movie.release?.valid && movie.release?.warning <= 10),
    mismatch: Object.values(state?.movies || {}).filter((movie: any) => !movie.release?.valid && movie.release?.warning > 10),
    missing: Object.values(state?.movies || {}).filter((movie: any) => !movie.error && !movie.release.title),
    disturbed: Object.values(state?.movies || {}).filter((movie: any) => movie.error),
  }

  useEffect(() => {
    if (status === 'done') {
      onDone({ results })
    }
  }, [status])

  return status === 'done' ? (
    <>
      {Object.entries(results).filter(([type, movies]: [string, any]) => movies.length).map(([type, movies]: [string, any]) => (
        <React.Fragment key={type}>
          <Task
            title={{
              recorded: <Text>📼 Recorded movies</Text>,
              dropped: <Text>🚨 Dropped movies releases</Text>,
              mismatch: <Text>💩 Mismatch movies releases</Text>,
              missing: <Text>📭 Missing movies releases</Text>,
              disturbed: <Text>⚠️  Disturbed during process</Text>,
            }[type]}
            status={{
              recorded: 'done',
              dropped: 'warning',
              mismatch: 'error',
              missing: 'error',
              disturbed: 'error',
            }[type] as string}
            output={{
              recorded: <Text><Text bold={true}>{movies.length}</Text> recorded</Text>,
              dropped: <Text><Text bold={true}>{movies.length}</Text> dropped</Text>,
              mismatch: <Text><Text bold={true}>{movies.length}</Text> mismatch</Text>,
              missing: <Text><Text bold={true}>{movies.length}</Text> missing</Text>,
              disturbed: <Text><Text bold={true}>{movies.length}</Text> disturbed</Text>,
            }[type]}
          />
          {(type === 'recorded' && movies.map((movie: any) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={`${movie.release?.meta.generated} (${movie.release?.znab.name})`}
              status='done'
              depth={1}
            />
          )))}
          {(type === 'dropped' && movies.map((movie: any) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={`${movie.release?.reason?.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')?.trim()}: ${movie.release?.meta?.generated}`}
              status='warning'
              depth={1}
            />
          )))}
          {(type === 'mismatch' && movies.map((movie: any) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={`${movie.release?.reason?.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')?.trim()}: ${movie.release?.meta?.generated}`}
              status='error'
              depth={1}
            />
          )))}
          {(type === 'missing' && movies.map((movie: any) => {
            const [query] = sensorr.useQuery(movie, movie.query)

            return (
              <Task
                key={movie.id}
                title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
                output={`"${query.terms.join('", "')}" (${query.years.join(', ')})`}
                status='error'
                depth={1}
              />
            )
          }))}
          {(type === 'disturbed' && movies.map((movie: any) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={movie.error?.message}
              status='error'
              depth={1}
            />
          )))}
        </React.Fragment>
      ))}
    </>
  ) : (
    <>
      <Task key='record-wished-movies-task' {...task} status={status} />
      {...Object.values(state?.movies || {})?.sort((a: any, b: any) => a.updated_at - b.updated_at).map((movie: any, i: number, arr) => (
        <RecordMovieTask
          key={movie.id}
          movie={movie}
          dependencies={arr[i - 1] ? [`record-wished-movie-${(arr as any)[i - 1].id}`] : []}
          hide={status === 'done' || (['waiting', 'loading'].includes(status) && !(i >= index && i <= (index + 10)))}
          depth={1}
        />
      ))}
    </>
  )
}

const RecordMovieTask = ({ movie, hide, dependencies = [], ...props }: { movie: any, dependencies?: string[], hide?: boolean, depth?: number }) => {
  const { ready, task, setTask, status, setStatus, context: { setState, logger, job } } = useTask(
    {
      id: `record-wished-movie-${movie.id}`,
      title: <Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>,
      status: 'waiting',
    },
    {
      type: 'record-wished-movie',
      dependencies,
    }
  )

  useEffect(() => {
    if (!ready) {
      return
    }

    const policy = new Policy(movie.policy, SENSORR_POLICIES)
    const releases: any[] = []
    const cb = async () => {
      try {
        let done = false
        setStatus('loading')
        const [query] = sensorr.useQuery(movie, movie.query)
        const res = sensorr.call(query, (tasks: any[]) => {
          const ongoing = tasks.findIndex(({ releases, ...task }) => task.ongoing)

          if (ongoing >= 0) {
            setTask((task: any) => ({ ...task, output: `${ongoing + 1}/${tasks.length} "${tasks[ongoing].term}" (${tasks[ongoing].znab.name})`}))
          }
        })

        logger.info({ message: `📹 Record "${movie.title}" (${new Date(movie.release_date).getFullYear()})`, metadata: { job, group: movie.id, movie } })

        do {
          const raw = await res.next() as any
          done = !!raw.done

          if (!done) {
            releases.push(...raw.value.releases)
            const results = policy.apply(raw.value.releases, query)

            const stats = {
              total: results?.length || 0,
              matches: results?.filter(release => release.valid && !release.warning).map(({ meta: { generated: release, original } }) => ({ release, original })),
              dropped: results?.filter(release => !release.valid && release.warning <= 10).map(({ reason, meta: { generated: release, original } }) => ({ release, original, reason })),
              mismatch: results?.filter(release => !release.valid && release.warning > 10).map(({ reason, meta: { generated: release, original } }) => ({ release, original, reason })),
            }

            logger.info({ message: (
              (stats.matches.length && stats.total === stats.matches.length) ? `🎉 ${stats.total} matching Releases found on ${raw.value.znab?.name} with "${raw.value.term}"`
              : (stats.matches.length) ? `🎉 ${stats.total} Releases found on ${raw.value.znab?.name} with "${raw.value.term}"`
              : (stats.dropped.length && stats.total === stats.dropped.length) ? `🚨 ${stats.total} Releases dropped by policy on ${raw.value.znab?.name} with "${raw.value.term}"`
              : (stats.mismatch.length && stats.total === stats.mismatch.length) ? `💩 ${stats.total} Releases mismatch on ${raw.value.znab?.name} with "${raw.value.term}"`
              : (stats.total) ? `📭 No matching Releases found on ${raw.value.znab?.name} with "${raw.value.term}"`
              : `📭 No Releases found on ${raw.value.znab?.name} with "${raw.value.term}"`
            ), metadata: { job, group: movie.id, znab: raw.value.znab.name, term: raw.value.term, stats } })
          }
        } while (!done)

        const results = policy.apply(releases, query)
        const { account, ...release } = (results[0] || {}) as any

        if (release?.valid) {
          setTask((task: any) => ({ ...task, output: `📼 ${release?.meta.generated}` }))
          const { uri, params, init } = api.query.movies.postMovie({ body: { ...movie, state: 'archived', release, updated_at: new Date().getTime() } })
          await api.fetch(uri, params, init)
          logger.info({ message: `📼 Release ${release?.meta.generated} recorded (${release?.znab})`, metadata: { job, group: movie.id, release, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('done')
        } else if (release?.warning <= 10) {
          setTask((task: any) => ({ ...task, output: `${release?.reason}: ${release?.meta?.generated}` }))
          logger.info({ message: `🚨 Dropped Release ${release?.meta.generated}`, metadata: { job, group: movie.id, release, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('warning')
        } else if (release.title) {
          setTask((task: any) => ({ ...task, output: `${release?.reason}: ${release?.meta?.generated}` }))
          logger.info({ message: `💩 Mismatch Release ${release?.meta.generated}`, metadata: { job, group: movie.id, release, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('error')
        } else {
          setTask((task: any) => ({ ...task, output: '📭 No releases found' }))
          logger.info({ message: `📭 Missing movies releases`, metadata: { job, group: movie.id, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('error')
        }

        setState((state: any) => ({ ...state, movies: { ...state.movies, [movie.id]: { ...movie, release, results } } }))
      } catch (error: any) {
        setTask((task: any) => ({ ...task, output: `⚠️  ${error.message}` }))
        logger.error({ message: '⚠️ Error', metadata: { job, group: movie.id, error } })
        await new Promise(resolve => setTimeout(resolve, 600))
        setStatus('error')
        setState((state: any) => ({ ...state, movies: { ...state.movies, [movie.id]: { ...movie, error } } }))
      }
    }

    cb()
  }, [movie?.id, ready])

  if (hide) {
    return null
  }

  return (
    <Task {...props} {...task} status={status} output={task.output || (ready && ['waiting', 'loading'].includes(status) && 'Loading...')} />
  )
}
