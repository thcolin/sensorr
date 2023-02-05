import { compose } from '@sensorr/utils'
import { Entities } from '@sensorr/ui'
import withProps from '../enhancers/withProps'
import withFetchQuery from '../enhancers/withFetchQuery'
import { useTMDB } from '../../store/tmdb'

export const TrendingPersons = compose(
  withFetchQuery({
    uri: 'trending/person/day',
    params: { sort_by: 'popularity.desc' },
  }, 1, useTMDB),
  withProps({
    id: 'trending-persons',
  }),
)(Entities)

