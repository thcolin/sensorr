import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
// import toast from 'react-hot-toast'
import nanobounce from 'nanobounce'
import { useControlsState } from '@sensorr/ui'
import { useTMDB } from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { ControlsContext } from '../../components/Calendar/Calendar'
import { judge, summarize } from './refine'

// Every movie a followed person has in a TMDB discover query. TMDB takes 500 people at most a request: the first
// page of each slice says how many it has, then all the others go out at once. The movies keep the order the
// pages had when they were read one after the other, page by page and a slice after the other within a page.
export const discoverCalendar = async (tmdb, followed, params, cancelled: () => boolean) => {
  const ids = Object.keys(followed)
  const slices = Array.from({ length: Math.ceil(ids.length / 500) }, (_, i) => ids.slice(i * 500, (i + 1) * 500).join('|'))
  const discover = (with_people: string, page: number) => tmdb.fetch('discover/movie', { ...params, page, with_people })
  const firsts = await Promise.all(slices.map(with_people => discover(with_people, 1)))

  if (cancelled()) {
    return []
  }

  const rests = await Promise.all(slices.map((with_people, i) => Promise.all(
    Array.from({ length: Math.min(firsts[i].total_pages || 1, 500) - 1 }, (_, page) => discover(with_people, page + 2)),
  )))

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

// What the refinements are judged on, the details of 20 movies at a time in the order given. `onSummary` hears of
// each one as it lands, with every summary so far.
export const summarizeCalendar = async (tmdb, entities, followed, cancelled: () => boolean, onSummary = (summaries) => null) => {
  const summaries = {}
  let next = 0

  const work = async () => {
    while (next < entities.length && !cancelled()) {
      const entity = entities[next++]
      const details = await tmdb.fetch(`movie/${entity.id}`, { append_to_response: 'credits,release_dates' }).catch(() => {
        console.warn(`Movie ${entity.id} kept unfiltered, its details failed`)
        return null
      })

      summaries[entity.id] = details && summarize(details, followed)
      onSummary(summaries)
    }
  }

  await Promise.all(Array.from({ length: 20 }, work))
  return summaries
}

export const fetchCalendar = async (tmdb, followed, params, cancelled: () => boolean) => {
  const entities = await discoverCalendar(tmdb, followed, params, cancelled)
  return { entities, summaries: await summarizeCalendar(tmdb, entities, followed, cancelled) }
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

      let cancelled = false

      debouncer(async () => {
        try {
          const fetched = await fetchCalendar(tmdb, persons.metadata, query.params, () => cancelled)

          if (!cancelled) {
            setFetched(fetched)
          }
        } catch (error) {
          if (!cancelled) {
            setError(error)
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      })

      return () => {
        cancelled = true
      }
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
