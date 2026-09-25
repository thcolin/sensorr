import { Znab } from './znab'

describe('Znab.search', () => {
  afterEach(() => delete (global as any).fetch)

  it('drops a result oleoo refuses to parse and keeps the others', async () => {
    const items = [
      { guid: 'a', link: 'a', title: `${'A'.repeat(1100)}.2020.1080p.WEB.x264-GRP` },
      { guid: 'b', link: 'b', title: 'Show.E1-20000.1080p.WEB.x264-GRP' },
      { guid: 'c', link: 'c', title: 'Movie.2020.MULTi.1080p.WEB.x264-GRP' },
    ]
    ;(global as any).fetch = jest.fn(async () => ({ ok: true, text: async () => JSON.stringify({ items }) }))

    const znab = new Znab({ name: 'test', url: 'http://indexer.test/api', key: 'key', disabled: false }, {})
    const results = await znab.search('movie')

    expect(results.map((result: any) => result.original)).toEqual(['Movie.2020.MULTi.1080p.WEB.x264-GRP'])
  })

  it('searches movies as free text in the movie categories', async () => {
    (global as any).fetch = jest.fn(async () => ({ ok: true, text: async () => JSON.stringify({ items: [] }) }))

    await new Znab({ name: 'test', url: 'http://indexer.test/api', key: 'key', disabled: false }, {}).search('la haine')

    expect((global as any).fetch.mock.calls.map(([url]) => url)).toEqual([
      'http://indexer.test/api?q=la%20haine&Query=la%20haine&t=search&cat=2000%2C2010%2C2020%2C2030%2C2040%2C2050%2C2060%2C2070%2C2080%2C2090%2C5080&format=json&apikey=key',
    ])
  })
})

describe('Znab.searchShow', () => {
  afterEach(() => delete (global as any).fetch)

  const TV = 'cat=5000%2C5010%2C5020%2C5030%2C5040%2C5045%2C5050%2C5060%2C5070%2C5080'
  const capsOf = (tv: string) => `<?xml version="1.0" encoding="UTF-8"?>
    <caps>
      <searching>
        <search available="yes" supportedParams="q" />
        ${tv}
      </searching>
    </caps>`
  const mock = (caps: { ok: boolean, body?: string }, items = []) => {
    (global as any).fetch = jest.fn(async (url: string) => url.includes('t=caps') ?
      { ok: caps.ok, text: async () => caps.body } :
      { ok: true, text: async () => JSON.stringify({ items }) }
    )
    return new Znab({ name: 'test', url: 'http://indexer.test/api', key: 'key', disabled: false }, {})
  }
  const urls = () => (global as any).fetch.mock.calls.map(([url]) => url)

  it('uses tvsearch with season and ep when the indexer announces them, and asks caps once', async () => {
    const znab = mock({ ok: true, body: capsOf('<tv-search available="yes" supportedParams="q,season,ep" />') })

    await znab.searchShow('friends', { season: 2, episode: 5 })
    await znab.searchShow('friends', { season: 2 })
    await znab.searchShow('friends')

    expect(urls()).toEqual([
      'http://indexer.test/api?t=caps&format=json&apikey=key',
      `http://indexer.test/api?q=friends&season=2&ep=5&Query=friends&t=tvsearch&${TV}&format=json&apikey=key`,
      `http://indexer.test/api?q=friends&season=2&Query=friends&t=tvsearch&${TV}&format=json&apikey=key`,
      `http://indexer.test/api?q=friends&Query=friends&t=tvsearch&${TV}&format=json&apikey=key`,
    ])
  })

  it('writes the season and the episode in a free text search otherwise', async () => {
    const qOnly = mock({ ok: true, body: capsOf('<tv-search available="yes" supportedParams="q" />') })
    await qOnly.searchShow('friends', { season: 2, episode: 5 })
    await qOnly.searchShow('friends')

    expect(urls().slice(1)).toEqual([
      `http://indexer.test/api?q=friends%20S02E05&Query=friends%20S02E05&t=search&${TV}&format=json&apikey=key`,
      `http://indexer.test/api?q=friends&Query=friends&t=tvsearch&${TV}&format=json&apikey=key`,
    ])

    await mock({ ok: true, body: capsOf('<tv-search available="no" supportedParams="q,season,ep" />') }).searchShow('friends', { season: 2 })

    expect(urls().slice(1)).toEqual([`http://indexer.test/api?q=friends%20S02&Query=friends%20S02&t=search&${TV}&format=json&apikey=key`])

    await mock({ ok: false }).searchShow('friends', { season: 10 })

    expect(urls().slice(1)).toEqual([`http://indexer.test/api?q=friends%20S10&Query=friends%20S10&t=search&${TV}&format=json&apikey=key`])
  })

  it('keeps the Torznab category of each result', async () => {
    const znab = mock({ ok: false }, [
      { guid: 'a', link: 'a', title: 'Friends.S02.MULTi.1080p.BluRay.x264-GRP', category: [5040, 100001] },
      { guid: 'b', link: 'b', title: 'Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP', category: 2040 },
    ])

    const results = await znab.searchShow('friends')

    expect(results.map(({ original, category, term }: any) => [original, category, term])).toEqual([
      ['Friends.S02.MULTi.1080p.BluRay.x264-GRP', [5040, 100001], 'friends'],
      ['Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP', [2040], 'friends'],
    ])
  })
})

describe('Znab.request', () => {
  afterEach(() => delete (global as any).fetch)

  const refuse = () => {
    (global as any).fetch = jest.fn(async (url: string) => ({ ok: false, status: 401, statusText: 'Unauthorized', url }))
  }

  it('masks the key in the error of a movie and of a show search', async () => {
    refuse()
    const znab = new Znab({ name: 'C411', url: 'https://c411.example/api', key: 's3cr3t', disabled: false }, {})
    znab.caps = { tvsearch: [] }

    for (const search of [() => znab.search('Heat'), () => znab.searchShow('Friends', { season: 3 })]) {
      const error = await search().catch((error) => error)
      expect(error.message).toContain('apikey=***')
      expect(error.message).not.toContain('s3cr3t')
    }
  })

  it('masks the key encoded in the target of a proxied request', async () => {
    refuse()
    const znab = new Znab({ name: 'C411', url: 'https://c411.example/api', key: 'a+b/c', disabled: false }, { proxify: true })
    const error = await znab.search('Heat').catch((error) => error)

    expect(error.message).toContain('apikey%3D***')
    expect(error.message).not.toContain(encodeURIComponent(encodeURIComponent('a+b/c')))
  })
})
