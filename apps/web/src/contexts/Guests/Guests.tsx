import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'

const guestsContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const { authenticated } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [guests, setGuests] = useState({})

  const deleteGuest = useCallback((email) => {
    const { uri, params, init } = api.query.guests.deleteGuest({ body: { email } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: `Deleting guest "${email}"...`,
      success: (data) => {
        setGuests(guests => Object.values(guests)
          .filter((guest: any) => guest.email !== email)
          .reduce((acc: any, guest: any) => ({ ...acc, [guest.email]: guest }), {})
        )

        return `Guest "${email}" successfully deleted !`
      },
      error: (err) => {
        console.warn(err)
        return `Error while deleting guest "${email}"`
      },
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
        toast.error('Error while fetching guests')
      } finally {
        setLoading(false)
      }
    }

    cb()
  }, [authenticated])

  return (
    <guestsContext.Provider {...props} value={{ loading, guests, deleteGuest }} />
  )
}

export const useGuestsContext = () => useContext(guestsContext)

export const withMovieGuestsContext = ({} = {}) => (WrappedComponent) => {
  const withMovieGuestsContext = ({ ...props }) => {
    const { loading, guests } = useGuestsContext() as any

    const metadata = useMemo(() => ({
      ...(props.metadata || {}),
      requested_by: loading ? [] : (props.metadata?.requested_by || []).map(guest => guests[guest]),
    }), [props.metadata, loading, guests])

    return (
      <WrappedComponent {...props} metadata={metadata} />
    )
  }

  withMovieGuestsContext.displayName = `withMovieGuestsContext(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withMovieGuestsContext
}

