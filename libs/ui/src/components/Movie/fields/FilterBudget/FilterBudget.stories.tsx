import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../../../.storybook/helpers'
import { FilterBudget as UIFilterBudget } from './FilterBudget'

export default { component: UIFilterBudget, title: 'Components / Movie / filters / Vote Count' } as Meta

export const FilterBudget = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterBudget {...args} />
  </ColorModeWrapper>
)

FilterBudget.args = {
  value: null,
  onChange: () => {},
  statistics: [
    { _id: -1, count: 21 },
    { _id: 100, count: 12 },
    { _id: 110, count: 18 },
    { _id: 120, count: 8 },
    { _id: 130, count: 31 },
    { _id: 140, count: 13 },
    { _id: 150, count: 19 },
    { _id: 160, count: 41 },
    { _id: 170, count: 11 },
    { _id: 180, count: 17 },
    { _id: 190, count: 7 },
    { _id: 210, count: 27 },
    { _id: 220, count: 20 },
    { _id: 230, count: 16 },
    { _id: 240, count: 16 },
  ],
  disabled: false,
}

FilterBudget.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
