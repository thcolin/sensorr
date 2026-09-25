import { agendaDays, groupByDay, monthWeeks, weeksRange } from './agenda'

const shows = { 1668: { name: 'Friends' }, 1399: { name: 'Game of Thrones' } }

const NOW = new Date('2026-09-25T12:00:00.000Z')

const episode = (id, show_id, air_date, season_number = 1, episode_number = 1, extra = {}) => ({ id, show_id, air_date, season_number, episode_number, monitored: true, ...extra })

describe('agenda', () => {
  it('lays a month out in whole weeks from Monday, with the days of the months around it', () => {
    const weeks = monthWeeks(new Date(2026, 8, 1))

    expect(weeks).toHaveLength(5)
    expect(weeks.every(week => week.length === 7)).toBe(true)
    expect(weeks[0].map(({ key }) => key)).toEqual(['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'])
    expect(weeks[0][0].outside).toBe(true)
    expect(weeks[0][1].outside).toBe(false)
    expect(weeks[4].map(({ key, outside }) => [key, outside])).toEqual([
      ['2026-09-28', false], ['2026-09-29', false], ['2026-09-30', false],
      ['2026-10-01', true], ['2026-10-02', true], ['2026-10-03', true], ['2026-10-04', true],
    ])
  })

  it('needs six weeks for a month that starts on a Sunday, and four for a February that starts on a Monday', () => {
    expect(monthWeeks(new Date(2026, 10, 1))).toHaveLength(6)
    expect(monthWeeks(new Date(2027, 1, 1))).toHaveLength(4)
    expect(monthWeeks(new Date(2027, 1, 1))[0][0].key).toBe('2027-02-01')
  })

  it('bounds the query of a month on the first and last day its grid shows', () => {
    expect(weeksRange(new Date(2026, 8, 1))).toEqual({ aired_after: '2026-08-31', aired_before: '2026-10-04' })
    expect(weeksRange(new Date(2026, 11, 1))).toEqual({ aired_after: '2026-11-30', aired_before: '2027-01-03' })
  })

  it('groups episodes by their air date, days in order and shows by name within a day', () => {
    const days = groupByDay([
      episode(3, 1399, '2026-09-24T00:00:00.000Z', 8, 1),
      episode(1, 1668, '2026-09-24T00:00:00.000Z', 4, 24),
      episode(2, 1668, '2026-09-02T00:00:00.000Z', 4, 23),
    ], shows, NOW)

    expect(days.map(({ key }) => key)).toEqual(['2026-09-02', '2026-09-24'])
    expect(days[1].entries.map(({ show_id }) => show_id)).toEqual([1668, 1399])
    expect(days[1].date.getDate()).toBe(24)
  })

  it('makes one entry of the episodes a show drops the same day in the same status, and leaves undated ones out', () => {
    const days = groupByDay([
      episode(2, 1668, '2026-09-24T00:00:00.000Z', 4, 25),
      episode(1, 1668, '2026-09-24T00:00:00.000Z', 4, 24),
      episode(3, 1668, '2026-09-24T00:00:00.000Z', 4, 26),
      episode(4, 1668, null),
    ], shows, NOW)

    expect(days).toHaveLength(1)
    expect(days[0].entries).toHaveLength(1)
    expect(days[0].entries[0].status).toBe('wanted')
    expect(days[0].entries[0].episodes.map(({ episode_number }) => episode_number)).toEqual([24, 25, 26])
  })

  it('splits a drop where the status changes, so each line keeps one status', () => {
    const days = groupByDay([
      episode(1, 1668, '2026-09-24T00:00:00.000Z', 4, 24, { files: [{ size: 1 }] }),
      episode(2, 1668, '2026-09-24T00:00:00.000Z', 4, 25, { files: [{ size: 1 }] }),
      episode(3, 1668, '2026-09-24T00:00:00.000Z', 4, 26),
      episode(4, 1668, '2026-09-24T00:00:00.000Z', 4, 27, { files: [{ size: 1 }] }),
    ], shows, NOW)

    expect(days[0].entries.map(({ status, episodes }) => [status, episodes.map(({ id }) => id)])).toEqual([
      ['owned', [1, 2]],
      ['wanted', [3]],
      ['owned', [4]],
    ])
  })

  describe('agendaDays', () => {
    const past = [
      episode(3, 1668, '2026-09-22T00:00:00.000Z', 4, 3),
      episode(2, 1668, '2026-09-15T00:00:00.000Z', 4, 2),
      episode(1, 1399, '2026-09-15T00:00:00.000Z', 8, 1),
    ]

    const future = [
      episode(4, 1668, '2026-09-29T00:00:00.000Z', 4, 4),
      episode(5, 1399, '2026-10-06T00:00:00.000Z', 8, 2),
    ]

    it('keeps only the days something airs on, and today as a marker when nothing does', () => {
      const days = agendaDays({ past: { episodes: past, done: true }, future: { episodes: future, done: true } }, shows, '2026-09-25', NOW)

      expect(days.map(({ key, entries }) => [key, entries.length])).toEqual([
        ['2026-09-15', 2],
        ['2026-09-22', 1],
        ['2026-09-25', 0],
        ['2026-09-29', 1],
        ['2026-10-06', 1],
      ])
    })

    it('holds back the farthest day of a stream with pages left, as its page may have cut it', () => {
      const days = agendaDays({ past: { episodes: past, done: false }, future: { episodes: future, done: false } }, shows, '2026-09-25', NOW)

      expect(days.map(({ key }) => key)).toEqual(['2026-09-22', '2026-09-25', '2026-09-29'])
    })

    it('does not add today twice when something airs on it', () => {
      const days = agendaDays({ past: { episodes: [], done: true }, future: { episodes: [episode(6, 1668, '2026-09-25T00:00:00.000Z')], done: true } }, shows, '2026-09-25', NOW)

      expect(days.map(({ key, entries }) => [key, entries.length])).toEqual([['2026-09-25', 1]])
    })

    it('counts an episode once when two pages both return it', () => {
      const days = agendaDays({ past: { episodes: [...past, past[0]], done: true }, future: { episodes: [], done: true } }, shows, '2026-09-25', NOW)

      expect(days.find(({ key }) => key === '2026-09-22').entries[0].episodes).toHaveLength(1)
    })
  })
})
