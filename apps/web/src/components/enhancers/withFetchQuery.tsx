import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import nanobounce from 'nanobounce'
import toast from 'react-hot-toast'
import { useControlsState } from '@sensorr/ui'
import { API } from '@sensorr/services'
import { TMDB } from '@sensorr/tmdb'
import { useAnimationContext } from '../../contexts/Animation/Animation'

interface withFetchQueryProps {
  debounce?: boolean
  uri?: string
  query?: { uri: string, params: { [key: string]: string } },
  transform?: (res) => { entities: any[], total: number }
}

const withFetchQuery = (
  defaultQuery: { uri?: string; params?: {}, init?: {} },
  initPage: number = null,
  useService: (() => API) | (() => TMDB),
  useControlsValues?: () => [({ uri: string, params: { [key: string]: string }}), (query: { uri: string, params: { [key: string]: string} }) => void],
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
    const [ready, setReady] = useState(!!useControlsValues)
    const [controlsQuery, controls] = useControlsState(useControlsValues, ({ uri, ...params }) => ({ uri, params }))

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

    const [pages, setPages] = useState({})
    const processed = useRef([])

    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(null)
    const [error, setError] = useState(null)

    const debouncers = useMemo(() => ({ sync: nanobounce(0), async: nanobounce(800) }), [])
    const { ongoing } = useAnimationContext() as any

    const fetcher = useCallback(async (uri, params) => {
      try {
        processed.current.push(params.page)
        const res = await service.fetch(uri, params, defaultQuery.init)
        return transform(res)
      } catch (error) {
        processed.current = processed.current.filter((p) => p !== params.page)
        throw error
      }
    }, [transform])

    const fetchEntities = useCallback((entities) => (
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
    ), [fetcher, query])

    useEffect(() => {
      if ((props as any).error) {
        setLoading(false)
        setError((props as any).error)
        return
      }

      setLoading(true)
      setError(null)

      if (ready === false || (props as any).ready === false || (props as any).loading === true || ongoing) {
        return
      }

      debouncers[debounce ? 'async' : 'sync'](async () => {
        processed.current = []

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
    }, [ready, query, (props as any).ready, (props as any).loading, (props as any).error, ongoing])

    useEffect(() => {
      // First controlsQuery hydration by serializing initial state is now complete
      setReady(true)
    }, [])

    const entities = useMemo(() => Object.entries(pages).reduce((acc, [page, entities]: any) => ({
      ...acc,
      ...entities.reduce((acc, entity, index) => ({ ...acc, [((page - 1) * steps) + index]: entity }), {}),
    }), {}), [pages, steps])

    return (
      <WrappedComponent
        {...props as any}
        entities={entities}
        length={total}
        ready={(props as any).ready !== false && ready !== false && !loading}
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
