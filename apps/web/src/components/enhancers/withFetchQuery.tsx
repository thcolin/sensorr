import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import nanobounce from 'nanobounce'
import toast from 'react-hot-toast'
import { useControlsState } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { useHistoryState } from '@sensorr/utils'
import { API } from '@sensorr/services'
import { TMDB } from '@sensorr/tmdb'

interface withFetchQueryProps {
  debounce?: boolean
  uri?: string
  query?: { uri: string, params: { [key: string]: string } },
  transform?: (res) => { entities: any[], total: number }
}

// Pages requested at once while filtered entities don't fill the grid yet
const BATCH = 5

export const useControlsHistoryState = () => useHistoryState('controls', { uri: '', params: {} }) as any

const withFetchQuery = (
  // `filters` turn a control value TMDB can't filter on into a predicate, or `null` when inactive. While
  // one is active, pages load in batches and are laid end to end, so a dropped entity leaves no hole.
  defaultQuery: { uri?: string; params?: {}, init?: {}, filters?: { [key: string]: (value) => ((entity) => boolean) | null } },
  initPage: number = null,
  useService: (() => API) | (() => TMDB),
  useControlsValues?: () => [
    ({ uri: string, params: { [key: string]: string }}),
    (query: { uri: string, params: { [key: string]: string} }) => void,
  ],
  steps = 20,
) => <TProps,>(WrappedComponent: React.JSXElementConstructor<TProps>) => {
  const WithFetchQuery = ({
    debounce = false,
    query: propsQuery = { uri: defaultQuery.uri, params: defaultQuery.params },
    transform = (res) => ({ entities: res.results, total: res.total_results }),
    ...props
  }: withFetchQueryProps & Omit<TProps, 'length' | 'entities' | 'onMore'>) => {
    const service = useService()
    // Wait for first controlsQuery hydration by serializing initial state
    const [controlsValues, setControlsValues] = (useControlsValues || (() => [{}, () => null]))()
    const [controlsQuery, controls] = useControlsState(() => [controlsValues, setControlsValues], ({ uri, ...params }) => ({ ready: true, uri, params }))

    const query = useMemo(() => ({
      uri: controlsQuery.uri || propsQuery.uri || defaultQuery.uri,
      params: {
        ...defaultQuery.params,
        ...propsQuery.params,
        ...controlsQuery.params,
      },
    }), [
      JSON.stringify(defaultQuery),
      JSON.stringify(propsQuery),
      JSON.stringify(controlsQuery),
    ])

    const filters = defaultQuery.filters
    const filtersValues = JSON.stringify(Object.keys(filters || {}).map((key) => controlsValues?.[key]))
    const keep = useMemo(() => {
      const predicates = Object.keys(filters || {}).map((key) => filters[key](controlsValues?.[key])).filter(Boolean)
      return predicates.length ? (entity) => predicates.every((predicate) => predicate(entity)) : null
    }, [filtersValues])

    const [pages, setPages] = useState({})
    const [wanted, setWanted] = useState(0)
    const processed = useRef([])
    // Bumped on each new query, so a page answered for the previous one is dropped
    const generation = useRef(0)

    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(null)
    const [error, setError] = useState(null)

    const debouncers = useMemo(() => ({ sync: nanobounce(0), async: nanobounce(800) }), [])

    const fetcher = useCallback(async (uri, params) => {
      const current = generation.current

      try {
        processed.current.push(params.page)
        const res = transform(await service.fetch(uri, params, defaultQuery.init))
        return keep ? { ...res, entities: res.entities.filter(keep) } : res
      } catch (error) {
        if (current === generation.current) {
          processed.current = processed.current.filter((p) => p !== params.page)
        }

        throw error
      }
    }, [transform, keep])

    // The grid calls `onMore` while it renders, so the index it wants is stored after that render
    const fetchEntities = useCallback((entities) => keep ? (
      Promise.resolve().then(() => setWanted(Math.max(0, ...entities.map(({ index }) => index))))
    ) : (
      Object.keys(entities.reduce((acc, { index }) => ({ ...acc, [Math.ceil(index / steps)]: true }), {}))
        .map((page) => Number(page))
        .filter((page) => !!page && !processed.current.includes(page))
        .forEach(async (page) => {
          const current = generation.current

          try {
            const { entities, total } = await fetcher(query.uri, { ...query.params, page })

            if (current === generation.current) {
              setTotal(total)
              setPages((pages) => ({ ...pages, [page]: entities }))
            }
          } catch (err) {
            console.warn(err)
            toast.error(i18n.t('enhancers.fetchQuery.error'))
          } finally {
            setLoading(false)
          }
        })
    ), [fetcher, query, keep])

    // Filtered, only the pages answered from the first one on are shown, so a late page never shifts the grid
    const contiguous = useMemo(() => {
      const list = []
      for (let page = initPage || 1; pages[page]; page++) list.push(pages[page])
      return list
    }, [pages])

    const loaded = useMemo(() => contiguous.reduce((sum, entities) => sum + entities.length, 0), [contiguous])
    const complete = total !== null && ((initPage || 1) + contiguous.length - 1) * steps >= total

    useEffect(() => {
      if (!keep || loading || complete || wanted < loaded) {
        return
      }

      const current = generation.current
      const last = Math.ceil(total / steps)
      const batch = []

      for (let page = initPage || 1; page <= last && batch.length + processed.current.filter((p) => !pages[p]).length < BATCH; page++) {
        if (!processed.current.includes(page)) {
          batch.push(page)
        }
      }

      batch.forEach((page) => fetcher(query.uri, { ...query.params, page })
        .then(({ entities }) => current === generation.current && setPages((pages) => ({ ...pages, [page]: entities })))
        .catch((err) => {
          console.warn(err)
          toast.error(i18n.t('enhancers.fetchQuery.error'))
        }))
    }, [keep, wanted, loaded, complete, pages, total, loading])

    useEffect(() => {
      if ((props as any).error) {
        setLoading(false)
        setError((props as any).error)
        return
      }

      setLoading(true)
      setError(null)

      if ((useControlsValues && !controlsQuery?.ready) || (props as any).ready === false || (props as any).loading === true) {
        return
      }

      debouncers[debounce ? 'async' : 'sync'](async () => {
        const current = ++generation.current
        processed.current = []
        setWanted(0)

        try {
          const { entities, total } = await fetcher(query.uri, { ...query.params, page: initPage || 1 })

          if (current === generation.current) {
            setTotal(total)
            setPages({ [initPage || 1]: entities })
          }
        } catch (error) {
          if (current === generation.current) {
            setTotal(null)
            setPages({})
            setError(error)
          }
        } finally {
          if (current === generation.current) {
            setLoading(false)
          }
        }
      })
    }, [controlsQuery?.ready, query, keep, (props as any).ready, (props as any).loading, (props as any).error])

    const entities = useMemo(() => keep ? (
      contiguous.flat().reduce((acc, entity, index) => ({ ...acc, [index]: entity }), {})
    ) : (
      Object.entries(pages).reduce((acc, [page, entities]: any) => ({
        ...acc,
        ...entities.reduce((acc, entity, index) => ({ ...acc, [((page - 1) * steps) + index]: entity }), {}),
      }), {})
    ), [pages, contiguous, steps, keep])

    return (
      <WrappedComponent
        {...props as any}
        entities={entities}
        // Filtered, the count is known only once the last page is in
        length={keep && complete ? loaded : total}
        ready={(props as any).ready !== false && !loading}
        error={error || (props as any).error}
        onMore={fetchEntities}
        controls={controls}
      />
    )
  }

  WithFetchQuery.displayName = `withFetchQuery(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithFetchQuery
}

export default withFetchQuery
