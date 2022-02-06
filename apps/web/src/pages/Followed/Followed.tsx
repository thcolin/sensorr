import { compose } from '@sensorr/utils'
import { Entities } from '@sensorr/ui'
import Person from '../../components/Person/Person'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import api from '../../store/api'

const FollowedPersons = compose(
  withFetchQuery(api.query.persons.getPersons({}), 1, api),
)(Entities)

const Followed = ({ ...props }) => {
  return (
    <FollowedPersons
      display="grid"
      child={Person}
      empty={{
        emoji: '',
        title: '',
        subtitle: '',
      }}
    />
  )
}

export default Followed
