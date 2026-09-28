import { imageRequestOf, transcodeOf, fallbackOf } from './image'

describe('imageRequestOf', () => {
  it('reads an artwork path as sync stores it', () => {
    expect(imageRequestOf({ path: '/library/metadata/6850/thumb/1643698660', size: 'w300', fallback: '/matrix.jpg' }))
      .toEqual({ path: '/library/metadata/6850/thumb/1643698660', size: 'w300', fallback: '/matrix.jpg' })
    expect(imageRequestOf({ path: '/library/metadata/6850/clearLogo/1790301610' }))
      .toEqual({ path: '/library/metadata/6850/clearLogo/1790301610', size: 'original', fallback: null })
  })

  it('refuses any other path on Plex, and a fallback outside TMDB', () => {
    expect(imageRequestOf({ path: '/library/sections' })).toBeNull()
    expect(imageRequestOf({ path: '/library/metadata/6850/thumb/1643698660?X-Plex-Token=1' })).toBeNull()
    expect(imageRequestOf({ path: '/library/metadata/6850/thumb/1643698660', fallback: '//evil.example/a.jpg' })).toBeNull()
    expect(imageRequestOf({ path: '/library/metadata/6850/thumb/1643698660', size: '../w300' })).toBeNull()
    expect(imageRequestOf({})).toBeNull()
    expect(imageRequestOf({ path: '/library/metadata/6850/thumb/1643698660', size: ['w300'] })).toBeNull()
    expect(imageRequestOf({ path: '/library/metadata/6850/thumb/1643698660', size: 'w9999' })).toBeNull()
  })
})

describe('transcodeOf', () => {
  it('asks Plex for the width TMDB would have served, 1920 for the original', () => {
    expect(transcodeOf({ path: '/library/metadata/1/thumb/2', size: 'w300', fallback: null }))
      .toBe('/photo/:/transcode?url=%2Flibrary%2Fmetadata%2F1%2Fthumb%2F2&width=300&height=1200&minSize=0&upscale=0')
    expect(transcodeOf({ path: '/library/metadata/1/art/2', size: 'original', fallback: null }))
      .toBe('/photo/:/transcode?url=%2Flibrary%2Fmetadata%2F1%2Fart%2F2&width=1920&height=7680&minSize=0&upscale=0')
  })
})

describe('fallbackOf', () => {
  it('points at the same size on TMDB', () => {
    expect(fallbackOf({ path: '/library/metadata/1/thumb/2', size: 'w92', fallback: '/matrix.jpg' })).toBe('https://image.tmdb.org/t/p/w92/matrix.jpg')
    expect(fallbackOf({ path: '/library/metadata/1/thumb/2', size: 'w92', fallback: null })).toBeNull()
  })
})
