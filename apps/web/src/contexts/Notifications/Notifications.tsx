import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'

const notificationsContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const { authenticated } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const eventSource = new ReconnectingEventSource(`/api/notifications?authorization=Bearer%20${api.access_token}`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)
      setNotifications(notifications => raw.job ? [...notifications, raw] : raw)
      setLoading(false)
    }

    return () => eventSource.close()
  }, [authenticated])

  const sorted = useMemo(() => Object.values(notifications).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [notifications])

  return (
    <notificationsContext.Provider
      {...props}
      value={{
        loading,
        notifications: sorted,
      }}
    />
  )
}

export const useNotificationsContext = () => useContext(notificationsContext)
