import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../../store/api'
import { useTMDB } from '../../store/tmdb'

const personsMetadataContext = createContext({})

export const Provider = ({ ...props }) => {
  const tmdb = useTMDB()
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState({})

  useEffect(() => {
    const controller = new AbortController()
    const cb = async () => {
      const { uri, params, init } = api.query.persons.getMetadata({ init: { signal: controller.signal } })
      try {
        const body = await api.fetch(uri, params, init)
        setMetadata(body)
      } catch (e) {
        console.warn(e)
      } finally {
        setLoading(false)
      }
    }

    cb()
    return () => controller.abort()
  }, [])

  const setPersonState = useCallback(async (
    id: number,
    state: 'ignored' | 'followed'
  ) => {
    setMetadata(metadata => state === 'ignored' ?
      Object.keys(metadata).filter(_id => parseInt(_id) !== id).reduce((acc, curr) => ({ ...acc, [curr]: metadata[curr] }), {}) :
      ({ ...metadata, [id]: { state } })
    )

    try {
      const person = await tmdb.fetch(`person/${id}`)
      const { uri, params, init } = api.query.persons.postPerson({ body: { ...person, state, updated_at: new Date().getTime() } })
      await api.fetch(uri, params, init)
    } catch (e) {
      setMetadata(metadata => Object.keys(metadata).filter(_id => parseInt(_id) !== id).reduce((acc, curr) => ({ ...acc, [curr]: metadata[curr] }), {}))
      console.warn(e)
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
