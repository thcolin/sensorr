import { ownedMatchOf, ownedOf } from './owned'

// The movie 16391 on Cortex, its record and its Plex file differing by 41 bytes
const record = { title: 'Le.Narcisse.Noir.1947.MULTi-VFF.1080p.WEB-DL.x264.AAC-1.0-mHDgz', from: 'record', job: 'manual', size: 1527178624 }
const plex = { title: 'Le.Narcisse.Noir.1947.MULTi.1080p.x264.AAC-1.0-mHDgz', from: 'sync', size: 1527178583 }
const result = (title: string, size: number) => ({ title, size })

describe('ownedOf', () => {
  it('keeps the Plex files and the accepted records, not the refused or pending proposals', () => {
    const refused = { ...record, from: 'refine', proposal: true, choice: false }
    const pending = { ...record, from: 'shrink', proposal: true }
    const accepted = { ...record, from: 'refine', proposal: true, choice: true }

    expect(ownedOf([plex, record, refused, pending, accepted])).toEqual([plex, record, accepted])
  })
})

describe('ownedMatchOf', () => {
  it('matches the same release named differently, the Plex file first', () => {
    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.MULTi-VFF.1080p.BLURAY.x264.AAC-1.0-mHDgz', 1527178624), [record, plex])).toBe(plex)
    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.MULTi.1080p.x264.AAC-mHDgz', 1527178000), [record, plex])).toBe(plex)
  })

  it('falls back on the record when no Plex file matches', () => {
    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.MULTi.1080p.x264.AAC-mHDgz', 1527178000), [record])).toBe(record)
  })

  it('reads x264, h264 and AVC as one encoding, x265, h265 and HEVC as another', () => {
    const owned = [{ title: 'French.Kiss.1995.MULTi.1080p.AMZN.WEB-DL.DDP2.0.h264-TFA', from: 'sync', size: 5e9 }]

    expect(ownedMatchOf(result('French.Kiss.1995.MULTi.1080p.AMZN.WEB-DL.DDP2.0.x264.EAC3-2.0-TFA', 5.01e9), owned)).toBe(owned[0])
    expect(ownedMatchOf(result('French.Kiss.1995.MULTi.1080p.AMZN.WEB-DL.DDP2.0.x265-TFA', 5.01e9), owned)).toBeNull()
  })

  it('reads TRUEFRENCH as FRENCH', () => {
    const owned = [{ title: 'Ronin.1998.FRENCH.1080p.x264-GRP', from: 'sync', size: 4e9 }]

    expect(ownedMatchOf(result('Ronin.1998.TRUEFRENCH.1080p.BluRay.x264-GRP', 4e9), owned)).toBe(owned[0])
  })

  it('needs the same group, the same resolution and a size within 1%', () => {
    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.MULTi.1080p.x264.AAC-Dread', 1527178624), [plex])).toBeNull()
    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.MULTi.720p.x264.AAC-mHDgz', 1527178624), [plex])).toBeNull()
    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.MULTi.1080p.x264.AAC-mHDgz', 1.6e9), [plex])).toBeNull()
  })

  it('matches nothing without a group, NOTEAM in a generated title', () => {
    const owned = [{ title: 'Le.Narcisse.Noir.1947.CRITERION.VOSTFR.1080p.DTS.x264-NOTEAM', from: 'record', size: 8209578624 }]

    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.CRITERION.VOSTFR.1080p.DTS.x264-NOTEAM', 8209578624), owned)).toBeNull()
    expect(ownedMatchOf(result('Le.Narcisse.Noir.1947.VOSTFR.1080p.BLURAY.DTS.x264-GCJM', 8289000000), owned)).toBeNull()
  })
})
