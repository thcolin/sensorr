import { ColorModeWrapper } from '../../helpers'
import { Select as UISelect } from './Select'

const options = [
  { label: 'Bill Murray', value: 123 },
  { label: 'Bill Pullman', value: 456 },
  { label: 'Bill Tung', value: 789 },
]

const loadOptions = (query = 'Bill') => options

export default { component: UISelect, title: 'Inputs / Select' }

export const Select = (args: any) => <UISelect {...args} />

Select.args = {
  label: 'Peoples',
  options,
  value: null,
  onChange: () => {},
  onBehavior: () => {},
}

Select.argTypes = {
  label: {
    control: 'text',
  },
  options: {
    control: {
      type: 'select',
      options: {
        none: null,
        options,
      },
    },
  },
  value: {
    control: null
  },
  loadOptions: {
    control: {
      type: 'select',
      options: {
        none: null,
        loadOptions,
      },
    },
  },
}

export const LightSelect = (args: any) => (
  <ColorModeWrapper value='light'>
    <Select {...args} label='Peoples' options={options} value={null} onChange={() => {}} loadOptions={loadOptions} />
  </ColorModeWrapper>
)

export const DarkSelect = (args: any) => (
  <ColorModeWrapper value='dark'>
    <Select {...args} label='Peoples' options={options} value={null} onChange={() => {}} loadOptions={loadOptions} />
  </ColorModeWrapper>
)

export const PrimarySelect = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Select {...args} label='Peoples' options={options} value={null} onChange={() => {}} loadOptions={loadOptions} />
  </ColorModeWrapper>
)
