import { compose } from '@sensorr/utils'
import { Show as UIShow } from '@sensorr/ui'
import { withShowMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { withMovieGuestsContext } from '../../contexts/Guests/Guests'
import { withShowProgress } from './withShowProgress'

// The `extra` a grid or a mobile row of show posters takes for the progress footer: its 0.5em margin and the 1.275em
// compact pill, so the cards keep the gap of their movie counterparts
export const FOOTER_HEIGHT = 28

// `withShowProgress` sits inside the metadata context: it reads whether Sensorr holds the show
const Show = compose(
  withShowMetadataContext(),
  withShowProgress(),
  withMovieGuestsContext(),
)(UIShow) as typeof UIShow

export default Show
