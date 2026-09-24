import { isRefreshDue, monitoredOf, fetchShow, REFRESH_AFTER } from './shows'

const now = 1790000000000

describe('isRefreshDue', () => {
  it('refreshes a show still airing on every run', () => {
    for (const status of ['Returning Series', 'In Production', 'Planned', 'Pilot']) {
      expect(isRefreshDue({ status, refreshed_at: new Date(now - 1000).toISOString() }, now)).toBe(true)
    }
  })

  it('refreshes any other show once its last refresh is 30 days old', () => {
    expect(isRefreshDue({ status: 'Ended', refreshed_at: new Date(now - REFRESH_AFTER + 1000).toISOString() }, now)).toBe(false)
    expect(isRefreshDue({ status: 'Canceled', refreshed_at: new Date(now - REFRESH_AFTER).toISOString() }, now)).toBe(true)
  })

  it('refreshes a show never refreshed', () => {
    expect(isRefreshDue({ status: 'Ended' }, now)).toBe(true)
  })
})

describe('monitoredOf', () => {
  const show = { monitored: true, monitor_new_seasons: false }
  const known = [
    { id: 1, season_number: 1, episode_number: 1, monitored: false },
    { id: 2, season_number: 1, episode_number: 2, monitored: true },
    { id: 3, season_number: 2, episode_number: 1, monitored: false },
  ]

  it('monitors a new episode of a season that already has a monitored episode', () => {
    expect(monitoredOf({ season_number: 1, episode_number: 3 }, show, known)).toBe(true)
    expect(monitoredOf({ season_number: 2, episode_number: 2 }, show, known)).toBe(false)
  })

  it('monitors a new season only when the show monitors new seasons', () => {
    expect(monitoredOf({ season_number: 3, episode_number: 1 }, show, known)).toBe(false)
    expect(monitoredOf({ season_number: 3, episode_number: 1 }, { ...show, monitor_new_seasons: true }, known)).toBe(true)
  })

  it('never monitors an episode of an unmonitored show', () => {
    expect(monitoredOf({ season_number: 1, episode_number: 3 }, { ...show, monitored: false }, known)).toBe(false)
    expect(monitoredOf({ season_number: 3, episode_number: 1 }, { monitored: false, monitor_new_seasons: true }, known)).toBe(false)
  })

  it('never monitors a special on its own', () => {
    expect(monitoredOf({ season_number: 0, episode_number: 2 }, { ...show, monitor_new_seasons: true }, [{ season_number: 0, monitored: true }])).toBe(false)
  })
})

describe('fetchShow', () => {
  const season = (season_number, count) => ({
    season_number,
    episodes: Array(count).fill(null).map((foo, index) => ({ id: season_number * 100 + index + 1, season_number, episode_number: index + 1, name: `E${index + 1}`, crew: [] })),
  })

  it('fetches every season, specials included, and lightens show and episodes', async () => {
    const calls = []
    const tmdb = {
      fetch: async (uri, params) => {
        calls.push([uri, params?.append_to_response])
        if (uri === 'tv/7/season/0') return season(0, 1)
        if (!params.append_to_response.includes('season/')) return { id: 7, name: 'Show', credits: {}, seasons: [0, 1, 2, 21].map((season_number) => ({ season_number })) }
        return params.append_to_response.split(',').reduce((acc, key) => ({ ...acc, [key]: season(Number(key.split('/')[1]), 2) }), { id: 7 })
      },
    }

    const { show, episodes } = await fetchShow(tmdb, 7)

    expect(calls.map(([uri]) => uri)).toEqual(['tv/7', 'tv/7', 'tv/7', 'tv/7/season/0'])
    expect(calls[0][1]).toBe('external_ids,alternative_titles')
    expect(show).not.toHaveProperty('credits')
    expect(episodes.map(({ season_number }) => season_number)).toEqual([1, 1, 2, 2, 21, 21, 0])
    expect(episodes[0]).toEqual({ id: 101, show_id: 7, season_number: 1, episode_number: 1, name: 'E1', overview: undefined, air_date: undefined, runtime: undefined, still_path: undefined })
  })
})
