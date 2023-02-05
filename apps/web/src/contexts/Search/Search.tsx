import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTMDB } from '../../store/tmdb'

const searchContext = createContext({})

export const Provider = ({ ...props }) => {
  const tmdb = useTMDB()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const clear = useCallback(() => {
    setResults(null)
    setQuery('')
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!query) {
      setResults(null)
      return
    }

    const controller = new AbortController()

    const cb = async () => {
      try {
        setLoading(true)
        const [movies, persons, collections, keywords, companies] = await Promise.all([
          tmdb.fetch('search/movie', { query }, { signal: controller.signal }),
          tmdb.fetch('search/person', { query }, { signal: controller.signal }),
          tmdb.fetch('search/collection', { query }, { signal: controller.signal }),
          tmdb.fetch('search/keyword', { query }, { signal: controller.signal }),
          tmdb.fetch('search/company', { query }, { signal: controller.signal }),
        ])
        setResults({ movies, persons, collections, keywords, companies })
      } catch (err) {
        setResults(null)
        console.warn(err)
        toast.error('Error while fetching results')
      } finally {
        setLoading(false)
      }
    }

    cb()
    return () => controller.abort()
  }, [query])

  return (
    <searchContext.Provider
      {...props}
      value={{
        query,
        setQuery,
        loading,
        results,
        clear,
      }}
    />
  )
}

export const useSearchContext = () => useContext(searchContext)
