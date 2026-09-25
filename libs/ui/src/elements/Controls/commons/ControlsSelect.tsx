import { memo, ReactNode } from 'react'

export interface ControlsSelectProps {
  id: string
  value: string
  options: { value: string, label: string }[]
  onChange: (value: string) => void
  label?: ReactNode
  style?: { [key: string]: any }
}

// A native select laid invisible over the label of its value, so the bar shows a word and the platform shows the list
const UIControlsSelect = ({ id, value, options, onChange, label, style }: ControlsSelectProps) => (
  <div sx={{ ...style, ...UIControlsSelect.styles.element }}>
    <label htmlFor={id}>{label ?? options.find(option => option.value === value)?.label}</label>
    <select id={id} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
)

UIControlsSelect.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginY: 4,
    paddingX: 2,
    borderRadius: '0.25em',
    ':hover': {
      backgroundColor: 'accent',
    },
    '>label': {
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      color: 'textShadow',
      fontSize: 4,
      fontWeight: 'semibold',
      whiteSpace: 'nowrap',
    },
    '>select': {
      variant: 'select.reset',
      position: 'absolute',
      height: '100%',
      width: '100%',
      right: '0px',
      opacity: 0,
      fontSize: 4,
      fontWeight: 'semibold',
      '>option': {
        width: '0px',
      },
    },
  },
}

export const ControlsSelect = memo(UIControlsSelect)
