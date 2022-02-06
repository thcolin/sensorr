import { memo, useCallback } from 'react'
import { Badge, BadgeProps } from '../Badge/Badge'

export interface StateProps extends Omit<BadgeProps, 'emoji' | 'label' | 'onChange'> {
  value: string
  onChange: (e?: string) => void
  options: { emoji: string; label: string; value: string; hide?: boolean; }[]
}

function UIState({
  value,
  onChange,
  options,
  compact = false,
  ...props
}: StateProps) {
  const handleChange = useCallback((e) => onChange(e.target.value), [onChange])
  const option = options.find((option) => option.value === value) || {
    emoji: '⌛',
    label: 'Loading',
    value: 'loading',
    hide: true,
  }

  return (
    <label sx={UIState.styles.element}>
      <select value={option.value} onChange={handleChange} disabled={option.value === 'loading'}>
        {options
          .filter((option) => !option.hide)
          .map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji} - {option.label}
            </option>
          ))}
      </select>
      <Badge {...props} emoji={option.emoji} label={!compact && option.label} />
    </label>
  )
}

UIState.styles = {
  element: {
    position: 'relative',
    display: 'block',
    '>select': {
      position: 'absolute',
      opacity: 0,
      top: '0em',
      left: '0em',
      height: '100%',
      width: '100%',
      appearance: 'none',
      border: 'none',
      cursor: 'pointer',
    },
  },
}

export const State = memo(UIState)
