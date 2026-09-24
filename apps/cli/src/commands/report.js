import React, { useEffect } from 'react'
import fs from 'node:fs/promises'
import { render, Text } from 'ink'
import { Sensorr } from '@sensorr/sensorr'
import { Plex, getReports } from '@sensorr/plex'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { ProcessMoviesTask } from '../components/Tasks/ProcessMoviesTask'
import api from '../store/api'
import command from '../utils/command'
import { bansOf, isBusy, newReportsOf, cursorOf } from '../utils/reports'

const meta = {
  command: 'report',
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
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, plex, sensorr, token: config.get('plex.token'), since: config.get('jobs.report.since'), policies: config.get('policies') }}>
        <FetchAPIMoviesTask />
        <ProcessMoviesTask command='report' proposalOnly={config.get('jobs.report.proposalOnly')} />
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
        const movies = {}

        if (reports.length) {
          const { uri, params, init } = api.query.movies.getMovies({ params: { state: 'archived' } })
          const { results: library } = await api.fetch(uri, { ...params, limit: '' }, init)

          for (const report of reports.sort((a, b) => a.date - b.date)) {
            const payload = await state.plex.query(`${report.key}?includeGuids=1`).then(({ MediaContainer }) => MediaContainer.Metadata[0]).catch(() => null)
            const guids = (payload?.Guid || []).map(({ id }) => id.split('://')).reduce((acc, [agent, id]) => ({ ...acc, [agent]: id }), {})
            const found = payload?.type === 'movie' && library.find((movie) => `${movie.id}` === `${guids.tmdb}` || `${movie.imdb_id}` === `${guids.imdb}`)
            const movie = found && (movies[found.id] || found)

            if (!movie) {
              state.logger.info({ message: `🚩 Report "${report.message}" ignored, no archived movie for ${payload?.title ? `Plex ${payload.type} "${payload.title}"` : `Plex item ${report.key}`}`, metadata: { ...state.metadata } })
              continue
            }

            const reported = {
              ...movie,
              banned_releases: bansOf(movie),
              reports: [...(movie.reports || []), { id: report.id, message: report.message, date: report.date, username: report.username }],
            }

            const { uri, params, init } = api.query.movies.postMovie({ body: reported })
            await api.fetch(uri, params, init)
            state.logger.info({ message: `🚩 "${movie.title}" reported by ${report.username}: "${report.message}", ${movie.releases.filter(({ proposal }) => !proposal).length} owned release(s) banned`, metadata: { ...state.metadata, group: movie.id, report } })

            if (isBusy(movie)) {
              state.logger.info({ message: `🚩 "${movie.title}" already has a replacement pending, not searched`, metadata: { ...state.metadata, group: movie.id } })
              continue
            }

            movies[movie.id] = reported
          }
        }

        const put = api.query.config.putConfig({ body: { key: 'jobs.report.since', value: cursorOf(reports, state.since) } })
        await api.fetch(put.uri, put.params, put.init)

        setState((state) => ({ ...state, movies }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{reports.length}</Text> new reports, <Text bold={true}>{Object.keys(movies).length}</Text> movies to replace</Text> }))
        setStatus('done')
        state.logger.info({ message: state.since ? `🚩 ${reports.length} New Plex reports, ${Object.keys(movies).length} movies to replace` : `🚩 First run, reports made until now are ignored`, metadata: { ...state.metadata, summary: { reported: Object.keys(movies).length } } })
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
