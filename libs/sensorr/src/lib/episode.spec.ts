import { episodeStatus, progressOf } from './episode'

describe('episodeStatus', () => {
  const now = new Date('2026-09-24T12:00:00Z')
  const aired = { air_date: '2026-09-17', monitored: true, files: [], release: null }

  it('gives upcoming to an episode airing after now', () => {
    expect(episodeStatus({ ...aired, air_date: '2026-10-01' }, now)).toBe('upcoming')
    expect(episodeStatus({ ...aired, air_date: new Date('2026-09-24T13:00:00Z') }, now)).toBe('upcoming')
  })

  it('gives upcoming to a followed episode without an air date', () => {
    expect(episodeStatus({ ...aired, air_date: null }, now)).toBe('upcoming')
    expect(episodeStatus({ monitored: true }, now)).toBe('upcoming')
  })

  it('gives unmonitored to an episode without an air date nobody follows', () => {
    expect(episodeStatus({ ...aired, air_date: null, monitored: false }, now)).toBe('unmonitored')
    expect(episodeStatus({}, now)).toBe('unmonitored')
  })

  it('gives unmonitored to an aired episode nobody follows', () => {
    expect(episodeStatus({ ...aired, monitored: false }, now)).toBe('unmonitored')
    expect(episodeStatus({ air_date: '2026-09-17' }, now)).toBe('unmonitored')
  })

  it('gives owned to an episode with a file, monitored or not', () => {
    const files = [{ id: '1', size: 1, title: 'S01E01', original: 'Show.S01E01.mkv' }]
    expect(episodeStatus({ ...aired, files }, now)).toBe('owned')
    expect(episodeStatus({ ...aired, files, monitored: false, release: 'abc' }, now)).toBe('owned')
  })

  it('gives proposed to an aired, monitored episode a release covers', () => {
    expect(episodeStatus({ ...aired, release: 'abc' }, now)).toBe('proposed')
  })

  it('gives wanted to an aired, monitored episode with neither file nor release', () => {
    expect(episodeStatus(aired, now)).toBe('wanted')
    expect(episodeStatus({ ...aired, air_date: '2026-09-24' }, now)).toBe('wanted')
    expect(episodeStatus(aired, now.getTime())).toBe('wanted')
  })
})

describe('progressOf', () => {
  const now = new Date('2026-09-24T12:00:00Z')
  const files = [{ id: '1', size: 1, title: 'S01E01', original: 'Show.S01E01.mkv' }]

  it('counts the episodes aired by now and the ones with a file', () => {
    expect(progressOf([
      { air_date: '2026-09-10', files },
      { air_date: '2026-09-17', files: [] },
      { air_date: '2026-09-24' },
      { air_date: '2026-10-01' },
      { air_date: null },
    ], now)).toEqual({ owned: 1, aired: 3 })
  })

  it('counts a file even when TMDB dates its episode later', () => {
    expect(progressOf([{ air_date: '2026-10-01', files }], now.getTime())).toEqual({ owned: 1, aired: 0 })
  })

  it('gives zero to no episode', () => {
    expect(progressOf([], now)).toEqual({ owned: 0, aired: 0 })
  })
})
