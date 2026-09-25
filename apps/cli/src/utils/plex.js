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

// Past this share of what Sensorr holds from Plex lost in one run, Plex was more likely read in part than emptied:
// `sync` and `sync shows` log the losses and write none of them
export const LOSS_CEILING = 0.25

export const isMassLoss = (lost, held) => held > 0 && lost / held > LOSS_CEILING

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

const nameOf = (media) => media.Part[0].file.split(/[\\/]/).pop()

// A file holding several episodes is listed under each of them, or under the first one only: its name then numbers
// the others, as long as it agrees with Plex.
const numbersOf = (item, parsed) => parsed.season === item.parentIndex && parsed.episodes.includes(item.index) ? parsed.episodes : [item.index]

export const releaseOf = (payload, media) => {
  const streams = media.Part[0].Stream || []
  const fallback = oleoo.parse(nameOf(media), { strict: false, flagged: true })
  const { dub, flags } = dubOf(media)
  const episode = payload.type === 'episode'

  const meta = {
    type: episode ? 'tvshow' : 'movie',
    title: (episode ? payload.grandparentTitle : payload.title)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\sa-zA-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    year: episode ? null : payload.year,
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
    season: episode ? payload.parentIndex : null,
    episode: null,
    episodes: episode ? numbersOf(payload, fallback) : [],
  }

  return { title: oleoo.stringify(meta, { flagged: true }), original: fallback.original }
}

const idOf = (item, media) => `${item.guid}#${media.id}`

const fileOf = (item, media, read) => {
  const { title, original } = read.get(idOf(item, media)) || releaseOf(item, media)
  return { id: idOf(item, media), size: media.Part.reduce((acc, curr) => acc + curr.size, 0), title, original, from: 'sync' }
}

const readOf = (episodes) => new Map(episodes.flatMap(({ files }) => files || []).filter(({ from }) => from === 'sync').map((file) => [file.id, file]))

// A file listed under several episodes is named by the first one only
export const unreadItemsOf = (episodes, items) => {
  const read = readOf(episodes), seen = new Set()

  return items.filter((item) => (item.Media || []).filter((media) => {
    const first = !seen.has(media.Part[0].file)
    seen.add(media.Part[0].file)
    return first && !read.has(idOf(item, media))
  }).length)
}

// The versions of each episode, numbered as `showFilesOf` numbers them, with the item a deletion goes through
export const episodeVersionsOf = (items) => {
  const versions = {}, entries = {}

  for (const item of items) {
    for (const media of item.Media || []) {
      const file = media.Part[0].file
      const entry = entries[file] = entries[file] || { id: idOf(item, media), file, name: nameOf(media), size: media.Part.reduce((acc, curr) => acc + curr.size, 0), ratingKey: item.ratingKey, media: media.id }

      for (const number of numbersOf(item, oleoo.parse(nameOf(media), { strict: false, flagged: true }))) {
        const key = `${item.parentIndex}:${number}`
        versions[key] = (versions[key] || []).includes(entry) ? versions[key] : [...(versions[key] || []), entry]
      }
    }
  }

  return versions
}

// Plex numbers an episode by its season `parentIndex` and its own `index`.
// A file already read keeps the name built from its streams.
export const showFilesOf = (episodes, items) => {
  const keyOf = (season, episode) => `${season}:${episode}`
  const read = readOf(episodes)
  const files = {}, entries = {}, listed = new Set()

  for (const item of items) {
    listed.add(keyOf(item.parentIndex, item.index))

    for (const media of item.Media || []) {
      const entry = entries[media.Part[0].file] = entries[media.Part[0].file] || fileOf(item, media, read)
      const numbers = numbersOf(item, oleoo.parse(nameOf(media), { strict: false, flagged: true }))

      for (const key of numbers.map((number) => keyOf(item.parentIndex, number))) {
        files[key] = (files[key] || []).includes(entry) ? files[key] : [...(files[key] || []), entry]
      }
    }
  }

  const numbers = new Set(episodes.map(({ season_number, episode_number }) => keyOf(season_number, episode_number)))

  return {
    episodes: episodes.map((episode) => ({ ...episode, files: files[keyOf(episode.season_number, episode.episode_number)] || [] })),
    unmatched: [...listed].filter((key) => !numbers.has(key)).length,
  }
}

// A watchlist lists no date: when a guest added an item is in its `userState`, one item a call.
// The earliest guest makes the request date; without every guest's answer there is none yet.
export const requestedAtOf = async (clients, plex_guid, guests) => {
  const dates = []

  for (const guest of guests) {
    try {
      const { MediaContainer: { UserState } } = await clients[guest].query(`/library/metadata/${plex_guid.split('/').pop()}/userState`)
      UserState?.watchlistedAt && dates.push(UserState.watchlistedAt * 1000)
    } catch (error) {
      return null
    }
  }

  return dates.length ? Math.min(...dates) : null
}
