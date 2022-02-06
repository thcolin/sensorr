import fetchMock, { enableFetchMocks } from 'jest-fetch-mock'
import { TMDB } from '../tmdb'
import * as fixtures from './fixtures'

describe('tmdb', () => {
  beforeAll(() => {
    enableFetchMocks()
  })

  it('should init with `genres`', async () => {
    fetchMock.mockResponseOnce(() => new Promise((resolve) => setTimeout(() => resolve(JSON.stringify(fixtures.genres)), 100)))
    const tmdb = new TMDB({ key: 'TMDB_API_KEY' })
    expect(tmdb.genres).toEqual([])
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(tmdb.genres).toEqual(fixtures.genres)
  })

  it('should init with `genres` before any fetch', async () => {
    fetchMock.mockResponseOnce(() => new Promise((resolve) => setTimeout(() => resolve(JSON.stringify(fixtures.genres)), 100)))
    const tmdb = new TMDB({ key: 'TMDB_API_KEY' })
    expect(tmdb.genres).toEqual([])
    const t0 = performance.now()
    fetchMock.mockResponseOnce(JSON.stringify(fixtures.movie))
    const movie = await tmdb.fetch('movie/1826')
    const t1 = performance.now()
    expect(movie).toEqual(fixtures.movie)
    expect(tmdb.genres).toEqual(fixtures.genres)
    expect(t1 - t0).toBeGreaterThanOrEqual(100)
  })
})
