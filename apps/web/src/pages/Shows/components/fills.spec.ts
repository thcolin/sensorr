import { fileMetaOf, fillsOf, ownedFilesOf, sizeOf } from './fills'

describe('fillsOf', () => {
  const files = [{ id: '1' }]
  const episodes = [
    { season_number: 4, episode_number: 1, files },
    { season_number: 4, episode_number: 2, files: [] },
    { season_number: 4, episode_number: 3, files },
    { season_number: 4, episode_number: 4 },
  ]

  it('names the covered episodes the library does not own', () => {
    const fills = fillsOf([4, 3, 2, 1].map(episode => ({ season: 4, episode })), episodes)
    expect(fills.total).toBe(4)
    expect(fills.label).toBe('E02 E04')
  })

  it('counts the whole pack of a season or series release', () => {
    expect(fillsOf([{ season: 4, episode: 2 }], episodes, 'season').total).toBe(4)
    expect(fillsOf([{ season: 4, episode: 2 }], [...episodes, { season_number: 0, episode_number: 1 }], 'series').total).toBe(4)
    expect(fillsOf([{ season: 4, episode: 2 }], episodes, 'episode').total).toBe(1)
  })

  it('prefixes the season when the release spans several', () => {
    expect(fillsOf([{ season: 4, episode: 4 }, { season: 5, episode: 1 }], episodes).label).toBe('S04E04 S05E01')
  })

  it('cuts a long list and counts the rest', () => {
    const coverage = Array.from({ length: 10 }, (_, i) => ({ season: 1, episode: i + 1 }))
    expect(fillsOf(coverage, []).label).toBe('E01 E02 E03 E04 E05 E06 +4')
  })
})

describe('fileMetaOf', () => {
  it('keeps the language the file name spells', () => {
    expect(fileMetaOf({ original: 'Friends.S01E01.1080p.BluRay.x265.MULTi.mkv' }).language).toBe('MULTi')
    expect(fileMetaOf({ original: 'Friends.S01E01.MULTi.VFF.1080p.mkv' }).language).toBe('MULTi-VFF')
    expect(fileMetaOf({ original: 'The.Office.S04E01.VOSTFR.720p.mkv' }).language).toBe('VOSTFR')
  })

  it('leaves the language out when the name does not settle one', () => {
    expect(fileMetaOf({ original: 'the_office_us_s04e01-02_VOST-FR-EN_x265_720p' }).language).toBeNull()
    expect(fileMetaOf({ original: 'The.Office.S04E03.720p.WEB.x264-GRP.mkv' }).language).toBeNull()
  })

  it('reads the original name before the one oleoo generated', () => {
    expect(fileMetaOf({ title: 'The.Office.S04E01.MULTi.720p-NOTEAM', original: 'the_office_us_s04e01_VOST-FR-EN_720p' }).language).toBeNull()
  })

  it('reads a Plex file on the name sync built from its streams', () => {
    expect(fileMetaOf({ from: 'sync', title: 'The.Office.Us.S04E01-E02.MULTi-VFF.1080p.WEB-DL.x264.EAC3-GRP', original: 'The Office (US) - S04E01-E02 - Fun Run' })).toMatchObject({ language: 'MULTi-VFF', resolution: '1080p', encoding: 'x264' })
  })
})

describe('ownedFilesOf', () => {
  const file = (id) => ({ id, title: id })
  const episodes = [
    { season_number: 1, episode_number: 1, files: [file('a')] },
    { season_number: 2, episode_number: 1, files: [file('b')] },
    { season_number: 2, episode_number: 2, files: [file('b')] },
    { season_number: 3, episode_number: 1 },
  ]

  it('takes the files of the seasons the release covers, once each', () => {
    expect(ownedFilesOf({ coverage: [{ season: 2 }], level: 'season' }, episodes).map(({ id }) => id)).toEqual(['b'])
  })

  it('falls back on every file of the show when the seasons have none', () => {
    expect(ownedFilesOf({ coverage: [{ season: 3 }], level: 'episode' }, episodes).map(({ id }) => id)).toEqual(['a', 'b'])
  })
})

describe('sizeOf', () => {
  it('weighs a file holding several episodes once', () => {
    const double = { id: 'S04E23E24', size: 700 }
    const episodes = [
      { season_number: 4, episode_number: 22, files: [{ id: 'S04E22', size: 350 }] },
      { season_number: 4, episode_number: 23, files: [double] },
      { season_number: 4, episode_number: 24, files: [double] },
      { season_number: 4, episode_number: 25 },
    ]

    expect(sizeOf(episodes)).toBe(1050)
  })
})
