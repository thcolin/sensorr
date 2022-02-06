import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../../../.storybook/helpers'
import { FilterReleaseDate as UIFilterReleaseDate } from './FilterReleaseDate'

export default { component: UIFilterReleaseDate, title: 'Components / Movie / filters / Release Date' } as Meta

export const FilterReleaseDate = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterReleaseDate {...args} />
  </ColorModeWrapper>
)

FilterReleaseDate.args = {
  value: null,
  onChange: () => {},
  statistics: [
    { _id: 1907, count: 12 },
    { _id: 1910, count: 18 },
    { _id: 1920, count: 8 },
    { _id: 1930, count: 31 },
    { _id: 1940, count: 13 },
    { _id: 1950, count: 19 },
    { _id: 1960, count: 41 },
    { _id: 1970, count: 11 },
    { _id: 1980, count: 17 },
    { _id: 1990, count: 7 },
    { _id: 2001, count: 27 },
    { _id: 2002, count: 20 },
    { _id: 2003, count: 16 },
    { _id: 2004, count: 16 },
    { _id: 2005, count: 21 },
    { _id: 2006, count: 10 },
    { _id: 2007, count: 37 },
    { _id: 2008, count: 12 },
  ],
  disabled: false,
}

FilterReleaseDate.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
