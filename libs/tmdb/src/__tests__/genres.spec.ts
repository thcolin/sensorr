import { TMDB } from '../tmdb'

// `query-string` ships as ESM, which this jest setup does not transform, and `transform` never builds a URL
jest.mock('query-string', () => ({}))

describe('genres', () => {
  const tmdb = new TMDB({ key: 'TMDB_API_KEY' })
  tmdb.genres = { 18: { id: 18, name: 'Drama' }, 36: { id: 36, name: 'History' } } as any
  tmdb.tvGenres = { 18: { id: 18, name: 'Drama' } } as any

  // `discover/tv` returns "Les Tudors" (2942) with 10749, a movie genre, page 35 of a popularity sort
  it('should name a show genre from the movie genres when the show genres lack it', () => {
    const body = tmdb.transform({ results: [{ id: 1, genre_ids: [18, 36] }] }, { uri: 'discover/tv', params: {} })
    expect(body.results[0].genres).toEqual([{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }])
  })

  it('should drop a genre neither list knows', () => {
    const tv = tmdb.transform({ results: [{ id: 1, genre_ids: [18, 99999] }] }, { uri: 'discover/tv', params: {} })
    const movie = tmdb.transform({ results: [{ id: 1, genre_ids: [99999, 18] }] }, { uri: 'discover/movie', params: {} })
    expect(tv.results[0].genres).toEqual([{ id: 18, name: 'Drama' }])
    expect(movie.results[0].genres).toEqual([{ id: 18, name: 'Drama' }])
  })
})
