import oleoo from 'oleoo'
// A converted 0.x config starts from the one a fresh install gets, outside any project
// eslint-disable-next-line @nx/enforce-module-boundaries
import defaults from './../../../../../config.default.json'

const AXES = ['source', 'encoding', 'resolution', 'language', 'dub', 'flags']

// A 0.x config.json (`thcolin/sensorr` up to 0.9) has `xznabs`, a single `policy` and its own `auth`.
// It becomes a fresh one with what still applies: `auth` lives in .env now, `blackhole` is a compose mount,
// `plex` is linked again from the onboarding, `filter` was stored but never read, and `custom` regexes have no axis.
export const migrateLegacy = (raw) => {
  if (raw?.znabs || !(raw?.xznabs || raw?.auth)) {
    return raw
  }

  // oleoo 3 renamed some values of oleoo 1 (`MULTI` is `MULTi`) and dropped others, and the schema rejects a value outside its rules
  const axes = (behavior) => Object.fromEntries(AXES.map((axis) => [
    axis,
    [].concat(raw.policy?.[behavior]?.[axis] || [])
      .map((value) => Object.keys(oleoo.rules[axis]).find((key) => key.toLowerCase() === `${value}`.toLowerCase()))
      .filter(Boolean),
  ]))

  return {
    ...defaults,
    tmdb: raw.tmdb || defaults.tmdb,
    region: raw.region || defaults.region,
    adult: !!raw.adult,
    znabs: [].concat(raw.xznabs || []).map(({ name, url, key, disabled }) => ({ name, url, key, disabled: !!disabled })),
    policies: [{
      name: 'default',
      sorting: ['seeders', 'peers', 'size'].includes(raw.sort) ? raw.sort : 'seeders',
      descending: raw.descending ?? true,
      prefer: axes('prefer'),
      avoid: axes('avoid'),
    }],
    onboarding: { done: false, legacy: true },
  }
}

const FLAT ={ 'record': 'movies', 'refresh': 'movies', 'sync': 'movies', 'refine': 'movies', 'shrink': 'movies', 'report': 'movies', 'airing': 'shows' }
const RENAMED = { 'record-shows': 'record', 'refresh-shows': 'refresh', 'sync-shows': 'sync', 'import-shows': 'import' }

export const migrateJobs = (raw) => {
  const flat = Object.keys(FLAT).filter((command) => Object.keys(raw?.jobs?.[command] || {}).some((key) => !['movies', 'shows'].includes(key)))
  const renamed = Object.keys(RENAMED).filter((key) => raw?.jobs?.[key])

  if (!flat.length && !renamed.length) {
    return raw
  }

  const jobs = { ...raw.jobs }

  for (const command of flat) {
    const { movies, shows, ...old } = jobs[command]
    const types = { ...(movies ? { movies } : {}), ...(shows ? { shows } : {}) }
    jobs[command] = { ...types, [FLAT[command]]: { ...old, ...types[FLAT[command]] } }
  }

  for (const key of renamed) {
    const command = RENAMED[key]
    jobs[command] = { ...jobs[command], shows: { ...jobs[key], ...jobs[command]?.shows } }
    delete jobs[key]
  }

  return { ...raw, jobs }
}
