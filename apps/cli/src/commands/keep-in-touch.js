import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Plex } from '@sensorr/plex'
import { Task, Tasks, useTask, StdinMock } from '../components/Taskink'
import api from '../store/api'
import { lighten } from '../store/logger'
import command from '../utils/command'

const app = require('../../../../package.json')

const meta = {
  command: 'keep-in-touch',
  desc: '🍻 Goes through guests Plex watchlist and sync wished movies',
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

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job }, logger, tmdb }}>
        <FetchSensorrMoviesTask />
        <FetchGuestsTask />
        <FetchGuestsRequestsFromPlexWatchlistTask />
        <ComputeSensorrMovieRequestsTask />
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

      for (let guest of state.guests) {
        try {
          setTask((task) => ({ ...task, output: <Text>Look at <Text bold={true}>{guest.email}</Text> Plex account</Text> }))
          const account = await Plex({ url: 'https://plex.tv:443', token: guest.plex_token, fallbackPort: 443 }, app).query(`/api/v2/user`)
          const { uri, params, init } = api.query.guests.postGuest({ body: { email: account.email, avatar: account.thumb, name: account.title || account.username } })
          await api.fetch(uri, params, init)

          setTask((task) => ({ ...task, output: <Text>Look at <Text bold={true}>{guest.email}</Text> Plex watchlist</Text> }))
          const plex = Plex({ url: 'https://metadata.provider.plex.tv:443', token: guest.plex_token, fallbackPort: 443 }, app)
          let total_results = 0
          results[guest.email] = []

          do {
            const { MediaContainer: { Metadata, totalSize } } = await plex.query(`/library/sections/watchlist/all?&includeFields=title%2Ctype%2Cguid%2Cslug%2Ckey&sort=watchlistedAt%3Adesc&type=1&X-Plex-Container-Start=${results[guest.email].length || 0}`)
            total_results = totalSize
            results[guest.email].push(...Metadata)
          } while (results[guest.email].length < total_results)

          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{results[guest.email].length}</Text> movie(s) found on <Text bold={true}>{guest.email}</Text> Plex watchlist</Text> }))
          state.logger.info({ message: `${results[guest.email].length} movies found on ${guest.email} Plex watchlist`, metadata: { ...state.metadata, guest: guest.email, watchlist: results[guest.email].length } })
        } catch (error) {
          setTask((task) => ({ ...task, output: <Text>⚠️  Unable to look at <Text bold={true}>{guest.email}</Text> Plex account or watchlist: "{error.message || error}"</Text> }))
          state.logger.warn({ message: `Unable to look at ${guest.email} Plex account or watchlist: "${error.message || error}"`, metadata: { ...state.metadata, summary: { warning: 1 } } })
          await new Promise(resolve => setTimeout(resolve, 2400))
        }
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

      setState((state) => ({ ...state, requests }))
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{Object.keys(requests).length}</Text> movie(s) found on guest(s) Plex watchlists</Text> }))
      setStatus('done')
      state.logger.info({ message: `📡 ${Object.keys(requests).length} movies found on guests Plex watchlist`, metadata: { ...state.metadata, summary: { watchlist: Object.keys(requests).length } } })
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
        [guest.email]: Plex({ url: 'https://metadata.provider.plex.tv:443', token: guest.plex_token, fallbackPort: 443 }, app),
      }), {})

      for (let [plex_guid, requested_by] of Object.entries(state.requests)) {
        setTask((task) => ({ ...task, output: `Look at movie "${plex_guid}" requested by ${requested_by.join(', ')}` }))
        let movie
        movie = state.library.find(m => m.plex_guid === plex_guid)

        if (!movie) {
          setTask((task) => ({ ...task, output: `Movie "${plex_guid}" requested by ${requested_by.join(', ')} unknown from library, look up for his TMDB id...` }))

          try {
            const { MediaContainer: { Metadata: [{ Guid }] } } = await plex[requested_by[0]].query(plex_guid.replace('plex://movie/', '/library/metadata/'))
            const tmdb_id = Number((Guid || []).find(guid => guid.id.startsWith('tmdb://')).id.replace('tmdb://', ''))
            movie = state.library.find(m => m.id === tmdb_id)

            if (!tmdb_id) {
              setTask((task) => ({ ...task, output: `Movie "${plex_guid}" requested by ${requested_by.join(', ')} don't have TMDB id` }))
              state.logger.warn({ message: `Movie "${plex_guid}" requested by ${requested_by.join(', ')} don't have TMDB id`, metadata: { ...state.metadata, plex_guid, requested_by } })
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
          state.logger.info({ message: `Movie "${movie.title}" requested by ${requested_by.join(', ')} processed`, metadata: { ...state.metadata, important: true, group: movie.id, movie: lighten.movie(movie), processed: true, requested_by } })
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
