// What a run found rather than what it did: a day of runs keeps the newest, the other counts add up
export const STATES = ['releases', 'shows', 'wished', 'ignored', 'missing', 'processed', 'refined', 'reported', 'library', 'guests', 'watchlist', 'watchlist_shows', 'due', 'plex', 'sonarr', 'changes', 'dump', 'local', 'imports.pending', 'imports.downloading', 'imports.warning', 'imports.overdue', 'unmatched']

export const cumulate = (newest = {}, older = {}, path = '') => Object.fromEntries(Object.keys({ ...older, ...newest }).map((key) => {
  const [a, b] = [newest[key], older[key]]

  if (STATES.includes(`${path}${key}`)) {
    return [key, a ?? b]
  }

  if (typeof a === 'number' || typeof b === 'number') {
    return [key, (a || 0) + (b || 0)]
  }

  if (a && typeof a === 'object' && !Array.isArray(a)) {
    return [key, cumulate(a, b, `${path}${key}.`)]
  }

  return [key, a ?? b]
}))
