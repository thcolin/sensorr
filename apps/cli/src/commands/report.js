import React, { useEffect } from 'react'
import fs from 'node:fs/promises'
import { render, Text } from 'ink'
import { Sensorr } from '@sensorr/sensorr'
import { Plex, getReports } from '@sensorr/plex'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { ProcessMoviesTask } from '../components/Tasks/ProcessMoviesTask'
import api from '../store/api'
import command from '../utils/command'
import { isBusy, isPending, movieOf, newReportsOf, cursorOf, reportedOf } from '../utils/reports'

const meta = {
  command: 'report',
  type: 'movie',
  desc: '🚩 Replace archived movies reported from Plex with their best release',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    if (!config.get('plex.url') || !config.get('plex.token')) {
      throw new Error('You need to register a Plex server with Sensorr settings page before reading its reports !')
    }

    const app = JSON.parse(await fs.readFile(new URL('../../../../package.json', import.meta.url)))
    app.plex = config.get('plex.client_identifier') || app.plex
    const plex = Plex(config.get('plex'), app)
    const sensorr = new Sensorr({ znabs: config.get('znabs'), region: config.get('region') })

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command, type: meta.type }, logger, plex, sensorr, token: config.get('plex.token'), since: config.get('jobs.report.movies.since'), policies: config.get('policies') }}>
        <FetchAPIMoviesTask />
        <ProcessMoviesTask command='report' proposalOnly={config.get('jobs.report.movies.proposalOnly')} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchAPIMoviesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-movies',
    title: '🚩 Fetch Plex reported issues...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const { MediaContainer: { machineIdentifier: server } } = await state.plex.query('/')
        const reports = newReportsOf(await getReports(state.token, state.since), { server, since: state.since })

        if (reports.length) {
          const { uri, params, init } = api.query.movies.getMovies({ params: { state: 'archived' } })
          const { results: library } = await api.fetch(uri, { ...params, limit: '' }, init)
          const touched = {}

          for (const report of reports.sort((a, b) => a.date - b.date)) {
            const payload = await state.plex.query(`${report.key}?includeGuids=1`)
              .then(({ MediaContainer }) => MediaContainer.Metadata[0])
              // A reported item Plex no longer has is skipped, any other failure stops the run before the cursor moves.
              .catch((error) => { if (/response code: 404$/.test(error?.message)) return null; throw error })
            const found = movieOf(payload, library)
            const movie = found && (touched[found.id] || found)

            if (!movie) {
              state.logger.info({ message: `🚩 Report "${report.message}" ignored, no archived movie for ${payload?.title ? `Plex ${payload.type} "${payload.title}"` : `Plex item ${report.key}`}`, metadata: { ...state.metadata } })
              continue
            }

            const reported = reportedOf(movie, report)

            if (reported === movie) {
              continue
            }

            touched[movie.id] = reported
            const { uri, params, init } = api.query.movies.postMovie({ body: reported })
            await api.fetch(uri, params, init)
            state.logger.info({ message: `🚩 "${movie.title}" reported by ${report.username}: "${report.message}", ${movie.releases.filter(({ proposal }) => !proposal).length} owned release(s) banned`, metadata: { ...state.metadata, group: movie.id, report } })
          }
        }

        const put = api.query.config.putConfig({ body: { key: 'jobs.report.movies.since', value: cursorOf(reports, state.since) } })
        await api.fetch(put.uri, put.params, put.init)

        const { uri, params, init } = api.query.movies.getMovies({ params: { state: 'archived', reported: true } })
        const { results } = await api.fetch(uri, { ...params, limit: '' }, init)
        const movies = {}

        for (const movie of results.filter(isPending)) {
          if (isBusy(movie)) {
            state.logger.info({ message: `🚩 "${movie.title}" already has a replacement pending, not searched`, metadata: { ...state.metadata, group: movie.id } })
            const { uri, params, init } = api.query.movies.postMovie({ body: { ...movie, reported_at: Date.now() } })
            await api.fetch(uri, params, init)
            continue
          }

          movies[movie.id] = movie
        }

        setState((state) => ({ ...state, movies }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{reports.length}</Text> new reports, <Text bold={true}>{Object.keys(movies).length}</Text> movies to replace</Text> }))
        setStatus('done')
        state.logger.info({ message: state.since ? `🚩 ${reports.length} new Plex reports, ${Object.keys(movies).length} movies to replace` : `🚩 First run, reports made until now are ignored`, metadata: { ...state.metadata, summary: { reported: Object.keys(movies).length } } })
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
