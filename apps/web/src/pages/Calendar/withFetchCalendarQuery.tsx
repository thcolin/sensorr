import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
// import toast from 'react-hot-toast'
import nanobounce from 'nanobounce'
import { useControlsState } from '@sensorr/ui'
import { useTMDB } from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { ControlsContext } from '../../components/Calendar/Calendar'
import { judge, summarize } from './refine'

// The requests a calendar keeps out at once, its discover pages as the details of its movies
const POOL = 20

// Runs `task` on each item in the order given, POOL at a time, until the signal aborts
const pool = async <T,>(items: T[], signal: AbortSignal, task: (item: T, index: number) => Promise<void>) => {
  let next = 0

  const work = async () => {
    while (next < items.length && !signal.aborted) {
      const index = next++
      await task(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: POOL }, work))
}

// A request TMDB refuses, as a 429 when too many went out at once, is asked again once a second later
const retry = (request: () => Promise<any>, signal: AbortSignal): Promise<any> => request().catch(error => signal.aborted
  ? Promise.reject(error)
  : new Promise(resolve => setTimeout(resolve, 1000)).then(request))

// Every movie a followed person has in a TMDB discover query. TMDB takes 500 people at most a request: the first
// page of each slice says how many it has, then the others go out through the pool. A first page is what the
// month needs and fails it, any other page that fails again is left out with a warning. The movies keep the order
// the pages had when they were read one after the other, page by page and a slice after the other within a page.
export const discoverCalendar = async (tmdb, followed, params, signal: AbortSignal) => {
  const ids = Object.keys(followed)
  const slices = Array.from({ length: Math.ceil(ids.length / 500) }, (_, i) => ids.slice(i * 500, (i + 1) * 500).join('|'))
  const discover = (with_people: string, page: number) => retry(() => tmdb.fetch('discover/movie', { ...params, page, with_people }, { signal }), signal)
  const firsts = await Promise.all(slices.map(with_people => discover(with_people, 1)))

  if (signal.aborted) {
    return []
  }

  const rests = slices.map((_, i) => Array.from({ length: Math.min(firsts[i].total_pages || 1, 500) - 1 }, () => null))
  const pages = rests.flatMap((rest, i) => rest.map((_, page) => ({ slice: i, page: page + 2 })))

  await pool(pages, signal, async ({ slice, page }) => {
    rests[slice][page - 2] = await discover(slices[slice], page).catch((error) => {
      if (!signal.aborted) {
        console.warn(`Calendar page ${page} left out, it failed`, error)
      }

      return null
    })
  })

  const seen = new Set<number>()
  const entities = []

  for (let page = 0; page < Math.max(1, ...rests.map(rest => rest.length + 1)); page++) {
    slices.forEach((_, i) => ((page ? rests[i][page - 1] : firsts[i])?.results || []).forEach(entity => {
      if (!seen.has(entity.id)) {
        seen.add(entity.id)
        entities.push(entity)
      }
    }))
  }

  return entities
}

// What the refinements are judged on, the details of the movies through the pool in the order given. `onSummary` hears of
// each one as it lands, with every summary so far.
export const summarizeCalendar = async (tmdb, entities, followed, signal: AbortSignal, onSummary = (summaries) => null) => {
  const summaries = {}

  await pool(entities, signal, async (entity: any) => {
    const details = await retry(() => tmdb.fetch(`movie/${entity.id}`, { append_to_response: 'credits,release_dates' }, { signal }), signal).catch(() => {
      if (!signal.aborted) {
        console.warn(`Movie ${entity.id} kept unfiltered, its details failed`)
      }

      return null
    })

    if (!signal.aborted) {
      summaries[entity.id] = details && summarize(details, followed)
      onSummary(summaries)
    }
  })

  return summaries
}

export const fetchCalendar = async (tmdb, followed, params, signal: AbortSignal) => {
  const entities = await discoverCalendar(tmdb, followed, params, signal)
  return { entities, summaries: await summarizeCalendar(tmdb, entities, followed, signal) }
}

// What the refinements keep of a fetch, sorted, and the departments the followed people hold in it
export const refine = ({ entities, summaries }, refinements, sort_by = 'primary_release_date.asc') => {
  const released = entities.filter(entity => judge(summaries[entity.id], { ...refinements, with_credits_departments: '' }))
  const kept = released.filter(entity => judge(summaries[entity.id], refinements))
  const [key, order] = sort_by.split('.')

  kept.sort((a, b) => {
    switch (key) {
      case 'primary_release_date':
        return order === 'desc' ? new Date(b.release_date).getTime() - new Date(a.release_date).getTime() : new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
      case 'popularity':
      case 'vote_average':
      case 'vote_count':
        return order === 'desc' ? b[key] - a[key] : a[key] - b[key]
      default:
        return 0
    }
  })

  const counts = released
    .flatMap(entity => summaries[entity.id]?.departments || [])
    .reduce((acc, department) => ({ ...acc, [department]: (acc[department] || 0) + 1 }), {})

  return {
    entities: kept,
    statistics: {
      with_credits_departments: Object.entries(counts).map(([_id, count]) => ({ _id, count })),
    },
  }
}

const withFetchCalendarQuery = (
  defaultQuery?: { params?: {} },
) => (WrappedComponent) => {
  const withFetchCalendarQuery = ({ ...props }) => {
    const tmdb = useTMDB()
    const persons = usePersonsMetadataContext() as any
    const debouncer = useMemo(() => nanobounce(0), [])

    // Wait for first controlsQuery hydration by serializing initial state
    // A calendar page holds its controls in its context; a row of the home has none and keeps its own
    const useControlsValues = useCallback(() => {
      const context = useContext(ControlsContext)
      const local = useState({ uri: '', params: {} })
      return context || local
    }, [])
    const [controlsQuery, controls] = useControlsState(useControlsValues, ({ uri, ...params }) => ({ uri, params }))

    const [query, refinements] = useMemo(() => {
      const { with_release_type, with_credits_departments, ...params } = {
        ...defaultQuery?.params,
        ...controlsQuery?.params,
      } as any

      return [{ uri: 'discover/movie', params }, { with_release_type, with_credits_departments }]
    }, [JSON.stringify(defaultQuery), JSON.stringify(controlsQuery)])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [fetched, setFetched] = useState(null)

    useEffect(() => {
      if ((props as any).error) {
        setLoading(false)
        setError((props as any).error)
        return
      }

      setLoading(true)
      setError(null)
      setFetched(null)

      if ((props as any).ready === false || (props as any).loading === true || persons.loading) {
        return
      }

      // A newer query aborts the requests of the one it replaces
      const controller = new AbortController()
      const { signal } = controller

      debouncer(async () => {
        try {
          const fetched = await fetchCalendar(tmdb, persons.metadata, query.params, signal)

          if (!signal.aborted) {
            setFetched(fetched)
          }
        } catch (error) {
          if (!signal.aborted) {
            setError(error)
          }
        } finally {
          if (!signal.aborted) {
            setLoading(false)
          }
        }
      })

      return () => controller.abort()
    }, [query, (props as any).ready, (props as any).loading, (props as any).error, persons.loading])

    const refined = useMemo(() => {
      if (!fetched) {
        return { entities: {}, total: null, statistics: {} }
      }

      const { entities, statistics } = refine(fetched, refinements, query?.params?.sort_by)

      return {
        entities: entities.reduce((acc, entity, index) => ({ ...acc, [index]: entity }), {}),
        total: entities.length,
        statistics,
      }
    }, [fetched, refinements, query?.params?.sort_by])

    return (
      <WrappedComponent
        {...props}
        entities={refined.entities}
        length={refined.total}
        statistics={refined.statistics}
        ready={(props as any).ready !== false && !loading}
        controls={controls}
        error={(!persons.loading && !Object.keys(persons.metadata).length) ? {
          emoji: '⭐️',
          title: "Try to follow some people first",
          subtitle: "Calendar is based on people you follow, check trending stars or look at casting from your favorite movies",
        } : error || (props as any).error}
      />
    )
  }

  withFetchCalendarQuery.displayName = `withFetchCalendarQuery(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withFetchCalendarQuery
}

export default withFetchCalendarQuery
