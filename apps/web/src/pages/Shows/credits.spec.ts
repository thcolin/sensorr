import { aggregateCredits, LIMIT } from './credits'

// The package entry imports `query-string`, which is ESM and left untransformed by this jest config
jest.mock('@sensorr/tmdb', () => ({ utils: jest.requireActual('../../../../../libs/tmdb/src/utils').default }))

describe('aggregateCredits', () => {
  const credits = {
    cast: [
      { id: 1, name: 'Steve', roles: [{ character: 'Michael' }], total_episode_count: 140 },
      { id: 2, name: 'Rainn', roles: [{ character: 'Dwight' }, { character: 'Mose' }], total_episode_count: 1 },
    ],
    crew: [
      { id: 3, name: 'Greg', jobs: [{ job: 'Writer' }, { job: 'Executive Producer' }], total_episode_count: 20 },
      { id: 4, name: 'Paul', jobs: [{ job: 'Director' }], total_episode_count: 50 },
    ],
  }

  it('tells each cast member their characters and episode count', () => {
    expect(aggregateCredits(credits, [], 'cast').map(({ id, override }) => [id, override])).toEqual([
      [1, '"Michael" · 140 episodes'],
      [2, '"Dwight / Mose" · 1 episode'],
    ])
  })

  it('merges a crew member jobs, directors first', () => {
    expect(aggregateCredits(credits, ['3'], 'crew').map(({ id, override }) => [id, override])).toEqual([
      [4, 'Director · 50 episodes'],
      [3, 'Writer, Executive Producer · 20 episodes'],
    ])
  })

  it('keeps the first people, followed ones included', () => {
    const many = { cast: Array.from({ length: LIMIT + 10 }, (_, index) => ({ id: index + 1, roles: [], total_episode_count: 1 })) }
    const kept = aggregateCredits(many, [String(LIMIT + 10)], 'cast').map(({ id }) => id)

    expect(kept).toHaveLength(LIMIT)
    expect(kept[0]).toBe(LIMIT + 10)
  })

  it('gives nothing without credits', () => {
    expect(aggregateCredits(undefined, [], 'cast')).toEqual([])
  })
})
