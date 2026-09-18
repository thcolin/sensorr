import { ColorModeWrapper } from '../../helpers'
import { DatePicker as UIDatePicker } from './DatePicker'

const getOptions = (value: Date) => [value]

export default { component: UIDatePicker, title: 'Inputs / DatePicker' }

export const DatePicker = (args: any) => <UIDatePicker {...args} />

DatePicker.args = {
  label: 'Release date',
  value: new Date('2008-01-01'),
  onChange: () => {},
  getOptions,
  disabled: false,
}

export const LightDatePicker = (args: any) => (
  <ColorModeWrapper value='light'>
    <DatePicker {...args} label='Release date' value={new Date('2008-01-01')} onChange={() => {}} getOptions={getOptions} />
  </ColorModeWrapper>
)

export const DarkDatePicker = (args: any) => (
  <ColorModeWrapper value='dark'>
    <DatePicker {...args} label='Release date' value={new Date('2008-01-01')} onChange={() => {}} getOptions={getOptions} />
  </ColorModeWrapper>
)

export const PrimaryDatePicker = (args: any) => (
  <ColorModeWrapper value='primary'>
    <DatePicker {...args} label='Release date' value={new Date('2008-01-01')} onChange={() => {}} getOptions={getOptions} />
  </ColorModeWrapper>
)
