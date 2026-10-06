import { withPlexArtworks } from './plex'

const movie = { id: 346808, poster_path: '/poster.jpg', backdrop_path: '/backdrop.jpg' }
const artworks = { poster: '/library/metadata/4260/thumb/1637148634', backdrop: '/library/metadata/4260/art/1637148634', logo: null }

describe('withPlexArtworks', () => {
  it('draws the Plex artworks, with the TMDB ones as fallback', () => {
    const { entity, details } = withPlexArtworks(movie, { poster: '/poster.jpg', billboard: '/backdrop.jpg' }, artworks, 'token')
    const poster = new URL(entity.poster_path, 'https://sensorr.test')

    expect(poster.pathname).toBe('/api/plex/image')
    expect(Object.fromEntries(poster.searchParams)).toEqual({ path: artworks.poster, fallback: '/poster.jpg', authorization: 'Bearer token' })
    expect(details).toEqual({ poster: entity.poster_path, billboard: entity.backdrop_path })
  })

  it('keeps TMDB for a movie Plex does not have', () => {
    expect(withPlexArtworks(movie, null, null, 'token')).toEqual({ entity: movie, details: null })
  })

  it('leaves a movie already drawn with its Plex artworks as it is', () => {
    const once = withPlexArtworks(movie, null, artworks, 'token')
    expect(withPlexArtworks(once.entity, null, artworks, 'token').entity).toBe(once.entity)
  })

  it('draws no image while the source is unknown', () => {
    expect(withPlexArtworks(movie, { poster: '/poster.jpg', billboard: '/backdrop.jpg' }, null, 'token', true)).toEqual({
      entity: { ...movie, poster_path: null, backdrop_path: null },
      details: { poster: null, billboard: null },
      pending: true,
    })
  })
})
