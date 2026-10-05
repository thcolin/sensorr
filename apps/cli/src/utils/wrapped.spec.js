import { idsOf, isOldGuid, sameMovieOf, tmdbOf } from './wrapped'

describe('isOldGuid', () => {
  it('tells an old agent guid from a new or local one', () => {
    expect(isOldGuid('com.plexapp.agents.imdb://tt0351283?lang=fr')).toBe(true)
    expect(isOldGuid('plex://movie/5d776828961905001eb919e2')).toBe(false)
    expect(isOldGuid('local://1234')).toBe(false)
  })
})

describe('idsOf', () => {
  it('reads the IMDb or TMDB id an old agent kept in its guid', () => {
    expect(idsOf('com.plexapp.agents.imdb://tt0351283?lang=fr')).toEqual(['imdb://tt0351283'])
    expect(idsOf('com.plexapp.agents.themoviedb://953?lang=fr')).toEqual(['tmdb://953'])
  })

  it('reads nothing from a new agent guid or a local one', () => {
    expect(idsOf('plex://movie/5d776828961905001eb919e2')).toEqual([])
    expect(idsOf('local://1234')).toEqual([])
  })
})

describe('sameMovieOf', () => {
  const metadata = { guid: 'plex://movie/5d776828961905001eb919e2', guids: ['imdb://tt0351283', 'tmdb://953'] }

  it('keeps the metadata of a movie Plex matched again with the new agent', () => {
    expect(sameMovieOf('com.plexapp.agents.imdb://tt0351283?lang=fr', metadata)).toBe(true)
    expect(sameMovieOf('plex://movie/5d776828961905001eb919e2', metadata)).toBe(true)
  })

  it('drops the metadata of another movie behind the same rating key', () => {
    expect(sameMovieOf('com.plexapp.agents.imdb://tt2503944?lang=fr', metadata)).toBe(false)
    expect(sameMovieOf('plex://movie/other', metadata)).toBe(false)
  })
})

describe('tmdbOf', () => {
  const movie = {
    id: 953,
    title: 'Madagascar',
    release_date: '2005-05-25',
    runtime: 86,
    genres: [{ name: 'Animation' }],
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    credits: { cast: [{ name: 'Ben Stiller' }], crew: [{ name: 'Eric Darnell', job: 'Director' }, { name: 'Hans Zimmer', job: 'Original Music Composer' }] },
  }

  it('describes a movie gone from Plex in the shape of Plex metadata', async () => {
    const tmdb = { fetch: jest.fn(async (uri) => uri.startsWith('find/') ? { movie_results: [{ id: 953 }] } : movie) }
    await expect(tmdbOf(tmdb, 'com.plexapp.agents.imdb://tt0351283?lang=fr')).resolves.toEqual({
      title: 'Madagascar',
      year: 2005,
      genres: ['Animation'],
      directors: ['Eric Darnell'],
      actors: ['Ben Stiller'],
      guids: ['tmdb://953'],
      thumb: '/poster.jpg',
      art: '/backdrop.jpg',
      duration: 5160000,
    })
    expect(tmdb.fetch).toHaveBeenCalledWith('find/tt0351283', { external_source: 'imdb_id' })
  })

  it('describes nothing without an id, or when TMDB does not know the IMDb one', async () => {
    const tmdb = { fetch: jest.fn(async () => ({ movie_results: [] })) }
    await expect(tmdbOf(tmdb, 'plex://movie/5d776828961905001eb919e2')).resolves.toEqual({})
    await expect(tmdbOf(tmdb, 'com.plexapp.agents.imdb://tt0000000?lang=fr')).resolves.toEqual({})
    expect(tmdb.fetch).toHaveBeenCalledTimes(1)
  })
})
