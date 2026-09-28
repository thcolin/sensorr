export const WRAPPED_TIME_ZONE = 'Europe/Paris'

// The looks of the wrapped page, the same list as `WRAPPED_THEMES` in `@sensorr/config`
export type WrappedTheme = 'affiche' | 'labo' | 'tele' | 'videoclub' | 'scenario'

// Each look as the page names it to the friend
export const WRAPPED_THEME_NAMES: Record<WrappedTheme, string> = {
  affiche: 'Affiche polonaise',
  labo: 'Labo 35 mm',
  tele: 'Télé-magazine',
  videoclub: 'Vidéoclub',
  scenario: 'Scénario',
}

interface WrappedLook { theme?: WrappedTheme | null, choice?: boolean | null }

// A friend's own setting wins over the edition's, which wins over the global one
export const lookOf = ({ global, edition, guest }: { global: { theme: WrappedTheme, choice: boolean }, edition?: WrappedLook | null, guest?: WrappedLook | null }) => ({
  theme: guest?.theme ?? edition?.theme ?? global.theme,
  choice: guest?.choice ?? edition?.choice ?? global.choice,
})

// `title` is the movie guid, or `show:<grandparent_rating_key>` for an episode.
export interface WrappedPlay {
  id: number
  user_id: number
  media_type: 'movie' | 'episode'
  title: string
  started: number
  stopped: number
  play_duration: number
  parent_media_index?: number
  media_index?: number
  seen?: string
}

export interface WrappedTitle {
  key: string
  media_type: 'movie' | 'show'
  title: string
  year?: number
  genres?: string[]
  directors?: string[]
  // The first billed
  actors?: string[]
  tmdb_id?: number
  thumb?: string
  art?: string
  // Seconds, a typical episode for a show
  duration?: number
  // Episodes of a show in Plex
  episode_count?: number
}

export interface WrappedPoster {
  key: string
  title: string
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
  evenings: number
  rank: number
  server: { users: number, median_hours: number }
  // The previous edition, only when the gap is worth telling
  previous: { year: number, hours: number } | null
  first: WrappedPoster & { date: string } | null
  last: WrappedPoster & { date: string } | null
  streak: { evenings: number, from: string, to: string, poster: WrappedPoster } | null
  // The show watched the most each month, from December to November
  month_shows: (WrappedPoster & { episodes: number } | null)[]
  binge: WrappedPoster & { episodes: number, minutes: number, date: string } | null
  pace: WrappedPoster & { episodes: number, days: number } | null
  // `late` when the evening ended past 01:00, otherwise it is the evening with the most plays; `poster` is its last play
  night: { date: string, plays: number, episodes: number, end: string, late: boolean, episode: boolean, poster: WrappedPoster } | null
  first_on_server: WrappedPoster & { others: number } | null
  same_week: WrappedPoster & { others: number } | null
  only_you: { count: number, posters: WrappedPoster[] } | null
  // Titles only one other viewer watched, the oldest first, `with` that viewer
  duo: { count: number, posters: (WrappedPoster & { year?: number, with: number })[] } | null
  // The viewer who shares the most titles with this one
  twin: { user_id: number, shared: number, total: number, posters: WrappedPoster[] } | null
  dropped: WrappedPoster & { percent: number } | null
  dropped_show: WrappedPoster & { season: number, episode: number } | null
  longest: WrappedPoster & { minutes: number } | null
  oldest: WrappedPoster & { year: number } | null
  rewatched: WrappedPoster & { times: number } | null
  genre: { name: string, titles: number, total: number, posters: WrappedPoster[], lead: { kind: 'actor' | 'show' | 'director', name: string, titles: number, posters: WrappedPoster[] } | null } | null
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

// The edition runs from 1 December of the previous year to 1 December, midnight where it is read
export const editionBounds = (year: number, timeZone: string) => {
  const midnight = (month: number, y: number) => {
    const guess = Date.UTC(y, month, 1) / 1000
    const { day, hour, minute } = partsOf(guess, timeZone)
    // Ahead of UTC it is already the 1st there, behind it is still the day before
    return day === 1 ? guess - hour * 3600 - minute * 60 : guess + (24 - hour) * 3600 - minute * 60
  }

  return { start: midnight(11, year - 1), end: midnight(11, year) }
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

// A session left open keeps counting in Tautulli, a play never lasts longer than its media
const cappedOf = (play: WrappedPlay, title?: WrappedTitle) => Math.min(play.play_duration || 0, title?.duration || Infinity)

// The hours one user watched over any stretch of plays, what an edition is compared on
export const watchedHoursOf = ({ plays, titles, user_id }: { plays: WrappedPlay[], titles: WrappedTitle[], user_id: number }) => {
  const byKey = new Map(titles.map((title) => [title.key, title]))
  return plays.filter((play) => play.user_id === user_id).reduce((sum, play) => sum + cappedOf(play, byKey.get(play.title)), 0) / 3600
}

const WATCHED = 0.85
const DAY = 24 * 3600

// Ranked by count, a tie gives no leader
const leaderOf = (names: string[], min: number) => {
  const counts = [...groupBy(names, (name) => name).entries()].map(([name, list]) => ({ name, titles: list.length })).sort((a, b) => b.titles - a.titles)
  return counts[0] && counts[0].titles >= min && counts[0].titles !== counts[1]?.titles ? counts[0] : null
}

// `plays` holds the whole server's plays: ranks and "only you" are measured against every user
export const wrappedOf = (
  { plays, titles, user_id, year, previous, timeZone = WRAPPED_TIME_ZONE }:
  { plays: WrappedPlay[], titles: WrappedTitle[], user_id: number, year: number, previous?: { hours: number } | null, timeZone?: string },
): Wrapped => {
  const byKey = new Map(titles.map((title) => [title.key, title]))
  const server = plays
    .map((play) => {
      const started = partsOf(play.started, timeZone)
      const duration = byKey.get(play.title)?.duration
      const play_duration = cappedOf(play, byKey.get(play.title))
      // An evening runs from 06:00 to 06:00 the next day, so a night past midnight stays one night
      const evening = partsOf(play.started - 6 * 3600, timeZone)
      return {
        ...play,
        play_duration,
        watched: duration ? play_duration / duration : null,
        edition: started.month === 12 ? started.year + 1 : started.year,
        month: started.month,
        date: started.date,
        time: started.time,
        evening: evening.date,
        // Minutes since 06:00, so 01:00 comes after 23:00
        late: evening.hour * 60 + evening.minute,
        // A pause of up to half an hour counts, a session left open longer does not
        closed: Math.min(play.stopped, play.started + play_duration + 1800),
      }
    })
    .filter((play) => play.edition === year)
  const byUser = groupBy(server, (play) => play.user_id)
  const mine = (byUser.get(user_id) || []).sort((a, b) => a.started - b.started)
  const movies = mine.filter((play) => play.media_type === 'movie')
  const episodes = mine.filter((play) => play.media_type === 'episode')
  const ranked = [...byUser.entries()].map(([user, plays]) => ({ user, hours: hoursOf(plays) })).sort((a, b) => b.hours - a.hours)
  const hours = round(hoursOf(mine))
  // The year starts on 1 January even if the edition opens in December, which only counts when nothing came after
  const opening = mine.find((play) => play.month !== 12) || mine[0]

  const posterOf = (key: string): WrappedPoster => {
    const title = byKey.get(key)
    return { key, title: title?.title || key, thumb: title?.thumb, art: title?.art }
  }
  const dayOf = (date: string) => Date.parse(`${date}T00:00:00Z`) / 1000 / DAY

  const moviePlays = groupBy(movies, (play) => play.title)
  const showPlays = groupBy(episodes, (play) => play.title)
  const nights = groupBy(mine, (play) => play.evening)

  const evenings = [...nights.keys()].sort()
  const streaks: string[][] = []
  evenings.forEach((date, index) => index && dayOf(date) - dayOf(evenings[index - 1]) === 1 ? streaks[streaks.length - 1].push(date) : streaks.push([date]))
  const streak = [...streaks].sort((a, b) => b.length - a.length)[0]

  const monthly = groupBy(episodes, (play) => play.month)
  const binged = [...groupBy(episodes, (play) => `${play.evening} ${play.title}`).values()].sort((a, b) => b.length - a.length)[0]
  const [topShow, topShowPlays] = [...showPlays.entries()].sort((a, b) => b[1].length - a[1].length)[0] || []

  const endOf = (play: typeof mine[number]) => play.late + (play.closed - play.started) / 60
  const latest = [...mine].sort((a, b) => endOf(b) - endOf(a))[0]
  // Launched after 01:00, otherwise the evening with the most plays
  const late = !!latest && endOf(latest) >= 19 * 60
  const nightPlays = late ? nights.get(latest.evening)! : [...nights.values()].sort((a, b) => b.length - a.length)[0]
  const lastLaunch = nightPlays && [...nightPlays].sort((a, b) => b.late - a.late)[0]
  const nightEnd = nightPlays && Math.max(...nightPlays.map((play) => play.closed))

  const serverMovies = groupBy(server.filter((play) => play.media_type === 'movie'), (play) => play.title)
  const shared = [...moviePlays.keys()].map((key) => {
    const starts = new Map<number, number>()
    serverMovies.get(key)!.forEach((play) => starts.set(play.user_id, Math.min(play.started, starts.get(play.user_id) ?? Infinity)))
    const at = starts.get(user_id)!
    const others = [...starts.entries()].filter(([user]) => user !== user_id).map(([, started]) => started)
    return { key, others: others.length, ahead: others.every((started) => started > at), week: others.filter((started) => Math.abs(started - at) <= 7 * DAY).length }
  })
  const pioneer = shared.filter(({ others, ahead }) => ahead && others >= 2).sort((a, b) => b.others - a.others)[0]
  const together = [...shared].sort((a, b) => b.week - a.week)[0]
  const onlyYou = shared.filter(({ others }) => others === 0).map(({ key }) => key)
  const byYear = (keys: string[]) => [...keys].filter((key) => byKey.get(key)?.year).sort((a, b) => byKey.get(a)!.year! - byKey.get(b)!.year!)

  // Summed over its plays: a film resumed on another player is not always grouped by Tautulli
  const seenOf = (key: string) => Math.min(1, moviePlays.get(key)!.reduce((sum, play) => sum + (play.watched ?? 1), 0))
  const dropped = [...moviePlays.keys()].filter((key) => seenOf(key) >= 0.1 && seenOf(key) < 0.5).sort((a, b) => seenOf(b) - seenOf(a))[0]

  // Season and episode as one number, to find the furthest episode reached
  const reach = (play: WrappedPlay) => (play.parent_media_index || 0) * 10000 + (play.media_index || 0)
  const furthest = new Map([...groupBy(server.filter((play) => play.media_type === 'episode'), (play) => play.title).entries()].map(([key, plays]) => [key, Math.max(...plays.map(reach))]))
  const now = Math.max(...server.map((play) => play.started))
  // Left for two months, before the last episode Plex has, and before where someone else on the server got to
  const [droppedShow, droppedAt] = [...showPlays.entries()]
    .map(([key, plays]) => [key, plays, Math.max(...plays.map(reach))] as const)
    .filter(([key, plays, at]) => plays.length >= 3 && at % 10000 && now - plays[plays.length - 1].started > 60 * DAY
      && new Set(plays.map(reach)).size < (byKey.get(key)?.episode_count || 0) && at < furthest.get(key)!)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([key, , at]) => [key, at] as const)[0] || []

  const longest = [...moviePlays.keys()].filter((key) => byKey.get(key)?.duration).sort((a, b) => byKey.get(b)!.duration! - byKey.get(a)!.duration!)[0]
  const oldest = byYear([...moviePlays.keys()]).filter((key) => byKey.get(key)!.year! < 2000)[0]
  const rewatches = (key: string) => moviePlays.get(key)!.filter((play) => (play.watched ?? 0) >= WATCHED).length
  const rewatched = [...moviePlays.keys()].filter((key) => rewatches(key) >= 2).sort((a, b) => rewatches(b) - rewatches(a))[0]

  const mineKeys = [...moviePlays.keys(), ...showPlays.keys()]
  const watchersOf = new Map([...groupBy(server, (play) => play.title).entries()].map(([key, plays]) => [key, new Set(plays.map((play) => play.user_id))]))
  const duo = mineKeys.filter((key) => watchersOf.get(key)!.size === 2).sort((a, b) => (byKey.get(a)?.year || 9999) - (byKey.get(b)?.year || 9999))
  const overlap = new Map<number, string[]>()
  mineKeys.forEach((key) => watchersOf.get(key)!.forEach((user) => user !== user_id && overlap.set(user, [...(overlap.get(user) || []), key])))
  const twin = [...overlap.values()].sort((a, b) => b.length - a.length)[0]

  const watchedTitles = mineKeys.map((key) => byKey.get(key)).filter(Boolean) as WrappedTitle[]
  const genre = mostCommon(watchedTitles.flatMap((title) => title.genres || []))
  const actor = leaderOf(watchedTitles.flatMap((title) => title.actors || []), 3)
  const director = leaderOf(watchedTitles.flatMap((title) => title.directors || []), 2)
  const playsOf = (key: string) => (moviePlays.get(key) || showPlays.get(key))!.length
  // The ones watched the most first
  const postersWith = (match: (title: WrappedTitle) => boolean | undefined) => watchedTitles.filter(match).sort((a, b) => playsOf(b.key) - playsOf(a.key)).slice(0, 4).map(({ key }) => posterOf(key))
  const lastStarted = (key: string) => Math.max(...moviePlays.get(key)!.map((play) => play.started))

  return {
    year,
    hours,
    plays: mine.length,
    movies: moviePlays.size,
    shows: showPlays.size,
    episodes: episodes.length,
    evenings: nights.size,
    rank: mine.length ? ranked.findIndex(({ user }) => user === user_id) + 1 : 0,
    server: { users: ranked.length, median_hours: ranked.length ? round(median(ranked.map(({ hours }) => hours))) : 0 },
    previous: previous && previous.hours >= 10 && Math.abs(hours - previous.hours) >= previous.hours * 0.2
      ? { year: year - 1, hours: round(previous.hours) }
      : null,
    first: opening ? { ...posterOf(opening.title), date: opening.date } : null,
    last: mine.length ? { ...posterOf(mine[mine.length - 1].title), date: mine[mine.length - 1].date } : null,
    streak: streak?.length >= 3 ? { evenings: streak.length, from: streak[0], to: streak[streak.length - 1], poster: posterOf(mostCommon(streak.flatMap((date) => nights.get(date)!.map((play) => play.title)))!) } : null,
    month_shows: Array.from({ length: 12 }, (_, index) => {
      const month = monthly.get((index + 11) % 12 + 1) || []
      const key = mostCommon(month.map((play) => play.title))
      return key ? { ...posterOf(key), episodes: month.filter((play) => play.title === key).length } : null
    }),
    binge: binged?.length >= 3 ? { ...posterOf(binged[0].title), episodes: binged.length, minutes: Math.round(hoursOf(binged) * 60), date: binged[0].evening } : null,
    pace: topShow && topShowPlays!.length >= 3
      ? { ...posterOf(topShow), episodes: topShowPlays!.length, days: dayOf(topShowPlays![topShowPlays!.length - 1].date) - dayOf(topShowPlays![0].date) + 1 }
      : null,
    night: lastLaunch ? { date: lastLaunch.evening, plays: nightPlays!.length, episodes: nightPlays!.filter((play) => play.media_type === 'episode').length, end: partsOf(nightEnd!, timeZone).time, late, episode: lastLaunch.media_type === 'episode', poster: posterOf(lastLaunch.title) } : null,
    first_on_server: pioneer ? { ...posterOf(pioneer.key), others: pioneer.others } : null,
    same_week: together?.week >= 2 ? { ...posterOf(together.key), others: together.week } : null,
    only_you: onlyYou.length ? { count: onlyYou.length, posters: [...onlyYou].sort((a, b) => lastStarted(b) - lastStarted(a)).slice(0, 4).map(posterOf) } : null,
    duo: duo.length ? { count: duo.length, posters: duo.slice(0, 4).map((key) => ({ ...posterOf(key), year: byKey.get(key)?.year, with: [...watchersOf.get(key)!].find((user) => user !== user_id)! })) } : null,
    // The titles fewest others watched say the most about the match
    twin: twin?.length >= 5 ? { user_id: [...overlap.entries()].find(([, keys]) => keys === twin)![0], shared: twin.length, total: mineKeys.length, posters: [...twin].sort((a, b) => watchersOf.get(a)!.size - watchersOf.get(b)!.size).slice(0, 4).map(posterOf) } : null,
    dropped: dropped ? { ...posterOf(dropped), percent: Math.round(100 * seenOf(dropped)) } : null,
    dropped_show: droppedShow ? { ...posterOf(droppedShow), season: Math.floor(droppedAt! / 10000), episode: droppedAt! % 10000 } : null,
    longest: moviePlays.size >= 2 && longest ? { ...posterOf(longest), minutes: Math.round(byKey.get(longest)!.duration! / 60) } : null,
    oldest: moviePlays.size >= 2 && oldest ? { ...posterOf(oldest), year: byKey.get(oldest)!.year! } : null,
    rewatched: rewatched ? { ...posterOf(rewatched), times: rewatches(rewatched) } : null,
    genre: genre ? {
      name: genre,
      titles: watchedTitles.filter((title) => title.genres?.includes(genre)).length,
      total: watchedTitles.length,
      posters: postersWith((title) => title.genres?.includes(genre)),
      lead: actor ? { kind: 'actor', ...actor, posters: postersWith((title) => title.actors?.includes(actor.name)) }
        : topShow ? { kind: 'show', name: posterOf(topShow).title, titles: 1, posters: [posterOf(topShow)] }
          : director ? { kind: 'director', ...director, posters: postersWith((title) => title.directors?.includes(director.name)) }
            : null,
    } : null,
  }
}
