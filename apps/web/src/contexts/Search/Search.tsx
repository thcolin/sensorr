import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTMDB } from '../../store/tmdb'

const searchContext = createContext({})

export const Provider = ({ ...props }) => {
  const tmdb = useTMDB()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState(null)
  const [historyDisplay, setHistoryDisplay] = useState(false)

  const addHistoryQuery = useCallback((query) => setHistory(history => {
    const next = [...new Set([query, ...history])].slice(0, 5)
    localStorage.setItem('sensorr-search-history', JSON.stringify(next))
    return next
  }), [setHistory])

  const removeHistoryQuery = useCallback((query) => setHistory(history => {
    const next = history.filter(q => q !== query)
    localStorage.setItem('sensorr-search-history', JSON.stringify(next))
    return next
  }), [setHistory])

  const clear = useCallback(() => {
    setResults(null)
    setQuery('')
    setLoading(false)
  }, [])

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('sensorr-search-history') || '[]'))
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

        if (
          !!movies?.results?.length ||
          !!collections?.results?.length ||
          !!persons?.results?.length ||
          !!companies?.results?.length ||
          !!keywords?.results?.length
        ) {
          addHistoryQuery(query)
        }
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
        input,
        setInput,
        query,
        setQuery,
        loading,
        results,
        clear,
        history,
        removeHistoryQuery,
        historyDisplay,
        setHistoryDisplay,
      }}
    />
  )
}

export const useSearchContext = () => useContext(searchContext)
