import { memo, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Bar, Warning, Icon } from '@sensorr/ui'
import { useTitle } from '@sensorr/utils'
import i18n from '@sensorr/i18n'
import { useAPI } from '../../store/api'
import { LoadingBar } from '../../layout/LoadingBar'
import { LookFont, WrappedPage, WrappedTicket, lookOf, useShare } from './Wrapped'

// Persist the PIN so a page reload (e.g. a mobile tab discarded while the user is on plex.tv/link)
// reuses the SAME code instead of minting a new one and orphaning the code already entered.
const STORAGE_KEY = 'sensorr_plex_guest_pin'
const POLL_INTERVAL = 3000

const readStoredPin = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (raw && raw.id && raw.expiresAt && raw.expiresAt > Date.now()) {
      return raw
    }
  } catch (err) {}

  return null
}

const clearStoredPin = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {}
}

const EmblemSide = ({ icon, label }) => (
  <span sx={Emblem.styles.side}>
    <span sx={Emblem.styles.icon}>{icon}</span>
    <span sx={Emblem.styles.label}>{label}</span>
  </span>
)

export const Emblem = ({ icon, label }) => {
  const { t } = useTranslation()

  return (
    <div sx={Emblem.styles.element}>
      <EmblemSide icon={icon} label={label} />
      <span sx={Emblem.styles.plus}>+</span>
      <EmblemSide icon={<span sx={{ fontSize: '4em', lineHeight: 1 }}>🍿</span>} label={t('settings.footer.name')} />
    </div>
  )
}

Emblem.styles = {
  element: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 'auto',
    gap: 4,
  },
  side: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '4em',
    fontSize: '1em',
  },
  label: {
    fontFamily: 'heading',
    fontWeight: 'heading',
    lineHeight: 'heading',
  },
  plus: {
    display: 'flex',
    alignItems: 'center',
    height: '2em',
    fontSize: '2em',
    fontFamily: 'monospace',
  },
}

export const Splash = ({ emblem, step = 0, cover = null }) => {
  const { t } = useTranslation()

  return (
    <div sx={Splash.styles.element} style={{ '--step': step, ...(cover && { minHeight: '85svh' }) } as any}>
      {cover}
      {emblem}
      <div sx={{ width: '100%' }}>
        <a href="https://github.com/thcolin/sensorr" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.reset' }}><h1>Sensorr</h1></a>
        <p>{t('keepInTouch.tagline')}</p>
      </div>
    </div>
  )
}

Splash.styles = {
  page: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'grayLightest',
    overflow: 'hidden',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: ['column-reverse', 'row'],
    overflow: ['scroll', 'hidden'],
  },
  element: {
    flex: 1,
    minHeight: '20em',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    padding: '1em 2em',
    overflow: 'hidden',
    zIndex: 0,
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '200%',
      height: '200%',
      top: '-50%',
      left: '-50%',
      flex: 1,
      backgroundImage: "url('https://i.pinimg.com/originals/3c/f6/56/3cf656908a2481110485bac3bf1297d9.jpg')",
      backgroundPosition: 'calc(50% - var(--step) * 12em) center',
      backgroundSize: '75%',
      transform: 'rotate(30deg)',
      transition: 'background-position 800ms ease-in-out',
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
      opacity: 0.25,
      zIndex: -1,
    },
  },
}

const KeepInTouch = () => {
  const { t } = useTranslation()
  useTitle(t('keepInTouch.title'))
  const api = useAPI()
  const [pin, setPin] = useState(null) as any
  const share = useShare(pin?.wrapped?.token)
  const look = share && lookOf(share.look.theme)

  useEffect(() => {
    let stopped = false
    let interval = null
    let currentPin = null
    let done = false

    const register = async () => {
      const { uri, params, init } = api.query.guests.register({})
      const fresh = await api.fetch(uri, params, init)

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
      } catch (err) {}

      return fresh
    }

    // Client-driven polling: a fresh request always succeeds when the tab returns to the
    // foreground, unlike the previous SSE whose server-side polling died on mobile backgrounding.
    const check = async ({ id, code }) => {
      if (stopped || done || id !== currentPin?.id) {
        return
      }

      try {
        const { uri, params, init } = api.query.guests.status({ id, code })
        const raw = await api.fetch(uri, params, init)

        if (raw.done) {
          done = true
          clearStoredPin()
          if (interval) {
            clearInterval(interval)
          }
          setPin(prev => ({ ...prev, done: true, wrapped: raw.wrapped }))
          return
        }

        if (raw.refused) {
          done = true
          clearStoredPin()
          if (interval) {
            clearInterval(interval)
          }
          setPin(prev => ({ ...prev, refused: true }))
          return
        }

        if (raw.expired) {
          clearStoredPin()
          if (interval) {
            clearInterval(interval)
          }
          await start()
        }
      } catch (err) {
        // Transient error (network / Plex hiccup): keep polling, the next tick retries
        console.warn(err)
      }
    }

    const start = async () => {
      if (interval) {
        clearInterval(interval)
      }

      try {
        const current = readStoredPin() || await register()

        if (stopped) {
          return
        }

        currentPin = current
        setPin(current)

        if (current.done) {
          done = true
          return
        }

        check(current)
        interval = setInterval(() => check(current), POLL_INTERVAL)
      } catch (err) {
        console.warn(err)
        toast.error(i18n.t('keepInTouch.pin'))
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && currentPin && !done) {
        check(currentPin)
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      stopped = true
      if (interval) {
        clearInterval(interval)
      }
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  return (
    <div sx={Splash.styles.page}>
      <LoadingBar />
      <div sx={KeepInTouch.styles.wrapper}>
        <div sx={KeepInTouch.styles.register}>
          <div sx={{ maxWidth: '40em', marginY: 'auto' }}>
            <Warning
              emoji='🍻'
              title={t('keepInTouch.heading')}
              subtitle={t('keepInTouch.subtitle')}
              children={(
                <div sx={{ marginY: 0 }}>
                  {pin?.refused ? (
                    <div>
                      <p sx={{ marginTop: 2 }}>
                        {t('keepInTouch.refused.title')}
                      </p>
                      <br/>
                      <p sx={{ fontSize: 6 }}>
                        {t('keepInTouch.refused.help')}
                      </p>
                    </div>
                  ) : pin?.done ? (
                    <div>
                      {!share && <Icon value='check' height='1em' width='1em' sx={{ fontSize: '4em', color: 'black' }} />}
                      <p sx={{ marginTop: 2 }}>
                        {t('keepInTouch.done.title')}
                      </p>
                      {share && (
                        <WrappedTicket token={pin.wrapped.token} share={share} look={look} />
                      )}
                      <br/>
                      <p sx={{ fontSize: 6, color: 'grayDark' }}>
                        <Trans t={t} i18nKey='keepInTouch.done.watchlist' components={[<a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }} />]} />
                        <br/><br/>
                        <Trans t={t} i18nKey='keepInTouch.device' components={[<a href="https://support.plex.tv/articles/115007577087-devices/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }} />, <a href="https://app.plex.tv/desktop/#!/settings/devices/all" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }} />]} />
                      </p>
                    </div>
                  ) : (
                    <div>
                      <a
                        href='https://plex.tv/link'
                        rel='noopener noreferrer'
                        target='_blank'
                        sx={KeepInTouch.styles.action}
                      >
                        <Trans t={t} i18nKey='keepInTouch.link.go' components={[<span sx={{ textDecoration: 'underline' }} />]} />
                      </a>
                      <br/>
                      <span>{t('keepInTouch.link.code')}</span>
                      <br/>
                      <code sx={{ fontSize: '4em', fontWeight: 'bold', color: 'black' }}>
                        {pin?.code || <Bar inline={true} width='2.75em' height='0.75em' />}
                      </code>
                      <p sx={{ fontSize: 6, marginTop: '2rem', textAlign: 'left', color: 'grayDark' }}>
                        <Trans t={t} i18nKey='keepInTouch.link.watchlist' components={[<a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }} />]} />
                        <br/><br/>
                        <Trans t={t} i18nKey='keepInTouch.device' components={[<a href="https://support.plex.tv/articles/115007577087-devices/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }} />, <a href="https://app.plex.tv/desktop/#!/settings/devices/all" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }} />]} />
                      </p>
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>
        <Splash
          emblem={<Emblem icon={<Icon value='plex' sx={{ height: '4em' }} />} label='Plex' />}
          cover={share && <WrappedPage token={pin.wrapped.token} theme={share.look.theme} look={look} />}
        />
        {look && <LookFont look={look} />}
      </div>
    </div>
  )
}

KeepInTouch.styles = {
  action: {
    variant: 'button.default',
    display: 'block',
    textDecoration: 'none',
    borderColor: 'primary',
    backgroundColor: 'primary',
    color: 'hsl(0, 0%, 100%)',
    marginBottom: 4,
    ':hover': {
      borderColor: 'primaryDark',
      backgroundColor: 'primaryDark',
    },
    ':active': {
      borderColor: 'primaryDarker',
      backgroundColor: 'primaryDarker',
    },
    ':disabled': {
      borderColor: 'primaryDarkest',
      backgroundColor: 'primaryDarkest',
    },
  },
  // The register comes first, so a phone opens on it, at the top of the page, as Onboarding does
  wrapper: {
    ...Splash.styles.wrapper,
    flexDirection: ['column', 'row-reverse'],
  },
  // A container, so the wrapped's ticket can take its whole width
  register: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: ['visible', 'auto'],
    containerType: 'inline-size',
  },
}

export default memo(KeepInTouch)
