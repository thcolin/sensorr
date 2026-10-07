import { Policy, entryPolicy, listPolicy, matchPolicy, ranked, unranked } from './policy'

describe('matchPolicy', () => {
  const policies = [
    { name: 'MULTi' },
    { name: 'VOF', match: { original_languages: ['fr'] } },
    { name: 'VOST', match: { original_languages: ['ja', 'fr'] } },
  ]

  it('gives the first policy matching the original language', () => {
    expect(matchPolicy({ original_language: 'fr' }, policies)?.name).toBe('VOF')
    expect(matchPolicy({ original_language: 'ja' }, policies)?.name).toBe('VOST')
  })

  it('gives nothing when no policy matches', () => {
    expect(matchPolicy({ original_language: 'en' }, policies)).toBeUndefined()
    expect(matchPolicy({}, policies)).toBeUndefined()
    expect(matchPolicy({ original_language: 'fr' }, [])).toBeUndefined()
  })
})

describe('entryPolicy', () => {
  const policies = [
    { name: 'MULTi' },
    { name: 'VOF', match: { original_languages: ['fr'] } },
  ]
  const movie = { original_language: 'fr' }

  it('gives the matching policy to a movie entering the library', () => {
    expect(entryPolicy(movie, null, policies)?.name).toBe('VOF')
    expect(entryPolicy(movie, { state: 'ignored' }, policies)?.name).toBe('VOF')
  })

  it('leaves a movie already in the library, or with a stored policy, as it is', () => {
    expect(entryPolicy(movie, { state: 'wished' }, policies)).toBeUndefined()
    expect(entryPolicy(movie, { state: 'ignored', policy: 'MULTi' }, policies)).toBeUndefined()
  })
})

describe('listPolicy', () => {
  const policies = [{ name: 'VOF' }, { name: '4K' }]
  const lists = [{ id: 'kids', policy: 'VOF' }, { id: 'big', policy: '4K' }, { id: 'none', policy: null }, { id: 'gone', policy: 'Removed' }]

  it('takes the policy of the last list entered that has a known one', () => {
    expect(listPolicy(['kids', 'big'], lists, policies)).toBe('4K')
    expect(listPolicy(['big', 'kids', 'none', 'gone'], lists, policies)).toBe('VOF')
  })

  it('gives none without such a list', () => {
    expect(listPolicy(['none', 'gone', 'unknown'], lists, policies)).toBeUndefined()
    expect(listPolicy([], lists, policies)).toBeUndefined()
  })
})

describe('prefer ranks', () => {
  const policy = (language) => new Policy({ name: 'MULTi', sorting: 'size', descending: false, prefer: { language }, avoid: {} } as any)
  const releases = [
    { title: 'Little.Italy.2018.MULTi-VF2.1080p.BLURAY.x264-A', size: 8, seeders: 1 },
    { title: 'Little.Italy.2018.MULTi-VFF.1080p.WEB.x264-B', size: 2, seeders: 1 },
    { title: 'Little.Italy.2018.MULTi.1080p.WEB.x264-C', size: 1, seeders: 1 },
  ]
  const scores = (language) => Object.fromEntries(policy(language).apply(releases, null).map(({ original, title, score }) => [(original || title).split('.')[3], score]))

  it('scores each entry of a flat list by its position', () => {
    expect(scores(['MULTi-VF2', 'MULTi-VFF', 'MULTi'])).toEqual({ 'MULTi-VF2': 2200, 'MULTi-VFF': 2166, MULTi: 2133 })
  })

  it('gives the values of one rank the same score, and lets the sorting decide between them', () => {
    expect(scores([['MULTi-VF2', 'MULTi-VFF'], 'MULTi'])).toEqual({ 'MULTi-VF2': 2200, 'MULTi-VFF': 2200, MULTi: 2150 })
    expect(policy([['MULTi-VF2', 'MULTi-VFF'], 'MULTi']).apply(releases, null)[0].meta.language).toBe('MULTi-VFF')
  })

  it('goes back and forth between entries and ranked values', () => {
    const entries = ['YGG', ['C411', 'TR4KER'], 'ABN']
    expect(unranked(entries)).toEqual([{ value: 'YGG', rank: 0 }, { value: 'C411', rank: 1 }, { value: 'TR4KER', rank: 1 }, { value: 'ABN', rank: 2 }])
    expect(ranked(unranked(entries))).toEqual(entries)
    expect(ranked(unranked(entries).filter(({ value }) => value !== 'TR4KER'))).toEqual(['YGG', 'C411', 'ABN'])
    expect(ranked([{ value: 'YGG', rank: undefined }, { value: 'ABN', rank: undefined }])).toEqual(['YGG', 'ABN'])
  })
})

describe('movie releases', () => {
  const policy = new Policy({ name: 'MULTi', sorting: 'size', descending: false, prefer: {}, avoid: {} } as any)
  const query = { terms: ['Mayday'], years: [2025], titles: ['Mayday'], banned_releases: [] }
  const release = (title) => ({ title, size: 1, seeders: 1, publishDate: '2025-10-01' })

  it('withdraws a release that names a season or an episode', () => {
    const results = policy.apply([release('Mayday.S25.FRENCH.1080p.WEB-DL.h264-TFA'), release('Mayday.S25E03.FRENCH.1080p.WEB-DL.h264-TFA'), release('Mayday.2025.FRENCH.1080p.WEB-DL.h264-TFA')], query)
    expect(Object.fromEntries(results.map(({ meta, valid }) => [meta.original, valid]))).toEqual({
      'Mayday.S25.FRENCH.1080p.WEB-DL.h264-TFA': false,
      'Mayday.S25E03.FRENCH.1080p.WEB-DL.h264-TFA': false,
      'Mayday.2025.FRENCH.1080p.WEB-DL.h264-TFA': true,
    })
  })
})

describe('magnet releases', () => {
  const policy = new Policy({ name: 'MULTi', sorting: 'size', descending: false, prefer: {}, avoid: {} } as any)
  const query = { terms: ['Dune'], years: [2021], titles: ['Dune'], banned_releases: [] }
  const release = (enclosure) => ({ title: 'Dune.2021.1080p.WEBRip.x264', size: 1, seeders: 1, publishDate: '2021-10-17', enclosure })
  const valid = (results) => Object.fromEntries(results.map(({ enclosure, valid }) => [enclosure.split(':')[0], valid]))

  it('withdraws a magnet link from a movie search unless magnet links are on', () => {
    const releases = [release('magnet:?xt=urn:btih:ED0DA850C273E3E15A819BDCBBF418BC85107EC8'), release('https://jackett/dl/1')]
    expect(valid(policy.apply(releases, query))).toEqual({ magnet: false, https: true })
    expect(valid(policy.apply(releases, { ...query, magnet: true }))).toEqual({ magnet: true, https: true })
  })

  it('withdraws a magnet link from a show search even when magnet links are on', () => {
    const result = Policy.normalizers.magnetReleases({ ...release('magnet:?xt=urn:btih:ED0DA850C273E3E15A819BDCBBF418BC85107EC8'), valid: true }, true, { type: 'season', season: 1, episodes: [] })
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/show needs a \.torrent/)
  })

  it('gives the reason of any other policy before the magnet one', () => {
    const [result] = policy.apply([{ ...release('magnet:?xt=urn:btih:ED0DA850C273E3E15A819BDCBBF418BC85107EC8'), title: 'Dune.1984.1080p.WEBRip.x264' }], query)
    expect(result.reason).toMatch(/Release year/)
    const [unseeded] = policy.apply([{ ...release('magnet:?xt=urn:btih:ED0DA850C273E3E15A819BDCBBF418BC85107EC8'), seeders: 0 }], query)
    expect(unseeded.reason).toMatch(/No seeders/)
  })

  it('gives a code and values the web translates next to each English reason', () => {
    const [result] = policy.apply([{ ...release('https://jackett/dl/1'), title: 'Dune.1984.1080p.WEBRip.x264' }], query)
    expect(result.explanation).toEqual({ code: 'yearDifferent', values: { year: '1984', years: expect.any(String) } })
    const unit = Policy.normalizers.showReleaseUnit({ ...release('https://jackett/dl/1'), valid: true, meta: { type: 'movie' } }, { type: 'season', season: 2, episodes: [] })
    expect(unit.explanation).toEqual({ code: 'unit', values: { level: 'movie', type: 'season', unit: 'S02' } })
    expect(Policy.normalizers.releasePolicy({ ...release('https://jackett/dl/1'), valid: true, meta: { resolution: '720p' } }, { avoid: { resolution: ['720p'] } }).explanation)
      .toEqual({ code: 'avoided', values: { tag: 'resolution', keywords: '720p' } })
  })
})
