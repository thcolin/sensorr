import { artworksOf, sameArtworks, candidatesOf } from './artworks'

describe('artworksOf', () => {
  it('reads the poster, the backdrop and the logo picked on Plex', () => {
    expect(artworksOf({
      thumb: '/library/metadata/6850/thumb/1643698660',
      art: '/library/metadata/6850/art/1643698660',
      Image: [
        { type: 'coverPoster', url: '/library/metadata/6850/thumb/1643698660' },
        { type: 'background', url: '/library/metadata/6850/art/1643698660' },
        { type: 'backgroundSquare', url: '/library/metadata/6850/squareArt/1643698660' },
        { type: 'clearLogo', url: '/library/metadata/6850/clearLogo/1790301610' },
      ],
    })).toEqual({
      poster: '/library/metadata/6850/thumb/1643698660',
      backdrop: '/library/metadata/6850/art/1643698660',
      logo: '/library/metadata/6850/clearLogo/1790301610',
    })
  })

  it('falls back on thumb and art, and holds null for what Plex does not have', () => {
    expect(artworksOf({ thumb: '/library/metadata/1/thumb/2' })).toEqual({ poster: '/library/metadata/1/thumb/2', backdrop: null, logo: null })
  })
})

describe('sameArtworks', () => {
  const artworks = { poster: '/library/metadata/1/thumb/2', backdrop: null, logo: null }

  it('tells a changed artwork, and one Sensorr never stored', () => {
    expect(sameArtworks({ poster: '/library/metadata/1/thumb/2' }, artworks)).toBe(true)
    expect(sameArtworks({ poster: '/library/metadata/1/thumb/3' }, artworks)).toBe(false)
    expect(sameArtworks(undefined, artworks)).toBe(false)
    expect(sameArtworks({ poster: '/library/metadata/1/thumb/2', logo: '/library/metadata/1/clearLogo/2' }, artworks)).toBe(false)
  })
})

describe('candidatesOf', () => {
  it('keeps what picks a candidate back, and names an upload local', () => {
    expect(candidatesOf([
      { key: 'https://image.tmdb.org/t/p/original/a.jpg', ratingKey: 'https://image.tmdb.org/t/p/original/a.jpg', thumb: 'https://images.plex.tv/photo?url=a', provider: 'tmdb', selected: false },
      { key: '/library/metadata/1/file?url=upload%3A%2F%2Fposters%2Fb', ratingKey: 'upload://posters/b', thumb: '/library/metadata/1/file?url=upload%3A%2F%2Fposters%2Fb', selected: true },
    ])).toEqual([
      { key: 'https://image.tmdb.org/t/p/original/a.jpg', thumb: 'https://images.plex.tv/photo?url=a', provider: 'tmdb', selected: false },
      { key: 'upload://posters/b', thumb: '/library/metadata/1/file?url=upload%3A%2F%2Fposters%2Fb', provider: 'local', selected: true },
    ])
  })
})
