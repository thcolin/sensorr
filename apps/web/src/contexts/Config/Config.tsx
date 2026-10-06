import config from '@sensorr/config'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { useSensorr } from '../../store/sensorr'
import i18n from '@sensorr/i18n'

const configContext = createContext({})

export const Provider = ({ children = null, ...props }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const sensorr = useSensorr()
  const { authenticated, setAuthenticated } = useAuthContext()
  const [singleton, setSingleton] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async (raw) => {
    config.load(raw)

    i18n.changeLanguage(config.get('region') || localStorage.getItem('region') || 'en-US')

    sensorr.znabs = config.get('znabs')
    sensorr.policies = config.get('policies')
    sensorr.region = config.get('region')

    tmdb.key = config.get('tmdb')
    tmdb.region = config.get('region') || localStorage.getItem('region') || 'en-US'
    tmdb.adult = config.get('adult')
    await tmdb.init()
  }, [])

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const cb = async () => {
      try {
        setError(null)
        const { uri, params, init } = api.query.config.getConfig({})
        const raw = await api.fetch(uri, params, init)

        await load(raw)

        setSingleton(config)
      } catch (err) {
        console.warn(err)

        // Only a refused token logs out: a gateway timeout or an invalid config keeps the session
        if (err?.status === 401) {
          setAuthenticated(false)
        } else {
          setError(err)
        }
      }
    }

    cb()
  }, [authenticated, attempt])

  const retry = useCallback(() => setAttempt((attempt) => attempt + 1), [])

  return (
    <configContext.Provider {...props} value={{ config: singleton, load, error, retry }}>
      {children}
    </configContext.Provider>
  )
}

export const useConfigContext = () => useContext(configContext) as { config: { [key: string]: any }, load: (raw: any) => Promise<void>, error: Error | null, retry: () => void }
