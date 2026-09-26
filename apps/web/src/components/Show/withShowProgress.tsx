import { useEffect, useMemo, useState } from 'react'
import { progressOfDetails } from '@sensorr/sensorr'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'

// A show's diffusion does not change within a session: one TMDB request per show, whatever the cards showing it
const details = new Map<number, Promise<any>>()

// Shared by every card of the show, so no card's unmount aborts it. A failed request is forgotten, the next card asks again
const detailsOf = (tmdb, id: number) => {
  if (!details.has(id)) {
    details.set(id, tmdb.fetch(`tv/${id}`).catch((error) => {
      details.delete(id)
      throw error
    }))
  }

  return details.get(id)
}

// The progress footer of a poster whose entity comes without one: from Sensorr when it holds the show, from its
// TMDB details otherwise. Until the metadata loads, which one is unknown
export const withShowProgress = () => (WrappedComponent) => {
  const withShowProgress = ({ entity, metadata, display, placeholder, state, ...props }) => {
    const api = useAPI()
    const tmdb = useTMDB()
    const [fetched, setFetched] = useState(null)
    const inSensorr = !!metadata?.state
    const skip = !!entity?.progress || !!placeholder || display === 'card' || display === 'pretty' || typeof entity?.id !== 'number' || state === 'loading'

    useEffect(() => {
      if (skip) {
        return
      }

      const id = entity.id
      const controller = new AbortController()

      const cb = async () => {
        try {
          if (inSensorr) {
            const { uri, params, init } = api.query.shows.getShowProgress({ params: { id }, init: { signal: controller.signal } })
            const progress = await api.fetch(uri, params, init)
            setFetched({ id, progress })
            return
          }

          const show = await detailsOf(tmdb, id)

          if (!controller.signal.aborted) {
            setFetched({ id, progress: progressOfDetails(show), status: show.status, last_air_date: show.last_air_date })
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            console.warn(error)
          }
        }
      }

      cb()
      return () => controller.abort()
    }, [api, tmdb, entity?.id, skip, inSensorr])

    // `fetched` may still be the previous entity's: a row keys its cards by index
    const enhanced = useMemo(() => (skip || fetched?.id !== entity?.id) ? entity : {
      ...entity,
      progress: fetched.progress,
      status: metadata?.status || fetched.status || entity.status,
      last_air_date: metadata?.last_air_date || fetched.last_air_date || entity.last_air_date,
    }, [entity, fetched, skip, metadata?.status, metadata?.last_air_date])

    return (
      <WrappedComponent
        {...props}
        entity={enhanced}
        metadata={metadata}
        display={display}
        placeholder={placeholder}
        state={state}
      />
    )
  }

  withShowProgress.displayName = `withShowProgress(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withShowProgress
}
