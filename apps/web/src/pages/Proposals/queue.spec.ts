import { arrange, balanceOf, decide, groupOf, itemOf } from './queue'

const GB = 1024 ** 3

const policy = {
  require: {},
  avoid: {},
  prefer: { language: ['MULTi-VF2', 'MULTi-VFF', 'MULTi', 'VOSTFR'] },
}

const release = (id, language, size, extra = {}) => ({
  id,
  title: `Movie.2020.${language}.1080p.BluRay.x264-${id}`,
  original: `Movie.2020.${language}.1080p.BluRay.x264-${id}`,
  size,
  meta: { language, resolution: '1080p', source: 'BLURAY', encoding: 'x264' },
  ...extra,
})

const movie = (id, owned, proposed) => itemOf({ id }, [...owned, { ...proposed, proposal: true, from: proposed.from || 'refine' }], policy)

describe('queue', () => {
  it('puts a same-language proposal that frees less than the threshold in the last group', () => {
    const item = movie(1, [release('a', 'MULTi', 8 * GB)], release('b', 'MULTi', 7.7 * GB))

    expect(groupOf(item, 0.5 * GB)).toBe('rest')
    expect(groupOf(item, 0.25 * GB)).toBe('refine')
  })

  it('keeps a same-language proposal that grows in its job group', () => {
    const item = movie(1, [release('a', 'MULTi', 8 * GB)], release('b', 'MULTi', 8.1 * GB))

    expect(groupOf(item, 0.5 * GB)).toBe('refine')
  })

  it('lists the axes the policy holds first and the unchanged ones last', () => {
    const strict = { ...policy, require: { encoding: ['x265'] }, avoid: { source: ['WEB-DL'] } }
    const owned = release('a', 'VOSTFR', 8 * GB)
    const proposed = release('b', 'MULTi', 8 * GB, { meta: { language: 'MULTi', resolution: '1080p', source: 'WEB-DL', encoding: 'x265' } })
    const item = itemOf({ id: 1 }, [owned, { ...proposed, proposal: true, from: 'refine' }], strict)

    expect(item.diff.rows.map(({ axis, state }) => `${axis}:${state}`)).toEqual([
      'encoding:held',
      'source:broken',
      'language:moved',
      'resolution:same',
      'dub:same',
    ])
  })

  it('keeps a same-language proposal that reaches a required value in its job group', () => {
    const strict = { ...policy, require: { resolution: ['1080p'] } }
    const owned = release('a', 'MULTi', 2 * GB, { meta: { language: 'MULTi', resolution: '720p', source: 'BLURAY', encoding: 'x264' } })
    const proposed = release('b', 'MULTi', 2 * GB)
    const item = itemOf({ id: 1 }, [owned, { ...proposed, proposal: true, from: 'refine' }], strict)

    expect(groupOf(item, 0.1 * GB)).toBe('refine')
  })

  it('keeps a language change in its job group whatever the size', () => {
    const item = movie(1, [release('a', 'VOSTFR', 8 * GB)], release('b', 'MULTi-VF2', 8 * GB))

    expect(groupOf(item, 0.5 * GB)).toBe('refine')
  })

  it('orders a group by the date the job last processed the movie, newest first', () => {
    const older = { ...movie(1, [release('a', 'VOSTFR', 8 * GB)], release('b', 'MULTi-VF2', 6 * GB)), entity: { id: 1, refined_at: '2026-09-01' } }
    const newer = { ...movie(2, [release('c', 'VOSTFR', 8 * GB)], release('d', 'MULTi', 9 * GB)), entity: { id: 2, refined_at: '2026-09-20' } }

    const [refine] = arrange([older, newer], { threshold: 0.5 * GB })

    expect(refine.items.map(({ id }) => id)).toEqual([2, 1])
  })

  it('sends a skipped proposal to the end of its group', () => {
    const first = movie(1, [release('a', 'VOSTFR', 8 * GB)], release('b', 'MULTi-VF2', 6 * GB))
    const second = movie(2, [release('c', 'VOSTFR', 8 * GB)], release('d', 'MULTi', 6 * GB))

    const [refine] = arrange([first, second], { threshold: 0.5 * GB, skipped: { 1: 1 } })

    expect(refine.items.map(({ id }) => id)).toEqual([2, 1])
  })

  it('bans by refusing the release and listing its title in banned_releases', () => {
    const metadata = { banned_releases: ['Other'], releases: [release('a', 'VOSTFR', GB), { ...release('b', 'MULTi', GB), proposal: true }] }
    const changes = decide(metadata, 'b', 'ban')

    expect(changes.releases.find(({ id }) => id === 'b')).toMatchObject({ proposal: true, choice: false })
    expect(changes.releases.find(({ id }) => id === 'a')).not.toHaveProperty('choice')
    expect(changes.banned_releases).toEqual(['Other', metadata.releases[1].title])
    expect(changes).not.toHaveProperty('state')
  })

  it('refuses without banning and accepts by archiving', () => {
    const metadata = { releases: [{ ...release('b', 'MULTi', GB), proposal: true }] }

    expect(decide(metadata, 'b', 'refuse')).not.toHaveProperty('banned_releases')
    expect(decide(metadata, 'b', 'accept')).toMatchObject({ state: 'archived', releases: [{ id: 'b', choice: true }] })
  })
  it('weighs the disk from the Plex files only, per command', () => {
    const plex = (id, language, size) => release(id, language, size, { from: 'sync' })
    const upgrade = movie(1, [plex('a', 'MULTi', 4 * GB), release('b', 'VOSTFR', GB, { from: 'record' })], release('c', 'MULTi-VFF', 7 * GB))
    const lighter = movie(2, [plex('d', 'MULTi', 10 * GB)], release('e', 'MULTi', 6 * GB, { from: 'shrink' }))
    const unknown = movie(3, [release('f', 'VOSTFR', 2 * GB, { from: 'record' })], release('g', 'MULTi', 3 * GB))

    expect(balanceOf([upgrade, lighter, unknown])).toEqual({ now: 14 * GB, after: 13 * GB, refine: 3 * GB, shrink: -4 * GB })
  })
})
