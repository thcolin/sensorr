import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../../../.storybook/helpers'
import { FilterPopularity as UIFilterPopularity } from './FilterPopularity'

export default { component: UIFilterPopularity, title: 'Components / commons / filters / Popularity' } as Meta

export const FilterPopularity = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterPopularity {...args} />
  </ColorModeWrapper>
)

FilterPopularity.args = {
  value: null,
  onChange: () => {},
  statistics: [
    { _id: -1, count: 15 },
    { _id: 0, count: 12 },
    { _id: 10, count: 18 },
    { _id: 20, count: 8 },
    { _id: 30, count: 31 },
    { _id: 40, count: 13 },
    { _id: 50, count: 19 },
    { _id: 60, count: 41 },
    { _id: 70, count: 11 },
    { _id: 80, count: 17 },
    { _id: 90, count: 7 },
    { _id: 100, count: 27 },
    { _id: 200, count: 20 },
    { _id: 300, count: 16 },
    { _id: 400, count: 16 },
    { _id: 500, count: 21 },
    { _id: 600, count: 10 },
    { _id: 700, count: 37 },
    { _id: 800, count: 12 },
  ],
  disabled: false,
}

FilterPopularity.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
