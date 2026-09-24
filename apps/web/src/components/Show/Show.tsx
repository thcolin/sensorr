import { compose } from '@sensorr/utils'
import { Show as UIShow } from '@sensorr/ui'
import { withShowMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { withMovieGuestsContext } from '../../contexts/Guests/Guests'

const Show = compose(
  withShowMetadataContext(),
  withMovieGuestsContext(),
)(UIShow) as typeof UIShow

export default Show
