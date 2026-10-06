import { refresh, refreshAll } from './refresh'

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

describe('refreshAll', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => null))
  afterEach(() => jest.restoreAllMocks())

  it('skips the movie TMDB does not answer for and keeps the others, a few calls at a time', async () => {
    let running = 0
    let most = 0
    const tmdb = {
      fetch: async (uri) => {
        running++
        most = Math.max(most, running)
        await new Promise((resolve) => setTimeout(resolve, 5))
        running--

        if (uri === 'movie/2') {
          throw new Error('The resource you requested could not be found.')
        }

        return { id: Number(uri.split('/')[1]), title: uri, release_dates: { results: [] } }
      },
    }

    const { refreshed, skipped } = await refreshAll(tmdb, ['1', '2', '3', '4', '5'], {}, 2)

    expect(Object.keys(refreshed)).toEqual(['1', '3', '4', '5'])
    expect(skipped).toEqual(['2'])
    expect(most).toBe(2)
  })
})
