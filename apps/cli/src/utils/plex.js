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

const DUB_FLAGS = { dca: ['DTS'], 'dca-ma': ['DTS', 'HDMA'], truehd: ['TRUEHD'] }

const CHANNELS = { 1: '1.0', 2: '2.0', 6: '5.1', 8: '7.1' }

const CHANNEL_FLAGS = ['1.0', '2.0', '3.0', '5.1', '6.1', '7.1']

const baseOf = (stream) => (stream.languageTag || '').split('-')[0]

const frenchOf = (stream) => (
  (stream.languageTag === 'fr-CA' || /vfq|qu[eé]b|canad/i.test(stream.title || '')) ? 'VFQ' :
  (stream.languageTag === 'fr-FR' || /vff|truefrench|vof/i.test(stream.title || '')) ? 'TRUEFRENCH' :
  'FRENCH'
)

const REFINES = { MULTi: ['MULTi-VFF', 'MULTi-VFQ', 'MULTi-VF2'], FRENCH: ['TRUEFRENCH', 'VFQ'] }

export const languageOf = (streams) => {
  const audios = streams.filter(stream => stream.streamType === 2 && baseOf(stream))
  const subtitles = streams.filter(stream => stream.streamType === 3 && baseOf(stream))
  const languages = [...new Set(audios.map(stream => baseOf(stream) === 'fr' ? frenchOf(stream) : (LANGUAGES[baseOf(stream)] || baseOf(stream))))]
  const french = languages.filter(language => ['FRENCH', 'TRUEFRENCH', 'VFQ'].includes(language))

  if (!audios.length) {
    return null
  }

  if (!french.length) {
    return subtitles.some(stream => baseOf(stream) === 'fr') ? 'VOSTFR' : (LANGUAGES[baseOf(audios[0])] || null)
  }

  return languages.length === 1 ? languages[0] : [
    'MULTi',
    ...(
      (french.includes('TRUEFRENCH') && (french.includes('FRENCH') || french.includes('VFQ'))) ? ['VF2'] :
      french.includes('TRUEFRENCH') ? ['VFF'] :
      french.includes('VFQ') ? ['VFQ'] : []
    ),
  ].join('-')
}

export const dubOf = (media) => {
  const channels = CHANNELS[media.audioChannels]
  const dub = DUBS[media.audioCodec]
  const named = dub && channels && Object.keys(oleoo.rules.dub).includes(`${dub}-${channels}`) ? `${dub}-${channels}` : dub

  return {
    dub: named || null,
    flags: DUB_FLAGS[media.audioCodec] ? [...DUB_FLAGS[media.audioCodec], ...(channels ? [channels] : [])] : [],
  }
}

// The file name keeps the last word on the language: Plex tracks are often tagged wrong,
// a French track tagged `en`, or subtitles left outside the file.
export const settleLanguage = (named, read) => (
  (!named || named === 'VO') ? (read || named) :
  (REFINES[named] || []).includes(read) ? read :
  named
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
      .replace(/[̀-ͯ]/g, '')
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
    dub: dub || fallback.dub,
    // A file name's `5.1` would read twice next to a dub that already carries its channels.
    flags: [...new Set([...(fallback.flags || []).filter(flag => !(/-\d\.\d$/.test(dub || '') && CHANNEL_FLAGS.includes(flag))), ...flags])],
    group: fallback.group,
    season: null,
    episode: null,
    episodes: [],
  }

  return { title: oleoo.stringify(meta, { flagged: true }), original: fallback.original }
}
