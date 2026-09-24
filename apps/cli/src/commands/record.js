import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { Sensorr } from '@sensorr/sensorr'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { ProcessMoviesTask } from '../components/Tasks/ProcessMoviesTask'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'record',
  type: 'movie',
  desc: '📹 Record wished movies with best release available',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const sensorr = new Sensorr({ znabs: config.get('znabs'), region: config.get('region') })

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command, type: meta.type }, logger, sensorr, policies: config.get('policies') }}>
        <FetchAPIMoviesTask command='record' />
        <ProcessMoviesTask command='record' proposalOnly={config.get('jobs.record.movies.proposalOnly')} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchAPIMoviesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-movies',
    title: '🍿 Fetch wished movies from API...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      const { uri, params, init } = api.query.movies.getMovies({ params: { state: 'wished', 'releases.proposal': false, sort_by: 'updated_at.desc' } })

      try {
        const { results } = await api.fetch(uri, { ...params, limit: '' }, init)
        setState((state) => ({ ...state, movies: results.reduce((acc, movie) => ({ ...acc, [movie.id]: movie }), {}) }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{results.length}</Text> movies found</Text> }))
        setStatus('done')
        state.logger.info({ message: `🍿 ${results.length} Wished movies`, metadata: { ...state.metadata, summary: { wished: results.length } } })
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
