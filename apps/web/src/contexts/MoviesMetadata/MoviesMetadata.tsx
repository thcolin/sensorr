import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import toast from 'react-hot-toast'
import { Policy } from '@sensorr/sensorr'
import { useAuthContext } from '../Auth/Auth'
import { useConfigContext } from '../Config/Config'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { useSensorr } from '../../store/sensorr'

const moviesMetadataContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const { config } = useConfigContext()
  const sensorr = useSensorr()
  const { authenticated } = useAuthContext()
  const ref = useRef() as any
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
          const { uri, params, init } = api.query.movies.getMetadata({ params: { page: page++ } })
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

    try {
      const eventSource = new ReconnectingEventSource(`/api/movies/changes?authorization=Bearer%20${api.access_token}`)
      eventSource.onmessage = ({ data }) => setMetadata(metadata => ({ ...metadata, ...JSON.parse(data) }))
      return () => eventSource.close()
    } catch (e) {
      console.warn(e)
    }
  }, [authenticated])

  useEffect(() => {
    ref.current = metadata
  }, [metadata])

  const setMovieMetadata = useCallback(async (
    id: number | number[],
    key: 'state' | 'query' | 'policy' | 'refine' | 'shrink' | 'release' | 'releases' | 'proposal' | 'banned_releases' | null,
    value: any
  ) => {
    const ids = Array.isArray(id) ? id : [id]
    const initial = Object.keys(ref.current).filter(i => ids.includes(Number(i))).reduce((acc, i) => ({ ...acc, [i]: ref.current[i] }), {})
    const changes = ids.reduce((acc, i) => ({
      ...acc,
      [i]: {
        id: i,
        updated_at: new Date().getTime(),
        ...(
          ['state', 'query', 'policy', 'refine', 'shrink', 'releases', 'banned_releases'].includes(key) ? { [key]: typeof value === 'function' ? value(initial[i] || {}) : value }
          : typeof value === 'function' ? value(initial[i] || {}) : {}
        ),
        ...(key === 'state' && ['pinned', 'wished', 'archived'].includes(value) && initial[i]?.releases ? { releases: (initial[i]?.releases || []).filter(({ proposal }) => !proposal) } : {}),
        ...(key === 'proposal' && initial[i]?.releases ? { ...(value ? { state: 'archived' } : {}), releases: (initial[i]?.releases || []).map(r => ({ ...r, ...(r.proposal ? { choice: value } : {}) })) } : {}),
        ...(key === 'release' ? { state: 'archived', releases: [...(initial[i]?.releases || []), value] } : {}),
      }
    }), {})

    const promise = new Promise(async (resolve, reject) => {
      setMetadata(metadata => ({
        ...metadata,
        ...Object.keys(changes).reduce((acc, i) => ({
          ...acc,
          [i]: key === 'state' && value === 'ignored' ? {} : { ...(metadata[i] || {}), ...changes[i] },
        }), {}),
      }))

      try {
        if (Object.keys(changes).length === 1) {
          const movie = await tmdb.fetch(`movie/${Object.keys(changes)[0]}`, {
            append_to_response: 'alternative_titles,release_dates',
          })

          // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
          movie.release_dates.results = movie.release_dates.results
            .filter(({ type }) => type === 3)
            .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])

          changes[Object.keys(changes)[0]] = {
            ...movie,
            ...changes[Object.keys(changes)[0]],
          }
        }

        const { uri, params, init } = api.query.movies[(key === 'state' && value === 'ignored' ? 'deleteMovies' : 'postMovies')]({ body: changes })
        await api.fetch(uri, params, init)
        resolve(true)
      } catch (err) {
        setMetadata(metadata => ({
          ...metadata,
          ...Object.keys(changes).reduce((acc, i) => ({
            ...acc,
            [i]: { ...(metadata[i] || {}), ...initial[i] },
          }), {}),
        }))

        console.warn(err)
        reject(new Error())
      }
    })

    if (ids.length === 1) {
      return promise
    }

    await toast.promise(promise, {
      loading: `Updating **${ids.length}** movies metadata...`,
      success: () => `Updated **${ids.length}** movies metadata`,
      error: () => `Error while updating **${ids.length}** movies metadata`,
    })
  }, [setMetadata])

  const enhanceMovieMetadata = useCallback((entity, metadata) => ({
    ...metadata,
    query: sensorr.getQuery(entity, metadata?.query),
    policy: new Policy(metadata?.policy, config.get('policies')),
  }), [config])

  const removeMovieRelease = useCallback((id: number, release: any) => setMovieMetadata(id, 'releases',
    (metadata) => (metadata?.releases || []).filter(r => r.id !== release.id)
  ), [])

  return (
    <moviesMetadataContext.Provider
      {...props}
      value={{
        loading,
        metadata,
        setMovieMetadata,
        enhanceMovieMetadata,
        removeMovieRelease,
      }}
    />
  )
}

export const useMoviesMetadataContext = () => useContext(moviesMetadataContext)

export const withMovieMetadataContext = ({ enhanced = false } = {}) => (WrappedComponent) => {
  const withMovieMetadataContext = ({ entity, ...props }) => {
    const sensorr = useSensorr()
    const { loading, metadata: { [entity.id]: _metadata = {} }, setMovieMetadata, removeMovieRelease } = useMoviesMetadataContext() as any
    const setMetadata = useCallback((key, value) => setMovieMetadata(entity.id, key, value), [entity?.id])
    const proceedRelease = useCallback((release, choice) => setMovieMetadata(entity.id, 'proposal', choice), [entity?.id])
    const removeRelease = useCallback((release) => removeMovieRelease(entity.id, release), [entity?.id])
    const setState = useCallback(state => setMetadata('state', state), [setMetadata])

    // enhanced
    const metadata = useMemo(() => {
      if (!enhanced) {
        return _metadata
      }

      return {
        ..._metadata,
        query: sensorr.getQuery(entity, _metadata?.query),
        policy: new Policy(_metadata?.policy, sensorr.policies),
      }
    }, [entity?.id, _metadata])

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        state={loading ? 'loading' : (metadata?.state || 'ignored')}
        setState={setState}
        metadata={metadata}
        setMetadata={setMetadata}
        proceedRelease={proceedRelease}
        removeRelease={removeRelease}
      />
    )
  }

  withMovieMetadataContext.displayName = `withMovieMetadataContext(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withMovieMetadataContext
}
