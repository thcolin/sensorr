import config from '@sensorr/config'
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { useSensorr } from '../../store/sensorr'
import i18n from '../../store/i18n'

const configContext = createContext({})

export const Provider = ({ children, ...props }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const sensorr = useSensorr()
  const { authenticated, setAuthenticated } = useAuthContext()
  const [singleton, setSingleton] = useState(null)

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const cb = async () => {
      try {
        const { uri, params, init } = api.query.config.getConfig({})
        const raw = await api.fetch(uri, params, init)

        config.load(raw)

        i18n.changeLanguage(config.get('region') || localStorage.getItem('region') || 'en-US')

        sensorr.znabs = config.get('znabs')
        sensorr.policies = config.get('policies')
        sensorr.region = config.get('region')

        tmdb.key = config.get('tmdb')
        tmdb.region = config.get('region') || localStorage.getItem('region') || 'en-US'
        tmdb.adult = config.get('adult')
        await tmdb.init()

        setSingleton(config)
      } catch (err) {
        console.warn(err)
        setAuthenticated(false)
      }
    }

    cb()
  }, [authenticated])

  return (
    <configContext.Provider {...props} value={{ config: singleton }}>
      {children}
    </configContext.Provider>
  )
}

export const useConfigContext = () => useContext(configContext) as { config: { [key: string]: any } }
