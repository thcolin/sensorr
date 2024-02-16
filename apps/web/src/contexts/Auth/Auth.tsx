import { createContext, useCallback, useContext, useState } from 'react'
import jwtDecode from 'jwt-decode'
import { useAPI } from '../../store/api'
import { useSensorr } from '../../store/sensorr'

let AUTHENTICATED = false

try {
  const access_token = localStorage.getItem('sensorr_access_token')
  const raw = jwtDecode(access_token) as any
  AUTHENTICATED = new Date().getTime() < (raw.exp * 1000)
} catch (e) {
  console.warn(e)
}

const authContext = createContext({})

export const Provider = ({ children = null, ...props }) => {
  const api = useAPI()
  const sensorr = useSensorr()
  const [authenticated, setAuthenticated] = useState(AUTHENTICATED)
  const authenticate = useCallback((access_token) => {
    localStorage.setItem('sensorr_access_token', access_token)
    api.access_token = access_token
    sensorr.options.access_token = access_token
    setAuthenticated(true)
  }, [])

  return (
    <authContext.Provider {...props} value={{ authenticated, authenticate, setAuthenticated }}>
      {children}
    </authContext.Provider>
  )
}

export const useAuthContext = () => useContext(authContext) as {
  authenticated: boolean,
  authenticate: (access_token: string) => void,
  setAuthenticated: (value: any) => void
}
