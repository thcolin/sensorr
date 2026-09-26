import { compose } from '@sensorr/utils'
import { Show as UIShow } from '@sensorr/ui'
import { withShowMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { withMovieGuestsContext } from '../../contexts/Guests/Guests'
import { withShowProgress } from './withShowProgress'

// `withShowProgress` sits inside the metadata context: it reads whether Sensorr holds the show
const Show = compose(
  withShowMetadataContext(),
  withShowProgress(),
  withMovieGuestsContext(),
)(UIShow) as typeof UIShow

export default Show
