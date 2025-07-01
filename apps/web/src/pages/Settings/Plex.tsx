import { memo, useCallback, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import toast from 'react-hot-toast'
import { Icon, Warning } from '@sensorr/ui'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'

const UIPlex = ({ ...props }) => {
  const { config } = useConfigContext()
  const api = useAPI()
  const [registering, setRegistering] = useState(false)
  const [step, setStep] = useState(config.get('plex.token') ? 'token' : config.get('plex.url') ? 'pin' : 'url')

  const handleRegister = useCallback(async (e) => {
    setRegistering(true)
    e.preventDefault()
    const { uri, params, init } = api.query.plex.register({ body: { url: e.target.url.value } })

    try {
      const pin = await api.fetch(uri, params, init)
      config.set('plex.pin', pin)
      setStep('pin')
      setRegistering(false)
      const eventSource = new ReconnectingEventSource(`/api/plex/${pin.id}?authorization=Bearer%20${api.access_token}`)
      eventSource.onmessage = ({ data }) => {
        const raw = JSON.parse(data)

        if (raw.error) {
          console.warn(raw.error)
          toast.error('Error while fetching Plex PIN')
          return
        }

        if (raw.token) {
          config.set('plex.token', raw.token)
          setStep('token')
          eventSource.close()
        }
      }
    } catch (err) {
      console.warn(err)
      toast.error('Error while fetching Plex PIN')
    }
  }, [])

  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to unregister your Plex server ? Every releases from this server will be removed from Sensorr, but movies will still be "archived"')) {
      return
    }

    const { uri, params, init } = api.query.plex.reset({})

    try {
      await api.fetch(uri, params, init)
      config.set('plex.url', '')
      config.set('plex.pin.id', '')
      config.set('plex.pin.code', '')
      config.set('plex.token', '')
      setStep('url')
    } catch (err) {
      console.warn(err)
      toast.error('Error while reseting Plex configuration')
    }
  }, [])

  return (
    <div
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        height: '100%',
        overflow: ['auto', 'hidden'],
        '>*': {
          position: 'relative',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          minWidth: ['80%', 'auto'],
          marginX: 11,
          backgroundColor: 'primaryDark',
          transition: 'opacity 400ms ease-in-out',
          '&:first-child': {
            marginLeft: 12,
          },
          '&:last-child': {
            marginRight: 12,
          },
        },
      }}
    >
      <div sx={{ opacity: step === 'url' ? 1 : 0.5 }}>
        <div sx={UIPlex.styles.step}>1</div>
        <Warning
          emoji='📡'
          title='Your Plex Server'
          subtitle='Connect your Plex server to enable library synchronization between your Plex library and Sensorr movies releases'
          children={(
            <div sx={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <form onSubmit={handleRegister} sx={UIPlex.styles.inputs}>
                <input name='url' type='url' placeholder='http://192.168.0.42:32400' defaultValue={config.get('plex.url')} disabled={step !== 'url'} />
                <button type='submit' disabled={step !== 'url'}>Register</button>
              </form>
              {registering && (
                <Icon value='spinner' sx={{ position: 'absolute', bottom: '-1em' }} />
              )}
            </div>
          )}
        />
      </div>
      <div sx={{ opacity: step === 'pin' ? 1 : 0.5 }}>
        <div sx={UIPlex.styles.step}>2</div>
        <Warning
          emoji='🔑'
          title='Authorize Sensorr'
          subtitle={<span>Complete your Plex server registration with Sensorr on <a href={step === 'pin' ? 'https://plex.tv/pin' : null} target='_blank' rel='norefer noopener' sx={{ color: 'accentDarkest' }}>Plex website</a> using 4-character PIN code below</span>}
          children={(
            <div sx={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div sx={UIPlex.styles.inputs}>
                <label>PIN</label>
                <input type='text' value={config.get('plex.pin.code')} sx={{ cursor: 'text', textAlign: 'center' }} disabled={true} />
                <button
                  type='button'
                  onClick={() =>  {
                    navigator.clipboard.writeText(config.get('plex.pin.code'))
                    toast.success('PIN copied to clipboard !')
                  }}
                  disabled={step !== 'pin'}
                >
                  Copy
                </button>
              </div>
              {step === 'pin' && (
                <Icon value='spinner' sx={{ position: 'absolute', bottom: '-1em' }} />
              )}
            </div>
          )}
        />
      </div>
      <div sx={{ opacity: step === 'token' ? 1 : 0.5 }}>
        <div sx={UIPlex.styles.step}>3</div>
        <Warning
          emoji='🔗'
          title='Plex Server Linked !'
          subtitle={<span>The connection between your Plex Server and Sensorr is now successful, you're now able to sync your Plex movie library with <code sx={{ backgroundColor: 'accent', paddingY: 11, paddingX: 9, borderRadius: '0.25em' }}>sync</code> job</span>}
          children={(
            <div sx={UIPlex.styles.inputs}>
              <label>Token</label>
              <input type='text' value={config.get('plex.token')} sx={{ cursor: 'text', textAlign: 'center' }} disabled={true} />
              <button type='button' onClick={handleReset} disabled={step !== 'token'}>Unregister</button>
            </div>
          )}
        />
      </div>
    </div>
  )
}

UIPlex.styles = {
  step: {
    position: 'absolute',
    top: '2em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 2,
    fontWeight: 'bold',
    height: '1.75em',
    width: '1.75em',
    borderRadius: '1.75em',
    backgroundColor: 'whitePure',
    color: 'primary',
  },
  inputs: {
    display: 'flex',
    flexDirection: 'row',
    marginY: '3em',
    marginBottom: '5em',
    width: '100%',
    '>*': {
      border: '1px solid',
      borderLeft: 'none',
      borderColor: 'whitePure',
      borderRadius: '0px !important',
      color: 'whitePure',
    },
    '>*:first-child': {
      borderLeft: '1px solid',
      borderTopLeftRadius: '0.25rem !important',
      borderBottomLeftRadius: '0.25rem !important',
    },
    '>*:last-child': {
      borderTopRightRadius: '0.25rem !important',
      borderBottomRightRadius: '0.25rem !important',
    },
    '>input': {
      variant: 'input.default',
      flex: 1,
      fontFamily: 'monospace',
      fontSize: 5,
      borderColor: 'whitePure',
      ':hover:not(:disabled):not(:focus):not(:active)': {
        borderColor: 'whitePure',
      },
      ':focus,:active:not(:disabled)': {
        borderColor: 'whitePure',
      },
      ':disabled': {
        borderColor: 'whitePure',
        color: 'whitePure',
      },
    },
    '>label': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      fontSize: 5,
      fontWeight: 'bold',
      paddingX: 4,
      backgroundColor: 'whitePure',
      color: 'primary',
    },
    '>button': {
      variant: 'button.default',
      backgroundColor: 'accentDark',
      marginLeft: '-1px',
      borderLeft: 'none',
      borderColor: 'accentDark',
      ':hover:not(:disabled)': {
        backgroundColor: 'accentDarker',
        borderColor: 'accentDarker',
      },
      ':active': {
        backgroundColor: 'accentDarkest',
        borderColor: 'accentDarkest',
      },
    },
  },
}

const Plex = memo(UIPlex)

export default Plex
