// Generates the data the demo starts from, `apps/web/src/demo/seed/seed.json`, from TMDB with the demo's key:
//
//   SENSORR_DEMO_TMDB_KEY=... npx ts-node -P tools/tsconfig.tools.json --transpile-only -O '{"target":"es2022","esModuleInterop":true}' tools/demo/seed.ts
//
// The movies, shows and stars are TMDB's, the rest is made up: states, files, proposals, the runs of the jobs that
// found them, and the plays of Alex's wrapped, `apps/wrapped/src/demo/share.json`. TMDB data may not be kept more than 6 months, so the file is not committed: the Demo workflow builds it.

import fs from 'fs'
import path from 'path'
import { refresh } from '../../apps/web/src/contexts/MoviesMetadata/refresh'
import { lightenShow, lightenEpisodes } from '../../libs/tmdb/src/shows'
import { INDEXER, searchOf } from '../../apps/web/src/demo/releases'
import { tmdb, all, pages, parse, POLICIES, keyed } from './tmdb'
import { editionBounds, editionOf, lookOf, watchedHoursOf, wrappedOf, WrappedPlay, WrappedTitle, WRAPPED_TIME_ZONE } from '../../libs/sensorr/src/lib/wrapped'

const OUTPUT = path.join(__dirname, '../../apps/web/src/demo/seed/seed.json')
const SHARE = path.join(__dirname, '../../apps/wrapped/src/demo/share.json')
const MOVIES = 300
const PROPOSALS = 80
const SHOWS = 12
const PERSONS = 150
const DAY = 86400000
const NOW = Date.now()
const FRIEND = 'alex@sensorr.demo'
// The viewers of the server, as Tautulli names them: Alex, the friend above, is the first
const VIEWERS = ['Alex', 'Sam', 'Lou', 'Camille', 'Noa', 'Jo']

const hash = (value: string) => [...value].reduce((acc, char) => (Math.imul(acc ^ char.charCodeAt(0), 16777619) >>> 0), 2166136261)

// Mulberry32, seeded: the same TMDB answers give the same demo
const random = (seed: number) => () => {
  seed = (seed + 0x6D2B79F5) >>> 0
  let value = seed
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296
}

const next = random(1999)
const pick = <T>(values: T[]): T => values[Math.floor(next() * values.length)]
const jobId = () => Array.from({ length: 21 }, () => pick([...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'])).join('')
const objectId = () => Array.from({ length: 24 }, () => pick([...'0123456789abcdef'])).join('')
const iso = (value: string | number | Date) => value ? new Date(value).toISOString() : value

const config = () => {
  const defaults = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.default.json'), 'utf8'))
  delete defaults.tmdb

  return {
    ...defaults,
    onboarding: { done: true },
    znabs: [{ ...INDEXER, disabled: false }],
    policies: POLICIES,
  }
}

const log = (job: { id: string, command: string, type: string, at: number }, offset: number, message: string, meta: any = {}, level = 'info') => ({
  _id: objectId(),
  timestamp: iso(job.at + offset * 1000),
  level,
  message,
  meta: { job: job.id, command: job.command, type: job.type, ...meta },
})

// A run of a job, as the CLI logs it: opening, counters, the lines of each movie, closing
const run = (command: string, type: string, at: number, description: string, counters: { [key: string]: [string, number, object?] }, lines: (job: any, offset: () => number) => any[]) => {
  const job = { id: jobId(), command, type, at }
  let elapsed = 0
  const offset = () => (elapsed += 1 + Math.floor(next() * 6))
  const logs = [
    log(job, 0, description, { config: config().jobs[command]?.[`${type}s`] || {}, summary: true }),
    ...Object.entries(counters).filter(([, [, count]]) => count).map(([key, [message, count, extra]]) => log(job, 1, `${message.replace('%d', `${count}`)}`, { summary: { [key]: count, ...extra } })),
    ...lines(job, offset),
  ]

  logs.push({ ...log(job, offset(), `⏲️ Completed - ${elapsed}s`, {}), meta: { job: job.id, summary: true, done: true } })
  return { job, logs }
}

const lightenMovie = ({ id, title, poster_path, genres, vote_average, release_date }) => ({ id, title, poster_path, genres, vote_average, release_date })

const releaseOf = (item, extra: { [key: string]: any }) => ({
  id: item.guid,
  title: parse(item.title).generated,
  original: item.title,
  znab: INDEXER.name,
  link: item.link,
  enclosure: item.enclosure,
  size: item.size,
  ...extra,
})

const fileOf = (item, job: string) => ({
  id: `plex://movie/${objectId()}#${Math.floor(next() * 100000)}`,
  title: parse(item.title).generated,
  original: `${item.title}.mkv`,
  from: 'sync',
  job,
  size: item.size,
})

const movies = async () => {
  const listed = [...await pages('movie/top_rated', 10), ...await pages('movie/popular', 6)]
  const ids = [...new Set(listed.filter(({ adult }) => !adult).map(({ id }) => id))].slice(0, MOVIES)
  console.log(`${ids.length} movies`)
  const details = await all(ids, (id) => refresh(tmdb, id))

  const sync = { id: jobId(), at: NOW - 1 * DAY - 6 * 3600000 }
  const docs = details.map((movie: any) => {
    const roll = next()
    const state = roll < 0.6 ? 'archived' : roll < 0.85 ? 'wished' : roll < 0.9 ? 'pinned' : 'ignored'
    const year = `${movie.release_date || ''}`.slice(0, 4)
    const items = searchOf({ title: movie.title, year, runtime: movie.runtime }, NOW)
    const owned = state === 'archived' && items.length ? fileOf(pick(items), sync.id) : null

    return {
      ...movie,
      _id: movie.id,
      release_date: iso(movie.release_date),
      release_dates: {
        results: (movie.release_dates?.results || []).map((result) => ({ ...result, release_dates: result.release_dates.map((date) => ({ ...date, release_date: iso(date.release_date) })) })),
      },
      state: owned ? state : (state === 'archived' ? 'wished' : state),
      updated_at: NOW - Math.floor(next() * 200) * DAY,
      ...(owned ? { archived_at: NOW - Math.floor(next() * 700) * DAY, releases: [owned] } : { releases: [] }),
      ...(next() < 0.08 ? { requested_by: [FRIEND], requested_at: NOW - Math.floor(next() * 30) * DAY } : {}),
    }
  })

  const archived = docs.filter((movie) => movie.state === 'archived')
  const proposed = archived.slice().sort(() => next() - 0.5)
  const swaps = { refine: [], shrink: [] } as { [command: string]: any[] }

  for (const movie of proposed) {
    if (swaps.refine.length + swaps.shrink.length >= PROPOSALS) {
      break
    }

    const year = `${movie.release_date || ''}`.slice(0, 4)
    const items = searchOf({ title: movie.title, year, runtime: movie.runtime }, NOW).filter(({ title }) => !movie.releases.some(({ original }) => original === `${title}.mkv`))
    const [file] = movie.releases
    const lighter = items.filter(({ size }) => size < file.size * 0.7)
    const command = lighter.length && next() < 0.4 ? 'shrink' : 'refine'
    const candidates = command === 'shrink' ? lighter : items.filter(({ title }) => parse(title).language !== parse(file.original).language || parse(title).resolution !== parse(file.original).resolution)

    if (candidates.length) {
      swaps[command].push({ movie, item: pick(candidates) })
    }
  }

  // As `proposedSpaceOf` in apps/cli/src/utils/swaps.js: what the proposals would weigh against the files they replace
  const spaceOf = (swapped: any[]) => ({ proposed: swapped.reduce((acc, { movie, item }) => acc + item.size - movie.releases[0].size, 0) })

  const refine = run('refine', 'movie', NOW - 6 * DAY, '✨ Refine archived movies', { refined: ['🪨 %d Archived movies ready for refining', archived.length], proposal: ['🛎️  %d Proposed movies', swaps.refine.length, spaceOf(swaps.refine)] }, (job, offset) => swaps.refine.flatMap(({ movie, item }) => {
    const release = releaseOf(item, { from: 'refine', job: job.id, proposal: true })
    movie.releases.push(release)
    movie.refined_at = job.at
    return [
      log(job, offset(), `✨ Refine "${movie.title}" (${movie.release_date?.slice(0, 4)})`, { important: true, group: movie.id, movie: lightenMovie(movie) }),
      log(job, offset(), `🛎️  Release ${release.title} proposed (${INDEXER.name})`, { important: true, group: movie.id, movie: lightenMovie(movie), release: { ...release, valid: true, score: 0, warning: 0, reason: null, seeders: item.seeders, peers: item.peers, publishDate: item.publishDate, meta: parse(item.title) }, done: true }),
    ]
  }))

  const shrink = run('shrink', 'movie', NOW - 2 * DAY, '✂️ Shrink refined movies', { shrinked: ['💎 %d Refined movies ready for shrinking', archived.length], proposal: ['🛎️  %d Proposed movies', swaps.shrink.length, spaceOf(swaps.shrink)] }, (job, offset) => swaps.shrink.flatMap(({ movie, item }) => {
    const release = releaseOf(item, { from: 'shrink', job: job.id, proposal: true })
    movie.releases.push(release)
    movie.shrinked_at = job.at
    return [
      log(job, offset(), `✂️ Shrink "${movie.title}" (${movie.release_date?.slice(0, 4)})`, { important: true, group: movie.id, movie: lightenMovie(movie) }),
      log(job, offset(), `🛎️  Release ${release.title} proposed (${INDEXER.name})`, { important: true, group: movie.id, movie: lightenMovie(movie), release: { ...release, valid: true, score: 0, warning: 0, reason: null, seeders: item.seeders, peers: item.peers, publishDate: item.publishDate, meta: parse(item.title) }, done: true }),
    ]
  }))

  const wished = docs.filter((movie) => ['wished', 'pinned'].includes(movie.state))
  const record = run('record', 'movie', NOW - 7 * 3600000, '📹 Record wished movies', { wished: ['🍿 %d Wished movies', wished.length], missing: ['📭 %d No releases found', wished.length] }, (job, offset) => wished.flatMap((movie) => [
    log(job, offset(), `📹 Record "${movie.title}" (${movie.release_date?.slice(0, 4)})`, { important: true, group: movie.id, movie: lightenMovie(movie) }),
    log(job, offset(), '📭 No releases found', { important: true, group: movie.id, done: true }),
  ]))

  const synced = run('sync', 'movie', sync.at, '🔄 Sync movies with Plex', { archived: ['🗄️  %d Archived movies in Sensorr library', archived.length], plex: ['📡 %d movies available on Plex server', archived.length] }, () => [])
  synced.logs.forEach((doc) => (doc.meta.job = sync.id))

  console.log(`${archived.length} archived, ${swaps.refine.length} refine and ${swaps.shrink.length} shrink proposals`)
  return { movies: docs, logs: [...synced.logs, ...refine.logs, ...shrink.logs, ...record.logs] }
}

const shows = async () => {
  const listed = (await pages('tv/top_rated', 3)).filter(({ origin_country }) => !origin_country?.includes('JP')).slice(0, SHOWS * 2)
  const details = (await all(listed.map(({ id }) => id), (id) => tmdb.fetch(`tv/${id}`, { append_to_response: 'external_ids,alternative_titles' })))
    .filter(({ number_of_seasons }) => number_of_seasons <= 6)
    .slice(0, SHOWS)
  const episodes = []
  const docs = []

  for (const show of details) {
    const seasons = await all(show.seasons.filter(({ season_number }) => season_number > 0), ({ season_number }) => tmdb.fetch(`tv/${show.id}/season/${season_number}`))
    const lightened: any = lightenShow(show)
    const monitored = next() < 0.75
    const owned = next() < 0.85
    const releases = []

    for (const season of seasons) {
      for (const episode of lightenEpisodes(season, show.id) as any[]) {
        const aired = episode.air_date && new Date(episode.air_date).getTime() < NOW
        const item = owned && aired && next() < 0.9 ? searchOf({ title: show.name, season: episode.season_number, episode: episode.episode_number }, NOW)[0] : null

        episodes.push({
          ...episode,
          _id: episode.id,
          air_date: iso(episode.air_date),
          monitored,
          files: item ? [{ id: `plex://episode/${objectId()}#${Math.floor(next() * 100000)}`, size: item.size, title: parse(item.title).generated, original: `${item.title}.mkv`, from: 'sync' }] : [],
          ...(item ? { files_at: NOW - Math.floor(next() * 400) * DAY } : {}),
          release: null,
        })
      }
    }

    // A season with episodes missing gets a season pack proposed
    const missing = episodes.filter((episode) => episode.show_id === show.id && !episode.files.length && episode.air_date && episode.air_date < iso(NOW))
    const season = missing[0]?.season_number

    if (monitored && season !== undefined) {
      const [item] = searchOf({ title: show.name, season }, NOW)

      if (item) {
        const covered = episodes.filter((episode) => episode.show_id === show.id && episode.season_number === season)
        releases.push({
          ...releaseOf(item, { from: 'record', job: null, proposal: true }),
          coverage: covered.map(({ season_number, episode_number }) => ({ season: season_number, episode: episode_number })),
          level: 'season',
          demo_torrent: {
            name: item.title,
            files: covered.map(({ episode_number }) => ({ path: `${item.title}/${item.title.replace('.COMPLETE', `E${String(episode_number).padStart(2, '0')}`)}.mkv`, size: Math.round(item.size / covered.length) })),
          },
        })
      }
    }

    docs.push({
      ...lightened,
      _id: show.id,
      first_air_date: iso(show.first_air_date),
      last_air_date: iso(show.last_air_date),
      seasons: lightened.seasons.map((season) => ({ ...season, air_date: iso(season.air_date) })),
      // Followed or not, a show in the library is wished: `showStateOf` in apps/web reads `monitored` next to it
      state: 'wished',
      monitored,
      monitor_new_seasons: monitored,
      releases,
    })
  }

  console.log(`${docs.length} shows, ${episodes.length} episodes`)
  return { shows: docs, episodes }
}

// The Calendar lists the movies of the people followed, month by month: the directors and the leads of the movies in
// theatres, coming and popular have some in the months around now, the most popular of them first
const persons = async () => {
  const movies = [...await pages('movie/now_playing', 3), ...await pages('movie/upcoming', 4), ...await pages('movie/popular', 3)]
  const credits = await all([...new Set(movies.map(({ id }) => id))], (id) => tmdb.fetch(`movie/${id}/credits`))
  const people = new Map<number, any>()

  for (const { cast = [], crew = [] } of credits) {
    for (const person of [...cast.slice(0, 5), ...crew.filter(({ job }) => job === 'Director')]) {
      if (!person.adult && person.profile_path) {
        people.set(person.id, person)
      }
    }
  }

  const followed = [...people.values()].sort((a, b) => b.popularity - a.popularity).slice(0, PERSONS)
  const docs = await all(followed.map(({ id }) => id), (id) => tmdb.fetch(`person/${id}`))
  console.log(`${docs.length} persons followed, out of ${people.size} credited`)
  return docs.map((person) => ({ ...person, _id: person.id, birthday: iso(person.birthday), deathday: iso(person.deathday), state: 'followed', updated_at: NOW - Math.floor(next() * 200) * DAY }))
}

// Alex's wrapped, as `WrappedService.freeze` computes it from the plays Tautulli keeps: Alex and the other viewers watch
// the movies and shows of the library over the last closed edition. Each story of the page has the plays it needs: a
// rewatched movie, a dropped one, a binge, a streak, a late night, a show left halfway, movies seen first or alone
const wrapped = async (movieDocs: any[], showDocs: any[], episodeDocs: any[]) => {
  const year = editionOf(NOW / 1000, WRAPPED_TIME_ZONE) - 1
  const { start, end } = editionBounds(year, WRAPPED_TIME_ZONE)
  const days = Math.round((end - start) / 86400)
  // Minutes after midnight, Paris time give or take the hour of summer time
  const at = (day: number, minutes: number) => start + day * 86400 + minutes * 60
  const evening = () => 19 * 60 + 30 + Math.floor(next() * 150)
  const between = (from: number, to: number) => from + Math.floor(next() * (to - from))

  const pool = movieDocs.filter((movie) => movie.state === 'archived' && movie.runtime && movie.poster_path).slice(0, 90)
  const credits = await all(pool, (movie) => tmdb.fetch(`movie/${movie.id}/credits`))
  const aired = (show) => episodeDocs.filter((episode) => episode.show_id === show.id && episode.files.length)
    .sort((a, b) => a.season_number - b.season_number || a.episode_number - b.episode_number)
  const shows = showDocs.filter((show) => aired(show).length >= 10).slice(0, 4)
  const titles: WrappedTitle[] = [
    ...pool.map((movie, index) => ({
      key: `movie-${movie.id}`,
      media_type: 'movie' as const,
      title: movie.title,
      year: Number(movie.release_date?.slice(0, 4)) || undefined,
      genres: (movie.genres || []).map(({ name }) => name),
      directors: (credits[index].crew || []).filter(({ job }) => job === 'Director').map(({ name }) => name),
      actors: (credits[index].cast || []).slice(0, 5).map(({ name }) => name),
      tmdb_id: movie.id,
      thumb: movie.poster_path || undefined,
      art: movie.backdrop_path || undefined,
      duration: movie.runtime * 60,
    })),
    ...shows.map((show) => ({
      key: `show-${show.id}`,
      media_type: 'show' as const,
      title: show.name,
      year: Number(show.first_air_date?.slice(0, 4)) || undefined,
      genres: (show.genres || []).map(({ name }) => name),
      tmdb_id: show.id,
      thumb: show.poster_path || undefined,
      art: show.backdrop_path || undefined,
      duration: (show.episode_run_time?.[0] || 45) * 60,
      episode_count: aired(show).length,
    })),
  ]
  const byKey = new Map(titles.map((title) => [title.key, title]))
  const plays: WrappedPlay[] = []
  const play = (user_id: number, title: string, started: number, episode?: any, share = 1) => {
    const play_duration = Math.round(byKey.get(title).duration * share)
    plays.push({
      id: plays.length + 1,
      user_id,
      media_type: episode ? 'episode' : 'movie',
      title,
      started,
      stopped: started + play_duration + 60,
      play_duration,
      ...(episode ? { parent_media_index: episode.season_number, media_index: episode.episode_number } : {}),
    })
    return started + play_duration + 120
  }
  // Episodes one after the other from `minutes`, the evening they are watched
  const evenings = (user_id: number, show, from: number, count: number, day: number, minutes: number) => {
    let started = at(day, minutes)
    aired(show).slice(from, from + count).forEach((episode) => (started = play(user_id, `show-${show.id}`, started, episode)))
  }

  const [alex, sam, lou, camille, noa, jo] = VIEWERS.map((_, index) => index + 1)
  const movies = pool.slice(0, 48)
  const seen = new Map<string, number>()
  const key = (movie) => `movie-${movie.id}`

  // Alex: one movie every week or so, the first one rewatched twice, the second one left after a third
  movies.forEach((movie, index) => {
    const day = Math.floor((index + next()) * (days - 10) / movies.length)
    seen.set(key(movie), day)
    play(alex, key(movie), at(day, evening()), null, index === 1 ? 0.3 : 1)
  })
  play(alex, key(movies[0]), at(days - 40, evening()))
  play(alex, key(movies[0]), at(days - 8, evening()))

  const [binged, streaked, monthly, dropped] = shows
  // A whole season in January, four episodes the first night
  binged && evenings(alex, binged, 0, 4, 40, 19 * 60)
  binged && Array.from({ length: 5 }, (_, index) => evenings(alex, binged, 4 + index * 2, 2, 41 + index * 2, 21 * 60))
  // A week in a row in July
  streaked && Array.from({ length: 7 }, (_, index) => evenings(alex, streaked, index * 2, 2, 212 + index, 21 * 60))
  // A few episodes every month, one of them after a movie, past 1 AM
  monthly && Array.from({ length: 12 }, (_, month) => [5, 14, 23].forEach((day, index) => evenings(alex, monthly, (month * 3 + index) % aired(monthly).length, 1, month * 30 + day, 22 * 60)))
  monthly && evenings(alex, monthly, 0, 2, 151, 23 * 60 + 40)
  // Four episodes in March, never picked up again, where Sam went on
  dropped && evenings(alex, dropped, 0, 4, 100, 21 * 60)

  // Sam: most of Alex's movies, always after Alex, and every show: the twin, and the server's first
  movies.slice(0, 25).forEach((movie) => play(sam, key(movie), at(between(seen.get(key(movie)) + 8, days), evening())))
  pool.slice(48).forEach((movie) => next() < 0.7 && play(sam, key(movie), at(between(0, days), evening())))
  shows.forEach((show, index) => evenings(sam, show, 0, Math.min(aired(show).length, 12), 60 + index * 50, 20 * 60))

  // Lou, Camille and Noa: the movies Alex saw first, one of them the same week, and a few of their own
  const others = [lou, camille, noa]
  movies.slice(2, 5).forEach((movie) => others.forEach((user) => play(user, key(movie), at(between(seen.get(key(movie)) + 10, days), evening()))))
  others.forEach((user) => play(user, key(movies[10]), at(seen.get(key(movies[10])) + between(1, 6), evening())))
  movies.slice(25, 30).forEach((movie) => play(lou, key(movie), at(between(0, days), evening())))
  others.forEach((user) => pool.slice(48).forEach((movie) => next() < 0.3 && play(user, key(movie), at(between(0, days), evening()))))
  streaked && evenings(lou, streaked, 0, 6, 90, 20 * 60)
  monthly && evenings(camille, monthly, 0, 8, 180, 20 * 60)
  // Jo: a handful of movies
  pool.slice(60, 66).forEach((movie) => play(jo, key(movie), at(between(0, days), evening())))

  // Who ever watched each movie, as `WrappedService.historyOf` reads it
  const history: Record<string, number[]> = {}
  plays.filter((p) => p.media_type === 'movie').forEach(({ title, user_id }) => (history[title] = [...new Set([...(history[title] || []), user_id])]))
  const previous = { hours: Math.round(watchedHoursOf({ plays, titles, user_id: alex }) * 0.7) }
  const shown = wrappedOf({ plays, titles, user_id: alex, year, previous, history, timeZone: WRAPPED_TIME_ZONE })
  const ids = [shown.twin?.user_id, ...(shown.duo?.posters || []).map((poster) => poster.with)].filter(Number.isInteger)
  const looks = config().wrapped.looks

  console.log(`Wrapped ${year}: ${plays.length} plays, stories without data: ${Object.entries(shown).filter(([, value]) => value === null).map(([name]) => name).join(', ') || 'none'}`)
  return {
    // `WrappedService.share`, for the one link of the demo
    share: {
      name: VIEWERS[alex - 1],
      server: null,
      year,
      editions: [year],
      names: Object.fromEntries(ids.map((id) => [id, VIEWERS[id - 1]])),
      look: { ...lookOf({ looks }), looks },
      frozen: true,
      wrapped: shown,
    },
    edition: { _id: objectId(), year, user_id: alex, frozen_at: end * 1000 },
  }
}

const main = async () => {
  keyed()

  const { movies: movieDocs, logs } = await movies()
  const { shows: showDocs, episodes } = await shows()
  const personDocs = await persons()
  const { share, edition } = await wrapped(movieDocs, showDocs, episodes)

  // The demo has one wrapped, Alex's, at `/wrapped/demo`
  const guests = [{ _id: objectId(), email: FRIEND, name: VIEWERS[0], avatar: '', wrapped_token: 'demo' }]
  const data = { config: config(), collections: { movies: movieDocs, shows: showDocs, episodes, persons: personDocs, log: logs, guests, editions: [edition] } }
  // Other data, another version: the page drops what a visitor had changed on the previous one
  const version = hash(JSON.stringify(data)).toString(16)
  fs.writeFileSync(OUTPUT, `${JSON.stringify({ version, ...data })}\n`)
  console.log(`${OUTPUT}: ${(fs.statSync(OUTPUT).size / 1e6).toFixed(1)} MB`)
  fs.writeFileSync(SHARE, `${JSON.stringify(share)}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
