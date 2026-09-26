export const WRAPPED_TIME_ZONE = 'Europe/Paris'

// `title` is the movie guid, or `show:<grandparent_rating_key>` for an episode.
export interface WrappedPlay {
  id: number
  user_id: number
  media_type: 'movie' | 'episode'
  title: string
  started: number
  stopped: number
  play_duration: number
  seen?: string
}

export interface WrappedTitle {
  key: string
  media_type: 'movie' | 'show'
  title: string
  year?: number
  genres?: string[]
  directors?: string[]
  tmdb_id?: number
  thumb?: string
  art?: string
  // Seconds, a typical episode for a show
  duration?: number
}

export interface WrappedMovie {
  key: string
  title: string
  year?: number
  plays: number
  tmdb_id?: number
  thumb?: string
  art?: string
}

export interface WrappedShow {
  key: string
  title: string
  episodes: number
  months: number[]
  tmdb_id?: number
  thumb?: string
  art?: string
}

export interface WrappedCycle {
  kind: 'show' | 'director'
  // The show, or the director's first movie, whose artwork stands for the cycle
  key: string
  name: string
  count: number
  months: number[]
  thumb?: string
}

export interface Wrapped {
  // The edition, from 1 December of the previous year to 30 November
  year: number
  hours: number
  plays: number
  movies: number
  shows: number
  episodes: number
  rank: number
  server: { users: number, median_hours: number }
  film_age: number | null
  decade: number | null
  genre: string | null
  director: string | null
  only_you_pct: number
  night: { date: string, plays: number, episodes: number, end: string, titles: string[] } | null
  months: number[]
  cycles: WrappedCycle[]
  top_movies: WrappedMovie[]
  top_shows: WrappedShow[]
  palme: WrappedMovie | null
  grand_prix: WrappedShow | null
  jury: WrappedMovie | null
}

const formats = new Map<string, Intl.DateTimeFormat>()

export const partsOf = (timestamp: number, timeZone: string) => {
  if (!formats.has(timeZone)) {
    formats.set(timeZone, new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }))
  }

  const parts = Object.fromEntries(formats.get(timeZone)!.formatToParts(new Date(timestamp * 1000)).map(({ type, value }) => [type, value]))
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour, minute: +parts.minute, date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

// An edition closes on 1 December: what is watched in December counts for the next one
export const editionOf = (timestamp: number, timeZone: string) => {
  const { year, month } = partsOf(timestamp, timeZone)
  return month === 12 ? year + 1 : year
}

const round = (value: number, digits = 0) => Math.round(value * 10 ** digits) / 10 ** digits
const hoursOf = (plays: { play_duration: number }[]) => plays.reduce((sum, play) => sum + (play.play_duration || 0), 0) / 3600
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const mostCommon = <T>(values: T[]): T | null => {
  const counts = new Map<T, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}
const groupBy = <T, K>(values: T[], key: (value: T) => K) => {
  const groups = new Map<K, T[]>()
  values.forEach((value) => {
    const k = key(value)
    groups.has(k) ? groups.get(k)!.push(value) : groups.set(k, [value])
  })
  return groups
}
const unique = (values: number[]) => [...new Set(values)].sort((a, b) => a - b)

const SHOW_CYCLE_EPISODES = 10
const DIRECTOR_CYCLE_MOVIES = 3

// `plays` holds the whole server's plays: ranks and "only you" are measured against every user
export const wrappedOf = (
  { plays, titles, user_id, year, timeZone = WRAPPED_TIME_ZONE }:
  { plays: WrappedPlay[], titles: WrappedTitle[], user_id: number, year: number, timeZone?: string },
): Wrapped => {
  const byKey = new Map(titles.map((title) => [title.key, title]))
  const server = plays
    .map((play) => {
      const started = partsOf(play.started, timeZone)
      // A session left open keeps counting in Tautulli, a play never lasts longer than its media
      const play_duration = Math.min(play.play_duration || 0, byKey.get(play.title)?.duration || Infinity)
      return {
        ...play,
        play_duration,
        edition: started.month === 12 ? started.year + 1 : started.year,
        month: started.month,
        // An evening runs from 06:00 to 06:00 the next day, so a night past midnight stays one night
        evening: partsOf(play.started - 6 * 3600, timeZone).date,
        // A stop long after its capped length belongs to a session left open
        ended: play.stopped - play.started > play_duration + 6 * 3600 ? play.started + play_duration : play.stopped,
      }
    })
    .filter((play) => play.edition === year)
  const byUser = groupBy(server, (play) => play.user_id)
  const mine = byUser.get(user_id) || []
  const movies = mine.filter((play) => play.media_type === 'movie')
  const episodes = mine.filter((play) => play.media_type === 'episode')
  const ranked = [...byUser.entries()].map(([user, plays]) => ({ user, hours: hoursOf(plays) })).sort((a, b) => b.hours - a.hours)

  const moviePlays = groupBy(movies, (play) => play.title)
  const movieOf = (key: string): WrappedMovie => {
    const title = byKey.get(key)
    return { key, title: title?.title || key, year: title?.year, plays: moviePlays.get(key)?.length || 0, tmdb_id: title?.tmdb_id, thumb: title?.thumb, art: title?.art }
  }
  const lastStarted = (key: string) => Math.max(...moviePlays.get(key)!.map((play) => play.started))
  const topMovies = [...moviePlays.keys()].sort((a, b) => (moviePlays.get(b)!.length - moviePlays.get(a)!.length) || (lastStarted(b) - lastStarted(a)))

  const watchers = groupBy(server.filter((play) => play.media_type === 'movie'), (play) => play.title)
  const onlyYou = topMovies.filter((key) => new Set(watchers.get(key)!.map((play) => play.user_id)).size === 1)

  const showPlays = groupBy(episodes, (play) => play.title)
  const showOf = (key: string): WrappedShow => {
    const title = byKey.get(key)
    return { key, title: title?.title || key, episodes: showPlays.get(key)!.length, months: unique(showPlays.get(key)!.map((play) => play.month)), tmdb_id: title?.tmdb_id, thumb: title?.thumb, art: title?.art }
  }
  const topShows = [...showPlays.keys()].sort((a, b) => showPlays.get(b)!.length - showPlays.get(a)!.length)

  const directorPlays = groupBy(movies.flatMap((play) => (byKey.get(play.title)?.directors || []).map((director) => ({ director, play }))), ({ director }) => director)
  const cycles: WrappedCycle[] = [
    ...topShows.map(showOf).filter((show) => show.episodes >= SHOW_CYCLE_EPISODES && show.months.length >= 2)
      .map(({ key, title, episodes, months, thumb }) => ({ kind: 'show' as const, key, name: title, count: episodes, months, thumb })),
    ...[...directorPlays.entries()]
      .map(([director, entries]) => ({ director, keys: [...new Set(entries.map(({ play }) => play.title))], months: unique(entries.map(({ play }) => play.month)) }))
      .filter(({ keys }) => keys.length >= DIRECTOR_CYCLE_MOVIES)
      .sort((a, b) => b.keys.length - a.keys.length)
      .map(({ director, keys, months }) => ({ kind: 'director' as const, key: keys[0], name: director, count: keys.length, months, thumb: byKey.get(keys[0])?.thumb })),
  ]

  const nights = groupBy(mine, (play) => play.evening)
  const episodesOf = (plays: typeof mine) => plays.filter((play) => play.media_type === 'episode').length
  const [nightDate, nightPlays] = [...nights.entries()].sort((a, b) => (episodesOf(b[1]) - episodesOf(a[1])) || (b[1].length - a[1].length) || (hoursOf(b[1]) - hoursOf(a[1])))[0] || []

  const movieTitles = topMovies.map((key) => byKey.get(key)).filter(Boolean) as WrappedTitle[]
  const years = movieTitles.map((title) => title.year).filter(Boolean) as number[]
  const monthly = groupBy(mine, (play) => play.month)

  return {
    year,
    hours: round(hoursOf(mine)),
    plays: mine.length,
    movies: moviePlays.size,
    shows: showPlays.size,
    episodes: episodes.length,
    rank: mine.length ? ranked.findIndex(({ user }) => user === user_id) + 1 : 0,
    server: { users: ranked.length, median_hours: ranked.length ? round(median(ranked.map(({ hours }) => hours))) : 0 },
    film_age: years.length ? round(years.reduce((sum, y) => sum + y, 0) / years.length) : null,
    decade: mostCommon(years.map((y) => Math.floor(y / 10) * 10)),
    genre: mostCommon(movieTitles.flatMap((title) => title.genres || [])),
    director: mostCommon(movieTitles.flatMap((title) => title.directors || [])),
    only_you_pct: moviePlays.size ? round(100 * onlyYou.length / moviePlays.size) : 0,
    night: nightDate && nightPlays ? {
      date: nightDate,
      plays: nightPlays.length,
      episodes: episodesOf(nightPlays),
      end: partsOf(Math.max(...nightPlays.map((play) => play.ended)), timeZone).time,
      titles: [...new Set(nightPlays.map((play) => byKey.get(play.title)?.title || play.title))].slice(0, 4),
    } : null,
    // From December of the previous year to November
    months: Array.from({ length: 12 }, (_, index) => round(hoursOf(monthly.get((index + 11) % 12 + 1) || []), 1)),
    cycles,
    top_movies: topMovies.slice(0, 10).map(movieOf),
    top_shows: topShows.slice(0, 4).map(showOf),
    palme: topMovies.length ? movieOf(topMovies[0]) : null,
    grand_prix: topShows.length ? showOf(topShows[0]) : null,
    jury: onlyYou.length ? movieOf([...onlyYou].sort((a, b) => (byKey.get(a)?.year || 9999) - (byKey.get(b)?.year || 9999))[0]) : null,
  }
}
