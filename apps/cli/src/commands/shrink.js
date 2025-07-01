import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { Sensorr, Policy } from '@sensorr/sensorr'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { ProcessMoviesTask } from '../components/Tasks/ProcessMoviesTask'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'shrink',
  desc: '✂️ Shrink refined movies with smallest release available',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const sensorr = new Sensorr({ znabs: config.get('znabs'), region: config.get('region') })

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, sensorr, policies: config.get('policies') }}>
        <FetchAPIMoviesTask threshold={config.get('jobs.shrink.threshold')} />
        <ProcessMoviesTask command='shrink' proposalOnly={config.get('jobs.shrink.proposalOnly')} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchAPIMoviesTask = ({ threshold = 0, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-movies',
    title: '💎 Fetch refined movies ready for shrinking from API...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      const { uri, params, init } = api.query.movies.getMovies({
        params: {
          state: 'archived',
          shrink: true,
          'releases.proposal': false,
          ...(threshold ? { 'releases.size': threshold * Math.pow(1024, 3) } : {}),
          // 'shrinked_at.lte': new Date(
          //   new Date().getFullYear(),
          //   new Date().getMonth() - 1,
          //   new Date().getDate()
          // ).getTime(),
          sort_by: 'shrinked_at.desc',
        },
      })

      try {
        const res = await api.fetch(uri, { ...params, limit: '' }, init)

        const results = res.results.filter(movie => {
          const policy = new Policy(movie.policy, state.policies)
          const res = policy.apply(movie.releases.map(release => ({ ...release, title: release.original })), null, true)
          return res.some(release => release.valid)
        })

        setState((state) => ({ ...state, movies: results.reduce((acc, movie) => ({ ...acc, [movie.id]: movie }), {}) }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{results.length}</Text> movies found</Text> }))
        setStatus('done')
        state.logger.info({ message: `💎 ${results.length} Refined movies ready for shrinking`, metadata: { ...state.metadata, summary: { shrinked: results.length } } })
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
