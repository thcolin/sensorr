import { ColorModeWrapper } from '../../../../helpers'
import { FilterGender as UIFilterGender } from './FilterGender'

export default { component: UIFilterGender, title: 'Components / Person / filters / Gender' }

export const FilterGender = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterGender {...args} />
  </ColorModeWrapper>
)

FilterGender.args = {
  value: [0, 1],
  onChange: () => {},
  statistics: [
    { _id: 0, count: 3 },
    { _id: 1, count: 5 },
    { _id: 2, count: 4 },
  ],
  disabled: false,
  display: 'checkbox',
}

FilterGender.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
