import { useEffect, useMemo, useState } from 'react'
import { progressOfDetails } from '@sensorr/sensorr'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { limited } from './limited'

const DAY = 24 * 60 * 60 * 1000

// One TMDB request per show, whatever the cards showing it. A tab left open reads it again once its next episode
// aired, and after a day at most
const details = new Map<number, { expires: number, promise: Promise<{ progress: any, status?: string, last_air_date?: string }> }>()

// While in flight, never expired
const cachedOf = (id: number) => {
  const cached = details.get(id)
  return (cached && cached.expires > Date.now()) ? cached.promise : null
}

// Shared by every card of the show, so no card's unmount aborts it. A failed request is forgotten, the next card asks again
const detailsOf = (tmdb, id: number) => {
  if (!cachedOf(id)) {
    const cached = {
      expires: Infinity,
      promise: tmdb.fetch(`tv/${id}`).then((show) => {
        const progress = progressOfDetails(show)
        const now = Date.now()
        const next = progress.next ? new Date(progress.next).getTime() : Infinity
        // A next episode dated today or before has not reached TMDB's counts yet: it waits the day like the others
        cached.expires = Math.min(now + DAY, next > now ? next : Infinity)
        // Only what a card draws is kept, not the whole details
        return { progress, status: show.status, last_air_date: show.last_air_date }
      }).catch((error) => {
        details.delete(id)
        throw error
      }),
    }

    details.set(id, cached)
  }

  return cachedOf(id)
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
            const progress = await limited(() => api.fetch(uri, params, init), controller.signal)
            setFetched({ id, progress })
            return
          }

          // A show another card already asked for takes no turn
          const { progress, status, last_air_date } = await (cachedOf(id) || limited(() => detailsOf(tmdb, id), controller.signal))

          if (!controller.signal.aborted) {
            setFetched({ id, progress, status, last_air_date })
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
