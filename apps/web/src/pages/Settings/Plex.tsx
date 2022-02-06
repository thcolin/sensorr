import { Children, memo, useCallback, useState } from 'react'
import { Warning } from '@sensorr/ui'
import config, { handleConfigChange } from '../../store/config'
import api from '../../store/api'

const UIPlex = ({ ...props }) => {
  const [step, setStep] = useState(config.get('plex.token') ? 'token' : config.get('plex.url') ? 'pin' : 'url')

  const handleRegister = useCallback(async (e) => {
    e.preventDefault()
    const { uri, params, init } = api.query.plex.register({ body: { url: e.target.url.value } })

    try {
      const pin = await api.fetch(uri, params, init)
      config.set('plex.pin', pin)
      setStep('pin')
      const eventSource = new EventSource(`/api/plex/${pin.id}`)
      eventSource.onmessage = ({ data }) => {
        const raw = JSON.parse(data)

        if (raw.error) {
          console.warn(raw.error)
          return
        }

        if (raw.token) {
          config.set('plex.token', raw.token)
          setStep('token')
          eventSource.close()
        }
      }
    } catch (e) {
      console.warn(e)
    }
  }, [])

  const handleReset = useCallback(async () => {
    const { uri, params, init } = api.query.plex.reset({})

    try {
      await api.fetch(uri, params, init)
      config.set('plex.url', '')
      config.set('plex.pin.id', '')
      config.set('plex.pin.code', '')
      config.set('plex.token', '')
      setStep('url')
    } catch (e) {
      console.warn(e)
    }
  }, [])

  return (
    <Warning
      emoji='📡'
      title='Plex'
      subtitle='Configure Sensorr with your own Plex'
      children={(
        <Steps value={{ url: 0, pin: 1, token: 2 }[step]}>
          <form onSubmit={handleRegister}>
            <input name='url' type='url' placeholder='http://192.168.0.42:32400' defaultValue={config.get('plex.url')} />
            <button type='submit'>Register</button>
          </form>
          <div>
            <p>Waiting for token</p>
            <code>{config.get('plex.pin.code')}</code>
            <p>Please complete <a href='https://plex.tv/pin' target='_blank' rel='norefer noopener'>Plex account link</a> with Sensorr using 4-character code below</p>
          </div>
          <div>
            <p>Plex ready !</p>
            <code>{config.get('plex.token')}</code>
            <br/>
            <label>
              <input type='checkbox' defaultChecked={config.get('plex.doctor')} onChange={e => handleConfigChange('plex.doctor', !!e.target.checked, { onError: e => console.warn(e), onSuccess: (value) => console.log('Success', value) })} />
              <span>Doctor</span>
            </label>
            <br/>
            <button type='button' onClick={handleReset}>Unregister</button>
          </div>
        </Steps>
      )}
    />
  )
}

const Plex = memo(UIPlex)

export default Plex

const Steps = ({ children, value, ...props }) => {
  return (
    <div sx={Steps.styles.element}>
      <div>
        {Array(Children.count(children)).fill(true).map((_, i) => (
          <i key={i} data-enabled={i === value}></i>
        ))}
      </div>
      <div style={{ transform: `translateX(-${ value * 100}%)` }}>
        {children}
      </div>
    </div>
  )
}

Steps.styles = {
  element: {
    marginY: 4,
    overflow: 'hidden',
    '&>div:first-child': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
      '&>i': {
        width: '0.5rem',
        height: '0.5rem',
        borderRadius: '50%',
        backgroundColor: 'gray4',
        transition: 'all 100ms ease-in-out',
        '&[data-enabled=true]': {
          backgroundColor: '#fff',
        },
        '&:not(:last-child)': {
          marginRight: '0.5rem',
        },
      },
    },
    '&>div:last-child': {
      display: 'flex',
      transition: 'transform 400ms ease-in-out',
      '>*': {
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: '100%',
      },
    },
  },
}
