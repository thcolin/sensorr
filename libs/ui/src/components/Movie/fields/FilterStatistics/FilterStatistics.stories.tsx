import { ColorModeWrapper } from '../../../../helpers'
import { FilterStatistics as UIFilterStatistics } from './FilterStatistics'

export default { component: UIFilterStatistics, title: 'Components / commons / filters / Statistics' }

export const FilterStatistics = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterStatistics {...args} />
  </ColorModeWrapper>
)

FilterStatistics.args = {
  label: 'ui.filters.requested_by',
  value: { values: ['test@domain.tld'], behavior: 'or' },
  onChange: () => {},
  statistics: [
    { _id: 'test@domain.tld', count: 3 },
    { _id: 'admin@domain.tld', count: 5 },
  ],
  disabled: false,
  display: 'checkbox',
}

FilterStatistics.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
