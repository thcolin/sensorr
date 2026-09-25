import { memo, useState } from 'react'
import { Option } from '@sensorr/ui'

const UIToggle = ({ id, checked, onChange, disabled = false, children = null, ...props }) => {
  const [pending, setPending] = useState(false)

  const handleChange = async (e) => {
    setPending(true)
    await Promise.resolve(onChange(!!e.target.checked)).catch(() => null)
    setPending(false)
  }

  return (
    <span
      sx={{
        ...UIToggle.styles.element,
        color: checked ? 'accentDark' : 'grayDarkest',
        opacity: disabled ? 0.5 : 1,
      }}
      aria-busy={pending}
    >
      <Option
        {...props}
        id={id}
        type='checkbox'
        checked={!!checked}
        disabled={disabled || pending}
        onChange={handleChange}
      >
        {children}
      </Option>
    </span>
  )
}

UIToggle.styles = {
  element: {
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'color 200ms ease-in-out, opacity 200ms ease-in-out',
    '>label': {
      margin: 12,
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: ['-0.875em', '-0.75em'],
      },
    },
    '&[aria-busy="true"] >label': {
      cursor: 'progress',
    },
  },
}

export const Toggle = memo(UIToggle)
