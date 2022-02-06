import { compose } from '@sensorr/utils'
import { Person as UIPerson } from '@sensorr/ui'
import { withPersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'

const Person = compose(
  withPersonsMetadataContext()
)(UIPerson) as any

export default Person
