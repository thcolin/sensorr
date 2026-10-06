// What a dump carries, in the order `restore` writes it back
export const DUMP_COLLECTIONS = ['movies', 'shows', 'episodes', 'persons'] as const

// Bumped when a dump changes shape: `restore` refuses a format it does not know
export const DUMP_FORMAT = 1

export const DUMP_KEPT = 4

// Resolved against the working directory, `/app` in Docker, where compose mounts it
export const DUMP_FOLDER = 'dumps'

// manifest.json and config.json weigh a few kB: past this, the archive is not a dump, or a zip bomb
export const DUMP_ENTRY_MAX = 1024 * 1024

export const DUMP_FILE = /^sensorr-dump-\d{4}-\d{2}-\d{2}-\d{4}\.zip$/

const pad = (value: number) => `${value}`.padStart(2, '0')

// In the local time of the instance, `TZ` in Docker: the name reads as the hour the cron was set to
export const dumpFileOf = (date: Date) => `sensorr-dump-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.zip`

// Each indexer's key goes too, see `stripConfig`
export const DUMP_SECRET_KEYS = ['tmdb', 'plex.token', 'mail.password', 'tautulli.key', 'mediux.token']

// What describes the instance and its host rather than the library: the instance that restores keeps its own
// The hosts a secret is sent to too: a dump that brought its own would hand them the secrets of this Sensorr
export const DUMP_INSTANCE_KEYS = [
  'docker', 'onboarding', 'vapidPublicKey', 'guests.public',
  'plex.url', 'plex.client_identifier', 'plex.pin', 'tautulli.url',
  'mail.url', 'mail.host', 'mail.port', 'mail.secure', 'mail.user', 'mail.from',
  'blackhole', 'shows.library', 'shows.blackhole', 'shows.staging',
]

export interface DumpManifest {
  format: number
  version: string
  date: string
  counts: { [collection: string]: number }
}

const pathOf = (key: string) => key.split('.')

const getAt = (object: any, key: string) => pathOf(key).reduce((value, part) => value?.[part], object)

const hasAt = (object: any, key: string) => {
  const parts = pathOf(key)
  const parent = parts.slice(0, -1).reduce((value, part) => value?.[part], object)
  return !!parent && typeof parent === 'object' && Object.hasOwn(parent, parts[parts.length - 1])
}

const setAt = (object: any, key: string, value: any) => {
  const parts = pathOf(key)
  const parent = parts.slice(0, -1).reduce((acc, part) => (acc[part] = (acc[part] && typeof acc[part] === 'object') ? acc[part] : {}), object)
  parent[parts[parts.length - 1]] = value
}

const deleteAt = (object: any, key: string) => {
  const parts = pathOf(key)
  const parent = parts.slice(0, -1).reduce((value, part) => value?.[part], object)

  if (parent && typeof parent === 'object') {
    delete parent[parts[parts.length - 1]]
  }
}

// An indexer link carries its key in the query, as Jackett's `jackett_apikey=`: the name stays, the value goes
const KEY = '[^=&#]*(?:api[_-]?key|passkey|pass|authkey|rsskey|key|token|secret|sig)'

export const stripUrl = (url: string) => typeof url === 'string'
  ? url
    .replace(new RegExp(`([?&#]${KEY})=[^&#]*`, 'gi'), '$1=')
    .replace(new RegExp(`((?:%3F|%26)${KEY})%3D(?:(?!%26)[^&#])*`, 'gi'), '$1%3D')
    .replace(/(\w+:\/\/)[^/@\s]+@/g, '$1')
  : url

// Every string of a document, not only the links: a release's id is the indexer's guid, often its link, and episodes
// point to it. The same strip on both sides keeps them pointing to each other. Dates and ids are left as they are.
export const stripDocument = <T>(value: T): T => {
  if (typeof value === 'string') {
    return stripUrl(value) as T
  }

  if (Array.isArray(value)) {
    return value.map(stripDocument) as T
  }

  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, stripDocument(child)])) as T
  }

  return value
}

export const stripConfig = (config: any) => {
  const stripped = structuredClone(config || {})

  for (const key of [...DUMP_SECRET_KEYS, ...DUMP_INSTANCE_KEYS]) {
    deleteAt(stripped, key)
  }

  if (Array.isArray(stripped.znabs)) {
    stripped.znabs = stripped.znabs.map(({ key, ...znab }) => znab)
  }

  return stripDocument(stripped)
}

// The config a restore writes: the dump's, with the secrets and the instance keys of the config that restores,
// and each indexer's key taken from the indexer of the same name
export const restoreConfig = (current: any, dumped: any) => {
  const restored = stripConfig(dumped)

  for (const key of [...DUMP_SECRET_KEYS, ...DUMP_INSTANCE_KEYS]) {
    if (hasAt(current, key)) {
      setAt(restored, key, structuredClone(getAt(current, key)))
    }
  }

  if (Array.isArray(restored.znabs)) {
    // Only to the same indexer at the same address: a dump that moved it would get the key with it
    restored.znabs = restored.znabs.map((znab) => {
      const local = (current?.znabs || []).find(({ name, url }) => name === znab.name && url === znab.url)
      return local ? { ...znab, key: local.key } : znab
    })
  }

  // A job runs only once this Sensorr turns it on: its keys may not be set yet
  for (const [command, job] of Object.entries<any>(restored.jobs || {})) {
    for (const [type, settings] of Object.entries<any>('paused' in (job || {}) ? { '': job } : job || {})) {
      const paused = getAt(current, ['jobs', command, type, 'paused'].filter(Boolean).join('.'))

      if (settings && typeof settings === 'object' && typeof paused === 'boolean') {
        settings.paused = paused
      }
    }
  }

  return restored
}

export const isDumpManifest = (manifest: any): manifest is DumpManifest => !!manifest
  && typeof manifest.format === 'number'
  && typeof manifest.version === 'string'
  && typeof manifest.date === 'string'
  && !!manifest.counts && typeof manifest.counts === 'object'

// Why a manifest cannot be restored, null when it can
export const dumpManifestError = (manifest: any): string | null => {
  if (!isDumpManifest(manifest)) {
    return 'Not a Sensorr dump, its manifest.json is not one'
  }

  return manifest.format === DUMP_FORMAT ? null : `Dump format ${manifest.format}, this Sensorr reads format ${DUMP_FORMAT}`
}
