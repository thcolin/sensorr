import { CronExpressionParser } from 'cron-parser'
import { JOB_EMOJIS, JOBS } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { hasTMDBKey } from './needsOnboarding'

// What a step left in the config: a Continue on an empty step sets nothing
export const statusOf = (key, config) => {
  switch (key) {
    case 'tmdb':
      return hasTMDBKey(config) ? 'TMDB' : null
    case 'indexers':
      return (config.get('znabs') || []).length ? i18n.t('onboarding.recap.indexers', { count: config.get('znabs').length }) : null
    case 'policies':
      return (config.get('policies') || []).length ? i18n.t('onboarding.recap.policies', { count: config.get('policies').length }) : null
    case 'blackhole':
      return config.get('blackhole') ? i18n.t('settings.sections.blackhole') : null
    case 'plex':
      return config.get('plex.token') ? 'Plex' : null
    case 'friends':
      return (config.get('mail.host') && config.get('mail.from') && config.get('mail.url')) ? i18n.t('settings.sections.mail') : null
  }
}

// What the missing step costs, said where it is listed, in the language of the interface when it is read
export const MISSING = {
  get tmdb() { return i18n.t('onboarding.recap.missing.tmdb') },
  get indexers() { return i18n.t('onboarding.recap.missing.indexers') },
  get policies() { return i18n.t('onboarding.recap.missing.policies') },
  get blackhole() { return i18n.t('onboarding.recap.missing.blackhole') },
  get plex() { return i18n.t('onboarding.recap.missing.plex') },
  get friends() { return i18n.t('onboarding.recap.missing.friends') },
}

const whenOf = (date: Date, now: Date) => {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((day(date) - day(now)) / 86400000)
  const time = date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

  if (days === 0) {
    return i18n.t('onboarding.recap.today', { time })
  }

  if (days === 1) {
    return i18n.t('onboarding.recap.tomorrow', { time })
  }

  return i18n.t('onboarding.recap.day', {
    time,
    day: days < 7
      ? date.toLocaleDateString(i18n.language, { weekday: 'long' })
      : date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
  })
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
