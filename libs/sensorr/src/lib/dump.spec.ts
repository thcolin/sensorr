import { dumpFileOf, DUMP_FILE, DUMP_FORMAT, dumpManifestError, isDumpManifest, restoreConfig, stripConfig, stripDocument, stripUrl } from './dump'

const config = {
  tmdb: 'tmdb-secret',
  region: 'fr-FR',
  docker: true,
  vapidPublicKey: 'vapid-public',
  onboarding: { done: true, legacy: false },
  blackhole: '/blackhole',
  shows: { library: '/tvshows', blackhole: '/tvshows/.blackhole', staging: '/tvshows/.staging', cleanup: true },
  plex: { url: 'http://plex:32400', token: 'plex-secret', client_identifier: 'uuid', pin: { code: 'ABCD', id: '1' } },
  mail: { host: 'smtp.example.com', user: 'me', password: 'mail-secret' },
  tautulli: { url: 'http://tautulli', key: 'tautulli-secret' },
  mediux: { token: 'mediux-secret' },
  znabs: [{ name: 'YGG', url: 'http://jackett/ygg', key: 'ygg-secret' }, { name: 'TPB', url: 'http://jackett/tpb', key: 'tpb-secret' }],
  policies: [{ name: 'default' }],
  jobs: { record: { movies: { cron: '0 17 * * *', paused: false } } },
}

describe('stripUrl', () => {
  it('empties the key of a Jackett link and keeps the rest as is', () => {
    expect(stripUrl('http://jackett:9117/dl/c411/?jackett_apikey=abc123&path=Zm9v&file=Movie.2024'))
      .toBe('http://jackett:9117/dl/c411/?jackett_apikey=&path=Zm9v&file=Movie.2024')
  })

  it('empties apikey, api_key, passkey and token wherever they sit in the query', () => {
    expect(stripUrl('http://prowlarr/1/download?apikey=a&link=b')).toBe('http://prowlarr/1/download?apikey=&link=b')
    expect(stripUrl('http://x/dl?id=1&api_key=a')).toBe('http://x/dl?id=1&api_key=')
    expect(stripUrl('http://x/dl?id=1&passkey=a#top')).toBe('http://x/dl?id=1&passkey=#top')
    expect(stripUrl('http://x/dl?TOKEN=a')).toBe('http://x/dl?TOKEN=')
  })

  it('leaves a link without key, a magnet and a missing link alone', () => {
    expect(stripUrl('https://yts.mx/torrent/download/ABC')).toBe('https://yts.mx/torrent/download/ABC')
    expect(stripUrl('magnet:?xt=urn:btih:abc&dn=Movie')).toBe('magnet:?xt=urn:btih:abc&dn=Movie')
    expect(stripUrl(undefined)).toBeUndefined()
  })
})

describe('stripDocument', () => {
  it('strips the link and the enclosure of every release', () => {
    expect(stripDocument({ _id: 1, title: 'Movie', releases: [{ id: 'r', link: 'http://x/?apikey=a', enclosure: 'http://x/dl?jackett_apikey=a&path=p' }] })).toEqual({
      _id: 1,
      title: 'Movie',
      releases: [{ id: 'r', link: 'http://x/?apikey=', enclosure: 'http://x/dl?jackett_apikey=&path=p' }],
    })
  })

  it('strips a release id that is a guid with a key, and the episode that points to it the same way', () => {
    const guid = 'http://jackett:9117/dl/c411/?jackett_apikey=a&path=p'
    const show = stripDocument({ _id: 1, releases: [{ id: guid, coverage: [{ season: 1 }] }] })
    const episode = stripDocument({ _id: 2, show_id: 1, release: guid })
    expect(show.releases[0].id).toBe('http://jackett:9117/dl/c411/?jackett_apikey=&path=p')
    expect(episode.release).toBe(show.releases[0].id)
  })

  it('leaves dates, numbers and empty values as they are', () => {
    const date = new Date('2026-10-05T04:00:00Z')
    const doc = stripDocument({ _id: 2, show_id: 1, air_date: date, release: null, files: [] })
    expect(doc).toEqual({ _id: 2, show_id: 1, air_date: date, release: null, files: [] })
    expect(doc.air_date).toBe(date)
  })
})

describe('stripConfig', () => {
  const stripped = stripConfig(config)
  const json = JSON.stringify(stripped)

  it('leaves no secret value', () => {
    for (const secret of ['tmdb-secret', 'plex-secret', 'mail-secret', 'tautulli-secret', 'mediux-secret', 'ygg-secret', 'tpb-secret']) {
      expect(json).not.toContain(secret)
    }
  })

  it('leaves out what belongs to the instance', () => {
    expect(stripped.docker).toBeUndefined()
    expect(stripped.onboarding).toBeUndefined()
    expect(stripped.vapidPublicKey).toBeUndefined()
    expect(stripped.blackhole).toBeUndefined()
    expect(stripped.plex).toEqual({ url: 'http://plex:32400' })
    expect(stripped.shows).toEqual({ cleanup: true })
  })

  it('keeps the rest, indexers without their key', () => {
    expect(stripped.region).toBe('fr-FR')
    expect(stripped.mail).toEqual({ host: 'smtp.example.com', user: 'me' })
    expect(stripped.znabs).toEqual([{ name: 'YGG', url: 'http://jackett/ygg' }, { name: 'TPB', url: 'http://jackett/tpb' }])
    expect(stripped.policies).toEqual(config.policies)
    expect(stripped.jobs).toEqual(config.jobs)
  })

  it('does not touch the config it reads', () => {
    expect(config.tmdb).toBe('tmdb-secret')
    expect(config.znabs[0].key).toBe('ygg-secret')
  })
})

describe('restoreConfig', () => {
  const current = {
    tmdb: 'new-tmdb',
    docker: false,
    blackhole: '/new/blackhole',
    plex: { token: 'new-plex', client_identifier: 'new-uuid' },
    znabs: [{ name: 'YGG', url: 'http://old', key: 'new-ygg' }],
    region: 'en-US',
    policies: [],
  }
  const restored = restoreConfig(current, stripConfig(config))

  it('takes what the dump carries', () => {
    expect(restored.region).toBe('fr-FR')
    expect(restored.policies).toEqual(config.policies)
    expect(restored.plex.url).toBe('http://plex:32400')
  })

  it('keeps the secrets and the instance keys of the config that restores', () => {
    expect(restored.tmdb).toBe('new-tmdb')
    expect(restored.docker).toBe(false)
    expect(restored.blackhole).toBe('/new/blackhole')
    expect(restored.plex.token).toBe('new-plex')
    expect(restored.plex.client_identifier).toBe('new-uuid')
  })

  it('keeps whether each job is paused on the config that restores, and the rest of the jobs of the dump', () => {
    const jobs = restoreConfig(
      { jobs: { record: { movies: { cron: '0 1 * * *', paused: true } }, mail: { cron: '0 9 * * 1', paused: true } } },
      { jobs: { record: { movies: { cron: '0 17 * * *', paused: false, proposalOnly: true } }, mail: { cron: '0 8 * * 1', paused: false }, dump: { cron: '0 4 * * 0', paused: false } } },
    ).jobs
    expect(jobs.record.movies).toEqual({ cron: '0 17 * * *', paused: true, proposalOnly: true })
    expect(jobs.mail).toEqual({ cron: '0 8 * * 1', paused: true })
    expect(jobs.dump).toEqual({ cron: '0 4 * * 0', paused: false })
  })

  it('gives each indexer the key of the indexer of the same name, and none to an unknown one', () => {
    expect(restored.znabs).toEqual([{ name: 'YGG', url: 'http://jackett/ygg', key: 'new-ygg' }, { name: 'TPB', url: 'http://jackett/tpb' }])
  })

  it('never brings a secret of the dump back, even when the dump still has one', () => {
    expect(restoreConfig({}, config).tmdb).toBeUndefined()
    expect(restoreConfig({}, config).znabs[0].key).toBeUndefined()
  })
})

describe('dumpFileOf', () => {
  it('names a dump after its local minute, in a name DUMP_FILE recognizes', () => {
    const name = dumpFileOf(new Date(2026, 9, 5, 4, 0, 12))
    expect(name).toBe('sensorr-dump-2026-10-05-0400.zip')
    expect(DUMP_FILE.test(name)).toBe(true)
    expect(DUMP_FILE.test('../sensorr-dump-2026-10-05-0400.zip')).toBe(false)
  })
})

describe('isDumpManifest', () => {
  it('accepts a manifest and refuses anything else', () => {
    expect(isDumpManifest({ format: 1, version: '1.0.0', date: '2026-10-05T04:00:00.000Z', counts: { movies: 1 } })).toBe(true)
    expect(isDumpManifest({ format: '1', version: '1.0.0', date: 'x', counts: {} })).toBe(false)
    expect(isDumpManifest(null)).toBe(false)
  })
})

describe('dumpManifestError', () => {
  it('says nothing about a manifest of this format, and why otherwise', () => {
    expect(dumpManifestError({ format: DUMP_FORMAT, version: '1.0.0', date: 'x', counts: {} })).toBeNull()
    expect(dumpManifestError({ format: DUMP_FORMAT + 1, version: '2.0.0', date: 'x', counts: {} })).toBe(`Dump format ${DUMP_FORMAT + 1}, this Sensorr reads format ${DUMP_FORMAT}`)
    expect(dumpManifestError({ movies: 1 })).toBe('Not a Sensorr dump, its manifest.json is not one')
  })
})
