import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../../../.storybook/helpers'
import { FilterGenres as UIFilterGenres } from './FilterGenres'

export default { component: UIFilterGenres, title: 'Components / Movie / filters / Genres' } as Meta

export const FilterGenres = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterGenres {...args} />
  </ColorModeWrapper>
)

FilterGenres.args = {
  value: [53, 10749, 14],
  onChange: () => {},
  statistics: [
    { _id: 18, count: 3 },
    { _id: 53, count: 5 },
    { _id: 12, count: 4 },
    { _id: 80, count: 3 },
    { _id: 10749, count: 1 },
    { _id: 27, count: 1 },
    { _id: 28, count: 7 },
    { _id: 14, count: 2 },
    { _id: 10751, count: 2 },
    { _id: 35, count: 2 },
    { _id: 878, count: 3 },
  ],
  tmdb: null,
  disabled: false,
  display: 'grid',
}

FilterGenres.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
  tmdb: {
    control: null,
  },
}
