import oleoo from 'oleoo'
import { AVOIDED_TITLE, sampleReleasesOf, sandboxOf, summaryOf } from './sandbox'

const MULTI = {
  name: 'MULTi-VF2',
  sorting: 'size',
  descending: false,
  require: { resolution: ['1080p'], language: ['MULTi-VF2', 'MULTi-VFF'] },
  prefer: {
    resolution: ['1080p', '720p'],
    language: [['MULTi-VF2', 'MULTi-VFF'], ['MULTi-VFQ', 'MULTi'], ['VOSTFR', 'TRUEFRENCH', 'FRENCH'], 'VFQ', 'VO'],
  },
  avoid: {
    znab: ['indexer-2'],
    source: ['CAM', 'TC', 'SCREENER', 'R5', 'R6', 'DVDRip', 'DVD-R', 'DVDSCr'],
    encoding: ['DivX', 'XviD'],
    resolution: ['2160p', 'SD'],
    dub: ['MD', 'LD'],
    flags: ['3D', 'FASTSUB'],
  },
}

const byGroup = (releases, group) => releases.find(release => release.meta.group === group)

describe('sampleReleasesOf', () => {
  it('covers every source, encoding and resolution oleoo knows', () => {
    const releases = sampleReleasesOf()

    for (const axis of ['source', 'encoding', 'resolution']) {
      expect(Object.keys(oleoo.rules[axis]).filter(value => !releases.some(release => release.meta[axis] === value))).toEqual([])
    }
  })

  it('takes every release from an indexer the policy does not avoid, plus one from each avoided indexer', () => {
    const releases = sampleReleasesOf(['indexer-1', 'indexer-2', 'indexer-3'], ['indexer-1', 'indexer-3'])

    expect(new Set(releases.filter(release => release.title !== AVOIDED_TITLE).map(release => release.znab))).toEqual(new Set(['indexer-2']))
    expect(releases.filter(release => release.title === AVOIDED_TITLE).map(release => release.znab)).toEqual(['indexer-1', 'indexer-3'])
    expect(sampleReleasesOf()[0].znab).toBeUndefined()
  })
})

describe('sandboxOf', () => {
  const releases = sandboxOf(MULTI, ['indexer-1', 'indexer-2'])

  it('ranks the preferred language and resolution first, the smallest first on a tie', () => {
    expect(releases[0].meta.group).toBe('THICKET')
    expect(releases[0].valid).toBe(true)
  })

  it('withdraws what the policy avoids, with its reason, after every valid release', () => {
    expect(byGroup(releases, 'NETTLE')).toMatchObject({ valid: false, reason: '🚨 Withdrawn by policy (source=CAM)' })
    expect(releases.find(release => release.znab === 'indexer-2')).toMatchObject({ valid: false, reason: '🚨 Withdrawn by policy (znab=indexer-2)' })
    expect(releases.findIndex(release => !release.valid)).toBeGreaterThan(releases.findLastIndex(release => release.valid))
  })

  it('rejects what a movie search rejects whatever the policy', () => {
    expect(byGroup(releases, 'HOLLOW').reason).toBe('🌍 No seeders')
    for (const group of ['WARREN', 'DELL', 'COPSE', 'GLADE']) {
      expect(byGroup(releases, group).valid).toBe(false)
    }
  })

  it('marks as end-goal only the valid releases that meet the require', () => {
    expect(releases.filter(release => release.goal).map(release => release.meta.group)).toEqual(['THICKET', 'PEACH', 'ORCHARD'])
  })

  it('keeps a release flagged MD when the policy avoids MD as a dub', () => {
    expect(byGroup(releases, 'THICKET').meta.flags).toContain('MD')
  })
})

describe('summaryOf', () => {
  it('counts each kind of release and names the pick, with the tie-breaker of the policy', () => {
    expect(summaryOf(sandboxOf(MULTI, ['indexer-1', 'indexer-2']), MULTI)).toBe('25 ⭐ · 15 🚨 · 5 🗑️ · picks Big.Buck.Bunny.2008.MULTi-VF2.MD.1080p.BLURAY.mHD.x264.AC3-5.1-THICKET (smallest on a tie)')
  })

  it('says when nothing would be picked', () => {
    expect(summaryOf([], MULTI)).toBe('0 ⭐ · 0 🚨 · 0 🗑️ · picks nothing')
  })
})
