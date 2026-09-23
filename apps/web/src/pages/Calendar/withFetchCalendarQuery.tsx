import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import toast from 'react-hot-toast'
import nanobounce from 'nanobounce'
import { useControlsState } from '@sensorr/ui'
import { useHistoryState } from '@sensorr/utils'
import { useTMDB } from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { judge, summarize } from './refine'

const withFetchCalendarQuery = (
  defaultQuery?: { params?: {} },
) => (WrappedComponent) => {
  const withFetchCalendarQuery = ({ ...props }) => {
    const tmdb = useTMDB()
    const persons = usePersonsMetadataContext() as any
    const debouncer = useMemo(() => nanobounce(0), [])

    // Wait for first controlsQuery hydration by serializing initial state
    const useControlsValues = useCallback(() => useHistoryState('controls', { uri: '', params: {} }), [])
    const [controlsQuery, controls] = useControlsState(useControlsValues, ({ uri, ...params }) => ({ uri, params }))
    controlsQuery.params = Object.keys(controlsQuery.params || {})
      .filter(key => !['hide_library'].includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: controlsQuery.params[key] }), {})

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

    const processed = useRef([])
    const records = useRef([])
    const totals = useRef({})

    const fetcher = useCallback(async (uri, params) => {
      try {
        const raws = []
        const entities = []
        processed.current.push(params.page)

        for (let i = 0; i < Math.ceil(Object.keys(persons.metadata).length / 500); i++) {
          raws[i] = await tmdb.fetch(uri, {
            ...params,
            with_people: Object.keys(persons.metadata).slice(i * 500, (i + 1) * 500).join('|'),
          })

          raws[i].results.forEach(entity => {
            if (records.current.includes(entity.id)) {
              return
            }

            records.current.push(entity.id)
            entities.push(entity)
          })
        }

        entities.sort((a, b) => {
          const [key, order] = (params?.sort_by || 'primary_release_date.asc').split('.')

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

        totals.current = Array(raws.reduce((acc, curr) => Math.max(acc, curr.total_pages), 0)).fill(true).reduce((acc, curr, index) => ({
          ...acc,
          [index + 1]: ((index + 1) === params.page) ? entities.length :
            typeof totals.current[index + 1] !== 'undefined' ? totals.current[index + 1] :
            raws.reduce((acc, { total_results }) => acc + Math.max(0,
              total_results > (index * 20) ? Math.min(20, Math.max(0, total_results - (index * 20))) : 0
            ), 0),
        }), {})

        return { entities, total: Object.values(totals.current).reduce((acc, curr) => Number(acc) + Number(curr), 0) }
      } catch (error) {
        processed.current = processed.current.filter((p) => p !== params.page)
        throw error
      }
    }, [persons.metadata])

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

      debouncer(async () => {
        processed.current = []
        records.current = []
        totals.current = {}

        try {
          let page = 1
          let done = false
          let pages = {}

          do {
            const res = await fetcher(query.uri, { ...query.params, page: page })
            pages = { ...pages, [page]: res.entities }
            done = !res.entities.length
            page++
          } while (!done)

          const entities = Object.values(pages).flat() as any[]
          const summaries = {}

          for (let i = 0; i < entities.length; i += 20) {
            await Promise.all(entities.slice(i, i + 20).map(async (entity) => {
              const details = await tmdb.fetch(`movie/${entity.id}`, { append_to_response: 'credits,release_dates' }).catch(() => null)
              summaries[entity.id] = details && summarize(details, persons.metadata)
            }))
          }

          setFetched({ entities, summaries })
        } catch (error) {
          setError(error)
        } finally {
          setLoading(false)
        }
      })
    }, [query, (props as any).ready, (props as any).loading, (props as any).error, persons.loading])

    const refined = useMemo(() => {
      if (!fetched) {
        return { entities: {}, total: null, statistics: {} }
      }

      const { entities, summaries } = fetched
      const released = entities.filter(entity => judge(summaries[entity.id], { ...refinements, with_credits_departments: '' }))
      const kept = released.filter(entity => judge(summaries[entity.id], refinements))

      kept.sort((a, b) => {
        const [key, order] = (query?.params?.sort_by || 'primary_release_date.asc').split('.')

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

      return {
        entities: kept.reduce((acc, entity, index) => ({ ...acc, [index]: entity }), {}),
        total: kept.length,
        statistics: {
          with_credits_departments: released
            .flatMap(entity => summaries[entity.id]?.departments || [])
            .reduce((acc, _id) => [...acc.filter(stat => stat._id !== _id), { _id, count: (acc.find(stat => stat._id === _id)?.count || 0) + 1 }], []),
        },
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
