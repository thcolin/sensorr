import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, buttonStyles, Icon } from '@sensorr/ui'
import { app, reset } from './running'
import { STORAGE_FAILED } from './server/store'

const REPOSITORY = 'https://github.com/thcolin/sensorr'

const MESSAGES = {
  kept: 'demo.messages.kept',
  storage: 'demo.messages.storage',
  data: 'demo.messages.data',
}

const DemoBanner = () => {
  const { t } = useTranslation()
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
    if (window.confirm(t('demo.reset.confirm'))) {
      reset()
    }
  }

  return (
    <aside ref={ref} sx={DemoBanner.styles.element} aria-label={t('demo.label')}>
      <Badge emoji='🍿' label={t('demo.label')} compact={true} />
      <span sx={state === 'kept' ? DemoBanner.styles.text : DemoBanner.styles.failure}>
        {t(MESSAGES[state])}
      </span>
      <div sx={DemoBanner.styles.actions}>
        <button type='button' onClick={onReset} aria-label={t('demo.reset.title')} sx={{ ...buttonStyles.outline({ color: 'gray' }), ...DemoBanner.styles.action }}>
          {t('demo.reset.label')}
        </button>
        <a href={REPOSITORY} target='_blank' rel='noopener noreferrer' aria-label={t('demo.github.label')} title={t('demo.github.title')} sx={DemoBanner.styles.github}>
          <Icon value='github' sx={DemoBanner.styles.logo} />
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
  github: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: ['44px', '28px'],
    minHeight: ['44px', '28px'],
    color: 'text',
    transition: 'opacity 200ms ease-in-out',
    ':hover': {
      opacity: 0.8,
    },
  },
  logo: {
    width: '1.5em',
    height: '1.5em',
  },
}

export const Banner = memo(DemoBanner)
