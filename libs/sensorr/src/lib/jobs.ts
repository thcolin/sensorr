export type JobType = 'movies' | 'shows'

// A job about one media type takes it as its argument, `record movies`; `keep-in-touch` reads both watchlists in one pass
export const JOBS: { [command: string]: JobType[] } = {
  'record': ['movies', 'shows'],
  'refresh': ['movies', 'shows'],
  'sync': ['movies', 'shows'],
  'refine': ['movies'],
  'shrink': ['movies'],
  'report': ['movies'],
  'airing': ['shows'],
  'import': ['shows'],
  'keep-in-touch': [],
}

export const isJob = (command: string, type?: string | null) => !!JOBS[command] && (JOBS[command].length ? JOBS[command].includes(type as JobType) : !type)

// A log line gives its job with `meta.command` and `meta.type`, 'movie' or 'show', or 'person' on a `refresh movies` line.
// A line logged before jobs took a type has none, and is a movie one. `migrate sonarr` is a command, not a job.
export const jobNameOf = (meta: { command?: string, type?: string } = {}): string => {
  if (meta.command === 'migrate') {
    return meta.type === 'show' ? 'migrate sonarr' : 'migrate'
  }

  const types = JOBS[meta.command as string]
  return types?.length ? `${meta.command} ${types.find((type) => type === `${meta.type}s`) || types[0]}` : meta.command as string
}
