import { useEffect, useMemo, useState } from 'react'
import { WikiData } from '@sensorr/services'

const wikidata = new WikiData()

export const query = wikidata.query

export const useWikiData = () => wikidata

export const withWikiData = () => (WrappedComponent) => {
  const withWikiData = ({ entity, ...props }) => {
    const wikidata = useWikiData() as WikiData

    return (
      <WrappedComponent {...props} wikidata={wikidata} />
    )
  }

  withWikiData.displayName = `withWikiData(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withWikiData
}

export const useWikiDataRequest = (query, transform, { ready }: any = { ready: true }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({} as any)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    if (ready === false) {
      return
    }

    const controller = new AbortController()
    const cb = async () => {
      try {
        setData(await wikidata.fetch(query, transform, { signal: controller.signal }))
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
  }, [query, ready])

  return { loading, error, data }
}
