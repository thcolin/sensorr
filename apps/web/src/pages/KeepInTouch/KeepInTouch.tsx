import { memo, useEffect, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import toast from 'react-hot-toast'
import { Warning, Icon } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { LoadingBar } from '../../layout/LoadingBar'

const KeepInTouch = () => {
  const api = useAPI()
  const [pin, setPin] = useState(null) as any

  useEffect(() => {
    const cb = async () => {
      const { uri, params, init } = api.query.guests.register({})

      try {
        const pin = await api.fetch(uri, params, init)
        setPin(pin)

        if (pin.done) {
          return
        }

        const eventSource = new ReconnectingEventSource(`/api/guests/${pin.id}`)
        eventSource.onmessage = ({ data }) => {
          const raw = JSON.parse(data)

          if (raw.error) {
            console.warn(raw.error)
            eventSource.close()
            toast.error('Error while fetching Plex PIN, contact administrator')
            return
          }

          if (raw.done) {
            setPin(pin => ({ ...pin, done: true }))
            eventSource.close()
          }
        }
      } catch (err) {
        console.warn(err)
        toast.error('Error while fetching Plex PIN, contact administrator')
      }
    }

    cb()
  }, [])

  return (
    <div sx={KeepInTouch.styles.element}>
      <LoadingBar />
      <div sx={KeepInTouch.styles.wrapper}>
        <div sx={KeepInTouch.styles.splash}>
          <div sx={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <span>
              <Icon value='plex' sx={{ fontSize: '5em', height: '' }} />
              <span sx={{ display: 'block', marginLeft: 4, fontFamily: 'heading', fontWeight: 'heading', lineHeight: 'heading' }}>Plex</span>
            </span>
            <span sx={{ fontSize: '2em', paddingLeft: 8, paddingRight: 4, fontFamily: 'monospace' }}>
              +
            </span>
            <span>
              <span sx={{ fontSize: '4em', height: '' }}>🍿</span>
              <br/>
              <span sx={{ display: 'block', marginBottom: '-12px', paddingTop: '7px', fontFamily: 'heading', fontWeight: 'heading', lineHeight: 'heading' }}>sensorr</span>
            </span>
          </div>
          <div sx={{ width: '100%' }}>
          <a href="https://github.com/thcolin/sensorr" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.reset' }}><h1>Sensorr</h1></a>
            <p>A Friendly Digital Video Recorder. Think VCR but in modern times.</p>
          </div>
        </div>
        <div sx={KeepInTouch.styles.register}>
          <div sx={{ maxWidth: '40em' }}>
            <Warning
              emoji='🍻'
              title='Keep In Touch'
              subtitle='Someone wonderful want to follow your Plex watchlist and consider your movie wishes !'
              children={(
                <div sx={{ marginY: 0 }}>
                  {pin?.done ? (
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
                  ) : pin?.code ? (
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
                      <code sx={{ fontSize: '4em', fontWeight: 'bold', color: 'black' }}>{pin.code}</code>
                      <p sx={{ fontSize: 6, marginTop: '2rem', textAlign: 'left' }}>
                        Linking your Plex account with Sensorr server will allow administrator to follow movies from your <a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>Plex "Watchlist"</a> and consider adding them to his library.
                        <br/><br/>
                        Sensorr server will be listed as an <a href="https://support.plex.tv/articles/115007577087-devices/" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>authorized device</a> on your <a href="https://app.plex.tv/desktop/#!/settings/devices/all" target='_blank' rel='noreferer noopener' sx={{ variant: 'link.default' }}>Plex account</a> where you can manage it.
                      </p>
                    </div>
                  ) : (
                    <div sx={{ fontSize: '4em' }}>
                      <Icon value='spinner' />
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
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'grayLightest',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  splash: {
    flex: 1,
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
      backgroundPosition: 'center',
      backgroundSize: '75%',
      transform: 'rotate(30deg)',
      opacity: 0.25,
      zIndex: -1,
    },
  },
  register: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
}

export default memo(KeepInTouch)
