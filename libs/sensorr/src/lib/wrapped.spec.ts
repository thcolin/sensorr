import { editionBounds, editionOf, lookOf, watchedHoursOf, partsOf, wrappedOf, WrappedPlay, WrappedTitle } from './wrapped'

const at = (iso: string) => Date.parse(iso) / 1000
let id = 0
const play = (user_id: number, title: string, started: string, hours: number, media_type: 'movie' | 'episode' = 'movie'): WrappedPlay => ({
  id: ++id,
  user_id,
  media_type,
  title,
  started: at(started),
  stopped: at(started) + hours * 3600,
  play_duration: hours * 3600,
})

const titles: WrappedTitle[] = [
  { key: 'plex://movie/2001', media_type: 'movie', title: '2001', year: 1968, genres: ['Science-Fiction'], directors: ['Stanley Kubrick'] },
  { key: 'plex://movie/heat', media_type: 'movie', title: 'Heat', year: 1995, genres: ['Crime'], directors: ['Michael Mann'] },
  { key: 'plex://movie/dune', media_type: 'movie', title: 'Dune', year: 2021, genres: ['Science-Fiction'], directors: ['Denis Villeneuve'] },
  { key: 'show:1', media_type: 'show', title: 'Scrubs', duration: 30 * 60 },
  { key: 'show:2', media_type: 'show', title: 'Twin Peaks' },
]

const plays = [
  play(1, 'plex://movie/2001', '2026-01-10T20:00:00Z', 2),
  play(1, 'plex://movie/heat', '2026-03-10T20:00:00Z', 3),
  play(1, 'plex://movie/heat', '2026-03-20T20:00:00Z', 3),
  play(1, 'plex://movie/dune', '2026-05-02T20:00:00Z', 2.5),
  play(2, 'plex://movie/dune', '2026-05-03T20:00:00Z', 2.5),
  // A night past midnight, Paris time: 21:00 on 4 May, last stop at 01:30 on 5 May
  play(1, 'show:2', '2026-05-04T19:00:00Z', 0.75, 'episode'),
  play(1, 'show:2', '2026-05-04T20:00:00Z', 0.75, 'episode'),
  play(1, 'show:1', '2026-05-04T22:00:00Z', 0.5, 'episode'),
  play(1, 'show:1', '2026-05-04T23:00:00Z', 0.5, 'episode'),
  play(1, 'show:1', '2026-06-01T20:00:00Z', 0.5, 'episode'),
  play(2, 'show:1', '2026-06-01T20:00:00Z', 20, 'episode'),
  play(2, 'plex://movie/heat', '2026-06-02T20:00:00Z', 20),
  play(1, 'plex://movie/2001', '2025-11-30T20:00:00Z', 2),
  play(1, 'plex://movie/heat', '2026-12-01T20:00:00Z', 3),
]

describe('lookOf', () => {
  const global = { theme: 'affiche' as const, choice: true }

  it('keeps the global look when nothing overrides it', () => {
    expect(lookOf({ global })).toEqual({ theme: 'affiche', choice: true })
  })

  it('lets the edition override the global look, and the friend override both', () => {
    expect(lookOf({ global, edition: { theme: 'labo', choice: false } })).toEqual({ theme: 'labo', choice: false })
    expect(lookOf({ global, edition: { theme: 'labo', choice: false }, guest: { theme: 'tele' } })).toEqual({ theme: 'tele', choice: false })
    expect(lookOf({ global, edition: { choice: false }, guest: { choice: true } })).toEqual({ theme: 'affiche', choice: true })
  })

  it('skips a look turned off, down to the first one offered', () => {
    expect(lookOf({ global, edition: { theme: 'labo' }, guest: { theme: 'tele' }, looks: ['affiche', 'labo'] })).toEqual({ theme: 'labo', choice: true })
    expect(lookOf({ global, guest: { theme: 'tele' }, looks: ['scenario', 'labo'] })).toEqual({ theme: 'scenario', choice: true })
  })

  it('reads a null value as no override', () => {
    expect(lookOf({ global, edition: { theme: null, choice: null }, guest: { theme: null, choice: null } })).toEqual(global)
  })
})

describe('partsOf', () => {
  it('reads the calendar in the given time zone', () => {
    expect(partsOf(at('2026-12-31T23:30:00Z'), 'Europe/Paris')).toMatchObject({ year: 2027, month: 1, day: 1, time: '00:30' })
    expect(partsOf(at('2026-12-31T23:30:00Z'), 'UTC')).toMatchObject({ year: 2026, month: 12, day: 31, time: '23:30' })
  })
})

describe('editionOf', () => {
  it('counts December for the next edition', () => {
    expect(editionOf(at('2026-11-30T22:30:00Z'), 'Europe/Paris')).toBe(2026)
    expect(editionOf(at('2026-11-30T23:30:00Z'), 'Europe/Paris')).toBe(2027)
    expect(editionOf(at('2026-01-01T00:00:00Z'), 'Europe/Paris')).toBe(2026)
  })
})

describe('editionBounds', () => {
  it('runs from 1 December to 1 December, midnight in the given time zone', () => {
    expect(editionBounds(2026, 'Europe/Paris')).toEqual({ start: at('2025-11-30T23:00:00Z'), end: at('2026-11-30T23:00:00Z') })
    expect(editionBounds(2026, 'America/New_York')).toEqual({ start: at('2025-12-01T05:00:00Z'), end: at('2026-12-01T05:00:00Z') })
    expect(editionOf(editionBounds(2026, 'Europe/Paris').end - 1, 'Europe/Paris')).toBe(2026)
    expect(editionOf(editionBounds(2026, 'Europe/Paris').end, 'Europe/Paris')).toBe(2027)
  })
})

describe('wrappedOf', () => {
  const wrapped = wrappedOf({ plays, titles, user_id: 1, year: 2026 })

  it('counts the edition of one user, from December to November, and nothing from another edition', () => {
    expect(wrapped).toMatchObject({ plays: 9, movies: 3, shows: 2, episodes: 5, hours: 14, evenings: 6 })
  })

  it('ranks by hours against every user of the server', () => {
    expect(wrapped.rank).toBe(2)
    expect(wrapped.server).toEqual({ users: 2, median_hours: 18 })
    expect(wrappedOf({ plays, titles, user_id: 2, year: 2026 }).rank).toBe(1)
  })

  it('caps a play at its media duration', () => {
    expect(wrappedOf({ plays, titles, user_id: 2, year: 2026 }).hours).toBe(23)
  })

  it('opens on the first title of the edition and closes on the last', () => {
    expect(wrapped.first).toMatchObject({ title: '2001', date: '2026-01-10' })
    expect(wrapped.last).toMatchObject({ title: 'Scrubs', date: '2026-06-01' })
  })

  it('opens on the first title from 1 January, and on December only when nothing came after', () => {
    const december = [play(18, 'plex://movie/dune', '2025-12-20T20:00:00Z', 2.5), play(18, 'plex://movie/heat', '2026-01-03T20:00:00Z', 3)]
    expect(wrappedOf({ plays: december, titles, user_id: 18, year: 2026 }).first).toMatchObject({ title: 'Heat', date: '2026-01-03' })
    expect(wrappedOf({ plays: december.slice(0, 1), titles, user_id: 18, year: 2026 }).first).toMatchObject({ title: 'Dune', date: '2025-12-20' })
  })

  it('keeps the night that ended the latest, past midnight, as one night', () => {
    expect(wrapped.night).toEqual({ date: '2026-05-04', plays: 4, episodes: 4, end: '01:30', late: true, episode: true, poster: { key: 'show:1', title: 'Scrubs' }, before: [{ key: 'show:2', title: 'Twin Peaks' }] })
  })

  it('falls back on the evening with the most plays when nothing ends after 01:00, and ignores a session left open', () => {
    const early = [
      play(4, 'plex://movie/2001', '2026-02-01T18:00:00Z', 2),
      { ...play(4, 'plex://movie/heat', '2026-02-01T20:00:00Z', 3), stopped: at('2026-02-03T20:00:00Z') },
      play(4, 'plex://movie/dune', '2026-02-10T19:00:00Z', 2.5),
    ]
    expect(wrappedOf({ plays: early, titles, user_id: 4, year: 2026 }).night).toMatchObject({ date: '2026-02-01', plays: 2, end: '00:30', late: false, poster: { title: 'Heat' }, before: [{ title: '2001' }] })
  })

  it('puts the show watched the most on each month', () => {
    expect(wrapped.month_shows[5]).toMatchObject({ title: 'Twin Peaks', episodes: 2 })
    expect(wrapped.month_shows[6]).toMatchObject({ title: 'Scrubs', episodes: 1 })
    expect(wrapped.month_shows[0]).toBeNull()
  })

  it('finds the evenings in a row, the binge and the pace of the first show', () => {
    const binge = [
      ...['01', '02', '03', '05'].map((day) => play(6, 'show:1', `2026-03-${day}T20:00:00Z`, 0.5, 'episode')),
      ...[20, 21, 22, 23].map((hour) => play(6, 'show:1', `2026-03-10T${hour}:00:00Z`, 0.5, 'episode')),
    ]
    expect(wrappedOf({ plays: binge, titles, user_id: 6, year: 2026 })).toMatchObject({
      streak: { evenings: 3, from: '2026-03-01', to: '2026-03-03', poster: { title: 'Scrubs' }, times: 3, nights: [{ title: 'Scrubs' }, { title: 'Scrubs' }, { title: 'Scrubs' }] },
      binge: { title: 'Scrubs', episodes: 4, date: '2026-03-10' },
      pace: { title: 'Scrubs', episodes: 8, days: 11 },
    })
    expect(wrapped).toMatchObject({ streak: null, binge: null, pace: { title: 'Scrubs', episodes: 3, days: 28 } })
  })

  it('tells each evening of the run by its own title', () => {
    const run = [
      play(14, 'plex://movie/2001', '2026-03-01T20:00:00Z', 2),
      play(14, 'plex://movie/heat', '2026-03-02T20:00:00Z', 2),
      play(14, 'show:1', '2026-03-03T20:00:00Z', 0.5, 'episode'),
    ]
    expect(wrappedOf({ plays: run, titles, user_id: 14, year: 2026 }).streak).toMatchObject({ evenings: 3, times: 1, nights: [{ title: '2001' }, { title: 'Heat' }, { title: 'Scrubs' }] })
  })

  it('shows the last film watched alone among the films nobody else watched', () => {
    const alone = [play(13, 'plex://movie/2001', '2026-03-01T20:00:00Z', 2), play(13, 'plex://movie/heat', '2026-04-01T20:00:00Z', 3)]
    expect(wrappedOf({ plays: alone, titles, user_id: 13, year: 2026 }).only_you).toMatchObject({ count: 2, posters: [{ title: 'Heat' }, { title: '2001' }] })
  })

  it('finds the titles watched with one other viewer, and the viewer who shares the most', () => {
    const match = [
      ...['2001', 'heat', 'dune'].map((key, index) => play(15, `plex://movie/${key}`, `2026-03-0${index + 1}T20:00:00Z`, 2)),
      play(15, 'show:1', '2026-03-05T20:00:00Z', 0.5, 'episode'),
      play(15, 'show:2', '2026-03-06T20:00:00Z', 0.5, 'episode'),
      ...['2001', 'heat', 'dune'].map((key, index) => play(16, `plex://movie/${key}`, `2026-04-0${index + 1}T20:00:00Z`, 2)),
      play(16, 'show:1', '2026-04-05T20:00:00Z', 0.5, 'episode'),
      play(16, 'show:2', '2026-04-06T20:00:00Z', 0.5, 'episode'),
      play(17, 'plex://movie/dune', '2026-05-01T20:00:00Z', 2.5),
    ]
    expect(wrappedOf({ plays: match, titles, user_id: 15, year: 2026 })).toMatchObject({
      duo: { count: 4, posters: [{ title: '2001', year: 1968, with: 16, days: 31 }, { title: 'Heat', year: 1995, with: 16, days: 31 }, { title: 'Scrubs', with: 16, days: 31 }, { title: 'Twin Peaks', with: 16, days: 31 }] },
      twin: { user_id: 16, shared: 5, total: 5 },
    })
    expect(wrappedOf({ plays: match.slice(0, 7), titles, user_id: 15, year: 2026 }).twin).toBeNull()
  })

  it('orders the titles watched with one other viewer by how close the two evenings were', () => {
    const close = [
      play(15, 'plex://movie/2001', '2026-03-01T20:00:00Z', 2), play(16, 'plex://movie/2001', '2026-06-01T20:00:00Z', 2),
      play(15, 'plex://movie/heat', '2026-03-02T20:00:00Z', 3), play(16, 'plex://movie/heat', '2026-03-02T21:00:00Z', 3),
      play(15, 'plex://movie/dune', '2026-03-03T20:00:00Z', 2.5), play(16, 'plex://movie/dune', '2026-03-06T20:00:00Z', 2.5),
    ]
    expect(wrappedOf({ plays: close, titles, user_id: 15, year: 2026 }).duo).toMatchObject({ count: 3, posters: [{ title: 'Heat', days: 0 }, { title: 'Dune', days: 3 }, { title: '2001', days: 92 }] })
  })

  it('counts as only yours a film nobody else ever watched, earlier years included', () => {
    const alone = [play(13, 'plex://movie/2001', '2026-03-01T20:00:00Z', 2), play(13, 'plex://movie/heat', '2026-04-01T20:00:00Z', 3)]
    const history = { 'plex://movie/2001': [13], 'plex://movie/heat': [13, 14] }
    expect(wrappedOf({ plays: alone, titles, user_id: 13, year: 2026, history }).only_you).toMatchObject({ count: 1, posters: [{ title: '2001' }] })
  })

  it('compares with the other users, who stay anonymous', () => {
    const server = [
      play(7, 'plex://movie/dune', '2026-04-01T20:00:00Z', 2.5),
      play(8, 'plex://movie/dune', '2026-04-03T20:00:00Z', 2.5),
      play(9, 'plex://movie/dune', '2026-04-08T20:00:00Z', 2.5),
      play(8, 'plex://movie/heat', '2026-04-05T20:00:00Z', 3),
      play(7, 'plex://movie/2001', '2026-04-06T20:00:00Z', 2),
    ]
    expect(wrappedOf({ plays: server, titles, user_id: 7, year: 2026 })).toMatchObject({
      first_on_server: { title: 'Dune', others: 2 },
      only_you: { count: 1, posters: [{ title: '2001' }] },
    })
    expect(wrappedOf({ plays: server, titles, user_id: 8, year: 2026 })).toMatchObject({ first_on_server: null, same_week: { title: 'Dune', others: 2 } })
    expect(wrapped).toMatchObject({ first_on_server: null, same_week: null, only_you: { count: 1, posters: [{ title: '2001' }] } })
  })

  it('tells the movies dropped, rewatched, the longest and the oldest', () => {
    const timed = titles.map((title) => title.media_type === 'movie' ? { ...title, duration: { '2001': 2, 'Heat': 3, 'Dune': 2.5 }[title.title]! * 3600 } : title)
    const habits = [
      play(10, 'plex://movie/heat', '2026-02-01T20:00:00Z', 3),
      play(10, 'plex://movie/heat', '2026-02-08T20:00:00Z', 3),
      play(10, 'plex://movie/dune', '2026-02-09T20:00:00Z', 1),
      play(10, 'plex://movie/2001', '2026-02-10T20:00:00Z', 2),
    ]
    expect(wrappedOf({ plays: habits, titles: timed, user_id: 10, year: 2026 })).toMatchObject({
      dropped: { title: 'Dune', percent: 40 },
      rewatched: { title: 'Heat', times: 2, dates: ['2026-02-01', '2026-02-08'] },
      longest: { title: 'Heat', minutes: 180 },
      oldest: { title: '2001', year: 1968, dates: ['2026-02-10'] },
    })
    const resumed = [play(10, 'plex://movie/dune', '2026-02-09T20:00:00Z', 1.2), play(10, 'plex://movie/dune', '2026-02-10T20:00:00Z', 1.3)]
    expect(wrappedOf({ plays: resumed, titles: timed, user_id: 10, year: 2026 }).dropped).toBeNull()
  })

  it('keeps a film released after 2000 out of the oldest', () => {
    const recent = [
      play(14, 'plex://movie/dune', '2026-02-01T20:00:00Z', 2.5),
      play(14, 'plex://movie/heat', '2026-02-05T20:00:00Z', 3),
    ]
    const timed = titles.map((title) => title.media_type === 'movie' ? { ...title, duration: { '2001': 2, 'Heat': 3, 'Dune': 2.5 }[title.title]! * 3600 } : title)
    expect(wrappedOf({ plays: recent, titles: timed, user_id: 14, year: 2026 })).toMatchObject({ oldest: { title: 'Heat', year: 1995 } })
    const modern = timed.map((title) => title.key === 'plex://movie/heat' ? { ...title, year: 2005 } : title)
    expect(wrappedOf({ plays: recent, titles: modern, user_id: 14, year: 2026 }).oldest).toBeNull()
  })

  it('sums the hours of any stretch of plays, capped at the media duration', () => {
    expect(watchedHoursOf({ plays, titles, user_id: 2 })).toBe(23)
  })

  it('finds a show dropped before its end and before where someone else got to', () => {
    const counted = titles.map((title) => title.key === 'show:1' ? { ...title, episode_count: 20 } : title)
    const episode = (user_id: number, index: number, started: string) => ({ ...play(user_id, 'show:1', started, 0.5, 'episode'), parent_media_index: 1, media_index: index })
    const shows = [
      episode(11, 1, '2026-01-01T20:00:00Z'),
      episode(11, 2, '2026-01-02T20:00:00Z'),
      episode(11, 3, '2026-01-03T20:00:00Z'),
      episode(12, 9, '2026-06-01T20:00:00Z'),
    ]
    expect(wrappedOf({ plays: shows, titles: counted, user_id: 11, year: 2026 }).dropped_show).toMatchObject({ title: 'Scrubs', season: 1, episode: 3 })
    expect(wrappedOf({ plays: shows.slice(0, 3), titles: counted, user_id: 11, year: 2026 }).dropped_show).toBeNull()
    expect(wrappedOf({ plays: shows, titles: titles.map((title) => title.key === 'show:1' ? { ...title, episode_count: 3 } : title), user_id: 11, year: 2026 }).dropped_show).toBeNull()
    expect(wrappedOf({ plays: [...shows, episode(12, 9, '2026-01-20T20:00:00Z')].filter((play) => play.started < at('2026-02-01T00:00:00Z')), titles: counted, user_id: 11, year: 2026 }).dropped_show).toBeNull()
  })

  it('reads the genre, led by the actor seen the most, else the first show', () => {
    expect(wrapped.genre).toMatchObject({ name: 'Science-Fiction', titles: 2, total: 5, lead: { kind: 'show', name: 'Scrubs', titles: 1, posters: [{ key: 'show:1', title: 'Scrubs' }] } })
    expect(wrapped.genre?.posters.map(({ title }) => title)).toEqual(['2001', 'Dune'])
    const cast = titles.map((title) => ({ ...title, actors: ['Al Pacino'] }))
    expect(wrappedOf({ plays, titles: cast, user_id: 1, year: 2026 }).genre?.lead).toMatchObject({ kind: 'actor', name: 'Al Pacino', titles: 5, posters: [{ title: 'Scrubs' }, { title: 'Heat' }, { title: 'Twin Peaks' }, { title: '2001' }] })
  })

  it('compares with the previous edition only when the gap is worth telling', () => {
    expect(wrappedOf({ plays, titles, user_id: 1, year: 2026, previous: { hours: 30 } }).previous).toEqual({ year: 2025, hours: 30 })
    expect(wrappedOf({ plays, titles, user_id: 1, year: 2026, previous: { hours: 15 } }).previous).toBeNull()
    expect(wrappedOf({ plays, titles, user_id: 1, year: 2026, previous: { hours: 5 } }).previous).toBeNull()
  })

  it('gives an empty year to a user without plays', () => {
    expect(wrappedOf({ plays, titles, user_id: 3, year: 2026 })).toMatchObject({ plays: 0, hours: 0, rank: 0, evenings: 0, first: null, night: null, streak: null, only_you: null, genre: null, month_shows: Array(12).fill(null) })
  })
})
