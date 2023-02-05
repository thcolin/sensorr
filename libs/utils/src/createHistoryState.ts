import { useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const useGlobalHistoryState = () => {
  const navigate = useNavigate()
  const { key: _, ...location } = useLocation()
  const setState = useCallback((fnOrState) => {
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      ...location,
      replace: true,
      state: typeof fnOrState === 'function' ? fnOrState(location.state) : fnOrState,
    })
  }, [location])

  return [location.state, setState] as [any, any]
}

export const useHistoryState = (key, initial) => {
  const location = useRef(null)
  const navigate = useNavigate()
  const { key: _, ...next } = useLocation()

  location.current = next

  const setState = useCallback((state) => {
    navigate(`${location.current.pathname}${location.current.search}${location.current.hash}`, {
      ...location.current,
      replace: true,
      state: {
        ...location.current.state,
        [key]: (typeof state === 'function' ? state((location.current.state || {})[key]) : state),
      },
    })
  }, [key])

  return [
    typeof (location.current.state || {})[key] === 'undefined' ? initial : location.current.state[key],
    setState,
  ]
}

export const createHistoryState = (key, initial) => () => useHistoryState(key, initial)
