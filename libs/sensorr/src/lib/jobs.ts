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
  'wrapped': [],
  'mail': [],
  'dump': [],
}

// The emoji of each job, keyed by `jobNameOf`
export const JOB_EMOJIS: { [name: string]: string } = {
  'sync movies': '🔗',
  'refresh movies': '🔌',
  'record movies': '📹',
  'refine movies': '✨',
  'shrink movies': '✂️',
  'report movies': '🚩',
  'keep-in-touch': '🍻',
  'wrapped': '🎞️',
  'mail': '📬',
  'dump': '💾',
  'migrate': '🚚',
  'refresh shows': '🔌',
  'sync shows': '🔗',
  'import shows': '📥',
  'record shows': '📹',
  'airing shows': '📡',
  'migrate sonarr': '🚚',
}

// JOBS is an object literal: `toString` or `__proto__` would be read from its prototype
const typesOf = (command: unknown): JobType[] | undefined => typeof command === 'string' && Object.hasOwn(JOBS, command) ? JOBS[command] : undefined

export const isJob = (command: unknown, type?: string | null) => {
  const types = typesOf(command)
  return !!types && (types.length ? types.includes(type as JobType) : !type)
}

export const jobNameOf = (meta: { command?: string, type?: string } = {}): string => {
  if (meta.command === 'migrate') {
    return meta.type === 'show' ? 'migrate sonarr' : 'migrate'
  }

  const types = typesOf(meta.command)
  return types?.length ? `${meta.command} ${types.find((type) => type === `${meta.type}s`) || types[0]}` : meta.command as string
}

// A `jobNameOf` name split for display, the command first and what it runs on after: `record shows` reads `record` and `tv`
export const jobLabelOf = (name: string): { command: string, suffix?: string } => {
  const [command, suffix] = name.split(' ')
  return { command, suffix: suffix === 'shows' ? 'tv' : suffix }
}

// The same where text cannot be styled: a document title, a toast, an aria-label
export const jobTitleOf = (name: string): string => {
  const { command, suffix } = jobLabelOf(name)
  return suffix ? `${command} (${suffix})` : command
}
