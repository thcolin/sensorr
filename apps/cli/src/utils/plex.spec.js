import oleoo from 'oleoo'
import { languageOf, settleLanguage, dubOf, releaseOf, filesOf, showFilesOf } from './plex'

const video = { streamType: 1, codec: 'h264', languageTag: 'en' }
const audio = (languageTag, title = null) => ({ streamType: 2, languageTag, title })
const subtitle = (languageTag) => ({ streamType: 3, languageTag })

describe('languageOf', () => {
  it('reads the French variety from the tag, else from the track title', () => {
    expect(languageOf([video, audio('fr-FR', 'VFF'), audio('fr-CA', 'VFQ'), audio('en')])).toBe('MULTi-VF2')
    expect(languageOf([video, audio('fr', 'AC3-5.1-VFQ'), audio('en', 'AC3-5.1-VO')])).toBe('MULTi-VFQ')
    expect(languageOf([video, audio('fr-FR', 'VOF'), audio('fr-FR', 'AD')])).toBe('TRUEFRENCH')
  })

  it('keeps a French track that says nothing of its variety plain', () => {
    expect(languageOf([video, audio('fr', 'Surround'), audio('en', 'Surround'), audio('fr', 'Stereo')])).toBe('MULTi')
    expect(languageOf([video, audio('fr')])).toBe('FRENCH')
  })

  it('reads a plain French track next to a named one as the same French', () => {
    expect(languageOf([video, audio('fr-FR', 'VOF'), audio('fr', 'Audio Description')])).toBe('TRUEFRENCH')
    expect(languageOf([video, audio('fr-CA'), audio('fr')])).toBe('VFQ')
    expect(languageOf([video, audio('fr-FR'), audio('fr-CA')])).toBe('MULTi-VF2')
    expect(languageOf([video, audio('fr'), audio('qaa'), audio('mul')])).toBe('FRENCH')
  })

  it('reads a foreign track with French subtitles as VOSTFR, without them as its language', () => {
    expect(languageOf([video, audio('en'), subtitle('en'), subtitle('fr')])).toBe('VOSTFR')
    expect(languageOf([video, audio('ja'), audio('en')])).toBe('JAPANESE')
  })

  it('knows nothing without a tagged audio track', () => {
    expect(languageOf([video])).toBe(null)
    expect(languageOf([video, audio(null)])).toBe(null)
    expect(languageOf([])).toBe(null)
  })
})

describe('settleLanguage', () => {
  it('lets Plex fill a name that says nothing, and name the French a name leaves plain', () => {
    expect(settleLanguage(null, 'FRENCH')).toBe('FRENCH')
    expect(settleLanguage('VO', 'VOSTFR')).toBe('VOSTFR')
    expect(settleLanguage('MULTi', 'MULTi-VFF')).toBe('MULTi-VFF')
    expect(settleLanguage('FRENCH', 'VFQ')).toBe('VFQ')
  })

  it('keeps the name when Plex contradicts it, or knows less', () => {
    expect(settleLanguage('FRENCH', 'ENGLiSH')).toBe('FRENCH')
    expect(settleLanguage('MULTi-VF2', 'VOSTFR')).toBe('MULTi-VF2')
    expect(settleLanguage('MULTi-VFF', 'MULTi')).toBe('MULTi-VFF')
    expect(settleLanguage('VOSTFR', null)).toBe('VOSTFR')
  })
})

describe('dubOf', () => {
  it('names the codec with its channels when oleoo does', () => {
    expect(dubOf({ audioCodec: 'eac3', audioChannels: 6 })).toEqual({ dub: 'EAC3-5.1', flags: [] })
    expect(dubOf({ audioCodec: 'aac', audioChannels: 2 })).toEqual({ dub: 'AAC-2.0', flags: [] })
    expect(dubOf({ audioCodec: 'mp3', audioChannels: 2 })).toEqual({ dub: 'MP3', flags: [] })
    expect(dubOf({ audioCodec: 'dca', audioChannels: 6 })).toEqual({ dub: null, flags: ['DTS', '5.1'] })
    expect(dubOf({ audioCodec: 'dca-ma', audioChannels: 8 })).toEqual({ dub: null, flags: ['DTS-HDMA', '7.1'] })
  })
})

describe('releaseOf', () => {
  const payload = { title: 'Mission 3D: Spy kids 3', year: 2003 }
  const media = (Stream) => ({ videoCodec: 'h264', videoResolution: '1080', audioCodec: 'aac', audioChannels: 2, Part: [{ file: '/movies/SPY.KIDS.3.2003.Game.Over.antonio.banderas.mkv', Stream }] })

  it('names a version from what Plex read, the file name only filling the rest', () => {
    const { title, original } = releaseOf(payload, media([video, audio('fr')]))
    const meta = oleoo.parse(title, { strict: false, flagged: true })

    expect(original).toBe('SPY.KIDS.3.2003.Game.Over.antonio.banderas')
    expect([meta.resolution, meta.language, meta.encoding, meta.dub]).toEqual(['1080p', 'FRENCH', 'x264', 'AAC-2.0'])
  })

  it('writes the audio Plex reads over the one the file name says, once', () => {
    const read = (file, audioCodec, audioChannels) => oleoo.parse(releaseOf(payload, { videoCodec: 'h264', videoResolution: '1080', audioCodec, audioChannels, Part: [{ file, Stream: [video, audio('en')] }] }).title, { strict: false, flagged: true })

    expect(read('Movie.2020.1080p.AC3.x264-GRP.mkv', 'dca-ma', 8)).toMatchObject({ dub: null, group: 'GRP' })
    expect(read('Movie.2020.1080p.AC3.x264-GRP.mkv', 'dca-ma', 8).flags).toEqual(expect.arrayContaining(['DTS-HDMA', '7.1']))
    expect(read('Movie.2020.1080p.DTS.5.1.x264-GRP.mkv', 'dca', 8).flags).not.toContain('5.1')
  })

  it('does not throw on a version without streams', () => {
    expect(() => releaseOf(payload, { videoResolution: '4k', Part: [{ file: 'Movie.2020.mkv' }] })).not.toThrow()
    expect(oleoo.parse(releaseOf(payload, { videoResolution: '4k', Part: [{ file: 'Movie.2020.mkv' }] }).title, { strict: false }).resolution).toBe('2160p')
  })
})

describe('showFilesOf', () => {
  const media = (id, file, sizes = [1000]) => ({ id, Part: sizes.map((size) => ({ file, size })) })
  const item = (parentIndex, index, Media) => ({ guid: `plex://episode/${parentIndex}-${index}`, parentIndex, index, Media })
  const episodes = [
    { id: 11, season_number: 1, episode_number: 1, files: [] },
    { id: 12, season_number: 1, episode_number: 2, files: [{ id: 'plex://episode/1-2#9', size: 1000, title: 'Old', original: 'Old' }] },
    { id: 13, season_number: 1, episode_number: 3 },
  ]

  it('names a file as oleoo reads its file name, and sums the size of its parts', () => {
    expect(filesOf(item(1, 1, [media(4, '/tvshows/Friends/Season 01/Friends.S01E01.1080p.WEB-DL.x264-GRP.mkv', [700, 300])]))).toEqual([{
      id: 'plex://episode/1-1#4',
      size: 1000,
      title: 'Friends.S01E01.1080p.WEB-DL.x264-GRP',
      original: 'Friends.S01E01.1080p.WEB-DL.x264-GRP',
    }])
  })

  it('gives each episode the files of the Plex episode with the same season and episode number', () => {
    const { episodes: synced } = showFilesOf(episodes, [
      item(1, 1, [media(4, 'Friends.S01E01.720p.HDTV.x264-A.mkv'), media(5, 'Friends.S01E01.1080p.BluRay.x264-B.mkv')]),
      item(1, 3, [media(6, 'Friends.S01E03.720p.HDTV.x264-A.mkv')]),
    ])

    expect(synced.map(({ id, files }) => [id, files.map(({ id }) => id)])).toEqual([
      [11, ['plex://episode/1-1#4', 'plex://episode/1-1#5']],
      [12, []],
      [13, ['plex://episode/1-3#6']],
    ])
  })

  it('gives a file holding several episodes to each of them, as the same entry', () => {
    const season = [4, 5, 6].map((number) => ({ id: number, season_number: 1, episode_number: number, files: [] }))
    const { episodes: named } = showFilesOf(season, [item(1, 4, [media(4, 'Friends.S01E04-E05.720p.mkv')])])
    const { episodes: listed } = showFilesOf(season, [item(1, 4, [media(4, 'Friends.S01E04.mkv')]), item(1, 5, [media(8, 'Friends.S01E04.mkv')])])

    expect(named.map(({ files }) => files.map(({ id }) => id))).toEqual([['plex://episode/1-4#4'], ['plex://episode/1-4#4'], []])
    expect(listed.map(({ files }) => files.map(({ id }) => id))).toEqual([['plex://episode/1-4#4'], ['plex://episode/1-4#4'], []])
    expect(showFilesOf(season, [item(1, 4, [media(4, 'Friends.S01E04E05.mkv')]), item(1, 5, [media(8, 'Friends.S01E04E05.mkv')])]).episodes[1].files).toHaveLength(1)
  })

  it('trusts Plex over a file name that numbers other episodes', () => {
    const { episodes: synced } = showFilesOf(episodes, [item(1, 1, [media(4, 'Friends.S01E02E03.mkv')])])

    expect(synced.map(({ files }) => files.length)).toEqual([1, 0, 0])
  })

  it('counts the Plex episodes no Sensorr episode numbers the same', () => {
    expect(showFilesOf(episodes, [item(1, 1, []), item(4, 24, [media(7, 'Friends.S04E24.mkv')])]).unmatched).toBe(1)
    expect(showFilesOf(episodes, [item(1, 3, [media(6, 'Friends.S01E03E04.mkv')])]).unmatched).toBe(0)
  })
})
