import { editionOf, partsOf, wrappedOf, WrappedPlay, WrappedTitle } from './wrapped'

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

describe('wrappedOf', () => {
  const wrapped = wrappedOf({ plays, titles, user_id: 1, year: 2026 })

  it('counts the edition of one user, from December to November, and nothing from another edition', () => {
    expect(wrapped).toMatchObject({ plays: 9, movies: 3, shows: 2, episodes: 5, hours: 14 })
    expect(wrapped.months[0]).toBe(0)
    expect(wrapped.months[1]).toBe(2)
    expect(wrapped.months[11]).toBe(0)
  })

  it('ranks by hours against every user of the server', () => {
    expect(wrapped.rank).toBe(2)
    expect(wrapped.server).toEqual({ users: 2, median_hours: 19 })
    expect(wrappedOf({ plays, titles, user_id: 2, year: 2026 }).rank).toBe(1)
  })

  it('caps a play at its media duration', () => {
    expect(wrappedOf({ plays, titles, user_id: 2, year: 2026 }).hours).toBe(23)
  })

  it('keeps a night past midnight as one night', () => {
    expect(wrapped.night).toEqual({ date: '2026-05-04', plays: 4, episodes: 4, end: '01:30', titles: ['Twin Peaks', 'Scrubs'] })
  })

  it('gives the awards', () => {
    expect(wrapped.palme).toMatchObject({ title: 'Heat', plays: 2 })
    expect(wrapped.grand_prix).toMatchObject({ title: 'Scrubs', episodes: 3, months: [5, 6] })
    expect(wrapped.jury).toMatchObject({ title: '2001' })
    expect(wrapped.alone_pct).toBe(33)
  })

  it('reads taste from the movies', () => {
    expect(wrapped).toMatchObject({ film_age: 1995, decade: 1990, genre: 'Science-Fiction' })
  })

  it('gives an empty year to a user without plays', () => {
    expect(wrappedOf({ plays, titles, user_id: 3, year: 2026 })).toMatchObject({ plays: 0, hours: 0, rank: 0, night: null, palme: null, grand_prix: null, jury: null, film_age: null })
  })
})
