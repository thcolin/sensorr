import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import nanobounce from 'nanobounce'
import toast from 'react-hot-toast'
import { useControlsState } from '@sensorr/ui'
import { API } from '@sensorr/services'
import { TMDB } from '@sensorr/tmdb'

interface withFetchQueryProps {
  debounce?: boolean
  uri?: string
  query?: { uri: string, params: { [key: string]: string } },
  transform?: (res) => { entities: any[], total: number }
}

const withFetchQuery = (
  // `filters` drop entities in the browser, one predicate per control value that TMDB can't filter on.
  // Pages then load one after the other and are laid end to end, so a dropped entity leaves no hole.
  defaultQuery: { uri?: string; params?: {}, init?: {}, filters?: { [key: string]: (entity, value) => boolean } },
  initPage: number = null,
  useService: (() => API) | (() => TMDB),
  useControlsValues?: () => [
    ({ uri: string, params: { [key: string]: string }}),
    (query: { uri: string, params: { [key: string]: string} }) => void,
  ],
  steps: number = 20,
) => <TProps,>(WrappedComponent: React.JSXElementConstructor<TProps>) => {
  const withFetchQuery = ({
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
    const keep = useMemo(() => filters && ((entity) => Object.keys(filters).every((key) => filters[key](entity, controlsValues?.[key]))), [filtersValues])

    const [pages, setPages] = useState({})
    const [wanted, setWanted] = useState(0)
    const processed = useRef([])

    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(null)
    const [error, setError] = useState(null)

    const debouncers = useMemo(() => ({ sync: nanobounce(0), async: nanobounce(800) }), [])

    const fetcher = useCallback(async (uri, params) => {
      try {
        processed.current.push(params.page)
        const res = transform(await service.fetch(uri, params, defaultQuery.init))
        return keep ? { ...res, entities: res.entities.filter(keep) } : res
      } catch (error) {
        processed.current = processed.current.filter((p) => p !== params.page)
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
    ), [fetcher, query, keep])

    const loaded = useMemo(() => Object.values(pages).reduce((sum: number, entities: any[]) => sum + entities.length, 0) as number, [pages])
    const next = useMemo(() => Math.max(0, ...Object.keys(pages).map(Number)) + 1, [pages])

    useEffect(() => {
      if (!keep || loading || total === null || wanted < loaded || (next - 1) * steps >= total || processed.current.includes(next)) {
        return
      }

      fetcher(query.uri, { ...query.params, page: next })
        .then(({ entities }) => setPages((pages) => ({ ...pages, [next]: entities })))
        .catch((err) => {
          console.warn(err)
          toast.error('Error while fetching entities')
        })
    }, [keep, wanted, loaded, next, total, loading])

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
        processed.current = []
        setWanted(0)

        try {
          const { entities, total } = await fetcher(query.uri, { ...query.params, page: initPage || 1 })
          setTotal(total)
          setPages({ [initPage || 1]: entities })
        } catch (error) {
          setTotal(null)
          setPages({})
          setError(error)
        } finally {
          setLoading(false)
        }
      })
    }, [controlsQuery?.ready, query, keep, (props as any).ready, (props as any).loading, (props as any).error])

    const entities = useMemo(() => keep ? (
      Object.keys(pages)
        .map(Number)
        .sort((a, b) => a - b)
        .flatMap((page) => pages[page])
        .reduce((acc, entity, index) => ({ ...acc, [index]: entity }), {})
    ) : (
      Object.entries(pages).reduce((acc, [page, entities]: any) => ({
        ...acc,
        ...entities.reduce((acc, entity, index) => ({ ...acc, [((page - 1) * steps) + index]: entity }), {}),
      }), {})
    ), [pages, steps, keep])

    return (
      <WrappedComponent
        {...props as any}
        entities={entities}
        // Filtered, the count is known only once the last page is in
        length={keep && total !== null && (next - 1) * steps >= total ? loaded : total}
        ready={(props as any).ready !== false && !loading}
        error={error || (props as any).error}
        onMore={fetchEntities}
        controls={controls}
      />
    )
  }

  withFetchQuery.displayName = `withFetchQuery(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withFetchQuery
}

export default withFetchQuery
