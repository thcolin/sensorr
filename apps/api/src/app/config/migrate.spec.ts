// eslint-disable-next-line @nx/enforce-module-boundaries
import defaults from './../../../../../config.default.json'
import { migrateJobs, migrateLegacy } from './migrate'

const old = () => ({
  tmdb: 'key',
  region: 'fr-FR',
  blackhole: '/blackhole',
  shows: { library: '/tvshows', blackhole: '/tvshows/.blackhole', staging: '/tvshows/.staging' },
  jobs: {
    'keep-in-touch': { cron: '0 16 * * *', paused: false },
    record: { cron: '0 17 * * *', paused: false, proposalOnly: true },
    sync: { cron: '0 1 * * *', paused: false, cleanup: true },
    refresh: { cron: '0 3 * * 0', paused: false },
    refine: { cron: '0 23 1 * *', paused: false, proposalOnly: true },
    shrink: { cron: '0 5 * * 0', paused: true, proposalOnly: true, threshold: 4 },
    report: { cron: '0 * * * *', paused: false, proposalOnly: true, since: 1758700000000 },
    'refresh-shows': { cron: '0 4 * * *', paused: true },
    'sync-shows': { cron: '0 2 * * *', paused: true },
    'import-shows': { cron: '*/10 * * * *', paused: false },
    'record-shows': { cron: '0 18 * * *', paused: true, proposalOnly: false },
    airing: { cron: '0 * * * *', paused: true, proposalOnly: true },
  },
  plex: { url: 'http://plex:32400', token: 'token', client_identifier: 'uuid' },
  znabs: [{ name: 'ABN', url: 'http://jackett/api', key: 'key', disabled: false }],
  policies: [{ name: 'default', sorting: 'seeders', descending: true }],
})

describe('migrateJobs', () => {
  it('moves every old job key under its command and type, values kept', () => {
    expect(migrateJobs(old())).toEqual({
      ...old(),
      jobs: {
        'keep-in-touch': { cron: '0 16 * * *', paused: false },
        record: {
          movies: { cron: '0 17 * * *', paused: false, proposalOnly: true },
          shows: { cron: '0 18 * * *', paused: true, proposalOnly: false },
        },
        sync: {
          movies: { cron: '0 1 * * *', paused: false, cleanup: true },
          shows: { cron: '0 2 * * *', paused: true },
        },
        refresh: {
          movies: { cron: '0 3 * * 0', paused: false },
          shows: { cron: '0 4 * * *', paused: true },
        },
        refine: { movies: { cron: '0 23 1 * *', paused: false, proposalOnly: true } },
        shrink: { movies: { cron: '0 5 * * 0', paused: true, proposalOnly: true, threshold: 4 } },
        report: { movies: { cron: '0 * * * *', paused: false, proposalOnly: true, since: 1758700000000 } },
        import: { shows: { cron: '*/10 * * * *', paused: false } },
        airing: { shows: { cron: '0 * * * *', paused: true, proposalOnly: true } },
      },
    })
  })

  it('gives a config already moved back untouched', () => {
    const migrated = migrateJobs(old())
    expect(migrateJobs(migrated)).toBe(migrated)
  })

  it('keeps the keys it does not know, an old job key included', () => {
    const raw = { ...old(), unknown: { kept: true }, jobs: { ...old().jobs, record: { ...old().jobs.record, legacy: 1 }, custom: { cron: '0 0 * * *' } } }
    const migrated = migrateJobs(raw)

    expect(migrated.unknown).toEqual({ kept: true })
    expect(migrated.jobs.custom).toEqual({ cron: '0 0 * * *' })
    expect(migrated.jobs.record.movies.legacy).toBe(1)
  })

  it('leaves a config without jobs alone', () => {
    const raw = { tmdb: 'key' }
    expect(migrateJobs(raw)).toBe(raw)
  })
})

// The shape `server/store/config.js` of 0.9 wrote
const legacy = () => ({
  disabled: false,
  tmdb: 'key',
  blackhole: '/app/sensorr/blackhole',
  xznabs: [
    { name: 'ABN', url: 'http://jackett/api/v2.0/indexers/abn/results/torznab/', key: 'key', disabled: false },
    { name: 'YGG', url: 'http://jackett/api/v2.0/indexers/ygg/results/torznab/', key: 'key', disabled: true },
  ],
  filter: 'resolution=720p|1080p',
  policy: {
    prefer: { resolution: ['1080p', '720p'], language: ['MULTI', 'FRENCH'], custom: ['^FR'], flags: ['REMUX', 'GONE'] },
    avoid: { source: ['CAM', 'TS'], encoding: [] },
  },
  sort: 'size',
  descending: false,
  region: 'fr-FR',
  adult: false,
  auth: { username: 'sensorr', password: 'secret' },
  plex: { url: 'http://plex:32400', pin: { code: 'ABCD', id: '1' }, token: 'token' },
  logs: { limit: 10 },
})

describe('migrateLegacy', () => {
  it('starts from config.default.json and keeps what still applies', () => {
    const migrated = migrateLegacy(legacy())

    expect(migrated).toEqual({
      ...defaults,
      tmdb: 'key',
      region: 'fr-FR',
      adult: false,
      znabs: [
        { name: 'ABN', url: 'http://jackett/api/v2.0/indexers/abn/results/torznab/', key: 'key', disabled: false },
        { name: 'YGG', url: 'http://jackett/api/v2.0/indexers/ygg/results/torznab/', key: 'key', disabled: true },
      ],
      policies: [{
        name: 'default',
        sorting: 'size',
        descending: false,
        prefer: { source: [], encoding: [], resolution: ['1080p', '720p'], language: ['MULTi', 'FRENCH'], dub: [], flags: ['REMUX'] },
        avoid: { source: ['CAM'], encoding: [], resolution: [], language: [], dub: [], flags: [] },
      }],
      onboarding: { done: false, legacy: true },
    })
  })

  it('drops the keys the API no longer reads', () => {
    const migrated = migrateLegacy(legacy())

    for (const key of ['xznabs', 'policy', 'auth', 'filter', 'sort', 'descending', 'logs', 'disabled']) {
      expect(migrated).not.toHaveProperty(key)
    }
    expect(migrated.blackhole).toBe(defaults.blackhole)
    expect(migrated.plex).toEqual({})
  })

  it('keeps the placeholder key of config.default.json when the 0.x had none', () => {
    expect(migrateLegacy({ ...legacy(), tmdb: '' }).tmdb).toBe(defaults.tmdb)
  })

  it('leaves a 1.x config alone', () => {
    const raw = { ...old(), auth: { username: 'stray' } }
    expect(migrateLegacy(raw)).toBe(raw)
    expect(migrateLegacy(defaults)).toBe(defaults)
  })
})
