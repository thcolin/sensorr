import { compose } from '@sensorr/utils'
import { Person as UIPerson } from '@sensorr/ui'
import { withPersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import withDetailsDrawer from '../enhancers/withDetailsDrawer'

const Person = compose(
  withPersonsMetadataContext(),
  withDetailsDrawer(),
)(UIPerson) as any

export default Person
