import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { TMDB } from '@sensorr/tmdb'
import { Plex } from '@sensorr/plex'
import { Task, Tasks, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'

const app = require('../../../../package.json')
const oleoo = require('oleoo')

const meta = {
  command: 'sync',
  desc: '🔗 Sync Sensorr library with registered Plex server',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    if (!config.get('plex.url')) {
      throw new Error('You need to register a Plex server with Sensorr settings page before sync to it !')
    }

    const plex = Plex(config.get('plex'), app)
    const tmdb = new TMDB({
      key: config.get('tmdb'),
      region: config.get('region') || 'en-US',
      adult: config.get('adult'),
    })

    await tmdb.init()

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job }, logger, plex, tmdb }}>
        <FetchSensorrMoviesTask />
        <FetchPlexMoviesTask />
        <CheckSensorrMoviesTask />
        <ComputeSensorrMissingMovies />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const FetchSensorrMoviesTask = ({ onError, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sensorr-movies',
    title: '🗄️  Fetch Sensorr library movies...',
  }, { dependencies: [] })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      const { uri, params, init } = api.query.movies.getMovies({ params: { state: 'archived' } })

      try {
        const { results, total_results } = await api.fetch(uri, { ...params, limit: '' }, init)
        setState((state) => ({ ...state, library: results }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{total_results}</Text> movies found</Text> }))
        setStatus('done')
        state.logger.info({ message: `🗄️  ${total_results} Archived movies in Sensorr library`, metadata: { ...state.metadata, summary: { archived: total_results } } })
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

const FetchPlexMoviesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-plex-movies',
    title: '📡 Fetch Plex library movies...',
  })

  useEffect(() => {
    const cb = async () => {
      let total_results = 0
      setStatus('loading')

      try {
        const { MediaContainer: { machineIdentifier: server } } = await state.plex.query('/')
        const raw = await state.plex.query('/library/sections')
        const sections = raw.MediaContainer.Directory.filter((dir) => dir.type === 'movie')
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{sections.length}</Text> section(s) found on Plex Server <Text bold={true}>{server}</Text></Text> }))

        for (const section of sections) {
          const payload = await state.plex.query(`/library/sections/${section.key}/all?includeGuids=1`)
          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{payload.MediaContainer.Metadata.length}</Text> movies found on <Text bold={true}>{sections.length}</Text> section(s) on Plex Server <Text bold={true}>{server}</Text></Text> }))
          setState((state) => ({ ...state, server, distant: [...(state.distant || []), ...payload.MediaContainer.Metadata] }))
          total_results += payload.MediaContainer.Metadata.length
        }

        setStatus('done')
        state.logger.info({ message: `📡 ${total_results} movies available on Plex server`, metadata: { ...state.metadata, summary: { plex: total_results } } })
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

const CheckSensorrMoviesTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, ready, context: { state, setState } } = useTask({
    id: 'check-sensorr-movies',
    title: '🔎 Check Sensorr movies...',
  },
  {
    dependencies: ['fetch-sensorr-movies', 'fetch-plex-movies'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      const corrections = [], warning = []
      setStatus('loading')

      for (const payload of (state.distant || [])) {
        try {
          setTask((task) => ({
            ...task,
            title: (
              <Text>
                🔎 Check Sensorr movies {(
                  <Text color='grey'>({(state.distant || []).indexOf(payload) + 1}/{(state.distant || []).length})</Text>
                )}
              </Text>
            ),
            output: <Text><Text bold={true}>{payload.title}</Text> - Fetching full Plex data</Text>,
          }))

          const guids = (payload.Guid || []).map(({ id }) => id.split('://')).reduce((acc, [agent, id]) => ({ ...acc, [agent]: id }), {})
          let movie = (state.library || []).find((movie) => `${movie.id}` === `${guids.tmdb}` || `${movie.imdb_id}` === `${guids.imdb}`)
          const { MediaContainer: { Metadata: [{ Media }] } } = await state.plex.query(payload.key)

          const body = {
            state: 'archived',
            plex_url: `https://app.plex.tv/desktop/#!/server/${state.server}/details?key=${encodeURIComponent(payload.key)}`,
            releases: [
              ...(movie?.releases || []).filter(release => !(release.id || '').startsWith('plex://')),
              ...Media.map(media => {
                const fallback = oleoo.parse(media.Part[0].file.split(/[\\/]/).pop(), { strict: false, flagged: true })

                const meta = {
                  type: 'movie',
                  fallback,
                  title: (payload.title)
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^\sa-zA-Z0-9]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' '),
                  year: payload.year,
                  language: media.Part[0].Stream
                    .reduce((acc, curr, index, arr) => {
                      const audios = arr.filter(stream => stream.streamType === 2)
                      if (audios.length > 1) {
                        return 'MULTI'
                      }

                      const subtitles = arr.filter(stream => stream.streamType === 3).sort((a, b) => a.languageTag === 'en' ? 1 : -1)
                      if (subtitles.length && subtitles[0].languageTag !== audios[0].languageTag) {
                        return `VOST${(subtitles[0].languageTag || '').toUpperCase()}`
                      }

                      return {
                        en: 'ENGLISH',
                        fr: 'FRENCH',
                        fa: 'PERSIAN',
                        am: 'AMHARIC',
                        ar: 'ARABIC',
                        km: 'CAMBODIAN',
                        zh: 'CHINESE',
                        cr: 'CREOLE',
                        da: 'DANISH',
                        nl: 'DUTCH',
                        et: 'ESTONIAN',
                        fi: 'FINNISH',
                        de: 'GERMAN',
                        el: 'GREEK',
                        iw: 'HEBREW',
                        in: 'INDONESIAN',
                        ga: 'IRISH',
                        it: 'ITALIAN',
                        ja: 'JAPANESE',
                        ko: 'KOREAN',
                        lo: 'LAOTIAN',
                        lv: 'LATVIAN',
                        lt: 'LITHUANIAN',
                        ms: 'MALAY',
                        ms: 'MALAYSIAN',
                        mi: 'MAORI',
                        no: 'NORWEGIAN',
                        ps: 'PASHTO',
                        pl: 'POLISH',
                        pt: 'PORTUGUESE',
                        ro: 'ROMANIAN',
                        ru: 'RUSSIAN',
                        es: 'SPANISH',
                        sw: 'SWAHILI',
                        sv: 'SWEDISH',
                        tl: 'TAGALOG',
                        tg: 'TAJIK',
                        th: 'THAI',
                        tr: 'TURKISH',
                        uk: 'UKRAINIAN',
                        vi: 'VIETNAMESE',
                        cy: 'WELSH',
                      }[audios[0].languageTag]
                    }),
                  source: fallback.source,
                  encoding: {
                    h264: 'x264',
                    hevc: 'x265',
                    vc1: 'VC1',
                    mpeg4: media.Part[0].Stream.reduce((acc, curr) => curr.streamType === 1 ? { XVID: 'XviD', DX50: 'DivX' }[curr.codecID] : acc, null),
                  }[media.videoCodec] || fallback.encoding,
                  resolution: media.videoResolution === '2160' ? '2160p' :  media.videoResolution === '1080' ? '1080p' : media.videoResolution === '720' ? '720p' : 'SD',
                  dub: fallback.dub || {
                    ac3: 'AC3',
                    eac3: 'AC3',
                    // mp3: 'MP3',
                    // flac: 'FLAC',
                    // opus: 'OPUS',
                    // vorbis: 'VORBIS'
                  }[media.audioCodec],
                  flags: [...new Set([
                    ...(fallback.flags || []),
                    ...({
                      aac: ['AAC'],
                      dca: ['DTS'],
                      'dca-ma': ['HDMA'],
                      truehd: ['TRUEHD'],
                    }[media.audioCodec] || []),
                  ])],
                  group: fallback.group,
                  season: null,
                  episode: null,
                  episodes: [],
                }

                const release = oleoo.stringify(meta, { flagged: true })

                return {
                  id: `${payload.guid}#${media.id}`,
                  title: release,
                  original: fallback.original,
                  from: 'sync',
                  job: state.metadata.job,
                  size: media.Part.reduce((acc, curr) => acc + curr.size, 0),
                }
              }),
            ],
          }

          const reason = (
            movie?.state !== body?.state ? `Plex movie state unknown from Sensorr library (${movie?.state || 'unknown'})` :
            movie?.plex_url !== body?.plex_url ? `Plex movie link unknown from Sensorr library` :
            JSON.stringify((movie?.releases || []).map(({ id }) => id).sort((a, b) => a.localeCompare(b))) !== JSON.stringify((body?.releases || []).map(({ id }) => id).sort((a, b) => a.localeCompare(b))) ? `Plex release different from Sensorr library` : null
          )

          if (!reason) {
            setState((state) => ({ ...state, processed: [...(state.processed || []), movie?.id] }))
            setTask((task) => ({ ...task, output: <Text><Text bold={true}>{payload.title}</Text> - Already "archived" on Sensorr</Text> }))
            continue
          }

          setTask((task) => ({ ...task, output: <Text><Text bold={true}>{payload.title}</Text> - Fix Sensorr movie data with Plex metadata</Text> }))

          if (!movie?.id) {
            if (!guids.tmdb) {
              if (!guids.imdb) {
                throw new Error(`Plex entity "${payload.title}" without service id (TMDB or IMDB), not associatable`)
              }

              const fallbacks = await state.tmdb.fetch(`/find/${guids.imdb}`, { external_source: 'imdb_id' })

              if (!fallbacks.movie_results.length) {
                throw new Error(`No TMDB associated movie found for Plex entity "${payload.title}" with IMDB id: ${guids.imdb}`)
              }

              guids.tmdb = fallbacks.movie_results[0].id
            }

            movie = await state.tmdb.fetch(`movie/${guids.tmdb}`, {
              append_to_response: 'alternative_titles,release_dates',
            })

            // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
            movie.release_dates.results = movie.release_dates.results
              .filter(({ type }) => type === 3)
              .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])
          }

          state.logger.info({ message: `🩹 Fix "${payload.title}" movie data with Plex metadata (archived)`, metadata: { ...state.metadata, group: 'corrections', movie: lighten.movie(movie), reason } })
          setState((state) => ({ ...state, processed: [...(state.processed || []), movie.id] }))
          const { uri, params, init } = api.query.movies.postMovie({
            body: {
              ...movie,
              ...body,
              updated_at: new Date().getTime(),
            },
          })

          await api.fetch(uri, params, init)
          corrections.push(movie.id)
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message}` }))
          state.logger.warn({ message: `⚠️ Error, ${error.message}`, metadata: { ...state.metadata, group: 'corrections', error, payload } })
          warning.push(payload.key)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      state.logger.info({ message: `🩹 ${corrections.length} Fixed movies with Plex metadata`, metadata: { ...state.metadata, summary: { corrections: { success: corrections.length, warning: warning.length} } } })
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{corrections.length}</Text> movies data fixed with Plex metadata (<Text bold={true}>archived</Text>)</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}

const ComputeSensorrMissingMovies = ({ ...props }) => {
  const { task, setTask, status, setStatus, ready, context: { state } } = useTask({
    id: 'compute-sensorr-missing-movies',
    title: '💊 Compute Sensorr "missing" movies...',
  },
  {
    dependencies: ['check-sensorr-movies'],
  })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      const missings = [], warning = []
      setStatus('loading')

      for (const movie of (state.library || [])) {
        if (!(state.processed || []).includes(movie.id) && movie.state === 'archived') {
          try {
            missings.push(movie.id)
            state.logger.info({ message: `💊 "${movie.title}" movie available on Plex but "missing" on Sensorr`, metadata: { ...state.metadata, group: 'missings', movie: lighten.movie(movie) } })
            setTask((task) => ({ ...task, output: <Text>Movie <Text bold={true}>{movie.title}</Text> not found on Plex, consider it as "missing"</Text> }))
            const { uri, params, init } = api.query.movies.postMovie({
              body: {
                ...movie,
                releases: (movie.releases || []).filter(release => release.from !== 'sync'),
                state: 'missing',
                updated_at: new Date().getTime(),
              },
            })

            await api.fetch(uri, params, init)
          } catch (error) {
            setStatus('error')
            setTask((task) => ({ ...task, output: `⚠️  ${error.message}` }))
            state.logger.warn({ message: `⚠️ Error on "${movie.title}" Plex movie, "${error.message}"`, metadata: { ...state.metadata, group: 'missings', error, movie: lighten.movie(movie) } })
            warning.push(movie.id)
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      state.logger.info({ message: `💊 ${missings.length} Missing movies in Sensorr but available on Plex`, metadata: { ...state.metadata, summary: { missings: { success: missings.length, warning: warning.length } } } })
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{missings.length}</Text> movies available on Plex but <Text bold={true}>missing</Text> on Sensorr</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...task} status={status} />
  )
}
