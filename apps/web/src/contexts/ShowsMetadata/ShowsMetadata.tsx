import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import toast from 'react-hot-toast'
import { fetchShow } from '@sensorr/tmdb'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'

const showsMetadataContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const { authenticated } = useAuthContext()
  const ref = useRef() as any
  const episodesRef = useRef({}) as any
  const sequences = useRef({}) as any
  const refreshTime = useRef() as any
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState({})
  const [episodes, setEpisodes] = useState({})

  // SSE messages can reload a show's episodes several times over, only the last load asked for is kept
  const loadEpisodes = useCallback(async (id: number) => {
    const load = sequences.current[id] = (sequences.current[id] || 0) + 1
    const { uri, params, init } = api.query.shows.getShowEpisodes({ params: { id } })
    const results = await api.fetch(uri, params, init)

    if (load === sequences.current[id]) {
      setEpisodes(episodes => ({ ...episodes, [id]: results }))
    }

    return results
  }, [])

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const controller = new AbortController()

    const cb = async () => {
      try {
        let total_pages = null
        let page = 1
        let buffer = {}

        do {
          const { uri, params, init } = api.query.shows.getMetadata({ params: { page: page++ }, init: { signal: controller.signal } })
          const raw = await api.fetch(uri, params, init)
          total_pages = raw.total_pages
          buffer = { ...buffer, ...raw.results }
        } while (!total_pages || page <= total_pages)

        setMetadata(metadata => ({ ...metadata, ...buffer }))
        setLoading(false)
      } catch (e) {
        console.warn(e)

        if (e.name !== 'AbortError') {
          setLoading(false)
        }
      }
    }

    cb()

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

    // A show sent as `null` was deleted, and a change on a show whose episodes are loaded reloads them:
    // an accepted release or an import writes its episodes too
    try {
      eventSource = new ReconnectingEventSource(`/api/shows/changes?authorization=Bearer%20${api.access_token}`)
      eventSource.onmessage = ({ data }) => {
        const changes = JSON.parse(data)

        setMetadata(metadata => Object.keys(changes).reduce((acc: { [id: string]: any }, id) => {
          if (changes[id] === null) {
            const { [id]: removed, ...rest } = acc
            return rest
          }

          return { ...acc, [id]: changes[id] }
        }, metadata))

        Object.keys(changes)
          .filter(id => changes[id] !== null && episodesRef.current[id])
          .forEach(id => loadEpisodes(Number(id)).catch(e => console.warn(e)))
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

  useEffect(() => {
    episodesRef.current = episodes
  }, [episodes])

  const setShowMetadata = useCallback(async (
    id: number | number[],
    key: 'state' | 'monitored' | 'monitor_new_seasons' | 'policy' | 'proposal_only' | 'proposal' | 'releases' | 'banned_releases',
    value: any,
    { silent = false } = {},
  ) => {
    const ids = Array.isArray(id) ? id : [id]
    const initial = ids.reduce((acc, i) => ({ ...acc, [i]: ref.current[i] || {} }), {})
    const changes = ids.reduce((acc, i) => ({
      ...acc,
      [i]: {
        id: Number(i),
        ...(key === 'proposal' ? {
          releases: (initial[i].releases || []).map(r => (r.proposal && (typeof value !== 'object' || r.id === value.id)) ? { ...r, choice: typeof value === 'object' ? value.choice : value } : r),
        } : {
          [key]: typeof value === 'function' ? value(initial[i], i) : value,
        }),
      },
    }), {})

    const covered = key !== 'proposal' ? [] : ids.flatMap(i => changes[i].releases
      .filter(release => typeof release.choice === 'boolean' && !(initial[i].releases || []).find(r => r.id === release.id && typeof r.choice === 'boolean'))
      .map(release => ({ show: Number(i), release })))
    // The release an episode moves to once the answer is given, `undefined` when it does not move
    const moved = (release, episode) => (
      release.choice && (release.coverage || []).some(({ season, episode: number }) => season === episode.season_number && number === episode.episode_number) ? release.id :
      !release.choice && episode.release === release.id ? null :
      undefined
    )
    const previous = covered.reduce((acc, { show, release }) => ({
      ...acc,
      [show]: new Map([...(acc[show] || []), ...(episodesRef.current[show] || [])
        .filter(episode => moved(release, episode) !== undefined)
        .map(episode => [episode.id, episode.release])]),
    }), {})

    const promise = new Promise(async (resolve, reject) => {
      setMetadata(metadata => ({
        ...metadata,
        ...Object.keys(changes).reduce((acc, i) => ({ ...acc, [i]: { ...(metadata[i] || {}), ...changes[i] } }), {}),
      }))

      if (covered.length) {
        setEpisodes(episodes => covered.reduce((acc, { show, release }) => !acc[show] ? acc : {
          ...acc,
          [show]: acc[show].map(episode => moved(release, episode) === undefined ? episode : { ...episode, release: moved(release, episode) }),
        }, episodes))
      }

      try {
        const { uri, params, init } = api.query.shows.postShows({ body: changes })
        await api.fetch(uri, params, init)
        resolve(true)
      } catch (err) {
        // A key the show did not have before the change is dropped, not kept with the value that failed
        const revert = (current, i) => Object.keys(changes[i]).filter(k => k !== 'id').reduce((acc, k) => {
          const { [k]: failed, ...rest } = acc
          return k in initial[i] ? { ...rest, [k]: initial[i][k] } : rest
        }, current || {})

        setMetadata(metadata => ({
          ...metadata,
          ...Object.keys(changes).reduce((acc, i) => ({ ...acc, [i]: revert(metadata[i], i) }), {}),
        }))
        setEpisodes(episodes => Object.keys(previous).reduce((acc, show) => !acc[show] ? acc : {
          ...acc,
          [show]: acc[show].map(episode => previous[show].has(episode.id) ? { ...episode, release: previous[show].get(episode.id) } : episode),
        }, episodes))

        console.warn(err)
        reject(new Error())
      }
    })

    // One show's toggle or answer tells its outcome on screen, only a policy change and a bulk get a toast.
    // A bulk is told by its list of ids, even of one show
    if (silent || (!Array.isArray(id) && key !== 'policy')) {
      return promise
    }

    await toast.promise(promise, {
      loading: ids.length === 1 ? `Updating show metadata...` : `Updating **${ids.length}** shows metadata...`,
      success: () => ids.length === 1 ? `Show metadata updated` : `Updated **${ids.length}** shows metadata`,
      error: () => ids.length === 1 ? `Error while updating show metadata` : `Error while updating **${ids.length}** shows metadata`,
    })
  }, [])

  const setEpisodesMetadata = useCallback(async (show: number, ids: number[], key: 'monitored', value: any) => {
    const initial = new Map((episodesRef.current[show] || []).map(episode => [episode.id, episode]))
    const changes = ids.reduce((acc, i) => ({ ...acc, [i]: { id: i, [key]: value } }), {})

    const promise = new Promise(async (resolve, reject) => {
      setEpisodes(episodes => ({
        ...episodes,
        [show]: (episodes[show] || []).map(episode => changes[episode.id] ? { ...episode, ...changes[episode.id] } : episode),
      }))

      try {
        const { uri, params, init } = api.query.episodes.postEpisodes({ body: changes })
        await api.fetch(uri, params, init)
        resolve(true)
      } catch (err) {
        // Only what this write changed goes back, a write made meanwhile on another episode stays
        setEpisodes(episodes => ({
          ...episodes,
          [show]: (episodes[show] || []).map(episode => changes[episode.id] ? { ...episode, [key]: initial.get(episode.id)?.[key] } : episode),
        }))
        console.warn(err)
        reject(new Error())
      }
    })

    if (ids.length === 1) {
      return promise
    }

    await toast.promise(promise, {
      loading: ids.length === 1 ? `Updating episode...` : `Updating **${ids.length}** episodes...`,
      success: () => ids.length === 1 ? `Episode updated` : `Updated **${ids.length}** episodes`,
      error: () => ids.length === 1 ? `Error while updating episode` : `Error while updating **${ids.length}** episodes`,
    })
  }, [])

  // Followed, the show is followed whole, S00 aside; not followed, it is kept as a pinned movie is
  const addShow = useCallback(async (id: number, followed = true) => {
    const promise = (async () => {
      const { show, episodes: fetched } = await fetchShow(tmdb, id)
      const body = { [show.id]: { ...show, state: 'wished', monitored: followed, monitor_new_seasons: followed, refreshed_at: new Date() } }
      const added = fetched.map(episode => ({ ...episode, monitored: followed && episode.season_number !== 0 }))

      // The episodes go first, their upsert can run again: a show posted without them would stay in the library with none
      if (added.length) {
        const { uri, params, init } = api.query.episodes.postEpisodes({ body: added.reduce((acc, episode) => ({ ...acc, [episode.id]: episode }), {}) })
        await api.fetch(uri, params, init)
      }

      const shows = api.query.shows.postShows({ body })
      await api.fetch(shows.uri, shows.params, shows.init)

      setMetadata(metadata => ({ ...metadata, [show.id]: { ...(metadata[show.id] || {}), ...body[show.id] } }))
      setEpisodes(episodes => ({ ...episodes, [show.id]: added }))
    })()

    await toast.promise(promise, {
      loading: `Adding show to the library...`,
      success: () => `Show added to the library`,
      error: (err) => {
        console.warn(err)
        return `Error while adding show to the library`
      },
    })
  }, [])

  const followShow = useCallback(async (id: number, followed: boolean) => {
    const current = ref.current[id]

    if (current && current.state !== 'ignored') {
      return setShowMetadata(id, 'monitored', followed)
    }

    return addShow(id, followed)
  }, [setShowMetadata, addShow])

  const removeShow = useCallback(async (id: number) => {
    const promise = (async () => {
      const { uri, params, init } = api.query.shows.deleteShows({ body: { [id]: { id } } })
      await api.fetch(uri, params, init)
      setMetadata(({ [id]: removed, ...metadata }: { [id: string]: any }) => metadata)
      setEpisodes(({ [id]: removed, ...episodes }: { [id: string]: any }) => episodes)
    })()

    await toast.promise(promise, {
      loading: `Removing show from the library...`,
      success: () => `Show removed from the library`,
      error: (err) => {
        console.warn(err)
        return `Error while removing show from the library`
      },
    })
  }, [])

  // A show leaves the library from its state badge, as a movie does, but once confirmed: its episodes go with it.
  // `removeShow` toasts its own failure, only a failed follow rejects
  const setShowState = useCallback(async (id: number, state: 'ignored' | 'unfollowed' | 'followed') => {
    if (state !== 'ignored') {
      return followShow(id, state === 'followed')
    }

    const show = ref.current[id]
    const count = episodesRef.current[id]?.length

    if (!show || !confirm(`Do you want to remove "${show.name}"${typeof count === 'number' ? ` and its ${count} episodes` : ''} from the library ? Their files stay on disk`)) {
      return
    }

    return removeShow(id).catch(() => null)
  }, [followShow, removeShow])

  return (
    <showsMetadataContext.Provider
      {...props}
      value={{
        loading,
        metadata,
        episodes,
        loadEpisodes,
        setShowMetadata,
        setEpisodesMetadata,
        addShow,
        followShow,
        removeShow,
        setShowState,
      }}
    />
  )
}

export const useShowsMetadataContext = () => useContext(showsMetadataContext)

export const showStateOf = (metadata) => (!metadata?.state || metadata.state === 'ignored') ? 'ignored' : metadata.monitored ? 'followed' : 'unfollowed'

export const withShowMetadataContext = () => (WrappedComponent) => {
  const withShowMetadataContext = ({ entity, ...props }) => {
    const { loading, metadata: { [entity?.id]: metadata = {} }, setShowMetadata, setShowState } = useShowsMetadataContext() as any
    const setMetadata = useCallback((key, value) => setShowMetadata(entity.id, key, value), [entity?.id])
    // `setShowMetadata` tells nothing for a single show, and `setShowState` toasts only a show it adds or removes
    const proceedRelease = useCallback((release, choice) => setShowMetadata(entity.id, 'proposal', { id: release.id, choice })
      .catch(() => toast.error('Error while answering the proposal')), [entity?.id])
    const setState = useCallback(state => setShowState(entity.id, state)
      .catch(() => metadata?.state && metadata.state !== 'ignored' && toast.error('Error while following the show')), [entity?.id, setShowState, metadata?.state])

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        state={loading ? 'loading' : showStateOf(metadata)}
        setState={setState}
        metadata={metadata}
        setMetadata={setMetadata}
        proceedRelease={proceedRelease}
      />
    )
  }

  withShowMetadataContext.displayName = `withShowMetadataContext(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withShowMetadataContext
}
