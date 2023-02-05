import { compose } from '@sensorr/utils'
import { Movie as UIMovie } from '@sensorr/ui'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { withMovieGuestsContext } from '../../contexts/Guests/Guests'
import withLoadableCredits from '../../components/enhancers/withLoadableCredits'

const Movie = compose(
  withMovieMetadataContext(),
  withMovieGuestsContext(),
)(UIMovie) as typeof UIMovie

export default Movie

export const MovieWithCredits = compose(
  withLoadableCredits(['cast', 'crew']),
)(Movie) as typeof UIMovie
