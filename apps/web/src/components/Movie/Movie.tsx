import { compose } from '@sensorr/utils'
import { Movie as UIMovie } from '@sensorr/ui'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import withHoverCredits from '../../components/enhancers/withHoverCredits'

const Movie = compose(
  withMovieMetadataContext(),
)(UIMovie) as typeof UIMovie

export default Movie

export const MovieWithCreditsDelayed = compose(
  withHoverCredits(['cast', 'crew'], 1350, 8),
)(Movie) as typeof UIMovie

export const MovieWithCredits = compose(
  withHoverCredits(['cast', 'crew'], 0, 8),
)(Movie) as typeof UIMovie
