import utils from '../utils'

describe('isUnknown', () => {
  const now = new Date('2026-09-30').getTime()

  // "Sex Rider: Wet Highway" (233651), 15 votes, 8th on `discover/movie` by popularity on 2026-09-30
  it('should flag an old movie under 50 votes', () => {
    expect(utils.isUnknown({ release_date: '1971-12-29', vote_count: 15 }, now)).toBe(true)
  })

  it('should keep an old movie with 50 votes or more', () => {
    expect(utils.isUnknown({ release_date: '1971-12-29', vote_count: 50 }, now)).toBe(false)
  })

  // "Verity" (1283515), 5 votes on its release day
  it('should keep a recent movie whatever its votes', () => {
    expect(utils.isUnknown({ release_date: '2026-09-30', vote_count: 5 }, now)).toBe(false)
    expect(utils.isUnknown({ release_date: '2024-10-15', vote_count: 0 }, now)).toBe(false)
  })

  it('should keep a movie without release date', () => {
    expect(utils.isUnknown({ release_date: '', vote_count: 0 }, now)).toBe(false)
    expect(utils.isUnknown({ release_date: undefined, vote_count: 0 }, now)).toBe(false)
  })
})
