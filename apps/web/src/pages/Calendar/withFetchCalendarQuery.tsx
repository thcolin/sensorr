import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import nanobounce from 'nanobounce'
import { useControlsState } from '@sensorr/ui'
import { useHistoryState } from '@sensorr/utils'
import { useTMDB } from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { useAnimationContext } from '../../contexts/Animation/Animation'

const withFetchCalendarQuery = (
  defaultQuery?: { params?: {} },
) => (WrappedComponent) => {
  const withFetchCalendarQuery = ({ ...props }) => {
    const tmdb = useTMDB()
    const persons = usePersonsMetadataContext() as any
    const { ongoing } = useAnimationContext() as any
    const debouncer = useMemo(() => nanobounce(0), [])

    // Wait for first controlsQuery hydration by serializing initial state
    const useControlsValues = useCallback(() => useHistoryState('controls', { uri: '', params: {} }), [])
    const [controlsQuery, controls] = useControlsState(useControlsValues, ({ uri, ...params }) => ({ uri, params }))

    const query = useMemo(() => ({
      uri: 'discover/movie',
      params: {
        ...defaultQuery?.params,
        ...controlsQuery?.params,
        include_video: false,
      },
    }), [JSON.stringify(defaultQuery), JSON.stringify(controlsQuery)])

    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(null)
    const [error, setError] = useState(null)

    const [pages, setPages] = useState({})
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

    const fetchEntities = useCallback((entities) => (Object.entries(totals.current)
      .reduce((acc, [page, total]) => [...acc, ...(new Array(total).fill(Number(page)))], [])
      .filter((page, index) => index >= entities[0].index && index <= entities[entities.length - 1].index)
      .reduce((acc, page) => acc.includes(page) ? acc : [...acc, page], [])
      .filter((page) => !processed.current.includes(page))
      .forEach(async (page) => {
        try {
          const { entities, total } = await fetcher(query.uri, { ...query.params, page })
          setTotal(total)
          setPages((pages) => ({ ...pages, [page]: entities }))
        } catch (err) {
          console.warn(err)
          toast.error('Error while fetching entities')
        } finally {
          setLoading(false)
        }
      })
    ), [query, fetcher])

    useEffect(() => {
      if ((props as any).error) {
        setLoading(false)
        setError((props as any).error)
        return
      }

      setLoading(true)
      setError(null)

      if ((props as any).ready === false || (props as any).loading === true || ongoing || persons.loading) {
        return
      }

      debouncer(async () => {
        processed.current = []
        records.current = []
        totals.current = {}

        try {
          const { entities, total } = await fetcher(query.uri, { ...query.params, page: 1 })
          setTotal(total)
          setPages({ 1: entities })
        } catch (error) {
          setTotal(null)
          setPages({})
          setError(error)
        } finally {
          setLoading(false)
        }
      })
    }, [query, (props as any).ready, (props as any).loading, (props as any).error, ongoing, persons.loading])

    const entities = useMemo(() => {
      const sorted = (Object.keys(totals.current).length !== Object.keys(pages).length ? [] : Object.values(pages)
        .reduce((acc, curr) => [...(acc as any), ...(curr as any)], [])) as any

      sorted.sort((a, b) => {
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

      return (Object.entries(totals.current)
        .reduce((acc, [page, total]) => [...acc, ...(new Array(total).fill(Number(page))).map((page, index) => ({ page, index }))], [])
        .reduce((acc, { page, index }, i) => ({
          ...acc,
          ...(sorted[i] ? { [i]: sorted[i] } : pages[page] ? { [i]: pages[page][index] } : {}),
        }), {})
      )
    }, [pages, query?.params?.sort_by])

    return (
      <WrappedComponent
        {...props}
        entities={entities}
        length={total}
        ready={(props as any).ready !== false && !loading}
        onMore={fetchEntities}
        controls={controls}
        error={(!persons.loading && !Object.keys(persons.metadata).length) ? {
          emoji: '🧑‍🎤',
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
