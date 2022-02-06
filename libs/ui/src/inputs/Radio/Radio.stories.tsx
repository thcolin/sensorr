import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../.storybook/helpers'
import { Radio as UIRadio } from './Radio'

const options = [
  {
    emoji: '📣',
    value: 'popularity',
    label: 'Popularity',
  },
  {
    emoji: '📅',
    value: 'release_date',
    label: 'Release date',
  },
  {
    emoji: '💵',
    value: 'revenue',
    label: 'Revenue',
  },
  {
    emoji: '⭐',
    value: 'vote_average',
    label: 'Vote Average',
  },
  {
    emoji: '🗳',
    value: 'vote_count',
    label: 'Vote Count',
  },
]

const value = 'popularity'

export default { component: UIRadio, title: 'Inputs / Radio' } as Meta

export const Radio = (args: any) => <UIRadio {...args} />

Radio.args = {
  label: 'Sort',
  options,
  value,
}

Radio.argTypes = {
  label: {
    control: {
      type: 'text',
    },
  },
  options: {
    control: null,
  },
  value: {
    control: null,
  },
}

export const LightRadio = (args: any) => (
  <ColorModeWrapper value='light'>
    <Radio {...args} label='Sort' options={options} value={value} />
  </ColorModeWrapper>
)

export const DarkRadio = (args: any) => (
  <ColorModeWrapper value='dark'>
    <Radio {...args} label='Sort' options={options} value={value} />
  </ColorModeWrapper>
)

export const PrimaryRadio = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Radio {...args} label='Sort' options={options} value={value} />
  </ColorModeWrapper>
)

export const RadioSort = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Radio {...args} label='Sort' options={options} value={value} sort={true} onSort={() => {}} />
  </ColorModeWrapper>
)
