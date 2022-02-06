import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../../../.storybook/helpers'
import { FilterStates as UIFilterStates } from './FilterStates'

export default { component: UIFilterStates, title: 'Components / commons / filters / States' } as Meta

export const FilterStates = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterStates {...args} />
  </ColorModeWrapper>
)

FilterStates.args = {
  value: ['archived'],
  onChange: () => {},
  type: 'movie',
  statistics: [
    { _id: 'wished', count: 3 },
    { _id: 'archived', count: 5 },
  ],
  disabled: false,
  display: 'grid',
}

FilterStates.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
