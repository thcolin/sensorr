import { memo, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, Warning, Icon } from '@sensorr/ui'
import { useTitle } from '@sensorr/utils'
import { useAPI } from '../../store/api'
import { LoadingBar } from '../../layout/LoadingBar'

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

export const Emblem = ({ icon, label }) => (
  <div sx={Emblem.styles.element}>
    <EmblemSide icon={icon} label={label} />
    <span sx={Emblem.styles.plus}>+</span>
    <EmblemSide icon={<span sx={{ fontSize: '4em', lineHeight: 1 }}>🍿</span>} label='sensorr' />
  </div>
)

Emblem.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    alignSelf: 'center',
    marginY: 'auto',
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

export const Splash = ({ emblem, step = 0 }) => (
  <div sx={Splash.styles.element} style={{ '--step': step } as any}>
    {emblem}
    <div sx={{ width: '100%' }}>
      <a href="https://github.com/thcolin/sensorr" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.reset' }}><h1>Sensorr</h1></a>
      <p>A Friendly Digital Video Recorder. Think VCR but in modern times.</p>
    </div>
  </div>
)

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
  useTitle('Keep in touch')
  const api = useAPI()
  const [pin, setPin] = useState(null) as any

  useEffect(() => {
    let stopped = false
    let interval = null
    let currentId = null
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
    const check = async (id) => {
      if (stopped || done || id !== currentId) {
        return
      }

      try {
        const { uri, params, init } = api.query.guests.status({ id })
        const raw = await api.fetch(uri, params, init)

        if (raw.done) {
          done = true
          clearStoredPin()
          if (interval) {
            clearInterval(interval)
          }
          setPin(prev => ({ ...prev, done: true }))
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

        currentId = current.id
        setPin(current)

        if (current.done) {
          done = true
          return
        }

        check(current.id)
        interval = setInterval(() => check(current.id), POLL_INTERVAL)
      } catch (err) {
        console.warn(err)
        toast.error('Error while fetching Plex PIN, contact administrator')
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && currentId && !done) {
        check(currentId)
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
      <div sx={Splash.styles.wrapper}>
        <Splash emblem={<Emblem icon={<Icon value='plex' sx={{ height: '4em' }} />} label='Plex' />} />
        <div sx={KeepInTouch.styles.register}>
          <div sx={{ maxWidth: '40em', overflow: ['visible', 'scroll'] }}>
            <Warning
              emoji='🍻'
              title='Keep In Touch'
              subtitle='Someone wonderful want to follow your Plex watchlist and consider your movie wishes !'
              children={(
                <div sx={{ marginY: 0 }}>
                  {pin?.refused ? (
                    <div>
                      <p sx={{ marginTop: 2 }}>
                        This Plex account is not one the Plex server of this Sensorr is shared with.
                      </p>
                      <br/>
                      <p sx={{ fontSize: 6 }}>
                        Ask the person who sent you this link to share their Plex server with you, then open it again. Or sign in to Plex with the account they share it with.
                      </p>
                    </div>
                  ) : pin?.done ? (
                    <div>
                      <Icon value='check' height='1em' width='1em' sx={{ fontSize: '4em', color: 'black' }} />
                      <p sx={{ marginTop: 2 }}>
                        Thanks, you've linked your Plex account with Sensorr server !
                      </p>
                      <br/>
                      <p sx={{ fontSize: 6 }}>
                        Administrator is now allowed to follow movies from your <a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>Plex "Watchlist"</a> and consider adding them to his library.
                        <br/><br/>
                        Sensorr server will be listed as an <a href="https://support.plex.tv/articles/115007577087-devices/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>authorized device</a> on your <a href="https://app.plex.tv/desktop/#!/settings/devices/all" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>Plex account</a> where you can manage it.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <a
                        href='https://plex.tv/link'
                        rel='noopener noreferrer'
                        target='_blank'
                        sx={{
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
                        }}
                      >
                        Go to <span sx={{ textDecoration: 'underline' }}>plex.tv/link</span>
                      </a>
                      <br/>
                      <span>And enter below code to link your Plex account with Sensorr server :</span>
                      <br/>
                      <code sx={{ fontSize: '4em', fontWeight: 'bold', color: 'black' }}>
                        {pin?.code || <Bar inline={true} width='2.75em' height='0.75em' />}
                      </code>
                      <p sx={{ fontSize: 6, marginTop: '2rem', textAlign: 'left', color: 'grayDark' }}>
                        Linking your Plex account with Sensorr server will allow administrator to follow movies from your <a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>Plex "Watchlist"</a> and consider adding them to his library.
                        <br/><br/>
                        Sensorr server will be listed as an <a href="https://support.plex.tv/articles/115007577087-devices/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>authorized device</a> on your <a href="https://app.plex.tv/desktop/#!/settings/devices/all" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>Plex account</a> where you can manage it.
                      </p>
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

KeepInTouch.styles = {
  register: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
}

export default memo(KeepInTouch)
