import { ColorModeWrapper } from '../../../../helpers'
import { FilterGenres as UIFilterGenres } from './FilterGenres'

export default { component: UIFilterGenres, title: 'Components / Movie / filters / Genres' }

export const FilterGenres = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterGenres {...args} />
  </ColorModeWrapper>
)

FilterGenres.args = {
  value: { values: [53, 10749, 14], behavior: 'or' },
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
  display: 'checkbox',
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

export const FilterGenresTV = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterGenres {...args} />
  </ColorModeWrapper>
)

FilterGenresTV.args = {
  ...FilterGenres.args,
  type: 'tv',
  value: { values: [10765, 18], behavior: 'or' },
  statistics: [
    { _id: 18, count: 6 },
    { _id: 10765, count: 3 },
    { _id: 10759, count: 2 },
    { _id: 35, count: 2 },
  ],
}

FilterGenresTV.argTypes = FilterGenres.argTypes
