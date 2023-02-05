import { memo, useCallback, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import toast from 'react-hot-toast'
import { Warning, Steps } from '@sensorr/ui'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'

const UIPlex = ({ ...props }) => {
  const { config } = useConfigContext()
  const api = useAPI()
  const [step, setStep] = useState(config.get('plex.token') ? 'token' : config.get('plex.url') ? 'pin' : 'url')

  const handleRegister = useCallback(async (e) => {
    e.preventDefault()
    const { uri, params, init } = api.query.plex.register({ body: { url: e.target.url.value } })

    try {
      const pin = await api.fetch(uri, params, init)
      config.set('plex.pin', pin)
      setStep('pin')
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
