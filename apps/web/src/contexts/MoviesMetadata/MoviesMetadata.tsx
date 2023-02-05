import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import toast from 'react-hot-toast'
import { Policy } from '@sensorr/sensorr'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { useSensorr } from '../../store/sensorr'
import { useConfigContext } from '../Config/Config'

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
    id: number,
    key: 'state' | 'query' | 'policy' | 'cared' | 'releases' | 'banned_releases' | null,
    value: any
  ) => {
    const initial = ref.current[id] || {}
    const changes = {
      ...(key ? { [key]: typeof value === 'function' ? value(initial) : value } : typeof value === 'function' ? value(initial) : value),
      ...(key === 'state' && ['pinned', 'wished', 'archived'].includes(value) ? { releases: (initial?.releases || []).filter(({ proposal }) => !proposal) } : {}),
    }

    setMetadata(metadata => ({
      ...metadata,
      [id]: key === 'state' && value === 'ignored' ? {} : { ...(metadata[id] || {}), ...changes },
    }))

    try {
      const movie = await tmdb.fetch(`movie/${id}`, {
        append_to_response: 'alternative_titles,release_dates',
      })

      // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
      movie.release_dates.results = movie.release_dates.results
        .filter(({ type }) => type === 3)
        .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])

      const { uri, params, init } = api.query.movies[(key === 'state' && value === 'ignored' ? 'deleteMovie' : 'postMovie')]({ body: { id, ...movie, ...changes, updated_at: new Date().getTime() } })
      await api.fetch(uri, params, init)
    } catch (err) {
      setMetadata(metadata => ({ ...metadata, [id]: { ...(metadata[id] || {}), ...initial } }))
      console.warn(err)
      toast.error('Error while updating movie metadata')
    }
  }, [setMetadata])

  const enhanceMovieMetadata = useCallback((entity, metadata) => ({
    ...metadata,
    query: sensorr.getQuery(entity, metadata?.query),
    policy: new Policy(metadata?.policy, config.get('policies')),
  }), [config])

  const proceedMovieRelease = useCallback(async (id: number, release: any, choice: boolean = true, source: 'cache' | 'enclosure' = 'enclosure') => {
    const initial = ref.current[id] || {}
    const changes = {
      ...(choice === true ? { state: 'archived' } : {}),
      releases: !choice ?
        (initial.releases || []).filter(r => r.id !== release.id) :
        [...(initial.releases || []), release]
          .filter((a, index, arr) => arr.findIndex(b => a.id === b.id) === index)
          .map(({ proposal, ...r }) => r.id === release.id ? r : { ...r, proposal })
          .filter(({ proposal }) => !proposal)
    }

    setMetadata(metadata => ({ ...metadata, [id]: { ...(metadata[id] || {}), ...changes } }))

    try {
      if (choice) {
        const { uri, params, init } = api.query.sensorr.downloadRelease({ body: release, params: { source, destination: 'fs' } })
        await api.fetch(uri, params, init)
      } else {
        const { uri, params, init } = api.query.sensorr.removeRelease({ body: release })
        await api.fetch(uri, params, init)
      }

      const movie = await tmdb.fetch(`movie/${id}`, {
        append_to_response: 'alternative_titles,release_dates',
      })

      // Lighten object for database by reducing releases_dates, only Theatrical (type === 3) and merge same year releases
      movie.release_dates.results = movie.release_dates.results
        .filter(({ type }) => type === 3)
        .reduce((acc, raw) => acc.map(({ release_date }) => new Date(release_date).getFullYear()).includes(new Date(raw.release_date).getFullYear()) ? acc : [...acc, raw], [])

      const { uri, params, init } = api.query.movies.postMovie({ body: { id, ...movie, ...changes, updated_at: new Date().getTime() } })
      await api.fetch(uri, params, init)

      if (release.job && release.from) {
        try {
          const { uri, params, init } = api.query.jobs.postJobLog({
            body: {
              level: 'info',
              message: '',
              meta: { job: release.job, command: release.from, group: id, treated: true, choice, summary: { treated: 1 } },
            },
            params: { job: release.job },
          })

          await api.fetch(uri, params, init)
        } catch (e) {
          console.warn(e)
        }
      }
    } catch (e) {
      setMetadata(metadata => ({ ...metadata, [id]: { ...(metadata[id] || {}), ...initial } }))
      throw e
    }
  }, [])

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
        proceedMovieRelease,
        removeMovieRelease,
      }}
    />
  )
}

export const useMoviesMetadataContext = () => useContext(moviesMetadataContext)

export const withMovieMetadataContext = ({ enhanced = false } = {}) => (WrappedComponent) => {
  const withMovieMetadataContext = ({ entity, ...props }) => {
    const sensorr = useSensorr()
    const { loading, metadata: { [entity.id]: _metadata = {} }, setMovieMetadata, proceedMovieRelease, removeMovieRelease } = useMoviesMetadataContext() as any
    const setMetadata = useCallback((key, value) => setMovieMetadata(entity.id, key, value), [entity?.id])
    const proceedRelease = useCallback((release, choice) => proceedMovieRelease(entity.id, release, choice), [entity?.id])
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
