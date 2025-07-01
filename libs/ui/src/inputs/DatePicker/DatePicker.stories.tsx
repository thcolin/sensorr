import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../.storybook/helpers'
import { DatePicker as UIDatePicker } from './DatePicker'

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

export default { component: UIDatePicker, title: 'Inputs / DatePicker' } as Meta

export const DatePicker = (args: any) => <UIDatePicker {...args} />

DatePicker.args = {
  label: 'Vote Average',
  value: [4, 5],
  data,
  min: 0,
  max: 10,
}

DatePicker.argTypes = {
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

export const LightDatePicker = (args: any) => (
  <ColorModeWrapper value='light'>
    <DatePicker {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)

export const DarkDatePicker = (args: any) => (
  <ColorModeWrapper value='dark'>
    <DatePicker {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)

export const PrimaryDatePicker = (args: any) => (
  <ColorModeWrapper value='primary'>
    <DatePicker {...args} label='Vote Average' value={[4, 5]} min={0} max={10} data={data} />
  </ColorModeWrapper>
)
