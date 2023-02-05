import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { Sensorr } from '@sensorr/sensorr'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { ProcessMoviesTask } from '../components/Tasks/ProcessMoviesTask'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'doctor',
  desc: '🚑 Doctor care for movies by looking for better releases',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const sensorr = new Sensorr({ znabs: config.get('znabs'), region: config.get('region') })

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, sensorr, policies: config.get('policies') }}>
        <FetchAPIMoviesTask />
        <ProcessMoviesTask command={meta.command} proposalOnly={config.get('jobs.record.proposalOnly')} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchAPIMoviesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-movies',
    title: '💊 Fetch cared movies from API...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      const { uri, params, init } = api.query.movies.getMovies({
        params: {
          state: 'archived',
          cared: true,
          'releases.proposal': false,
          'cared_at.lte': new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            new Date().getDate()
          ).getTime(),
          sort_by: 'cared_at.desc',
        },
      })

      try {
        const { results, limit, total_results } = await api.fetch(uri, { ...params, limit: 200 }, init)
        setState((state) => ({ ...state, movies: results.reduce((acc, movie) => ({ ...acc, [movie.id]: movie }), {}) }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{Math.min(total_results, limit)}</Text> movies found</Text> }))
        setStatus('done')
        state.logger.info({ message: `💊 ${Math.min(total_results, limit)} Cared movies`, metadata: { ...state.metadata, summary: { cared: Math.min(total_results, limit) } } })
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
