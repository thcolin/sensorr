import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'
import { fetchShow, sonarrShowOf, sonarrEpisodesOf } from '../utils/shows'

const meta = {
  command: 'migrate-sonarr',
  desc: '🚚 Migrate series from a Sonarr server',
  builder: {
    url: {
      describe: 'Sonarr server URL, its API key is read from SONARR_API_KEY',
      type: 'string',
      demandOption: true,
    },
    'dry-run': {
      describe: 'Print the counts without writing anything to Sensorr',
      type: 'boolean',
      default: false,
    },
  },
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ argv, config, logger }) => {
    if (!process.env.SONARR_API_KEY) {
      throw new Error('You need to set SONARR_API_KEY with your Sonarr API key before migrating from it !')
    }

    // Read-only on Sonarr: only GET requests, and the key never leaves this closure
    const sonarr = async (path, query = {}) => {
      const res = await fetch(`${argv.url.replace(/\/+$/, '')}/api/v3/${path}?${new URLSearchParams(query)}`, {
        headers: { 'X-Api-Key': process.env.SONARR_API_KEY, Accept: 'application/json' },
      })

      if (!res.ok) {
        throw new Error(`Sonarr "${path}" responded ${res.status} ${res.statusText}`)
      }

      return res.json()
    }

    const tmdb = new TMDB({
      key: config.get('tmdb'),
      region: config.get('region') || 'en-US',
      adult: config.get('adult'),
    })

    await tmdb.init()

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, tmdb, sonarr, dry: argv.dryRun }}>
        <FetchSonarrSeriesTask />
        <MigrateSonarrSeriesTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchSonarrSeriesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sonarr-series',
    title: '📡 Fetch Sonarr series...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const series = await state.sonarr('series')
        setState((state) => ({ ...state, series }))
        state.logger.info({ message: `📡 ${series.length} series found on Sonarr`, metadata: { ...state.metadata, summary: { sonarr: series.length } } })
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{series.length}</Text> series found on Sonarr</Text> }))
        setStatus('done')
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

const MigrateSonarrSeriesTask = ({ ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state } } = useTask({
    id: 'migrate-sonarr-series',
    title: '🚚 Migrate Sonarr series...',
  }, { dependencies: ['fetch-sonarr-series'] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      const counts = { wished: 0, archived: 0, skipped: 0, untracked: 0, unmatched: 0, warning: 0 }
      setStatus('loading')

      for (const series of (state.series || [])) {
        try {
          setTask((task) => ({
            ...task,
            title: (
              <Text>
                🚚 Migrate Sonarr series{state.dry ? ' (dry run)' : ''} {(
                  <Text color='grey'>({state.series.indexOf(series) + 1}/{state.series.length})</Text>
                )}
              </Text>
            ),
            output: `Migrate "${series.title}"...`,
          }))

          if (!series.tmdbId) {
            state.logger.info({ message: `Sonarr series "${series.title}" without TMDB id, ignored`, metadata: { ...state.metadata, ignored: true } })
            counts.untracked++
            continue
          }

          const fields = sonarrShowOf(series)

          if (!fields) {
            counts.skipped++
            continue
          }

          const { show, episodes: fetched } = await fetchShow(state.tmdb, series.tmdbId)
          const { episodes, unmatched } = sonarrEpisodesOf(fetched, await state.sonarr('episode', { seriesId: series.id }), fields, series.seasons)

          if (unmatched.length) {
            const numbers = unmatched.map(({ seasonNumber, episodeNumber }) => `S${`${seasonNumber}`.padStart(2, '0')}E${`${episodeNumber}`.padStart(2, '0')}`)
            state.logger.warn({ message: `⚠️ ${unmatched.length} Sonarr episodes of "${show.name}" unknown to TMDB: ${numbers.join(', ')}`, metadata: { ...state.metadata, group: show.id, show: lighten.show(show), unmatched: numbers } })
            counts.unmatched += unmatched.length
          }

          if (!state.dry) {
            const shows = api.query.shows.postShows({ body: { [show.id]: { ...show, ...fields, refreshed_at: new Date() } } })
            await api.fetch(shows.uri, shows.params, shows.init)

            if (episodes.length) {
              const { uri, params, init } = api.query.episodes.postEpisodes({ body: episodes.reduce((acc, episode) => ({ ...acc, [episode.id]: episode }), {}) })
              await api.fetch(uri, params, init)
            }
          }

          state.logger.info({ message: `Migrate "${show.name}" as "${fields.state}"${state.dry ? ' (dry run)' : ''}`, metadata: { ...state.metadata, group: show.id, type: 'show', entity: lighten.show(show) } })
          counts[fields.state]++
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
          state.logger.warn({ message: `⚠️ Sonarr series "${series.title}", error during migration: "${error?.message || error}"`, metadata: { ...state.metadata, entity: series.tmdbId, warning: error } })
          counts.warning++
        }
      }

      const summary = `${counts.wished} wished, ${counts.archived} archived, ${counts.skipped} skipped without monitoring nor file, ${counts.untracked} without TMDB id, ${counts.unmatched} episodes unknown to TMDB, ${counts.warning} errors`
      state.logger.info({ message: `🚚 ${state.dry ? 'Would migrate' : 'Migrated'} ${counts.wished + counts.archived} Sonarr series: ${summary}`, metadata: { ...state.metadata, summary: { shows: counts } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{counts.wished + counts.archived}</Text> series {state.dry ? 'to migrate' : 'migrated'}: {summary}</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}
