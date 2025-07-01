import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { useAuthContext } from '../Auth/Auth'
import { useConfigContext } from '../Config/Config'
import { useAPI } from '../../store/api'

const urlB64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

const notificationsContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const { authenticated } = useAuthContext()
  const { config } = useConfigContext()
  const [loading, setLoading] = useState(false)
  const [subscribable, setSubscribable] = useState(null)
  const [subscribed, setSubscribed] = useState(null)
  const [notifications, setNotifications] = useState([])

  const subscribeNotifications = useCallback((e) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (Notification.permission === 'granted') {
            setSubscribed(true)
            return registration
          }

          return new Promise((resolve, reject) => {
            Notification.requestPermission((permission) => {
              if (permission !== 'granted') {
                setSubscribed(false)
                return reject('Notifications disabled by user')
              }

              setSubscribed(true)
              return resolve(registration)
            })
          })
        })
        .then((registration: ServiceWorkerRegistration) => {
          return registration.pushManager.getSubscription()
            .then((subscription) => {
              if(!subscription){
                registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(config.get('vapidPublicKey')) })
                  .then((subscription) => {
                    const { uri, params, init } = api.query.notifications.postSubscription({ body: subscription })
                    return api.fetch(uri, params, init)
                  })
              }
            })
            .then((res) => {
              console.log('Notifications subscription success')
            })
            .catch((err) => {
              console.warn('Notifications subscription failed:', err)
            })
        })
        .catch((err) => console.warn(err))
    }
  }, [config])

  const answerNotification = useCallback(async (id, choice) => {
    setNotifications(notifications => notifications.map((notification) => (
      id === notification._id ? { ...notification, meta: { ...(notification.meta || {}), choice } } : notification)
    ))
  }, [])

  const seenNotification = useCallback(async (id) => {
    setNotifications(notifications => notifications.map((notification) => (
      id === notification._id ? { ...notification, meta: { ...(notification.meta || {}), seen: true } } : notification)
    ))

    try {
      const { uri, params, init } = api.query.logs.ammendLog({ params: { log: id }, body: { 'meta.seen': true } })
      await api.fetch(uri, params, init)
    } catch (err) {
      console.warn(err)
    }
  }, [])

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const eventSource = new ReconnectingEventSource(`/api/notifications?authorization=Bearer%20${api.access_token}`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)
      setNotifications(notifications => Array.isArray(raw) ? raw : [...notifications, raw])
      setLoading(false)
    }

    return () => eventSource.close()
  }, [authenticated])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (
            !('PushManager' in window) ||
            !('showNotification' in (registration as ServiceWorkerRegistration))
          ) {
            setSubscribable(false)
          } else {
            setSubscribable(true)
          }

          if (Notification.permission === 'granted') {
            setSubscribed(true)
          } else {
            setSubscribed(false)
          }
        })
    }
  }, [])

  const sorted = useMemo(() => Object.values(notifications).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [notifications])

  return (
    <notificationsContext.Provider
      {...props}
      value={{
        loading,
        subscribable,
        subscribed,
        notifications: sorted,
        subscribeNotifications,
        seenNotification,
        answerNotification,
      }}
    />
  )
}

export const useNotificationsContext = () => useContext(notificationsContext)
