import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../../../.storybook/helpers'
import { FilterVoteAverage as UIFilterVoteAverage } from './FilterVoteAverage'

export default { component: UIFilterVoteAverage, title: 'Components / Movie / filters / Vote Average' } as Meta

export const FilterVoteAverage = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterVoteAverage {...args} />
  </ColorModeWrapper>
)

FilterVoteAverage.args = {
  value: null,
  onChange: () => {},
  statistics: [
    { _id: -1, count: 47 },
    { _id: 0, count: 31 },
    { _id: 1, count: 12 },
    { _id: 2, count: 33 },
    { _id: 3, count: 21 },
    { _id: 4, count: 40 },
    { _id: 5, count: 26 },
    { _id: 6, count: 36 },
    { _id: 7, count: 29 },
    { _id: 8, count: 18 },
    { _id: 9, count: 11 },
    { _id: 10, count: 25 },
  ],
  disabled: false,
}

FilterVoteAverage.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
