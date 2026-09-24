import React, { useEffect } from 'react'
import fs from 'node:fs/promises'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Plex, pingToken } from '@sensorr/plex'
import { Task, Tasks, useTask, StdinMock } from '../components/Taskink'
import api from '../store/api'
import { lighten } from '../store/logger'
import command from '../utils/command'
import { fetchSensorrShows, fetchShow, requestedShowOf } from '../utils/shows'

const meta = {
  command: 'keep-in-touch',
  desc: '🍻 Goes through guests Plex watchlist and sync wished movies and shows',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const tmdb = new TMDB({
      key: config.get('tmdb'),
      region: config.get('region') || 'en-US',
      adult: config.get('adult'),
    })

    await tmdb.init()
    const app = JSON.parse(await fs.readFile(new URL('../../../../package.json', import.meta.url)))
    // Use the installation's unique, persisted X-Plex-Client-Identifier (falls back to the legacy
    // hardcoded one only if it hasn't been generated yet)
    app.plex = config.get('plex.client_identifier') || app.plex

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, tmdb, app }}>
        <FetchSensorrMoviesTask />
        <FetchSensorrShowsTask />
        <FetchGuestsTask />
        <FetchGuestsRequestsFromPlexWatchlistTask />
        <ComputeSensorrMovieRequestsTask />
        <ComputeSensorrShowRequestsTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchSensorrMoviesTask = ({ onError, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sensorr-movies',
    title: '🗄️  Fetch Sensorr library movies...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      const { uri, params, init } = api.query.movies.getMovies({
        params: {
          state: 'ignored|missing|pinned|wished|archived',
        },
      })

      try {
        const { results, total_results } = await api.fetch(uri, { ...params, limit: '' }, init)
        setState((state) => ({ ...state, library: results }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{total_results}</Text> movies found</Text> }))
        setStatus('done')
        state.logger.info({ message: `🗄️  ${total_results} Movies in Sensorr library`, metadata: { ...state.metadata, summary: { library: total_results } } })
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

const FetchSensorrShowsTask = ({ onError, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sensorr-shows',
    title: '🗄️  Fetch Sensorr library shows...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const shows = await fetchSensorrShows(api, { fields: 'id|name|state|genres|poster_path|vote_average|plex_guid|requested_by' })
        setState((state) => ({ ...state, shows }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{shows.length}</Text> shows found</Text> }))
        setStatus('done')
        state.logger.info({ message: `🗄️  ${shows.length} Shows in Sensorr library`, metadata: { ...state.metadata, summary: { shows: shows.length } } })
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

const FetchGuestsTask = ({ onError, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sensorr-guests',
    title: '🏘️  Fetch Sensorr guests...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const { uri, params, init } = api.query.guests.getGuests()
        const { results, total_results } = await api.fetch(uri, params, init)
        setState((state) => ({ ...state, guests: results }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{total_results}</Text> guest(s) found</Text> }))
        setStatus('done')
        state.logger.info({ message: `🏘️  ${total_results} guests registered on Sensorr`, metadata: { ...state.metadata, guests: results.map(({ email }) => email), summary: { guests: total_results } } })
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

const FetchGuestsRequestsFromPlexWatchlistTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, ready, context: { state, setState, handleError } } = useTask({
    id: 'fetch-guests-requests-from-plex-watchlist',
    title: '📡 Fetch Guests Requests from their Plex watchlist...',
  },
  {
    dependencies: ['fetch-sensorr-guests'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')
      const results = {}
      const shows = {}
      let expired = 0

      for (let guest of state.guests) {
        try {
          // Keep-alive: refresh the token's last-seen so Plex doesn't expire it on inactivity
          // (profile/watchlist reads don't refresh it, /api/v2/ping does)
          const alive = await pingToken(guest.plex_token, state.app)
          if (!alive) {
            state.logger.warn({ message: `Plex token keep-alive ping failed for ${guest.email}`, metadata: { ...state.metadata, guest: guest.email } })
          }

          setTask((task) => ({ ...task, output: <Text>Look at <Text bold={true}>{guest.email}</Text> Plex account</Text> }))
          const account = await Plex({ url: 'https://plex.tv:443', token: guest.plex_token, fallbackPort: 443 }, state.app).query(`/api/v2/user`)
          const { uri, params, init } = api.query.guests.postGuest({ body: { email: account.email, avatar: account.thumb, name: account.title || account.username, plex_token_valid: true, plex_token_checked_at: Date.now() } })
          await api.fetch(uri, params, init)

          setTask((task) => ({ ...task, output: <Text>Look at <Text bold={true}>{guest.email}</Text> Plex watchlist</Text> }))
          const plex = Plex({ url: 'https://discover.provider.plex.tv:443', token: guest.plex_token, fallbackPort: 443 }, state.app)
          let total_results = 0
          results[guest.email] = []

          do {
            const { MediaContainer: { Metadata, totalSize } } = await plex.query(`/library/sections/watchlist/all?&includeFields=title%2Ctype%2Cguid%2Cslug%2Ckey&sort=watchlistedAt%3Adesc&type=1&X-Plex-Container-Start=${results[guest.email].length || 0}`)
            total_results = totalSize
            results[guest.email].push(...Metadata)
          } while (results[guest.email].length < total_results)

          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{results[guest.email].length}</Text> movie(s) found on <Text bold={true}>{guest.email}</Text> Plex watchlist</Text> }))
          state.logger.info({ message: `${results[guest.email].length} movies found on ${guest.email} Plex watchlist`, metadata: { ...state.metadata, guest: guest.email, watchlist: results[guest.email].length } })

          // Movies are already in: a failure on the shows says nothing about the token
          try {
            let page = []
            shows[guest.email] = []

            do {
              const { MediaContainer: { Metadata, totalSize } } = await plex.query(`/library/sections/watchlist/all?&includeFields=title%2Ctype%2Cguid%2Cslug%2Ckey&sort=watchlistedAt%3Adesc&type=2&X-Plex-Container-Start=${shows[guest.email].length || 0}`)
              total_results = totalSize
              page = Metadata || []
              shows[guest.email].push(...page)
            } while (page.length && shows[guest.email].length < total_results)

            setTask((task) => ({ ...task, output: <Text><Text bold={true}>{shows[guest.email].length}</Text> show(s) found on <Text bold={true}>{guest.email}</Text> Plex watchlist</Text> }))
            state.logger.info({ message: `${shows[guest.email].length} shows found on ${guest.email} Plex watchlist`, metadata: { ...state.metadata, guest: guest.email, type: 'show', watchlist: shows[guest.email].length } })
          } catch (error) {
            shows[guest.email] = []
            state.logger.warn({ message: `Unable to look at ${guest.email} Plex watchlist of shows: "${error.message || error}"`, metadata: { ...state.metadata, guest: guest.email, type: 'show' } })
          }
        } catch (error) {
          // Token likely expired/revoked: mark the guest so it stops being silently skipped and
          // the administrator knows this guest must re-link their Plex account on /keep-in-touch.
          expired++
          try {
            const { uri, params, init } = api.query.guests.postGuest({ body: { email: guest.email, plex_token_valid: false, plex_token_checked_at: Date.now() } })
            await api.fetch(uri, params, init)
          } catch (err) {}

          setTask((task) => ({ ...task, output: <Text>⚠️  Unable to look at <Text bold={true}>{guest.email}</Text> Plex account or watchlist (token expired?), ask them to re-link: "{error.message || error}"</Text> }))
          state.logger.warn({ message: `Unable to look at ${guest.email} Plex account or watchlist, token expired? Ask them to re-link on /keep-in-touch: "${error.message || error}"`, metadata: { ...state.metadata, guest: guest.email, plex_token_valid: false, summary: { warning: 1 } } })
          await new Promise(resolve => setTimeout(resolve, 2400))
        }
      }

      if (expired > 0) {
        state.logger.warn({ message: `⚠️  ${expired} guest(s) have an expired Plex token and must re-link their account on /keep-in-touch`, metadata: { ...state.metadata, summary: { expired } } })
      }

      const requests = Object.keys(results).reduce((requests, guest, index) => ({
        ...requests,
        ...results[guest].reduce((acc, movie) => ({
          ...acc,
          [movie.guid]: [
            ...(requests[movie.guid] || []),
            ...(acc[movie.guid] || []),
            guest,
          ],
        }), {}),
      }), {})

      const showRequests = Object.keys(shows).reduce((requests, guest) => ({
        ...requests,
        ...shows[guest].reduce((acc, show) => ({
          ...acc,
          [show.guid]: [
            ...(requests[show.guid] || []),
            ...(acc[show.guid] || []),
            guest,
          ],
        }), {}),
      }), {})

      setState((state) => ({ ...state, requests, showRequests }))
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{Object.keys(requests).length}</Text> movie(s) and <Text bold={true}>{Object.keys(showRequests).length}</Text> show(s) found on guest(s) Plex watchlists</Text> }))
      setStatus('done')
      state.logger.info({ message: `📡 ${Object.keys(requests).length} movies found on guests Plex watchlist`, metadata: { ...state.metadata, summary: { watchlist: Object.keys(requests).length } } })
      state.logger.info({ message: `📡 ${Object.keys(showRequests).length} shows found on guests Plex watchlist`, metadata: { ...state.metadata, type: 'show', summary: { watchlist_shows: Object.keys(showRequests).length } } })
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}

const ComputeSensorrMovieRequestsTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, ready, context: { state, setState, handleError } } = useTask({
    id: 'compute-sensorr-movie-requests',
    title: '🍺 Compute Sensorr movie requests...',
  },
  {
    dependencies: ['fetch-guests-requests-from-plex-watchlist', 'fetch-sensorr-movies'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')

      const processed = []
      const plex = state.guests.reduce((acc, guest) => ({
        ...acc,
        [guest.email]: Plex({ url: 'https://metadata.provider.plex.tv:443', token: guest.plex_token, fallbackPort: 443 }, state.app),
      }), {})

      for (let [plex_guid, requested_by] of Object.entries(state.requests)) {
        setTask((task) => ({ ...task, output: `Look at movie "${plex_guid}" requested by ${requested_by.join(', ')}` }))
        let movie
        movie = state.library.find(m => m.plex_guid === plex_guid)

        if (!movie) {
          setTask((task) => ({ ...task, output: `Movie "${plex_guid}" requested by ${requested_by.join(', ')} unknown from library, look up for his TMDB id...` }))

          try {
            const { MediaContainer: { Metadata: [{ Guid }] } } = await plex[requested_by[0]].query(plex_guid.replace('plex://movie/', '/library/metadata/'))
            const tmdb_id = Number((Guid || []).find(guid => guid.id.startsWith('tmdb://'))?.id?.replace('tmdb://', ''))
            movie = state.library.find(m => m.id === tmdb_id)

            if (!tmdb_id) {
              setTask((task) => ({ ...task, output: `Movie "${plex_guid}" requested by ${requested_by.join(', ')} don't have TMDB id` }))
              state.logger.warn({ message: `Movie "${plex_guid}" requested by ${requested_by.join(', ')} don't have TMDB id`, metadata: { ...state.metadata, plex_guid, requested_by } })
              continue
            } else if (!movie) {
              setTask((task) => ({ ...task, output: `Movie "${plex_guid}" requested by ${requested_by.join(', ')} unknown from library, look up for his TMDB data with TMDB id "${tmdb_id}"...` }))
              const body = await state.tmdb.fetch(`movie/${tmdb_id}`, {
                append_to_response: 'alternative_titles,release_dates',
              })

              setTask((task) => ({ ...task, output: `Movie "${body.title}" requested by ${requested_by.join(', ')} processed` }))

              // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
              body.release_dates.results = body.release_dates.results
                .filter(({ type }) => type === 3)
                .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])

              movie = {
                ...body,
                state: 'ignored',
                plex_guid,
                requested_by,
                updated_at: new Date().getTime(),
              }

              const { uri, params, init } = api.query.movies.postMovie({ body: movie })
              await api.fetch(uri, params, init)
              processed.push(movie)
              state.logger.info({ message: `Movie "${movie.title}" requested by ${requested_by.join(', ')} processed`, metadata: { ...state.metadata, important: true, group: movie.id, movie: lighten.movie(movie), processed: true, requested_by } })
              continue
            } else {
              setTask((task) => ({ ...task, output: `Movie "${movie.title}" requested by ${requested_by.join(', ')} found in library with TMDB id "${tmdb_id}" !` }))
            }
          } catch (e) {
            console.warn(e)
          }
        }

        if (!requested_by.every(guest => (movie.requested_by || []).includes(guest))) {
          setTask((task) => ({ ...task, output: `Movie "${movie.title}" requested by ${requested_by.join(', ')} need to be synced with guests requesting it...` }))
          const { uri, params, init } = api.query.movies.postMovie({
            body: {
              id: movie.id,
              plex_guid,
              requested_by,
              updated_at: new Date().getTime(),
            },
          })

          await api.fetch(uri, params, init)
          processed.push(movie)
          setTask((task) => ({ ...task, output: `Movie "${movie.title}" requested by ${requested_by.join(', ')} processed` }))
          // `processed` is what turns this log into a request notification, and an archived movie leaves nothing to answer
          state.logger.info({ message: `Movie "${movie.title}" requested by ${requested_by.join(', ')} processed`, metadata: { ...state.metadata, important: true, group: movie.id, movie: lighten.movie(movie), processed: movie.state !== 'archived', requested_by } })
        } else {
          setTask((task) => ({ ...task, output: `Movie "${movie.title}" guests requests no need update` }))
          state.logger.info({ message: `Movie "${movie.title}" guests requests no need update`, metadata: { ...state.metadata, important: true, group: movie.id, movie: lighten.movie(movie), processed: false, requested_by } })
        }

      }

      await new Promise(resolve => setTimeout(resolve, 500))
      state.logger.info({ message: `🍺 ${processed.length} requests processed (added or updated)`, metadata: { ...state.metadata, summary: { processed: processed.length } } })
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{processed.length}</Text> requests processed (added or updated)</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}

const ComputeSensorrShowRequestsTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, ready, context: { state } } = useTask({
    id: 'compute-sensorr-show-requests',
    title: '🍺 Compute Sensorr show requests...',
  },
  {
    dependencies: ['fetch-guests-requests-from-plex-watchlist', 'fetch-sensorr-shows', 'compute-sensorr-movie-requests'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      setStatus('loading')

      const processed = []
      const plex = state.guests.reduce((acc, guest) => ({
        ...acc,
        [guest.email]: Plex({ url: 'https://metadata.provider.plex.tv:443', token: guest.plex_token, fallbackPort: 443 }, state.app),
      }), {})

      for (let [plex_guid, requested_by] of Object.entries(state.showRequests || {})) {
        try {
          setTask((task) => ({ ...task, output: `Look at show "${plex_guid}" requested by ${requested_by.join(', ')}` }))
          let show = state.shows.find(s => s.plex_guid === plex_guid)

          if (!show) {
            const { MediaContainer: { Metadata: [{ Guid }] } } = await plex[requested_by[0]].query(plex_guid.replace('plex://show/', '/library/metadata/'))
            const tmdb_id = Number((Guid || []).find(guid => guid.id.startsWith('tmdb://'))?.id?.replace('tmdb://', ''))
            show = state.shows.find(s => s.id === tmdb_id)

            if (!tmdb_id) {
              state.logger.warn({ message: `Show "${plex_guid}" requested by ${requested_by.join(', ')} don't have TMDB id`, metadata: { ...state.metadata, type: 'show', plex_guid, requested_by } })
              continue
            }

            if (!show) {
              setTask((task) => ({ ...task, output: `Show "${plex_guid}" requested by ${requested_by.join(', ')} unknown from library, look up for his TMDB data with TMDB id "${tmdb_id}"...` }))
              const requested = requestedShowOf(await fetchShow(state.tmdb, tmdb_id), plex_guid, requested_by)

              const shows = api.query.shows.postShows({ body: { [requested.show.id]: { ...requested.show, refreshed_at: new Date() } } })
              await api.fetch(shows.uri, shows.params, shows.init)

              if (requested.episodes.length) {
                const { uri, params, init } = api.query.episodes.postEpisodes({ body: requested.episodes.reduce((acc, episode) => ({ ...acc, [episode.id]: episode }), {}) })
                await api.fetch(uri, params, init)
              }

              processed.push(requested.show)
              state.logger.info({ message: `Show "${requested.show.name}" requested by ${requested_by.join(', ')} processed`, metadata: { ...state.metadata, important: true, group: requested.show.id, type: 'show', show: lighten.show(requested.show), processed: true, requested_by } })
              continue
            }
          }

          const guests = [...new Set([...(show.requested_by || []), ...requested_by])]
          const added = guests.length > (show.requested_by || []).length

          // A show known by its TMDB id only keeps its Plex guid, so the next run skips the lookup
          if (added || show.plex_guid !== plex_guid) {
            const { uri, params, init } = api.query.shows.postShows({ body: { [show.id]: { plex_guid, requested_by: guests } } })
            await api.fetch(uri, params, init)
          }

          if (added) {
            processed.push(show)
            // Same as a movie: an archived show leaves nothing to answer
            state.logger.info({ message: `Show "${show.name}" requested by ${requested_by.join(', ')} processed`, metadata: { ...state.metadata, important: true, group: show.id, type: 'show', show: lighten.show(show), processed: show.state !== 'archived', requested_by: guests } })
          } else {
            state.logger.info({ message: `Show "${show.name}" guests requests no need update`, metadata: { ...state.metadata, important: true, group: show.id, type: 'show', show: lighten.show(show), processed: false, requested_by } })
          }
        } catch (error) {
          state.logger.warn({ message: `⚠️ Error on show "${plex_guid}" requested by ${requested_by.join(', ')}: "${error?.message || error}"`, metadata: { ...state.metadata, type: 'show', plex_guid, requested_by, warning: error } })
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      state.logger.info({ message: `🍺 ${processed.length} show requests processed (added or updated)`, metadata: { ...state.metadata, type: 'show', summary: { processed_shows: processed.length } } })
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{processed.length}</Text> show requests processed (added or updated)</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}
