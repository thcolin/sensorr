import { TMDB } from '../tmdb'

// `query-string` ships as ESM, which this jest setup does not transform
jest.mock('query-string', () => ({ __esModule: true, default: { stringify: () => 'api_key=TMDB_API_KEY' } }))

describe('build', () => {
  const tmdb = new TMDB({ key: 'TMDB_API_KEY' })

  it('should not double the slash of a path that starts with one', () => {
    expect(tmdb.build('/movie/603')).toBe('https://api.themoviedb.org/3/movie/603?api_key=TMDB_API_KEY')
    expect(tmdb.build('movie/603')).toBe('https://api.themoviedb.org/3/movie/603?api_key=TMDB_API_KEY')
  })
})
