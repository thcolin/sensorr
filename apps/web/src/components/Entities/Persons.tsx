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

// Days until the next birthday: the week ahead may run over the new year
const untilBirthday = ({ birthday }, today) => {
  const date = new Date(birthday)
  return (Date.UTC(today.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) + 365 * 86400000) % (365 * 86400000)
}

// `transform` is read by `withFetchQuery`, so `withProps` wraps it
export const BirthdayPersons = compose(
  withProps({
    transform: (res) => {
      const today = new Date()
      return { entities: [...res.results].sort((a, b) => untilBirthday(a, today) - untilBirthday(b, today)), total: res.total_results }
    },
  }),
  withFetchQuery(APIQuery.persons.getPersons({ params: { 'birthday.upcoming': 7, limit: 50 } }), 1, useAPI),
)(Entities)
