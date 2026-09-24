// Indexers announce a rounded size: Burlesque was announced at 5658619392 bytes and landed at 5657383562.
const TOLERANCE = 0.02

export const OVERDUE_AFTER = 7 * 24 * 60 * 60 * 1000

// An accepted swap has landed once Plex shows a version it does not replace, of about the size it was
// accepted at. Only then are the versions it replaces removed: until it lands, they are the only copy.
// The download client writes outside the library and moves a file in once complete. `all` holds the movie's versions across every Plex item, `here` those of
// the item being synced, the only ones that item can delete.
export const settleSwaps = (releases, { here, all }, { cleanup, now }) => {
  const remove = new Set()
  // The version that landed, for each version it removes
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
