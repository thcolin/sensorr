import { refresh } from './refresh'

const gone = { fetch: async () => { throw new Error('The resource you requested could not be found.') } }

describe('refresh', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => null))
  afterEach(() => jest.restoreAllMocks())

  it('keeps one theatrical release per year of the movie TMDB gives', async () => {
    const tmdb = {
      fetch: async () => ({
        id: 1018,
        release_dates: {
          results: [
            { type: 3, release_date: '2001-05-16' },
            { type: 4, release_date: '2001-06-01' },
            { type: 3, release_date: '2001-10-12' },
            { type: 3, release_date: '2002-01-01' },
          ],
        },
      }),
    }

    expect((await refresh(tmdb, 1018, { title: 'Mulholland Drive' })).release_dates.results).toEqual([
      { type: 3, release_date: '2001-05-16' },
      { type: 3, release_date: '2002-01-01' },
    ])
  })

  it('writes a movie Sensorr stores without its refresh when TMDB has dropped it', async () => {
    await expect(refresh(gone, 185789, { title: 'Mulholland Dr.' })).resolves.toEqual({})
  })

  it.each([
    ['not stored yet', undefined],
    ['just ignored', {}],
    ['only holding a ban', { banned_releases: ['Mulholland.Dr.2001.1080p'] }],
    ['wished a moment ago, its write failed', { state: 'wished' }],
  ])('writes no movie %s when TMDB fails, it would have no title', async (_, current) => {
    await expect(refresh(gone, 185789, current)).rejects.toThrow('could not be found')
  })
})
