import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../../../.storybook/helpers'
import { FilterStatistics as UIFilterStatistics } from './FilterStatistics'

export default { component: UIFilterStatistics, title: 'Components / commons / filters / Requested By' } as Meta

export const FilterStatistics = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterStatistics {...args} />
  </ColorModeWrapper>
)

FilterStatistics.args = {
  value: ['test@domain.tld'],
  onChange: () => {},
  statistics: [
    { _id: 'test@domain.tld', count: 3 },
    { _id: 'admin@domain.tld', count: 5 },
  ],
  disabled: false,
  display: 'grid',
}

FilterStatistics.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
