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
})
