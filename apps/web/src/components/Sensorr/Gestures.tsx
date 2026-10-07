import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@sensorr/ui'

const GESTURES = [
  { verdict: 'accept', key: 'A', variant: 'contain' },
  { verdict: 'refuse', key: 'R', variant: 'outline' },
] as const

// `shortcuts` announces the A and R keys, which the Swaps screen and a show's page listen to.
const UIGestures = ({ onGesture, disabled = false, shortcuts = true, ...props }) => {
  const { t } = useTranslation()

  return (
    <div {...props} sx={UIGestures.styles.element}>
      {GESTURES.map(({ verdict, key, variant }) => (
        <Button key={verdict} variant={variant} color='primary' disabled={disabled} onClick={() => onGesture(verdict)} {...(shortcuts ? { 'aria-keyshortcuts': key } : {})}>
          {t(`sensorr.gestures.${verdict}`)}
        </Button>
      ))}
    </div>
  )
}

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
