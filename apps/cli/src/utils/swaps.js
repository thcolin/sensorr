// Indexers announce a rounded size: Burlesque was announced at 5658619392 bytes and landed at 5657383562.
const TOLERANCE = 0.02

export const OVERDUE_AFTER = 7 * 24 * 60 * 60 * 1000

// An accepted swap has landed once Plex shows a version it does not replace, of about the size it was
// accepted at. Only then are the versions it replaces removed: until it lands, they are the only copy.
// The download client writes outside the library and moves a file in once complete. `all` holds the movie's versions across every Plex item, `here` those of
// the item being synced, the only ones that item can delete.
export const settleSwaps = (releases, { here, all }, { cleanup, now }) => {
  const remove = new Set()
  const landed = {}

  const settled = releases.map((release) => {
    if (!release.replaces?.length) {
      return release
    }

    const { overdue, ...pending } = release
    const { replaces, ...rest } = pending
    const found = release.size > 0 && all.find(({ id, size }) => !replaces.includes(id) && Math.abs(size - release.size) <= release.size * TOLERANCE)
    const replaced = here.filter(({ id }) => replaces.includes(id))

    if (!all.some(({ id }) => replaces.includes(id))) {
      return found ? rest : release
    }

    if (!replaced.length) {
      return release
    }

    if (!found) {
      return (now - (release.accepted_at || now) > OVERDUE_AFTER) ? { ...pending, overdue: true } : pending
    }

    if (!cleanup) {
      return rest
    }

    replaced.forEach(({ id }) => {
      remove.add(id)
      landed[id] = { release: release.id, size: found.size }
    })
    return rest
  })

  return {
    releases: settled,
    remove: [...remove],
    landed,
    changed: JSON.stringify(settled) !== JSON.stringify(releases),
  }
}

// A season swap has landed once every episode it covers has a Plex version it does not replace, and that version is
// one of the files of its torrent: `import shows` links them under their own name. `versions` holds the Plex versions
// of each episode of the show, keyed `season:episode`. Until it lands, the versions it replaces are the only copy.
export const settleSeasonSwaps = (releases = [], versions, { cleanup, now }) => {
  const nameOf = (file) => file.split(/[\\/]/).pop()
  const current = [...new Set(Object.values(versions).flat())]
  const settled = [], remove = []

  for (const release of releases.filter(({ swap, replaces }) => swap && replaces?.length)) {
    const files = new Set((release.torrent?.files || []).map(({ path, size }) => `${nameOf(path)}:${size}`))
    const arrived = (release.coverage || []).map(({ season, episode }) => (versions[`${season}:${episode}`] || []).find(({ id, name, size }) => (
      !release.replaces.includes(id) && files.has(`${name}:${size}`)
    )))

    if (!arrived.length || !arrived.every(Boolean)) {
      if (!release.overdue && now - (release.accepted_at || now) > OVERDUE_AFTER) {
        settled.push({ release, fields: { overdue: true } })
      }

      continue
    }

    const size = [...new Set(arrived)].reduce((sum, version) => sum + version.size, 0)
    const replaced = cleanup ? current.filter(({ id }) => release.replaces.includes(id)) : []

    remove.push(...replaced.map((version) => ({ version, landed: { release: release.id, size } })))
    settled.push({ release, fields: { replaces: [], overdue: false } })
  }

  return { settled, remove }
}

// Counted as the Swaps gauge counts it (apps/web/src/pages/Proposals/queue.ts, balanceOf): only
// the Plex files exist on disk.
export const proposedSpaceOf = (movies) => {
  const swaps = movies
    .map((movie) => ({ size: movie.release?.size, files: (movie.releases || []).filter(({ from }) => from === 'sync') }))
    .filter(({ size, files }) => files.length && typeof size === 'number')

  return swaps.length ? { proposed: swaps.reduce((acc, { size, files }) => acc + size - files.reduce((sum, file) => sum + (file.size || 0), 0), 0) } : {}
}

// A swap removing versions from several Plex items lands once: its size counts once.
export const cleanedSpaceOf = (cleanups) => ({
  deleted: cleanups.reduce((sum, { size }) => sum + size, 0),
  arrived: Object.values(cleanups.reduce((acc, { landed }) => ({ ...acc, [landed.release]: landed.size }), {})).reduce((sum, size) => sum + size, 0),
})
