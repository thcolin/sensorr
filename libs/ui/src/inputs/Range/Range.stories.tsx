import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../.storybook/helpers'
import { Range as UIRange } from './Range'

const data = {
  '0': 37,
  '1': 19,
  '2': 12,
  '3': 28,
  '4': 67,
  '5': 120,
  '6': 139,
  '7': 170,
  '8': 74,
  '9': 51,
}

export default { component: UIRange, title: 'Inputs / Range' } as Meta

export const Range = (args: any) => <UIRange {...args} />

Range.args = {
  label: 'Vote Average',
  value: [4, 5],
  data,
  min: 0,
  max: 10,
}

Range.argTypes = {
  value: {
    control: null,
  },
  data: {
    control: {
      type: 'select',
      options: {
        none: null,
        data,
      }
    }
  },
  marks: {
    control: {
      type: 'select',
      options: {
        false: false,
        true: true,
        mutli: [{ value: 2, label: '2' }, { value: 4, label: '4' }, { value: 6, label: '6' }, { value: 8, label: '8' }],
      },
    },
  },
}

export const LightRange = (args: any) => (
  <ColorModeWrapper value='light'>
    <Range {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)

export const DarkRange = (args: any) => (
  <ColorModeWrapper value='dark'>
    <Range {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)

export const PrimaryRange = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Range {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)
