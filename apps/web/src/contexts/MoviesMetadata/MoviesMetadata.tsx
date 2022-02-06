import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../../store/api'
import { useTMDB } from '../../store/tmdb'

const moviesMetadataContext = createContext({})

export const Provider = ({ ...props }) => {
  const tmdb = useTMDB()
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState({})

  useEffect(() => {
    const cb = async () => {
      const { uri, params, init } = api.query.movies.getMetadata({})

      try {
        const body = await api.fetch(uri, params, init)
        setMetadata(body)
        const eventSource = new EventSource('/api/movies/changes')
        eventSource.onmessage = ({ data }) => setMetadata(JSON.parse(data))
      } catch (e) {
        console.warn(e)
      } finally {
        setLoading(false)
      }
    }

    cb()
  }, [])

  const setMovieMetadata = useCallback(async (
    id: number,
    key: 'state' | 'query' | 'policy' | null,
    value: any
  ) => {
    setMetadata(metadata => ({ ...metadata, [id]: { ...(metadata[id] || {}), ...(key ? { [key]: value } : value) } }))

    try {
      const movie = await tmdb.fetch(`movie/${id}`, {
        append_to_response: 'alternative_titles,release_dates',
      })

      // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
      movie.release_dates.results = movie.release_dates.results
        .filter(({ type }) => type === 3)
        .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])

      const { uri, params, init } = api.query.movies.postMovie({ body: { ...movie, ...(key ? { [key]: value } : value), updated_at: new Date().getTime() } })
      await api.fetch(uri, params, init)
    } catch (e) {
      setMetadata(metadata => ({ ...metadata, [id]: { ...(metadata[id] || {}), ...(key ? { [key]: null } : {}) } }))
      console.warn(e)
    }
  }, [setMetadata])

  return (
    <moviesMetadataContext.Provider
      {...props}
      value={{
        loading,
        metadata,
        setMovieMetadata,
      }}
    />
  )
}

export const useMoviesMetadataContext = () => useContext(moviesMetadataContext)

export const withMovieMetadataContext = () => (WrappedComponent) => {
  const withMovieMetadataContext = ({ entity, ...props }) => {
    const { loading, metadata: { [entity.id]: metadata = {} }, setMovieMetadata } = useMoviesMetadataContext() as any
    const setMetadata = useCallback((key, value) => setMovieMetadata(entity.id, key, value), [entity?.id])
    const setState = useCallback(state => setMetadata('state', state), [setMetadata])

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        state={loading ? 'loading' : (metadata?.state || 'ignored')}
        setState={setState}
        metadata={metadata}
        setMetadata={setMetadata}
      />
    )
  }

  withMovieMetadataContext.displayName = `withMovieMetadataContext(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withMovieMetadataContext
}
