declare const SENSORR: { config: any }

import config from '@sensorr/config'
import api from './api'

config.load(SENSORR.config)

export default config

export const handleConfigChange = async (key, value, { onError, onSuccess }) => {
  const { uri, params, init } = api.query.config.putConfig({ body: { key, value } })
  const initial = config.get(key)
  config.set(key, value)

  try {
    const raw = await api.fetch(uri, params, init)

    if (raw.error) {
      throw new Error(raw.error)
    }

    if (raw.success) {
      onSuccess(value)
    }
  } catch (e) {
    config.set(key, initial)
    onError(e)
  }
}
