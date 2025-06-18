import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { Sensorr, Policy } from '@sensorr/sensorr'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { ProcessMoviesTask } from '../components/Tasks/ProcessMoviesTask'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'refine',
  desc: '✨ Refine archived movies with better fitting release',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const sensorr = new Sensorr({ znabs: config.get('znabs'), region: config.get('region') })

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, sensorr, policies: config.get('policies') }}>
        <FetchAPIMoviesTask />
        <ProcessMoviesTask command='refine' proposalOnly={config.get('jobs.record.proposalOnly')} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchAPIMoviesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-movies',
    title: '🪨 Fetch archived movies ready for refining from API...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      const { uri, params, init } = api.query.movies.getMovies({
        params: {
          state: 'archived',
          // refine: true,
          'releases.proposal': false,
          'refined_at.lte': new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            new Date().getDate()
          ).getTime(),
          sort_by: 'refined_at.desc',
        },
      })

      try {
        const res = await api.fetch(uri, { ...params, limit: '' }, init)

        const results = res.results.filter(movie => {
          const policy = new Policy(movie.policy, state.policies)
          const res = policy.apply(movie.releases.map(release => ({ ...release, title: release.original })), null, true)
          return res.every(release => !release.valid)
        })

        setState((state) => ({ ...state, movies: results.reduce((acc, movie) => ({ ...acc, [movie.id]: movie }), {}) }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{results.length}</Text> movies found</Text> }))
        setStatus('done')
        state.logger.info({ message: `🪨 ${results.length} Archived movies ready for refining`, metadata: { ...state.metadata, summary: { refined: results.length } } })
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
