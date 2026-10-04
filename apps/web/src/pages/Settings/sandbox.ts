import oleoo from 'oleoo'
import { Policy } from '@sensorr/sensorr'

const GB = 1024 ** 3

// Fake releases of Big Buck Bunny (2008): every oleoo source and encoding, the common languages, dubs and flags,
// then the cases a movie search rejects whatever the policy, as [title, size in GB, seeders]
export const SAMPLE_RELEASES: [string, number, number][] = [
  ['Big.Buck.Bunny.2008.MULTi-VF2.1080p.BluRay.x264.AC3-5.1-PEACH', 4.4, 120],
  ['Big.Buck.Bunny.2008.MULTi-VFF.1080p.WEB-DL.H264.EAC3-5.1-ORCHARD', 5.1, 80],
  ['Big.Buck.Bunny.2008.MULTi-VFQ.720p.BluRay.x264.AAC-2.0-MEADOW', 2.1, 45],
  ['Big.Buck.Bunny.2008.MULTi.1080p.BluRay.10bit.HDR.x265.AC3-5.1-BURROW', 3.2, 60],
  ['Big.Buck.Bunny.2008.MULTi.2160p.UHD.BluRay.REMUX.HDR.DV.TrueHD.Atmos.HEVC-CLOVER', 58, 25],
  ['Big.Buck.Bunny.2008.2160p.AMZN.WEB-DL.EAC3-5.1.Atmos.DV.x265-ACORN', 14, 90],
  ['Big.Buck.Bunny.2008.MULTi-VF2.1080p.BluRay.mHD.x264.AC3-5.1.MD-THICKET', 3.4, 70],
  ['Big.Buck.Bunny.2008.TRUEFRENCH.1080p.BluRay.DTS-HDMA.x264-GROVE', 9.8, 30],
  ['Big.Buck.Bunny.2008.FRENCH.720p.HDTV.x264-HEDGE', 1.4, 12],
  ['Big.Buck.Bunny.2008.FRENCH.1080p.BluRay.FLAC-2.0.LD.x264-SPROUT', 6, 9],
  ['Big.Buck.Bunny.2008.VFQ.1080p.WEB-DL.H264.AAC-2.0-MAPLE', 2.9, 8],
  ['Big.Buck.Bunny.2008.VOSTFR.1080p.BluRay.x264.AC3-FERN', 4, 40],
  ['Big.Buck.Bunny.2008.VOSTA.720p.WEB-DL.x264-THISTLE', 1.1, 15],
  ['Big.Buck.Bunny.2008.VOST.SD.DVDRip.XviD.MP3-BRAMBLE', 0.7, 5],
  ['Big.Buck.Bunny.2008.VO.1080p.BluRay.x264-WILLOW', 4.3, 200],
  ['Big.Buck.Bunny.2008.ENGLiSH.1080p.BluRay.REMUX.VC1.DTS-HDMA-BIRCH', 22, 18],
  ['Big.Buck.Bunny.2008.GERMAN.DL.1080p.BluRay.x264-LINDEN', 6, 33],
  ['Big.Buck.Bunny.2008.SPANiSH.720p.BRRip.x264.AAC-OLIVE', 1.2, 9],
  ['Big.Buck.Bunny.2008.iTALiAN.1080p.BDRip.10bit.x265-CYPRESS', 2.3, 11],
  ['Big.Buck.Bunny.2008.JAPANESE.DUBBED.720p.HDRip.h264-BAMBOO', 1, 4],
  ['Big.Buck.Bunny.2008.MULTi.1080p.WEB-DL.VP9.OPUS-5.1-MOSS', 2.5, 14],
  ['Big.Buck.Bunny.2008.MULTi.1080p.BluRay.PCM-2.0.x264-LICHEN', 7.5, 6],
  ['Big.Buck.Bunny.2008.MULTi.1080p.BluRay.x264.PROPER-HAZEL', 4.4, 22],
  ['Big.Buck.Bunny.2008.MULTi.1080p.WEB-DL.x264.REPACK.iNTERNAL-ROWAN', 3, 18],
  ['Big.Buck.Bunny.2008.EXTENDED.UNRATED.MULTi.1080p.BluRay.x264-ALDER', 5, 26],
  ['Big.Buck.Bunny.2008.REMASTERED.FASTSUB.VOSTFR.1080p.BluRay.x264-ASPEN', 4, 10],
  ['Big.Buck.Bunny.2008.3D.HSBS.1080p.BluRay.x264-POPLAR', 4, 6],
  ['Big.Buck.Bunny.2008.MULTi.DVD-R.MPEG2.AC3-ELDER', 4.4, 7],
  ['Big.Buck.Bunny.2008.CAM.x264-NETTLE', 0.9, 300],
  ['Big.Buck.Bunny.2008.TC.XviD-BRACKEN', 0.7, 50],
  ['Big.Buck.Bunny.2008.SCREENER.DivX-SORREL', 0.7, 20],
  ['Big.Buck.Bunny.2008.R5.XviD-YARROW', 0.7, 10],
  ['Big.Buck.Bunny.2008.R6.MPEG-4-TANSY', 0.8, 3],
  ['Big.Buck.Bunny.2008.DVDSCr.XviD-RUSH', 0.7, 6],
  ['Big.Buck.Bunny.2008.BDSCR.x264-SEDGE', 0.9, 2],
  ['Big.Buck.Bunny.2008.TVRip.XviD-REED', 0.5, 2],
  ['Big.Buck.Bunny.2008.PDTV.XviD-HEATH', 0.5, 1],
  ['Big.Buck.Bunny.2008.SDTV.h264-GORSE', 0.6, 2],
  ['Big.Buck.Bunny.2008.1080p.UHDTV.h265-SEDUM', 3, 5],
  ['Big.Buck.Bunny.2008.MULTi.1080p.BluRay.x264-HOLLOW', 4.4, 0],
  ['Big.Buck.Bunny.2010.MULTi.1080p.BluRay.x264-WARREN', 4.4, 40],
  ['Big.Buck.Bunny.S01E01.MULTi.1080p.WEB-DL.x264-DELL', 0.9, 30],
  ['Big.Buck.Bunny.2008.COLLECTION.MULTi.1080p.BluRay.x264-COPSE', 12, 20],
  ['Elephants.Dream.2008.MULTi.1080p.BluRay.x264-GLADE', 4.4, 50],
]

export const SAMPLE_QUERY = { terms: ['big buck bunny'], titles: ['big buck bunny'], years: [2008], banned_releases: [] }

// Each release goes to a configured indexer in turn, as a search over all of them would bring it
export const sampleReleasesOf = (znabs: string[] = []) => SAMPLE_RELEASES.map(([title, size, seeders], index) => {
  const znab = znabs.length ? znabs[index % znabs.length] : undefined

  return {
    id: title,
    title,
    original: title,
    size: Math.round(size * GB),
    seeders,
    peers: seeders,
    publishDate: '2024-05-01T00:00:00Z',
    znab,
    meta: { ...oleoo.parse(title, { strict: false, flagged: true }), znab },
  }
})

// The policy's ranking of the sample, each release that also meets its `require` noted as the refine job's end-goal
export const sandboxOf = (raw, znabs: string[] = []) => {
  const policy = new Policy(raw)
  const goals = new Set(policy.apply(sampleReleasesOf(znabs), SAMPLE_QUERY, true).filter(release => release.valid).map(release => release.id))

  return policy.apply(sampleReleasesOf(znabs), SAMPLE_QUERY).map(release => ({ ...release, goal: release.valid && goals.has(release.id) }))
}
