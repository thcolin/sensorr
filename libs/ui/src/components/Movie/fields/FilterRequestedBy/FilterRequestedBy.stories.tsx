import { ColorModeWrapper } from '../../../../helpers'
import { FilterRequestedBy as UIFilterRequestedBy } from './FilterRequestedBy'

export default { component: UIFilterRequestedBy, title: 'Components / commons / filters / Requested By' }

export const FilterRequestedBy = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterRequestedBy {...args} />
  </ColorModeWrapper>
)

FilterRequestedBy.args = {
  value: { values: ['test@domain.tld'], behavior: 'or' },
  onChange: () => {},
  statistics: [
    { _id: 'test@domain.tld', count: 3 },
    { _id: 'admin@domain.tld', count: 5 },
  ],
  disabled: false,
  display: 'grid',
}

FilterRequestedBy.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
