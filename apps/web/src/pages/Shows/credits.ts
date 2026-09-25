import { utils } from '@sensorr/tmdb'

const episodesOf = (count: number) => `${count} episode${count > 1 ? 's' : ''}`

// `aggregate_credits` gives one entry per person across every season, with their roles or jobs
export const aggregateCredits = (credits, priorized: string[], key: 'cast' | 'crew') => {
  const people = (credits?.[key] || []) as any[]
  const counts = people.reduce((acc, person) => ({ ...acc, [person.id]: person.total_episode_count }), {})
  const flat = key === 'cast'
    ? people.map(({ roles = [], ...person }) => ({ ...person, character: roles.map(({ character }) => character).filter(Boolean).join(' / ') }))
    : [...people]
      .sort((a, b) => (b.total_episode_count || 0) - (a.total_episode_count || 0))
      .flatMap(({ jobs = [], ...person }) => jobs.map(({ job }) => ({ ...person, job })))

  return utils.sortCredits({ [key]: flat }, priorized, [key]).map(credit => ({
    ...credit,
    override: [credit.override, counts[credit.id] && episodesOf(counts[credit.id])].filter(Boolean).join(' · '),
  }))
}
