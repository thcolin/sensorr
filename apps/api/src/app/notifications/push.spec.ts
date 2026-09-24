import { pushOf } from './push'

const accept = [
  { action: 'accept', title: 'Accept' },
  { action: 'refuse', title: 'Refuse' },
]

describe('pushOf', () => {
  it('names a movie by its title and year, and its release by indexer, size and peers', () => {
    expect(pushOf({
      command: 'record',
      movie: { id: 603, title: 'The Matrix', release_date: '1999-03-30', poster_path: '/matrix.jpg' },
      release: { znab: 'ABN', size: 5 * 1024 ** 3, peers: 12, title: 'The.Matrix.1999.1080p.BluRay.x264-GRP', proposal: true, valid: true },
    })).toEqual({
      title: 'The Matrix (1999)',
      body: '📹 ABN, 5 GB, 12 peers\nThe.Matrix.1999.1080p.BluRay.x264-GRP',
      image: 'https://image.tmdb.org/t/p/w185/matrix.jpg',
      actions: accept,
    })
  })

  it('keeps a movie request as it was', () => {
    expect(pushOf({ command: 'keep-in-touch', movie: { id: 603, title: 'The Matrix', poster_path: '/matrix.jpg' }, requested_by: ['a@example.com', 'b@example.com'], processed: true })).toEqual({
      title: 'The Matrix',
      body: '🍺 Requested by a@example.com, b@example.com',
      image: 'https://image.tmdb.org/t/p/w185/matrix.jpg',
      actions: [
        { action: 'wish-it', title: '"Wish" it' },
        { action: 'ignore', title: 'Ignore' },
      ],
    })
  })

  it('names a show release by the show and the episodes it covers', () => {
    const show = { id: 1668, name: 'Friends', poster_path: '/friends.jpg' }
    const release = { znab: 'C411', size: 1024 ** 3, peers: 3, title: 'Friends.S03.MULTi.1080p.BluRay.x264-GRP', proposal: true, valid: true }
    const range = (season: number, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ season, episode: from + index }))

    expect(pushOf({ command: 'record', type: 'show', show, release: { ...release, coverage: range(3, 1, 25), meta: { type: 'tvshow', seasons: [3], episodes: [] } } })).toEqual({
      title: 'Friends S03',
      body: '📹 C411, 1 GB, 3 peers\nFriends.S03.MULTi.1080p.BluRay.x264-GRP',
      image: 'https://image.tmdb.org/t/p/w185/friends.jpg',
      actions: accept,
    })
    expect(pushOf({ command: 'airing', type: 'show', show, release: { ...release, coverage: range(3, 4, 6), meta: { type: 'tvshow', seasons: [3], episodes: [4, 5, 6] } } }).title).toBe('Friends S03E04-E06')
    expect(pushOf({ command: 'airing', type: 'show', show, release: { ...release, coverage: range(3, 4, 6), meta: { type: 'tvshow', seasons: [3], episodes: [4, 5, 6] } } }).body).toBe('📡 C411, 1 GB, 3 peers\nFriends.S03.MULTi.1080p.BluRay.x264-GRP')
    expect(pushOf({ command: 'record', type: 'show', show, release: { ...release, coverage: [...range(1, 1, 24), ...range(10, 1, 18)], meta: { type: 'tvshow', seasons: [1, 10], episodes: [] } } }).title).toBe('Friends S01-S10')
  })

  it('offers no answer to a show release already downloaded', () => {
    expect(pushOf({ command: 'record', type: 'show', show: { id: 1668, name: 'Friends' }, release: { title: 'Friends.S03E04.1080p.WEB.x264-GRP', coverage: [{ season: 3, episode: 4 }], proposal: false, valid: true } })).toMatchObject({
      title: 'Friends S03E04',
      actions: [],
    })
  })

  it('names a show request by the show alone', () => {
    expect(pushOf({ command: 'keep-in-touch', type: 'show', show: { id: 1668, name: 'Friends', poster_path: '/friends.jpg' }, requested_by: ['a@example.com'], processed: true })).toEqual({
      title: 'Friends',
      body: '🍺 Requested by a@example.com',
      image: 'https://image.tmdb.org/t/p/w185/friends.jpg',
      actions: [
        { action: 'wish-it', title: '"Wish" it' },
        { action: 'ignore', title: 'Ignore' },
      ],
    })
  })
})
