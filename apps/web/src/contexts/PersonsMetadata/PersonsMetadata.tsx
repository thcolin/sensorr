import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'

const personsMetadataContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const { authenticated } = useAuthContext()
  const refreshTime = useRef() as any
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState({})

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const cb = async () => {
      try {
        let total_pages = null
        let page = 0

        do {
          const { uri, params, init } = api.query.persons.getMetadata({ params: { page: page++ } })
          const raw = await api.fetch(uri, params, init)
          total_pages = raw.total_pages
          setMetadata(metadata => ({ ...metadata, ...raw.results }))
        } while (!total_pages || page <= total_pages)
      } catch (e) {
        console.warn(e)
      }

      setLoading(false)
    }

    cb()

    // Refresh if page was at sleep for 10s
    setInterval(() => {
      const currentTime = (new Date()).getTime()

      if (currentTime > (refreshTime.current + 10000)) {
        cb()
      }

      refreshTime.current = currentTime
    }, 2000)
  }, [authenticated])

  const setPersonState = useCallback(async (
    id: number,
    state: 'ignored' | 'followed'
  ) => {
    setMetadata(metadata => state === 'ignored' ?
      Object.keys(metadata).filter(_id => Number(_id) !== id).reduce((acc, curr) => ({ ...acc, [curr]: metadata[curr] }), {}) :
      ({ ...metadata, [id]: { state } })
    )

    try {
      const person = await tmdb.fetch(`person/${id}`)
      const { uri, params, init } = api.query.persons.postPerson({ body: { ...person, state, updated_at: new Date().getTime() } })
      await api.fetch(uri, params, init)
    } catch (err) {
      setMetadata(metadata => Object.keys(metadata).filter(_id => Number(_id) !== id).reduce((acc, curr) => ({ ...acc, [curr]: metadata[curr] }), {}))
      console.warn(err)
      toast.error('Error while updating person metadata')
    }
  }, [setMetadata])

  return (
    <personsMetadataContext.Provider
      {...props}
      value={{
        loading,
        metadata,
        setPersonState,
      }}
    />
  )
}

export const usePersonsMetadataContext = () => useContext(personsMetadataContext)

export const withPersonsMetadataContext = () => (WrappedComponent) => {
  const withPersonsMetadataContext = ({ entity, ...props }) => {
    const { loading, metadata, setPersonState } = usePersonsMetadataContext() as any
    const setState = useCallback(state => setPersonState(entity.id, state), [entity?.id])

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        state={loading ? 'loading' : (metadata[entity?.id]?.state || 'ignored')}
        setState={setState}
      />
    )
  }

  withPersonsMetadataContext.displayName = `withPersonsMetadataContext(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withPersonsMetadataContext
}
