import { groupByDay, monthRange } from './agenda'

const shows = { 1668: { name: 'Friends' }, 1399: { name: 'Game of Thrones' } }

const episode = (id, show_id, air_date, season_number = 1, episode_number = 1) => ({ id, show_id, air_date, season_number, episode_number })

describe('agenda', () => {
  it('bounds a month on its first and last day, February and December included', () => {
    expect(monthRange(new Date(2026, 8, 1))).toEqual({ aired_after: '2026-09-01', aired_before: '2026-09-30' })
    expect(monthRange(new Date(2028, 1, 1))).toEqual({ aired_after: '2028-02-01', aired_before: '2028-02-29' })
    expect(monthRange(new Date(2026, 11, 1))).toEqual({ aired_after: '2026-12-01', aired_before: '2026-12-31' })
  })

  it('groups episodes by their air date, days in order and shows by name within a day', () => {
    const days = groupByDay([
      episode(3, 1399, '2026-09-24T00:00:00.000Z', 8, 1),
      episode(1, 1668, '2026-09-24T00:00:00.000Z', 4, 24),
      episode(2, 1668, '2026-09-02T00:00:00.000Z', 4, 23),
    ], shows)

    expect(days.map(({ key }) => key)).toEqual(['2026-09-02', '2026-09-24'])
    expect(days[1].episodes.map(({ id }) => id)).toEqual([1, 3])
    expect(days[1].date.getDate()).toBe(24)
  })

  it('keeps two episodes of one show on the same day as two lines, and leaves undated ones out', () => {
    const days = groupByDay([
      episode(2, 1668, '2026-09-24T00:00:00.000Z', 4, 25),
      episode(1, 1668, '2026-09-24T00:00:00.000Z', 4, 24),
      episode(4, 1668, null),
    ], shows)

    expect(days).toHaveLength(1)
    expect(days[0].episodes.map(({ episode_number }) => episode_number)).toEqual([24, 25])
  })
})
