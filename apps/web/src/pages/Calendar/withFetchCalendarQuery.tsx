import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
// import toast from 'react-hot-toast'
import nanobounce from 'nanobounce'
import { useControlsState } from '@sensorr/ui'
import { useTMDB } from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { ControlsContext } from '../../components/Calendar/Calendar'
import { judge, summarize } from './refine'

// Every movie a followed person has in a TMDB discover query, with what its refinements are judged on. TMDB takes
// 500 people at most a request: the pages of each slice are merged, until a page adds nothing new.
export const fetchCalendar = async (tmdb, followed, params, cancelled: () => boolean) => {
  const ids = Object.keys(followed)
  const seen = new Set<number>()
  const entities = []

  for (let page = 1; !cancelled(); page++) {
    const results = []

    for (let i = 0; i < Math.ceil(ids.length / 500); i++) {
      const raw = await tmdb.fetch('discover/movie', {
        ...params,
        page,
        with_people: ids.slice(i * 500, (i + 1) * 500).join('|'),
      })

      raw.results.forEach(entity => {
        if (!seen.has(entity.id)) {
          seen.add(entity.id)
          results.push(entity)
        }
      })
    }

    if (!results.length) {
      break
    }

    entities.push(...results)
  }

  const summaries = {}

  for (let i = 0; i < entities.length && !cancelled(); i += 20) {
    await Promise.all(entities.slice(i, i + 20).map(async (entity) => {
      const details = await tmdb.fetch(`movie/${entity.id}`, { append_to_response: 'credits,release_dates' }).catch(() => {
        console.warn(`Movie ${entity.id} kept unfiltered, its details failed`)
        return null
      })
      summaries[entity.id] = details && summarize(details, followed)
    }))
  }

  return { entities, summaries }
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
    const useControlsValues = useCallback(() => useContext(ControlsContext), [])
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
