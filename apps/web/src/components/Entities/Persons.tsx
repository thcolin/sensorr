import { compose } from '@sensorr/utils'
import { Entities } from '@sensorr/ui'
import withFetchQuery from '../enhancers/withFetchQuery'
import tmdb from '../../store/tmdb'

export const TrendingPersons = compose(
  withFetchQuery({
    uri: 'trending/person/day',
    params: { sort_by: 'popularity.desc' },
  }, 1, tmdb),
)(Entities)

