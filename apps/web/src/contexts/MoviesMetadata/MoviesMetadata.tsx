import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import toast from 'react-hot-toast'
import i18n from '@sensorr/i18n'
import { entryPolicy, Policy } from '@sensorr/sensorr'
import { useAuthContext } from '../Auth/Auth'
import { useConfigContext } from '../Config/Config'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { useSensorr } from '../../store/sensorr'
import { usePlexArtworks } from '../../store/plex'
import { refresh, refreshAll } from './refresh'

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
  const [artworks, setArtworks] = useState(null)

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const controller = new AbortController()

    // Once per session: the changes stream carries the artworks from then on
    const artworksQuery = api.query.movies.getArtworks({ init: { signal: controller.signal } })
    api.fetch(artworksQuery.uri, artworksQuery.params, artworksQuery.init).then(setArtworks).catch((e) => {
      if (e.name !== 'AbortError') {
        console.warn(e)
        setArtworks(artworks => artworks || {})
      }
    })

    const cb = async () => {
      try {
        let total_pages = null
        let page = 1
        let buffer = {}

        do {
          const { uri, params, init } = api.query.movies.getMetadata({ params: { page: page++ }, init: { signal: controller.signal } })
          const raw = await api.fetch(uri, params, init)
          total_pages = raw.total_pages
          buffer = { ...buffer, ...raw.results }

          // First page unblocks the posters, the rest lands in one go
          if (page === 2 || page > total_pages) {
            setMetadata(metadata => ({ ...metadata, ...buffer }))
            setLoading(false)
            buffer = {}
          }
        } while (!total_pages || page <= total_pages)
      } catch (e) {
        console.warn(e)

        if (e.name !== 'AbortError') {
          setLoading(false)
        }
      }
    }

    cb()

    // Refresh if page was at sleep for 10s
    const onVisibilityChange = () => {
      const currentTime = (new Date()).getTime()

      if (document.visibilityState === 'hidden') {
        refreshTime.current = currentTime
        return
      }

      if (currentTime > (refreshTime.current + 10000)) {
        cb()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    let eventSource

    try {
      eventSource = new ReconnectingEventSource(`/api/movies/changes?authorization=Bearer%20${api.access_token}`)
      eventSource.onmessage = ({ data }) => {
        const changes = JSON.parse(data)
        setMetadata(metadata => ({ ...metadata, ...changes }))
        // A metadata page carries no artworks: the map is what the next refresh falls back on
        setArtworks(artworks => artworks && ({ ...artworks, ...Object.fromEntries(Object.entries(changes).filter(([, doc]: any) => doc && 'plex_artworks' in doc).map(([id, doc]: any) => [id, doc.plex_artworks])) }))
      }
    } catch (e) {
      console.warn(e)
    }

    return () => {
      controller.abort()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      eventSource?.close()
    }
  }, [authenticated])

  useEffect(() => {
    ref.current = metadata
  }, [metadata])

  const setMovieMetadata = useCallback(async (
    id: number | number[],
    key: 'state' | 'query' | 'policy' | 'refine' | 'shrink' | 'release' | 'releases' | 'proposal' | 'lists' | null,
    value: any,
    { silent = false } = {},
  ) => {
    const ids = Array.isArray(id) ? id : [id]
    const initial = Object.keys(ref.current).filter(i => ids.includes(Number(i))).reduce((acc, i) => ({ ...acc, [i]: ref.current[i] }), {})
    const changes = ids.reduce((acc, i) => ({
      ...acc,
      [i]: {
        id: i,
        updated_at: new Date().getTime(),
        ...(
          ['state', 'query', 'policy', 'refine', 'shrink', 'releases', 'lists'].includes(key) ? { [key]: typeof value === 'function' ? value(initial[i] || {}, i) : value }
          : typeof value === 'function' ? value(initial[i] || {}, i) : {}
        ),
        ...(key === 'state' && ['pinned', 'wished', 'archived'].includes(value) && initial[i]?.releases ? { releases: (initial[i]?.releases || []).filter(({ proposal }) => !proposal) } : {}),
        ...(key === 'proposal' && initial[i]?.releases ? { ...((typeof value === 'object' ? value.choice : value) ? { state: 'archived' } : {}), releases: (initial[i]?.releases || []).map(r => ({ ...r, ...(r.proposal && (typeof value !== 'object' || r.id === value.id) ? { choice: typeof value === 'object' ? value.choice : value } : {}) })) } : {}),
        ...(key === 'release' ? { state: 'archived', releases: [...(initial[i]?.releases || []), value] } : {}),
        // A movie Sensorr does not keep yet enters a list as `ignored`, as a guest's watchlist brings it
        ...(key === 'lists' && !initial[i]?.state ? { state: 'ignored' } : {}),
      }
    }), {})

    const undo = (keys: string[]) => setMetadata(metadata => ({
      ...metadata,
      ...keys.reduce((acc, i) => ({
        ...acc,
        [i]: initial[i] ? { ...(metadata[i] || {}), ...initial[i] } : {},
      }), {}),
    }))

    const promise = (async () => {
      setMetadata(metadata => ({
        ...metadata,
        ...Object.keys(changes).reduce((acc, i) => ({
          ...acc,
          [i]: key === 'state' && value === 'ignored' ? {} : { ...(metadata[i] || {}), ...changes[i] },
        }), {}),
      }))

      let failed = []
      const skipped = []

      try {
        // Several ids at once come from a selection: the ones Sensorr already keeps have their title, the others
        // only TMDB can give one, without it a grid's selection would write documents with no title
        const refreshed = Object.keys(changes).length === 1 ? Object.keys(changes) : key === 'state' && value === 'ignored' ? [] : Object.keys(changes).filter(i => !initial[i]?.title)

        if (ids.length === 1) {
          const [i] = refreshed
          changes[i] = { ...(await refresh(tmdb, i, initial[i])), ...changes[i] }
        } else {
          // A movie TMDB does not answer for is left out of the write, and told in the toast with the others that failed
          const { refreshed: fetched, skipped: missing } = await refreshAll(tmdb, refreshed, initial)
          Object.entries(fetched).forEach(([i, movie]) => (changes[i] = { ...(movie as any), ...changes[i] }))
          missing.forEach((i) => {
            delete changes[i]
            skipped.push(i)
          })
        }

        const { uri, params, init } = api.query.movies[(key === 'state' && value === 'ignored' ? 'deleteMovies' : 'postMovies')]({ body: changes })
        // A movie whose release did not download comes back in `failed`, the others are written
        const res = Object.keys(changes).length ? await api.fetch(uri, params, init) : {}
        failed = [...skipped, ...(res.failed || [])]
      } catch (err) {
        undo(ids.map(String))
        console.warn(err)
        throw new Error()
      }

      if (failed.length) {
        undo(failed.map(String))
        throw Object.assign(new Error(), { failed })
      }

      return true
    })()

    // A caller that tells the outcome itself, as the swaps' own toast, asks for no second one.
    if (silent) {
      return promise
    }

    if (!Array.isArray(id)) {
      if (!['query', 'policy', 'refine', 'shrink', 'lists'].includes(key)) {
        return promise
      }

      await toast.promise(promise, {
        loading: i18n.t('contexts.movies.loading'),
        success: () => i18n.t('contexts.movies.success'),
        error: () => i18n.t('contexts.movies.error'),
      })
    } else {
      await toast.promise(promise, {
        loading: i18n.t('contexts.movies.bulk.loading', { count: ids.length }),
        success: () => i18n.t('contexts.movies.bulk.success', { count: ids.length }),
        error: (err) => err?.failed?.length ? i18n.t('contexts.movies.bulk.failed', { failed: err.failed.length, count: ids.length, key }) : i18n.t('contexts.movies.bulk.error', { count: ids.length }),
      })
    }
  }, [setMetadata])

  const enhanceMovieMetadata = useCallback((entity, metadata) => ({
    ...metadata,
    query: sensorr.getQuery(entity, metadata?.query),
    policy: new Policy(metadata?.policy || entryPolicy(entity, metadata, config.get('policies'))?.name, config.get('policies')),
  }), [config])

  const removeMovieRelease = useCallback((id: number, release: any) => setMovieMetadata(id, 'releases',
    (metadata) => (metadata?.releases || []).filter(r => r.id !== release.id)
  ), [])

  // A ban goes through its own route, the list written whole would drop a ban made meanwhile
  const banMovieRelease = useCallback(async (id: number, title: string) => {
    const { uri, params, init } = api.query.movies.postMovieBannedRelease({ body: { title }, params: { id } })
    await api.fetch(uri, params, init)
  }, [])

  const unbanMovieRelease = useCallback(async (id: number, title: string) => {
    const { uri, params, init } = api.query.movies.deleteMovieBannedRelease({ body: { title }, params: { id } })
    await api.fetch(uri, params, init)
  }, [])

  return (
    <moviesMetadataContext.Provider
      {...props}
      value={{
        loading,
        metadata,
        artworks,
        setMovieMetadata,
        enhanceMovieMetadata,
        removeMovieRelease,
        banMovieRelease,
        unbanMovieRelease,
      }}
    />
  )
}

export const useMoviesMetadataContext = () => useContext(moviesMetadataContext)

export const withMovieMetadataContext = ({ enhanced = false } = {}) => (WrappedComponent) => {
  const WithMovieMetadataContext = ({ entity, ...props }) => {
    const sensorr = useSensorr()
    const { loading, metadata: { [entity.id]: _metadata = {} }, artworks: known = {}, setMovieMetadata, removeMovieRelease } = useMoviesMetadataContext() as any
    const setMetadata = useCallback((key, value) => setMovieMetadata(entity.id, key, value), [entity?.id])
    const proceedRelease = useCallback((release, choice) => setMovieMetadata(entity.id, 'proposal', release?.id ? { id: release.id, choice } : choice), [entity?.id])
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
        policy: new Policy(_metadata?.policy || entryPolicy(entity, _metadata, sensorr.policies)?.name, sensorr.policies),
      }
    }, [entity?.id, _metadata])

    const artworked = usePlexArtworks(entity, (props as any).details, 'plex_artworks' in _metadata ? _metadata.plex_artworks : known?.[entity.id], known === null)

    return (
      <WrappedComponent
        {...props}
        {...(artworked.details ? { details: artworked.details } : {})}
        entity={artworked.entity}
        ready={(props as any).ready !== false && !artworked.pending}
        state={loading ? 'loading' : (metadata?.state || 'ignored')}
        setState={setState}
        metadata={metadata}
        setMetadata={setMetadata}
        proceedRelease={proceedRelease}
        removeRelease={removeRelease}
      />
    )
  }

  WithMovieMetadataContext.displayName = `withMovieMetadataContext(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithMovieMetadataContext
}
