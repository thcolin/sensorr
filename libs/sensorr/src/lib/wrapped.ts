// `title` is the movie guid, or `show:<grandparent_rating_key>` for an episode.
export interface WrappedPlay {
  id: number
  user_id: number
  media_type: 'movie' | 'episode'
  title: string
  started: number
  stopped: number
  play_duration: number
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
  alone_pct: number
  night: { date: string, plays: number, episodes: number, end: string, titles: string[] } | null
  months: number[]
  top_movies: WrappedMovie[]
  top_shows: WrappedShow[]
  palme: WrappedMovie | null
  grand_prix: WrappedShow | null
  jury: WrappedMovie | null
}

export const partsOf = (timestamp: number, timeZone: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(timestamp * 1000))
      .map(({ type, value }) => [type, value]),
  )

  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour, minute: +parts.minute, date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

// An edition closes on 1 December: what is watched in December counts for the next one
export const editionOf = (timestamp: number, timeZone: string) => {
  const { year, month } = partsOf(timestamp, timeZone)
  return month === 12 ? year + 1 : year
}

const round = (value: number, digits = 0) => Math.round(value * 10 ** digits) / 10 ** digits
const hoursOf = (plays: WrappedPlay[]) => plays.reduce((sum, play) => sum + (play.play_duration || 0), 0) / 3600
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
const groupBy = <T, K>(values: T[], key: (value: T) => K) => values.reduce((groups, value) => {
  const k = key(value)
  groups.set(k, [...(groups.get(k) || []), value])
  return groups
}, new Map<K, T[]>())

// `plays` holds the whole server's plays: ranks and "watched alone" are measured against every user
export const wrappedOf = (
  { plays, titles, user_id, year, timeZone = 'Europe/Paris' }:
  { plays: WrappedPlay[], titles: WrappedTitle[], user_id: number, year: number, timeZone?: string },
): Wrapped => {
  const byKey = new Map(titles.map((title) => [title.key, title]))
  // A session left open keeps counting in Tautulli, a play never lasts longer than its media
  const server = plays
    .filter((play) => editionOf(play.started, timeZone) === year)
    .map((play) => ({ ...play, play_duration: Math.min(play.play_duration || 0, byKey.get(play.title)?.duration || Infinity) }))
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
  const lastStarted = (key: string) => Math.max(...(moviePlays.get(key) || []).map((play) => play.started))
  const topMovies = [...moviePlays.keys()].sort((a, b) => (moviePlays.get(b)!.length - moviePlays.get(a)!.length) || (lastStarted(b) - lastStarted(a)))

  const watchers = groupBy(server.filter((play) => play.media_type === 'movie'), (play) => play.title)
  const alone = topMovies.filter((key) => new Set(watchers.get(key)!.map((play) => play.user_id)).size === 1)

  const showPlays = groupBy(episodes, (play) => play.title)
  const showOf = (key: string): WrappedShow => {
    const title = byKey.get(key)
    const months = [...new Set(showPlays.get(key)!.map((play) => partsOf(play.started, timeZone).month))].sort((a, b) => a - b)
    return { key, title: title?.title || key, episodes: showPlays.get(key)!.length, months, tmdb_id: title?.tmdb_id, thumb: title?.thumb, art: title?.art }
  }
  const topShows = [...showPlays.keys()].sort((a, b) => showPlays.get(b)!.length - showPlays.get(a)!.length)

  // An evening runs from 06:00 to 06:00 the next day, so a night past midnight stays one night
  const nights = groupBy(mine, (play) => partsOf(play.started - 6 * 3600, timeZone).date)
  const [nightDate, nightPlays] = [...nights.entries()].sort((a, b) => (b[1].length - a[1].length) || (hoursOf(b[1]) - hoursOf(a[1])))[0] || []
  const last = nightPlays && [...nightPlays].sort((a, b) => b.stopped - a.stopped)[0]

  const movieTitles = topMovies.map((key) => byKey.get(key)).filter(Boolean) as WrappedTitle[]
  const years = movieTitles.map((title) => title.year).filter(Boolean) as number[]

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
    alone_pct: moviePlays.size ? round(100 * alone.length / moviePlays.size) : 0,
    night: nightDate && nightPlays ? {
      date: nightDate,
      plays: nightPlays.length,
      episodes: nightPlays.filter((play) => play.media_type === 'episode').length,
      end: partsOf(last!.stopped, timeZone).time,
      titles: [...new Set(nightPlays.map((play) => byKey.get(play.title)?.title || play.title))].slice(0, 4),
    } : null,
    // From December of the previous year to November
    months: Array.from({ length: 12 }, (_, index) => round(hoursOf(mine.filter((play) => partsOf(play.started, timeZone).month === (index + 11) % 12 + 1)), 1)),
    top_movies: topMovies.slice(0, 10).map(movieOf),
    top_shows: topShows.slice(0, 4).map(showOf),
    palme: topMovies.length ? movieOf(topMovies[0]) : null,
    grand_prix: topShows.length ? showOf(topShows[0]) : null,
    jury: alone.length ? movieOf([...alone].sort((a, b) => (byKey.get(a)?.year || 9999) - (byKey.get(b)?.year || 9999))[0]) : null,
  }
}
