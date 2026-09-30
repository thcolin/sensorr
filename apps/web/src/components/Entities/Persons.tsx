import { compose } from '@sensorr/utils'
import { Entities } from '@sensorr/ui'
import withProps from '../enhancers/withProps'
import withFetchQuery from '../enhancers/withFetchQuery'
import { useTMDB } from '../../store/tmdb'
import { useAPI, query as APIQuery } from '../../store/api'

export const TrendingPersons = compose(
  withFetchQuery({
    uri: 'trending/person/day',
    params: { sort_by: 'popularity.desc' },
  }, 1, useTMDB),
  withProps({
    id: 'trending-persons',
  }),
)(Entities)


export const FollowedPersons = compose(
  withFetchQuery(APIQuery.persons.getPersons({}), 1, useAPI),
)(Entities)

// The week ahead may run over the new year
const nextBirthday = ({ birthday }, today) => {
  const date = new Date(birthday)
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const next = Date.UTC(today.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return next < start ? Date.UTC(today.getUTCFullYear() + 1, date.getUTCMonth(), date.getUTCDate()) : next
}

// `transform` is read by `withFetchQuery`, so `withProps` wraps it
export const BirthdayPersons = compose(
  withProps({
    transform: (res) => {
      const today = new Date()
      return { entities: [...res.results].sort((a, b) => nextBirthday(a, today) - nextBirthday(b, today)), total: res.total_results }
    },
  }),
  withFetchQuery(APIQuery.persons.getPersons({ params: { 'birthday.upcoming': 7, limit: 200 } }), 1, useAPI),
)(Entities)
