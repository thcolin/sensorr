import { memo, useEffect, useRef, useState } from 'react'
import { Badge, buttonStyles } from '@sensorr/ui'
import { app, reset } from './running'
import { STORAGE_FAILED } from './server/store'

const REPOSITORY = 'https://github.com/thcolin/sensorr'

const MESSAGES = {
  kept: 'Your changes stay in this browser',
  storage: 'This browser keeps nothing, your changes go away on reload',
  data: 'The demo data did not load, reload the page',
}

const DemoBanner = () => {
  const [state, setState] = useState<keyof typeof MESSAGES>('kept')
  const ref = useRef<HTMLElement>(null)

  // The header takes the height of the screen once its search opens: what this banner takes comes off it
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => document.documentElement.style.setProperty('--banner-height', `${entry.borderBoxSize[0].blockSize}px`))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onStorage = () => setState('storage')
    app.then(({ store }) => store.failed && setState('storage'), () => setState('data'))
    globalThis.addEventListener(STORAGE_FAILED, onStorage)
    return () => globalThis.removeEventListener(STORAGE_FAILED, onStorage)
  }, [])

  const onReset = () => {
    if (window.confirm('Reset the demo? Everything you changed goes back to how it started')) {
      reset()
    }
  }

  return (
    <aside ref={ref} sx={DemoBanner.styles.element} aria-label='Demo'>
      <Badge emoji='🍿' label='Demo' />
      <span sx={state === 'kept' ? DemoBanner.styles.text : DemoBanner.styles.failure}>
        {MESSAGES[state]}
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
    display: ['none', 'block'],
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // Shown at every width, and on as many lines as it takes
  failure: {
    flex: 1,
    minWidth: 0,
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
