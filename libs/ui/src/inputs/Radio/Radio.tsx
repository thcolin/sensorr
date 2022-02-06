
import { memo } from 'react'
import { Options, OptionsProps } from '../Options/Options'

export interface RadioProps extends Omit<OptionsProps, 'value' | 'onChange'> {
  value: string
  onChange: (values: string) => void
  sort?: boolean
  onSort?: (value: boolean) => void
}

const UIRadio = ({ label, options, onChange, sort, onSort, ...props }: RadioProps) => (
  <Options
    {...props}
    options={options}
    type='radio'
    testChecked={(input, value) => input.value === value}
    onChange={(e, input) => !!e.target.checked && onChange(input.value)}
    onReset={onSort ? () => onSort(!sort) : options[0]?.label ? (() => onChange(options[0]?.value)) : null}
    label={onSort ? (
      <span>
        <span>{label} &nbsp;</span>
        <span sx={{ fontWeight: 'normal' }}>
          {{ true: '↑', false: '↓' }[`${sort}`]}
        </span>
      </span>
    ) : label}
  />
)

export const Radio = memo(UIRadio)
