import { artworkChoicesOf, ratingKeyOf, writeOf } from './artworks'

describe('artworkChoicesOf', () => {
  it('reads a listed candidate by its key, and an image to add by its url', () => {
    expect(artworkChoicesOf({ poster: { key: 'upload://posters/a' }, logo: { url: 'https://theposterdb.com/api/assets/1' } }))
      .toEqual({ poster: { key: 'upload://posters/a' }, logo: { url: 'https://theposterdb.com/api/assets/1' } })
  })

  it('refuses an unknown kind, another scheme, an array, or nothing to write', () => {
    expect(artworkChoicesOf({ thumb: { key: 'upload://posters/a' } })).toBeNull()
    expect(artworkChoicesOf({ poster: { url: 'file:///etc/passwd' } })).toBeNull()
    expect(artworkChoicesOf({ poster: { key: ['upload://posters/a'] } })).toBeNull()
    expect(artworkChoicesOf({})).toBeNull()
    expect(artworkChoicesOf(null)).toBeNull()
    expect(artworkChoicesOf(JSON.parse('{"constructor":{"url":"https://a.example/b.jpg"}}'))).toBeNull()
    expect(artworkChoicesOf(JSON.parse('{"__proto__":{"key":"upload://x"}}'))).toBeNull()
  })
})

describe('artworkChoicesOf, a url', () => {
  it('refuses an address on the network Plex sits in', () => {
    for (const url of ['http://localhost:32400/x', 'http://127.0.0.1/x', 'http://192.168.1.1/cgi', 'http://10.0.0.2/a.jpg', 'http://172.20.0.1/a', 'http://169.254.169.254/latest', 'http://[::1]/a']) {
      expect(artworkChoicesOf({ poster: { url } })).toBeNull()
    }
    expect(artworkChoicesOf({ poster: { url: 'http://172.32.0.1/a.jpg' } })).toEqual({ poster: { url: 'http://172.32.0.1/a.jpg' } })
  })
})

describe('ratingKeyOf', () => {
  it('takes digits only', () => {
    expect(ratingKeyOf('4260')).toBe('4260')
    expect(ratingKeyOf('4260/../sections')).toBeNull()
  })
})

describe('writeOf', () => {
  it('picks a candidate with a PUT, adds an image with a POST', () => {
    expect(writeOf('4260', 'backdrop', { key: 'metadata://art/a' })).toEqual({ method: 'PUT', path: '/library/metadata/4260/art?url=metadata%3A%2F%2Fart%2Fa' })
    expect(writeOf('4260', 'logo', { url: 'https://a.example/b.png' })).toEqual({ method: 'POST', path: '/library/metadata/4260/clearLogos?url=https%3A%2F%2Fa.example%2Fb.png' })
  })
})
