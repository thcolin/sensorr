import { memo, useState } from 'react'
import { Badge, INACTIVE, ShowStateOptions } from '@sensorr/ui'

const FOLLOWED = ShowStateOptions.find(({ value }) => value === 'followed')

// Follows a season or an episode: the 📺 of a followed show, in the round badge of a poster's state, turned off when not followed
const UIToggle = ({ checked, onChange, disabled = false, ...props }) => {
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    await Promise.resolve(onChange(!checked)).catch(() => null)
    setPending(false)
  }

  return (
    <button
      {...props}
      type='button'
      aria-pressed={!!checked}
      aria-busy={pending}
      disabled={disabled || pending}
      onClick={handleClick}
      sx={UIToggle.styles.element}
    >
      <Badge emoji={<span sx={checked ? {} : INACTIVE}>{FOLLOWED.emoji}</span>} size='small' />
    </button>
  )
}

UIToggle.styles = {
  element: {
    variant: 'button.reset',
    position: 'relative',
    display: 'inline-flex',
    borderRadius: '50%',
    cursor: 'pointer',
    // 44px of touch target on a phone around a badge of 20px
    '::after': {
      content: '""',
      position: 'absolute',
      inset: ['-0.75em', '-0.5em'],
    },
    '>span': {
      transition: 'background-color 200ms ease-in-out',
    },
    '>span >span >span': {
      transition: 'filter 200ms ease-in-out, opacity 200ms ease-in-out',
    },
    ':hover:not(:disabled) >span': {
      backgroundColor: 'grayDark',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
    ':disabled': {
      cursor: 'default',
      opacity: 0.5,
    },
    '&[aria-busy="true"]': {
      cursor: 'progress',
      opacity: 1,
    },
  },
}

export const Toggle = memo(UIToggle)
