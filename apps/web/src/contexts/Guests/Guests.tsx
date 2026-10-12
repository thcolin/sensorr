import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import i18n from '@sensorr/i18n'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'

const guestsContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const { authenticated } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [guests, setGuests] = useState({})
  const ref = useRef(guests)
  ref.current = guests

  const deleteGuest = useCallback((email) => {
    const { uri, params, init } = api.query.guests.deleteGuest({ body: { email } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: i18n.t('contexts.guests.delete.loading', { email }),
      success: (data) => {
        setGuests(guests => Object.values(guests)
          .filter((guest: any) => guest.email !== email)
          .reduce((acc: any, guest: any) => ({ ...acc, [guest.email]: guest }), {})
        )

        return i18n.t('contexts.guests.delete.success', { email })
      },
      error: (err) => {
        console.warn(err)
        return i18n.t('contexts.guests.delete.error', { email })
      },
    })
  }, [])

  // Shown at once and written one after the other for a guest, so they land in order. A failed write puts back the
  // last value the API took, unless a newer change is on its way
  const writes = useRef<{ [email: string]: { queue: Promise<void>, saved: string[], latest: number } }>({})
  const setGuestAutoAccept = useCallback((email: string, auto_accept: string[]) => {
    const write = writes.current[email] ||= { queue: Promise.resolve(), saved: ref.current[email]?.auto_accept || [], latest: 0 }
    const version = ++write.latest
    setGuests((guests) => ({ ...guests, [email]: { ...guests[email], auto_accept } }))

    write.queue = write.queue.then(async () => {
      try {
        const { uri, params, init } = api.query.guests.postGuest({ body: { email, auto_accept } })
        await api.fetch(uri, params, init)
        write.saved = auto_accept
      } catch (err) {
        console.warn(err)
        toast.error(i18n.t('settings.friends.accept.error', { name: ref.current[email]?.name || email }))

        if (version === write.latest) {
          setGuests((guests) => ({ ...guests, [email]: { ...guests[email], auto_accept: write.saved } }))
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const cb = async () => {
      try {
        const { uri, params, init } = api.query.guests.getGuests()
        const { results } = await api.fetch(uri, params, init)
        setGuests(results.reduce((guests, guest) => ({ ...guests, [guest.email]: guest }), {}))
      } catch (err) {
        console.warn(err)
      } finally {
        setLoading(false)
      }
    }

    cb()
  }, [authenticated])

  return (
    <guestsContext.Provider {...props} value={{ loading, guests, deleteGuest, setGuestAutoAccept }} />
  )
}

export const useGuestsContext = () => useContext(guestsContext)

export const withMovieGuestsContext = ({} = {}) => (WrappedComponent) => {
  const WithMovieGuestsContext = ({ ...props }) => {
    const { loading, guests } = useGuestsContext() as any

    const metadata = useMemo(() => ({
      ...(props.metadata || {}),
      requested_by: loading ? [] : (props.metadata?.requested_by || []).map(guest => guests[guest]),
    }), [props.metadata, loading, guests])

    return (
      <WrappedComponent {...props} metadata={metadata} />
    )
  }

  WithMovieGuestsContext.displayName = `withMovieGuestsContext(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithMovieGuestsContext
}

