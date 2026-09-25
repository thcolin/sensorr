import { fillsOf } from './fills'

describe('fillsOf', () => {
  const files = [{ id: '1' }]
  const episodes = [
    { season_number: 4, episode_number: 1, files },
    { season_number: 4, episode_number: 2, files: [] },
    { season_number: 4, episode_number: 3, files },
    { season_number: 4, episode_number: 4 },
  ]

  it('names the covered episodes the library does not own', () => {
    const fills = fillsOf([4, 3, 2, 1].map(episode => ({ season: 4, episode })), episodes)
    expect(fills.total).toBe(4)
    expect(fills.label).toBe('E02 E04')
  })

  it('counts the whole pack of a season or series release', () => {
    expect(fillsOf([{ season: 4, episode: 2 }], episodes, 'season').total).toBe(4)
    expect(fillsOf([{ season: 4, episode: 2 }], [...episodes, { season_number: 0, episode_number: 1 }], 'series').total).toBe(4)
    expect(fillsOf([{ season: 4, episode: 2 }], episodes, 'episode').total).toBe(1)
  })

  it('prefixes the season when the release spans several', () => {
    expect(fillsOf([{ season: 4, episode: 4 }, { season: 5, episode: 1 }], episodes).label).toBe('S04E04 S05E01')
  })

  it('cuts a long list and counts the rest', () => {
    const coverage = Array.from({ length: 10 }, (_, i) => ({ season: 1, episode: i + 1 }))
    expect(fillsOf(coverage, []).label).toBe('E01 E02 E03 E04 E05 E06 +4')
  })
})
