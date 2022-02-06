import { memo } from 'react'
import { Options, OptionsProps } from '../Options/Options'

export interface CheckboxProps extends Omit<OptionsProps, 'type' | 'testChecked' | 'value' | 'onChange' | 'onReset'> {
  value: string[]
  onChange: (values: string[]) => void
}

const UICheckbox = ({ onChange, ...props }: CheckboxProps) => (
  <Options
    {...props}
    type='checkbox'
    testChecked={(input, value) => (value || []).includes(input.value)}
    onChange={(e, input, value) => onChange([...new Set([input.value, ...value])].filter((v) => !!e.target.checked || input.value !== v))}
    onReset={() => onChange([])}
  />
)

export const Checkbox = memo(UICheckbox)
