import { memo, useEffect, useState } from 'react'
import { Badge, buttonStyles } from '@sensorr/ui'
import { app, reset } from './running'

const REPOSITORY = 'https://github.com/thcolin/sensorr'

const DemoBanner = () => {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onStorage = () => setFailed(true)
    app.then(({ store }) => setFailed(store.failed))
    globalThis.addEventListener('sensorr-demo:storage', onStorage)
    return () => globalThis.removeEventListener('sensorr-demo:storage', onStorage)
  }, [])

  const onReset = () => {
    if (window.confirm('Reset the demo? Everything you changed goes back to how it started')) {
      reset()
    }
  }

  return (
    <aside sx={DemoBanner.styles.element} aria-label='Demo'>
      <Badge emoji='🍿' label='Demo' />
      <span sx={{ ...DemoBanner.styles.text, display: failed ? 'block' : ['none', 'block'] }}>
        {failed ? 'This browser keeps nothing, your changes go away on reload' : 'Your changes stay in this browser'}
      </span>
      <div sx={DemoBanner.styles.actions}>
        <button type='button' onClick={onReset} aria-label='Reset the demo' sx={{ ...buttonStyles.outline({ color: 'gray' }), ...DemoBanner.styles.action }}>
          Reset
        </button>
        <a href={REPOSITORY} target='_blank' rel='noopener noreferrer' aria-label='Sensorr on GitHub, in a new tab' sx={{ ...buttonStyles.outline({ color: 'gray' }), ...DemoBanner.styles.action }}>
          GitHub
        </a>
      </div>
    </aside>
  )
}

DemoBanner.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingX: 4,
    paddingY: [12, 8],
    backgroundColor: 'grayLighter',
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    fontFamily: 'body',
    fontSize: 5,
    color: 'text',
  },
  text: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    marginLeft: 'auto',
    gap: 8,
  },
  action: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ['44px', 'auto'],
    paddingX: 6,
    paddingY: 8,
    textDecoration: 'none',
  },
}

export const Banner = memo(DemoBanner)
