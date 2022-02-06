import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../.storybook/helpers'
import { Wheel as UIWheel } from './Wheel'

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

export default { component: UIWheel, title: 'Inputs / Wheel' } as Meta

export const Wheel = (args: any) => <UIWheel {...args} />

Wheel.args = {
  label: 'Vote Average',
  value: [4, 5],
  data,
  min: 0,
  max: 10,
}

Wheel.argTypes = {
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

export const LightWheel = (args: any) => (
  <ColorModeWrapper value='light'>
    <Wheel {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)

export const DarkWheel = (args: any) => (
  <ColorModeWrapper value='dark'>
    <Wheel {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)

export const PrimaryWheel = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Wheel {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)
