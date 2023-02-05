import { useEffect, useMemo, useState } from 'react'
import { TMDB } from '@sensorr/tmdb'

const tmdb = new TMDB({})

export const useTMDB = () => tmdb

export const withTMDB = () => (WrappedComponent) => {
  const withTMDB = ({ entity, ...props }) => {
    const tmdb = useTMDB() as TMDB

    return (
      <WrappedComponent {...props} tmdb={tmdb} />
    )
  }

  withTMDB.displayName = `withTMDB(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withTMDB
}

export const useTMDBRequest = (uri, params = {}, { transform, ready }: any = { transform: (data) => data, ready: true }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({} as any)
  const [error, setError] = useState(null)

  const details = useMemo(() => transform(data as any), [data])

  useEffect(() => {
    setLoading(true)
    setError(null)

    if (ready === false) {
      return
    }

    const controller = new AbortController()
    const cb = async () => {
      try {
        setData(await tmdb.fetch(uri, params, { signal: controller.signal }))
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setError(error)
      } finally {
        setLoading(false)
      }
    }

    cb()
    return () => {
      controller.abort()
      setError(new DOMException('Request aborted.'))
    }
  }, [uri, JSON.stringify(params), ready])

  return { loading, error, data, details }
}
