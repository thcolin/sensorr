import { lightenShow, lightenEpisodes, buildShowSeasonsRequests, fetchShow } from '../shows'
import * as fixtures from './shows.fixtures'

describe('lightenShow', () => {
  it('keeps exactly the stored TMDB show fields', () => {
    expect(lightenShow(fixtures.show)).toEqual({
      id: 1399,
      name: 'Game of Thrones',
      original_name: 'Game of Thrones',
      original_language: 'en',
      overview: fixtures.show.overview,
      first_air_date: '2011-04-17',
      last_air_date: '2019-05-19',
      status: 'Ended',
      type: 'Scripted',
      in_production: false,
      number_of_seasons: 8,
      number_of_episodes: 73,
      episode_run_time: [60],
      genres: fixtures.show.genres,
      networks: fixtures.show.networks,
      origin_country: ['US'],
      poster_path: fixtures.show.poster_path,
      backdrop_path: fixtures.show.backdrop_path,
      popularity: 369.594,
      vote_average: 8.4,
      vote_count: 21390,
      external_ids: fixtures.show.external_ids,
      alternative_titles: fixtures.show.alternative_titles,
      seasons: fixtures.show.seasons,
    })
  })

  it('drops fields TMDB returns beyond the stored shape', () => {
    expect(Object.keys(lightenShow(fixtures.show))).not.toContain('homepage')
    expect(Object.keys(lightenShow(fixtures.show))).not.toContain('tagline')
  })
})

describe('lightenEpisodes', () => {
  it('keeps exactly the stored TMDB episode fields, with show_id set', () => {
    expect(lightenEpisodes(fixtures.season, 1399)).toEqual([
      {
        id: 63056,
        show_id: 1399,
        season_number: 1,
        episode_number: 1,
        name: 'Winter Is Coming',
        overview: fixtures.season.episodes[0].overview,
        air_date: '2011-04-17',
        runtime: 62,
        still_path: fixtures.season.episodes[0].still_path,
      },
      {
        id: 63057,
        show_id: 1399,
        season_number: 1,
        episode_number: 2,
        name: 'The Kingsroad',
        overview: fixtures.season.episodes[1].overview,
        air_date: '2011-04-24',
        runtime: 56,
        still_path: fixtures.season.episodes[1].still_path,
      },
    ])
  })
})

describe('buildShowSeasonsRequests', () => {
  it('appends every season in one request when 20 or fewer', () => {
    const requests = buildShowSeasonsRequests(1399, 8)
    expect(requests).toEqual([
      { uri: 'tv/1399', params: { append_to_response: 'season/1,season/2,season/3,season/4,season/5,season/6,season/7,season/8' } },
    ])
  })

  it('splits into several requests past the 20-item append_to_response cap', () => {
    const requests = buildShowSeasonsRequests(456, 38) // The Simpsons

    expect(requests).toHaveLength(2)
    expect(requests[0].params.append_to_response.split(',')).toHaveLength(20)
    expect(requests[0].params.append_to_response.split(',')[0]).toBe('season/1')
    expect(requests[0].params.append_to_response.split(',')[19]).toBe('season/20')
    expect(requests[1].params.append_to_response.split(',')).toHaveLength(18)
    expect(requests[1].params.append_to_response.split(',')[0]).toBe('season/21')
    expect(requests[1].params.append_to_response.split(',')[17]).toBe('season/38')
    expect(requests.every((request) => request.uri === 'tv/456')).toBe(true)
  })

  it('appends nothing for a show with no season yet', () => {
    expect(buildShowSeasonsRequests(1, 0)).toEqual([
      { uri: 'tv/1', params: { append_to_response: '' } },
    ])
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
