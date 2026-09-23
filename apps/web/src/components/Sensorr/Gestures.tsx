import { memo } from 'react'
import { Button } from '@sensorr/ui'

const GESTURES = [
  { verdict: 'accept', key: 'A', label: 'Accept', variant: 'contain' },
  { verdict: 'refuse', key: 'R', label: 'Refuse', variant: 'outline' },
] as const

// `shortcuts` announces the A and R keys, which only the Swaps screen listens to.
const UIGestures = ({ onGesture, disabled = false, shortcuts = true, ...props }) => (
  <div {...props} sx={UIGestures.styles.element}>
    {GESTURES.map(({ verdict, key, label, variant }) => (
      <Button key={verdict} variant={variant} color='primary' disabled={disabled} onClick={() => onGesture(verdict)} {...(shortcuts ? { 'aria-keyshortcuts': key } : {})}>
        {label}
      </Button>
    ))}
  </div>
)

UIGestures.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    '>button': {
      flex: ['1', '0 1 12em'],
      ':focus-visible': {
        outline: '1px solid',
        outlineColor: 'grayDarkest',
        outlineOffset: '2px',
      },
    },
  },
}

export const Gestures = memo(UIGestures)
