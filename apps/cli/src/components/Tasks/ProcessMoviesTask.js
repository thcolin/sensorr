import React, { useEffect } from 'react'
import { Policy } from '@sensorr/sensorr'
import { Text } from 'ink'
import { Task, useTask } from '../Taskink'
import api from '../../store/api'
import { lighten } from '../../store/logger'

export const ProcessMoviesTask = ({ command, proposalOnly = false, ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { tasks, state } } = useTask(
    {
      id: 'process-movies',
      title: {
        record: `📹 Record movies`,
        doctor: `🚑 Care for movies`,
      }[command],
      status: 'waiting',
    },
    {
      dependencies: ['fetch-api-movies'],
    },
  )
  const subtasks = Object.entries(tasks).filter(([id, status]) => new RegExp(/^process-movie-/).test(id))
  const index = subtasks.findIndex(([id, status]) => ['loading', 'waiting'].includes(status))

  useEffect(() => {
    if (!ready) {
      return
    }

    setStatus(Object.keys(state?.movies || {}).length ? 'loading' : 'done')
  }, [ready])

  const results = {
    recorded: Object.values(state?.movies || {}).filter((movie) => movie.release?.valid && !movie.release?.proposal),
    proposal: Object.values(state?.movies || {}).filter((movie) => movie.release?.valid && movie.release?.proposal),
    withdrawn: Object.values(state?.movies || {}).filter((movie) => !movie.release?.valid && movie.release?.warning <= 10),
    ignored: Object.values(state?.movies || {}).filter((movie) => !movie.release?.valid && movie.release?.warning > 10),
    missing: Object.values(state?.movies || {}).filter((movie) => !movie.warning && !movie.release?.title),
    warning: Object.values(state?.movies || {}).filter((movie) => movie.warning),
  }

  useEffect(() => {
    if (!ready || !subtasks.length) {
      return
    }

    const cb = async () => {
      setTask((task) => ({ ...task, title: (
        <Text>
          {{
            record: `📹 Record movies`,
            doctor: `🚑 Care for movies`,
          }[command]} {!!subtasks.length && (
            <Text color='grey'>({subtasks.filter(([id, status]) => ['done', 'warning', 'error'].includes(status)).length}/{subtasks.length})</Text>
          )}
        </Text>
      ) }))

      if (subtasks.every(([id, status]) => ['done', 'warning', 'error'].includes(status))) {
        Object.entries(results)
          .filter(([type, movies]) => movies.length)
          .forEach(([type, movies]) => state.logger.info({
            message: ({
              recorded: `📼 ${movies.length} Recorded movies`,
              proposal: `🛎️  ${movies.length} Proposed movies`,
              withdrawn: `⛔  ${movies.length} Withdrawn movies releases`,
              ignored: `🗑️  ${movies.length} Ignored movies releases`,
              missing: `📭 ${movies.length} No releases found`,
              warning: `⚠️  ${movies.length}  Disturbed during process`,
            }[type] || ''),
            [type]: movies.length,
            metadata: { ...state.metadata, summary: { [type]: movies.length } },
          }))

        await new Promise(resolve => setTimeout(resolve, 600))
        setStatus('done')
      }
    }

    cb()
  }, [ready, subtasks.map(value => value.join(':')).join(',')])

  return status === 'done' ? (
    <>
      {Object.entries(results).filter(([type, movies]) => movies.length).map(([type, movies]) => (
        <React.Fragment key={type}>
          <Task
            key='summary'
            title={{
              recorded: <Text>📼 Recorded movies</Text>,
              proposal: <Text>🛎️  Proposed movies</Text>,
              withdrawn: <Text>⛔  Withdrawn movies releases</Text>,
              ignored: <Text>🗑️  Ignored movies releases</Text>,
              missing: <Text>📭 No releases found</Text>,
              warning: <Text>⚠️  Disturbed during process</Text>,
            }[type]}
            status={{
              recorded: 'done',
              proposal: 'done',
              withdrawn: 'warning',
              ignored: 'error',
              missing: 'error',
              warning: 'error',
            }[type]}
            output={{
              recorded: <Text><Text bold={true}>{movies.length}</Text> recorded</Text>,
              proposal: <Text><Text bold={true}>{movies.length}</Text> proposals</Text>,
              withdrawn: <Text><Text bold={true}>{movies.length}</Text> withdrawn</Text>,
              ignored: <Text><Text bold={true}>{movies.length}</Text> ignored</Text>,
              missing: <Text><Text bold={true}>{movies.length}</Text> with no releases found</Text>,
              warning: <Text><Text bold={true}>{movies.length}</Text> disturbed</Text>,
            }[type]}
          />
          {(type === 'recorded' && movies.map((movie) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={`${movie.release?.title} (${movie.release?.znab})`}
              status='done'
              depth={1}
            />
          )))}
          {(type === 'proposal' && movies.map((movie) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={`${movie.release?.title} (${movie.release?.znab})`}
              status='done'
              depth={1}
            />
          )))}
          {(type === 'withdrawn' && movies.map((movie) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={movie.release?.warning <= 5 ? `Does not overcome existing releases: ${movie.release?.title}` : `${movie.release?.reason?.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')?.trim()}: ${movie.release?.title}`}
              status='warning'
              depth={1}
            />
          )))}
          {(type === 'ignored' && movies.map((movie) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={`${movie.release?.reason?.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')?.trim()}: ${movie.release?.title}`}
              status='error'
              depth={1}
            />
          )))}
          {(type === 'missing' && movies.map((movie) => {
            const query = state.sensorr.getQuery(movie, movie.query)

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
          {(type === 'warning' && movies.map((movie) => (
            <Task
              key={movie.id}
              title={<Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>}
              output={movie.warning?.message || movie.warning}
              status='error'
              depth={1}
            />
          )))}
        </React.Fragment>
      ))}
    </>
  ) : (
    <>
      <Task key='process-movies-task' {...task} status={status} />
      {...Object.values(state?.movies || {})?.sort((a, b) => a.updated_at - b.updated_at).map((movie, i, arr) => (
        <ProcessMovieTask
          key={movie.id}
          movie={movie}
          proposalOnly={proposalOnly}
          dependencies={arr[i - 1] ? [`process-movie-${arr[i - 1].id}`] : []}
          hide={status === 'done' || (['waiting', 'loading'].includes(status) && !(i >= index && i <= (index + 10)))}
          depth={1}
        />
      ))}
    </>
  )
}

const ProcessMovieTask = ({ movie, hide, dependencies = [], proposalOnly = false, ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state, setState } } = useTask(
    {
      id: `process-movie-${movie.id}`,
      title: <Text color='grey'>"<Text color='white'>{movie.title}</Text>" ({new Date(movie.release_date).getFullYear()})</Text>,
      status: 'waiting',
    },
    {
      type: 'process-movie',
      dependencies,
    }
  )

  useEffect(() => {
    if (!ready) {
      return
    }

    const policy = new Policy(movie.policy, state.policies)
    const doctor = new Policy({ ...policy, sorting: 'size', descending: false })
    const releases = []
    const cb = async () => {
      try {
        let done = false
        setStatus('loading')
        const query = state.sensorr.getQuery(movie, movie.query, movie.banned_releases)

        switch (state.metadata.command) {
          case 'record':
            state.logger.info({ message: `📹 Record "${movie.title}" (${new Date(movie.release_date).getFullYear()})`, metadata: { ...state.metadata, important: true, group: movie.id, movie: { ...lighten.movie(movie), query } } })
            break;
            case 'doctor':
            state.logger.info({ message: `🚑  Care for "${movie.title}" (${new Date(movie.release_date).getFullYear()})`, metadata: { ...state.metadata, important: true, group: movie.id, movie: { ...lighten.movie(movie), query, releases: doctor.apply(movie.releases, null) } } })
            break;
        }

        if (!query.terms.some((term) => term)) {
          throw new Error('No query term')
        }

        const res = state.sensorr.call(query, (tasks) => {
          const ongoing = tasks.findIndex(({ releases, ...task }) => task.ongoing)

          if (ongoing >= 0) {
            setTask((task) => ({ ...task, output: `${ongoing + 1}/${tasks.length} "${tasks[ongoing].term}" (${tasks[ongoing].znab.name})`}))
          }
        }, null, true)

        do {
          const raw = await res.next()
          done = !!raw.done

          if (!done) {
            releases.push(...raw.value.releases)
            const results = policy.apply(raw.value.releases, query)

            const stats = {
              total: results?.length || 0,
              matches: results?.filter(release => release.valid && !release.warning).map(({ size, score, seeders, link, meta: { generated: release, original } }) => ({ release, original, size, score, seeders, link })),
              withdrawn: results?.filter(release => !release.valid && release.warning <= 10).map(({ reason, size, score, seeders, link, meta: { generated: release, original } }) => ({ release, original, reason, size, score, seeders, link })),
              ignored: results?.filter(release => !release.valid && release.warning > 10).map(({ reason, size, score, seeders, link, meta: { generated: release, original } }) => ({ release, original, reason, size, score, seeders, link })),
            }

            state.logger.info({ message: (
              (stats.matches.length) ? `⭐  ${raw.value.znab?.name} - "${raw.value.term}", ${stats.matches.length} matching releases found`
              : (stats.withdrawn.length) ? `⛔  ${raw.value.znab?.name} - "${raw.value.term}", ${stats.withdrawn.length} releases withdrawn by policy`
              : (stats.ignored.length) ? `🗑️  ${raw.value.znab?.name} - "${raw.value.term}", ${stats.total} releases ignored`
              : (stats.total) ? `📭  ${raw.value.znab?.name} - "${raw.value.term}", no matching releases found`
              : `📭  ${raw.value.znab?.name} - "${raw.value.term}", no releases found`
            ), metadata: { ...state.metadata, group: movie.id, znab: raw.value.znab.name, term: raw.value.term, stats } })
          }
        } while (!done)

        const results = policy.apply(releases, query)
        const scoreboard = doctor.apply([...(results.length ? [results[0]] : []), ...movie.releases], null)

        if (state.metadata.command === 'doctor' && results.length) {
          const { score } = scoreboard.find(r => r.id === results[0].id)
          results[0].score = score

          if (scoreboard.findIndex(r => r.id === results[0].id) > 0) {
            results[0].valid = false
            results[0].warning = 5
          }
        }

        const release = results[0] || {}
        const raw = release.id ? {
          id: release.id,
          title: release.title,
          original: release.original,
          from: state.metadata.command,
          job: state.metadata.job,
          proposal: proposalOnly,
          znab: release.znab,
          link: release.link,
          enclosure: release.enclosure,
          size: release.size,
        } : {}

        setState((state) => ({ ...state, movies: { ...state.movies, [movie.id]: { ...movie, release: { ...release, ...raw }, results } } }))

        if (release.valid) {
          setTask((task) => ({ ...task, output: `${{ false: '📼', true: '🛎️ ' }[proposalOnly]} ${release.title}` }))
          const postMovie = api.query.movies.postMovie({ body: { ...movie, query, ...(proposalOnly ? {} : { state: 'archived' }), releases: [...(movie.releases || []), raw], updated_at: new Date().getTime(), ...(state.metadata.command === 'doctor' ? { cared_at: new Date().getTime() } : {}) } })
          await api.fetch(postMovie.uri, postMovie.params, postMovie.init)
          const downloadRelease = api.query.sensorr.downloadRelease({ body: raw, params: { source: 'enclosure', destination: proposalOnly ? 'cache' : 'fs' } })
          await api.fetch(downloadRelease.uri, downloadRelease.params, downloadRelease.init)
          state.logger.info({ message: `${{ false: '📼', true: '🛎️ ' }[proposalOnly]} Release ${release.title} ${{ false: 'recorded', true: 'proposed' }[proposalOnly]} (${release.znab})`, metadata: { ...state.metadata, important: true, group: movie.id, release: { ...release, proposal: true }, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('done')
        } else if (release.warning <= 5) {
          setTask((task) => ({ ...task, output: `🥈 Does not overcome existing releases: ${release.title}` }))
          const { uri, params, init } = api.query.movies.postMovie({ body: { ...movie, query, ...(state.metadata.command === 'doctor' ? { cared_at: new Date().getTime() } : {}) } })
          await api.fetch(uri, params, init)
          state.logger.info({ message: `🥈 Release ${release.title} does not overcome existing releases`, metadata: { ...state.metadata, important: true, group: movie.id, release, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('warning')
        } else if (release.warning <= 10) {
          setTask((task) => ({ ...task, output: `${release.reason}: ${release.title}` }))
          const { uri, params, init } = api.query.movies.postMovie({ body: { ...movie, query, ...(state.metadata.command === 'doctor' ? { cared_at: new Date().getTime() } : {}) } })
          await api.fetch(uri, params, init)
          state.logger.info({ message: `🚨 Release ${release.title} withdrawn`, metadata: { ...state.metadata, important: true, group: movie.id, release, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('warning')
        } else if (release.title) {
          setTask((task) => ({ ...task, output: `${release.reason}: ${release.title}` }))
          const { uri, params, init } = api.query.movies.postMovie({ body: { ...movie, query, ...(state.metadata.command === 'doctor' ? { cared_at: new Date().getTime() } : {}) } })
          await api.fetch(uri, params, init)
          state.logger.info({ message: `🗑️  No matching releases found`, metadata: { ...state.metadata, important: true, group: movie.id, release: { ...release, hide: true }, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('error')
        } else {
          setTask((task) => ({ ...task, output: '📭 No releases found' }))
          const { uri, params, init } = api.query.movies.postMovie({ body: { ...movie, query, ...(state.metadata.command === 'doctor' ? { cared_at: new Date().getTime() } : {}) } })
          await api.fetch(uri, params, init)
          state.logger.info({ message: `📭 No releases found`, metadata: { ...state.metadata, important: true, group: movie.id, results } })
          await new Promise(resolve => setTimeout(resolve, 600))
          setStatus('error')
        }
      } catch (error) {
        setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
        state.logger.warn({ message: `⚠️ Error during record: "${error?.message || error}"`, metadata: { ...state.metadata, important: true, group: movie.id, warning: error } })
        await new Promise(resolve => setTimeout(resolve, 600))
        setStatus('error')
        setState((state) => ({ ...state, movies: { ...state.movies, [movie.id]: { ...movie, warning: error } } }))
      }
    }

    cb()
  }, [movie?.id, ready])

  if (hide) {
    return null
  }

  return (
    <Task
      {...props}
      {...task}
      status={status}
      output={task.output || (ready && ['waiting', 'loading'].includes(status) && 'Loading...')}
    />
  )
}
