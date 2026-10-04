import { CronExpressionParser } from 'cron-parser'
import { JOB_EMOJIS, JOBS } from '@sensorr/sensorr'
import { hasTMDBKey } from './needsOnboarding'

const count = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

// What a step left in the config: a Continue on an empty step sets nothing
export const statusOf = (key, config) => {
  switch (key) {
    case 'tmdb':
      return hasTMDBKey(config) ? 'TMDB' : null
    case 'indexers':
      return (config.get('znabs') || []).length ? count(config.get('znabs').length, 'indexer') : null
    case 'policies':
      return (config.get('policies') || []).length ? count(config.get('policies').length, 'policy', 'policies') : null
    case 'blackhole':
      return config.get('blackhole') ? 'Blackhole' : null
    case 'plex':
      return config.get('plex.token') ? 'Plex' : null
    case 'friends':
      return (config.get('mail.host') && config.get('mail.from') && config.get('mail.url')) ? 'Mail' : null
  }
}

// What the missing step costs, said where it is listed
export const MISSING = {
  tmdb: 'no key, nothing loads',
  indexers: 'nothing to search yet',
  policies: 'seeders pick the release',
  blackhole: 'no folder to drop releases',
  plex: 'not linked',
  friends: 'no mail',
}

const whenOf = (date: Date, now: Date) => {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((day(date) - day(now)) / 86400000)
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  if (days === 0) {
    return `today at ${time}`
  }

  if (days === 1) {
    return `tomorrow at ${time}`
  }

  return days < 7
    ? `${date.toLocaleDateString('en-GB', { weekday: 'long' })} at ${time}`
    : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${time}`
}

// The jobs that will run first, as the scheduler reads them: a paused or unreadable cron never runs
export const nextRunsOf = (config, now = new Date(), limit = 3) => Object.entries(JOBS)
  .flatMap(([command, types]) => (types.length ? types : [undefined]).map((type) => [command, type].filter(Boolean).join(' ')))
  .flatMap((name) => {
    const key = `jobs.${name.replace(' ', '.')}`

    const cron = config.get(`${key}.cron`)

    // cron-parser reads a missing expression as every minute
    if (config.get(`${key}.paused`) || !cron) {
      return []
    }

    try {
      const date = CronExpressionParser.parse(cron, { currentDate: now }).next().toDate()
      return [{ name, emoji: JOB_EMOJIS[name], date }]
    } catch (err) {
      return []
    }
  })
  .sort((a, b) => a.date.getTime() - b.date.getTime())
  .slice(0, limit)
  .map(({ name, emoji, date }) => ({ name, emoji, when: whenOf(date, now) }))
