const FLAT = { 'record': 'movies', 'refresh': 'movies', 'sync': 'movies', 'refine': 'movies', 'shrink': 'movies', 'report': 'movies', 'airing': 'shows' }
const RENAMED = { 'record-shows': 'record', 'refresh-shows': 'refresh', 'sync-shows': 'sync', 'import-shows': 'import' }

export const migrateJobs = (raw) => {
  const flat = Object.keys(FLAT).filter((command) => Object.keys(raw?.jobs?.[command] || {}).some((key) => !['movies', 'shows'].includes(key)))
  const renamed = Object.keys(RENAMED).filter((key) => raw?.jobs?.[key])

  if (!flat.length && !renamed.length) {
    return raw
  }

  const jobs = { ...raw.jobs }

  for (const command of flat) {
    const { movies, shows, ...old } = jobs[command]
    const types = { ...(movies ? { movies } : {}), ...(shows ? { shows } : {}) }
    jobs[command] = { ...types, [FLAT[command]]: { ...old, ...types[FLAT[command]] } }
  }

  for (const key of renamed) {
    const command = RENAMED[key]
    jobs[command] = { ...jobs[command], shows: { ...jobs[key], ...jobs[command]?.shows } }
    delete jobs[key]
  }

  return { ...raw, jobs }
}
