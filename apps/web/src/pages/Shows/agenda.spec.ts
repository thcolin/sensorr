import { groupByDay, monthRange } from './agenda'

const shows = { 1668: { name: 'Friends' }, 1399: { name: 'Game of Thrones' } }

const NOW = new Date('2026-09-25T12:00:00.000Z')

const episode = (id, show_id, air_date, season_number = 1, episode_number = 1, extra = {}) => ({ id, show_id, air_date, season_number, episode_number, monitored: true, ...extra })

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
})
