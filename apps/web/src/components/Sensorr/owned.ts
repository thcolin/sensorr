import oleoo from 'oleoo'

// What a movie already has: its Plex files, and the releases Sensorr recorded that were not
// refused nor left pending. A record replaced since stays: it was downloaded once.
const RECORDED = ['record', 'refine', 'shrink', 'report', 'airing']

export const ownedOf = (releases) => (releases || []).filter(release => (
  release.from === 'sync' ||
  (RECORDED.includes(release.from) && (!release.proposal || release.choice === true))
))

// The same encode is named x264 by its group, h264 or AVC by an indexer, x264 by the Plex sync,
// and the same audio MULTi-VFF or MULTi depending on who reads it
const FAMILIES = {
  encoding: (value) => /265|hevc/i.test(value) ? '265' : /264|avc/i.test(value) ? '264' : value,
  language: (value) => /^multi/i.test(value) ? 'MULTi' : value === 'TRUEFRENCH' ? 'FRENCH' : value,
  resolution: (value) => value,
  group: (value) => value.toLowerCase(),
}

// What oleoo writes in a generated title when the release names no group
const NO_GROUP = 'NOTEAM'

// Measured on Cortex on 2026-10-11: a record and its Plex file differ by up to 1% in size,
// the indexer rounding what it announces
const SIZE_TOLERANCE = 0.01

const metaOf = (release) => {
  const meta = release.meta || oleoo.parse(release.title || '', { strict: false, flagged: true })
  return meta.group === NO_GROUP ? { ...meta, group: null } : meta
}

// A value missing on one side says nothing against the match, except the group: without it,
// another release of a close size passes for the owned one
const sameAs = (a, b) => !!a.group && !!b.group && Object.entries(FAMILIES).every(([axis, family]) => !a[axis] || !b[axis] || family(a[axis]) === family(b[axis]))

const sameSize = (a, b) => !!a && !!b && Math.abs(a - b) / Math.max(a, b) < SIZE_TOLERANCE

// The same indexer page is the same release, group or not
const sameLink = (a, b) => (!!a.link && a.link === b.link) || (!!a.id && a.id === b.id)

// The owned release a search result is a copy of, the Plex file first: it is what is on disk
export const ownedMatchOf = (release, owned) => {
  const meta = metaOf(release)
  const matches = owned.filter(candidate => sameLink(release, candidate) || (sameSize(release.size, candidate.size) && sameAs(meta, metaOf(candidate))))
  return matches.find(({ from }) => from === 'sync') || matches[0] || null
}
