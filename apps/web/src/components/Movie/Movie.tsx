import { compose } from '@sensorr/utils'
import { Movie as UIMovie } from '@sensorr/ui'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { withMovieGuestsContext } from '../../contexts/Guests/Guests'
import withLoadableCredits from '../../components/enhancers/withLoadableCredits'
import withLoadableReviews from '../enhancers/withLoadableReviews'
import withLongPressBehavior from '../enhancers/withLongPressBehavior'

const Movie = compose(
  withMovieMetadataContext(),
  withMovieGuestsContext(),
)(UIMovie) as typeof UIMovie

export default Movie

export const MovieWithCreditsAndReviews = compose(
  withLoadableCredits(['cast', 'crew']),
  withLoadableReviews(),
  withLongPressBehavior(),
)(Movie) as typeof UIMovie
