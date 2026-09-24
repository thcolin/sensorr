import oleoo from 'oleoo'
import { languageOf, settleLanguage, dubOf, releaseOf } from './plex'

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

  it('does not throw on a version without streams', () => {
    expect(() => releaseOf(payload, { videoResolution: '4k', Part: [{ file: 'Movie.2020.mkv' }] })).not.toThrow()
    expect(oleoo.parse(releaseOf(payload, { videoResolution: '4k', Part: [{ file: 'Movie.2020.mkv' }] }).title, { strict: false }).resolution).toBe('2160p')
  })
})
