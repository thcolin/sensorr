import oleoo from 'oleoo'

const LANGUAGES = {
  en: 'ENGLiSH', fa: 'PERSiAN', am: 'AMHARiC', ar: 'ARABiC', km: 'CAMBODiAN', zh: 'CHiNESE', da: 'DANiSH',
  nl: 'DUTCH', et: 'ESTONiAN', fi: 'FiNNiSH', de: 'GERMAN', el: 'GREEK', he: 'HEBREW', iw: 'HEBREW',
  hi: 'HiNDi', id: 'iNDONESiAN', ga: 'iRiSH', it: 'iTALiAN', ja: 'JAPANESE', ko: 'KOREAN', lo: 'LAOTiAN',
  lv: 'LATViAN', lt: 'LiTHUANiAN', ms: 'MALAY', mi: 'MAORi', no: 'NORWEGiAN', nb: 'NORWEGiAN', ps: 'PASHTO',
  pl: 'POLiSH', pt: 'PORTUGUESE', ro: 'ROMANiAN', ru: 'RUSSiAN', es: 'SPANiSH', sw: 'SWAHiLi', sl: 'SLOVENiAN',
  sv: 'SWEDiSH', tl: 'TAGALOG', tg: 'TAJiK', th: 'THAi', tr: 'TURKiSH', uk: 'UKRAiNiAN', vi: 'ViETNAMESE', cy: 'WELSH',
}

const RESOLUTIONS = { '4k': '2160p', '2160': '2160p', '1080': '1080p', '720': '720p' }

const ENCODINGS = { h264: 'x264', hevc: 'x265', vc1: 'VC1' }

const DUBS = { ac3: 'AC3', eac3: 'EAC3', aac: 'AAC', flac: 'FLAC', opus: 'OPUS', mp3: 'MP3', pcm: 'PCM' }

const DUB_FLAGS = { dca: ['DTS'], 'dca-ma': ['DTS-HDMA'], truehd: ['TrueHD'] }

const CHANNELS = { 1: '1.0', 2: '2.0', 6: '5.1', 8: '7.1' }

const CHANNEL_FLAGS = ['1.0', '2.0', '3.0', '5.1', '6.1', '7.1']

// ISO 639-2 codes for no language (`und`, `mul`, `zxx`) or a local one (`qaa` to `qtz`) say nothing.
const baseOf = (stream) => {
  const base = (stream.languageTag || '').split('-')[0]
  return /^(und|mul|zxx|q[a-t][a-z])$/.test(base) ? '' : base
}

const frenchOf = (stream) => (
  (stream.languageTag === 'fr-CA' || /vfq|qu[eé]b|canad/i.test(stream.title || '')) ? 'VFQ' :
  (stream.languageTag === 'fr-FR' || /vff|truefrench|vof/i.test(stream.title || '')) ? 'TRUEFRENCH' :
  'FRENCH'
)

const REFINES = { MULTi: ['MULTi-VFF', 'MULTi-VFQ', 'MULTi-VF2'], FRENCH: ['TRUEFRENCH', 'VFQ'] }

export const languageOf = (streams) => {
  const audios = streams.filter(stream => stream.streamType === 2 && baseOf(stream))
  const subtitles = streams.filter(stream => stream.streamType === 3 && baseOf(stream))
  const french = new Set(audios.filter(stream => baseOf(stream) === 'fr').map(frenchOf))
  const foreign = audios.filter(stream => baseOf(stream) !== 'fr')

  if (!audios.length) {
    return null
  }

  if (!french.size) {
    return subtitles.some(stream => baseOf(stream) === 'fr') ? 'VOSTFR' : (LANGUAGES[baseOf(foreign[0])] || null)
  }

  // A plain `fr` track next to a named one is the same French, or an audio description of it.
  const variety = (french.has('TRUEFRENCH') && french.has('VFQ')) ? 'VF2' : french.has('TRUEFRENCH') ? 'TRUEFRENCH' : french.has('VFQ') ? 'VFQ' : 'FRENCH'

  return variety === 'VF2' ? 'MULTi-VF2' :
    !foreign.length ? variety :
    ['MULTi', { TRUEFRENCH: 'VFF', VFQ: 'VFQ' }[variety]].filter(Boolean).join('-')
}

export const dubOf = (media) => {
  const channels = CHANNELS[media.audioChannels]
  const dub = DUBS[media.audioCodec]
  const withChannels = dub && channels && Object.keys(oleoo.rules.dub).includes(`${dub}-${channels}`) ? `${dub}-${channels}` : dub

  return {
    dub: withChannels || null,
    flags: DUB_FLAGS[media.audioCodec] ? [...DUB_FLAGS[media.audioCodec], ...(channels ? [channels] : [])] : [],
  }
}

// The file name keeps the last word on the language: Plex tracks are often tagged wrong,
// a French track tagged `en`, or subtitles left outside the file.
export const settleLanguage = (fromName, fromPlex) => (
  (!fromName || fromName === 'VO') ? (fromPlex || fromName) :
  (REFINES[fromName] || []).includes(fromPlex) ? fromPlex :
  fromName
)

export const releaseOf = (payload, media) => {
  const streams = media.Part[0].Stream || []
  const fallback = oleoo.parse(media.Part[0].file.split(/[\\/]/).pop(), { strict: false, flagged: true })
  const { dub, flags } = dubOf(media)

  const meta = {
    type: 'movie',
    title: (payload.title)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\sa-zA-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    year: payload.year,
    language: settleLanguage(fallback.language, languageOf(streams)),
    source: fallback.source,
    encoding: (
      ENCODINGS[media.videoCodec] ||
      (media.videoCodec === 'mpeg4' && { XVID: 'XviD', DX50: 'DivX' }[streams.find(stream => stream.streamType === 1)?.codecID]) ||
      fallback.encoding
    ),
    resolution: RESOLUTIONS[media.videoResolution] || (media.videoResolution ? 'SD' : fallback.resolution),
    // A codec oleoo only knows as a flag (DTS, TrueHD) still says the file name's dub is not the one Plex reads.
    dub: dub || (DUB_FLAGS[media.audioCodec] ? null : fallback.dub),
    flags: [...new Set([...(fallback.flags || []).filter(flag => !(media.audioChannels && CHANNEL_FLAGS.includes(flag))), ...flags])],
    group: fallback.group,
    season: null,
    episode: null,
    episodes: [],
  }

  return { title: oleoo.stringify(meta, { flagged: true }), original: fallback.original }
}
