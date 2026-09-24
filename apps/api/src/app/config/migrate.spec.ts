import { migrateJobs } from './migrate'

// The shape of a config.json written before jobs took a type, values of a running installation
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
