import { artworksOf, sameArtworks, candidatesOf, seasonsOf, sameSeasons } from './artworks'

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

describe('seasonsOf', () => {
  it('keeps the seasons of this show that have a poster of their own', () => {
    expect(seasonsOf([
      { index: 1, parentRatingKey: '11344', thumb: '/library/metadata/11463/thumb/1', parentThumb: '/library/metadata/11344/thumb/9' },
      { index: 2, parentRatingKey: '11344', thumb: '/library/metadata/11344/thumb/9', parentThumb: '/library/metadata/11344/thumb/9' },
      { index: 1, parentRatingKey: '999', thumb: '/library/metadata/1000/thumb/1', parentThumb: '/library/metadata/999/thumb/1' },
    ], ['11344'])).toEqual({ 1: '/library/metadata/11463/thumb/1' })
  })
})

describe('sameSeasons', () => {
  it('tells a season poster changed, added or gone', () => {
    expect(sameSeasons({ 1: 'a' }, { 1: 'a' })).toBe(true)
    expect(sameSeasons({ 1: 'a' }, { 1: 'b' })).toBe(false)
    expect(sameSeasons(undefined, { 1: 'a' })).toBe(false)
    expect(sameSeasons({ 1: 'a', 2: 'b' }, { 1: 'a' })).toBe(false)
  })
})
