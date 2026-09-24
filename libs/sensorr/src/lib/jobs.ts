export type JobType = 'movies' | 'shows'

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

export const jobNameOf = (meta: { command?: string, type?: string } = {}): string => {
  if (meta.command === 'migrate') {
    return meta.type === 'show' ? 'migrate sonarr' : 'migrate'
  }

  const types = JOBS[meta.command as string]
  return types?.length ? `${meta.command} ${types.find((type) => type === `${meta.type}s`) || types[0]}` : meta.command as string
}
