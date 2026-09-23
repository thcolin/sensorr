// Indexers announce a rounded size: Burlesque was announced at 5658619392 bytes and landed at 5657383562.
const TOLERANCE = 0.02

export const OVERDUE_AFTER = 7 * 24 * 60 * 60 * 1000

// An accepted swap has landed once Plex shows a version it does not replace, of about the size it was
// accepted at. Only then are the versions it replaces removed: until it lands, they are the only copy.
export const settleSwaps = (releases, versions, { cleanup, now }) => {
  const remove = new Set()

  const settled = releases.map((release) => {
    if (!release.replaces?.length) {
      return release
    }

    const { overdue, ...pending } = release
    const { replaces, ...rest } = pending
    const landed = versions.some(({ id, size }) => !replaces.includes(id) && (!release.size || Math.abs(size - release.size) <= release.size * TOLERANCE))

    if (!landed) {
      return (now - (release.accepted_at || now) > OVERDUE_AFTER) ? { ...pending, overdue: true } : pending
    }

    if (!cleanup) {
      return pending
    }

    replaces.filter(id => versions.some(version => version.id === id)).forEach(id => remove.add(id))
    return rest
  })

  return {
    releases: settled,
    remove: [...remove],
    changed: JSON.stringify(settled) !== JSON.stringify(releases),
  }
}
