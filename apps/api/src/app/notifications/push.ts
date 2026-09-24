import { coverageLabel, levelOf } from '@sensorr/sensorr'
// import { filesize } from '@sensorr/utils'

const units = ['B', 'KB', 'MB', 'GB', 'TB']
const filesize = {
  stringify: (bytes, unit = true) => {
    const exponent = bytes == 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, exponent)).toFixed(2) as any * 1} ${unit ? units[exponent] : ''}`
  },
}

const moviePushOf = (meta) => ({
  title: `${meta?.movie?.title}${meta?.movie?.release_date ? ` (${(new Date(meta?.movie?.release_date)).getFullYear()})` : ''}`,
  body: {
    'record': `📹 ${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers\n${meta?.release?.title}`,
    'refine': `✨ ${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers\n${meta?.release?.title}`,
    'shrink': `✂️ ${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers\n${meta?.release?.title}`,
    'report': `🚩 ${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers\n${meta?.release?.title}`,
    'sync': `💊 Missing from your Plex Server`,
    'keep-in-touch': `🍺 Requested by ${(meta?.requested_by || []).join(', ')}`,
  }[meta?.command],
  image: `https://image.tmdb.org/t/p/w185${meta?.movie?.poster_path}`,
  actions: {
    'record': [
      { action: 'accept', title: 'Accept' },
      { action: 'refuse', title: 'Refuse' },
    ],
    'refine': [
      { action: 'accept', title: 'Accept' },
      { action: 'refuse', title: 'Refuse' },
    ],
    'shrink': [
      { action: 'accept', title: 'Accept' },
      { action: 'refuse', title: 'Refuse' },
    ],
    'report': [
      { action: 'accept', title: 'Accept' },
      { action: 'refuse', title: 'Refuse' },
    ],
    'sync': [
      { action: 'wish-it-back', title: '"Wish" it back' },
      { action: 'ignore', title: 'Ignore' },
    ],
    'keep-in-touch': [
      { action: 'wish-it', title: '"Wish" it' },
      { action: 'ignore', title: 'Ignore' },
    ],
  }[meta?.command],
})

// A show release names what it covers, and only a proposal has something to answer
const showPushOf = (meta) => ({
  title: [
    meta?.show?.name,
    meta?.release?.coverage?.length ? coverageLabel(meta.release.coverage, levelOf(meta.release.meta, meta.release.category) || undefined) : '',
  ].filter(Boolean).join(' '),
  body: {
    'record': `📹 ${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers\n${meta?.release?.title}`,
    'airing': `📡 ${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers\n${meta?.release?.title}`,
    'keep-in-touch': `🍺 Requested by ${(meta?.requested_by || []).join(', ')}`,
  }[meta?.command],
  image: `https://image.tmdb.org/t/p/w185${meta?.show?.poster_path}`,
  actions: {
    'record': meta?.release?.proposal ? [
      { action: 'accept', title: 'Accept' },
      { action: 'refuse', title: 'Refuse' },
    ] : [],
    'airing': meta?.release?.proposal ? [
      { action: 'accept', title: 'Accept' },
      { action: 'refuse', title: 'Refuse' },
    ] : [],
    'keep-in-touch': [
      { action: 'wish-it', title: '"Wish" it' },
      { action: 'ignore', title: 'Ignore' },
    ],
  }[meta?.command],
})

export const pushOf = (meta) => meta?.type === 'show' ? showPushOf(meta) : moviePushOf(meta)
