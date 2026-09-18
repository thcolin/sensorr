import { ColorModeWrapper } from '../../helpers'
import { Checkbox as UICheckbox } from './Checkbox'

const options = [
  {
    emoji: '📼',
    label: 'Archived',
    value: 'archived',
    count: 2194,
  },
  {
    emoji: '📍',
    label: 'Pinned',
    value: 'pinned',
    count: 2156,
  },
  {
    emoji: '🍿',
    label: 'Wished',
    value: 'wished',
    count: 226
  },
  {
    emoji: '💊',
    label: 'Missing',
    value: 'missing',
    count: 1,
  },
]

const value = ['wished', 'missing']

export default { component: UICheckbox, title: 'Inputs / Checkbox' }

export const Checkbox = (args: any) => <UICheckbox {...args} />

Checkbox.args = {
  label: 'State',
  options,
  value,
}

Checkbox.argTypes = {
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

export const LightCheckbox = (args: any) => (
  <ColorModeWrapper value='light'>
    <Checkbox {...args} label='State' options={options} value={value} />
  </ColorModeWrapper>
)

export const DarkCheckbox = (args: any) => (
  <ColorModeWrapper value='dark'>
    <Checkbox {...args} label='State' options={options} value={value} />
  </ColorModeWrapper>
)

export const PrimaryCheckbox = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Checkbox {...args} label='State' options={options} value={value} />
  </ColorModeWrapper>
)
