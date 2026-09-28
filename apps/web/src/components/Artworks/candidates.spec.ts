import { candidatesOf, linkOf, ratingKeyOf } from './candidates'

const plex = [
  { key: 'upload://posters/a', thumb: '/library/metadata/4260/file?url=upload%3A%2F%2Fposters%2Fa', provider: 'local', selected: true },
  { key: 'https://image.tmdb.org/t/p/original/fr.jpg', thumb: 'https://images.plex.tv/photo?url=fr', provider: 'tmdb', selected: false },
  { key: 'https://assets.fanart.tv/fanart/b.jpg', thumb: 'https://assets.fanart.tv/preview/b.jpg', provider: 'fanarttv', selected: false },
]

const tmdb = [
  { file_path: '/fr.jpg', iso_639_1: 'fr' },
  { file_path: '/en.jpg', iso_639_1: 'en' },
  { file_path: '/none.jpg', iso_639_1: null },
]

describe('candidatesOf', () => {
  it('puts the current one first, then the region, English, and the others', () => {
    const groups = candidatesOf(plex, tmdb, { region: 'fr', token: 't' })

    expect(groups.map(({ label, items }) => [label, items.map(({ id }) => id)])).toEqual([
      ['current', ['upload://posters/a']],
      ['fr', ['https://image.tmdb.org/t/p/original/fr.jpg']],
      ['en', ['/en.jpg']],
      ['others', ['https://assets.fanart.tv/fanart/b.jpg', '/none.jpg']],
    ])
  })

  it('picks a TMDB image Plex lists back through Plex, and has Plex fetch the others', () => {
    const [current, fr, en] = candidatesOf(plex, tmdb, { region: 'fr', token: 't' })

    expect(fr.items[0]).toMatchObject({ thumb: '/fr.jpg', choice: { key: 'https://image.tmdb.org/t/p/original/fr.jpg' }, lang: 'fr' })
    expect(en.items[0]).toMatchObject({ thumb: '/en.jpg', choice: { url: 'https://image.tmdb.org/t/p/original/en.jpg' } })
    expect(current.items[0].thumb).toBe('/api/plex/image?path=%2Flibrary%2Fmetadata%2F4260%2Ffile%3Furl%3Dupload%253A%252F%252Fposters%252Fa&authorization=Bearer+t')
  })

  it('draws nothing when there is nothing', () => {
    expect(candidatesOf([], [], { region: 'fr', token: 't' })).toEqual([])
  })
})

describe('ratingKeyOf', () => {
  it('reads the Plex item from a stored artwork', () => {
    expect(ratingKeyOf({ poster: null, backdrop: '/library/metadata/4260/art/1637148634', logo: null })).toBe('4260')
    expect(ratingKeyOf(null)).toBeNull()
  })
})

describe('linkOf', () => {
  it('turns a ThePosterDB page into its asset, and keeps any other image link', () => {
    expect(linkOf(' https://theposterdb.com/poster/12345 ')).toBe('https://theposterdb.com/api/assets/12345')
    expect(linkOf('https://mediux.pro/some.jpg')).toBe('https://mediux.pro/some.jpg')
    expect(linkOf('not a link')).toBeNull()
    expect(linkOf('javascript:alert(1)')).toBeNull()
  })
})
