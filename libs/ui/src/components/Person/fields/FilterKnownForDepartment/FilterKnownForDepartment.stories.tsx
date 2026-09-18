import { ColorModeWrapper } from '../../../../helpers'
import { FilterKnownForDepartment as UIFilterKnownForDepartment } from './FilterKnownForDepartment'

export default { component: UIFilterKnownForDepartment, title: 'Components / Person / filters / Known For Department' }

export const FilterKnownForDepartment = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterKnownForDepartment {...args} />
  </ColorModeWrapper>
)

FilterKnownForDepartment.args = {
  value: ['Acting', 'Directing'],
  onChange: () => {},
  statistics: [
    { _id: 'Acting', count: 7 },
    { _id: 'Directing', count: 5 },
    { _id: 'Writing', count: 4 },
    { _id: 'Crew', count: 3 },
    { _id: 'Art', count: 3 },
    { _id: 'Sound', count: 3 },
    { _id: 'Editing', count: 2 },
    { _id: 'Production', count: 2 },
    { _id: 'Visual Effects', count: 1 },
    { _id: 'Camera', count: 1 },
  ],
  disabled: false,
  display: 'checkbox',
}

FilterKnownForDepartment.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
