import { useRef, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

export const useHistoryState = (key, initial) => {
  const location = useRef(null)
  const { replace } = useHistory()
  const { key: _, ...next } = useLocation()

  location.current = next

  const setState = useCallback((state) => replace({
    ...location.current,
    state: {
      ...location.current.state,
      [key]: (typeof state === 'function' ? state((location.current.state || {})[key]) : state),
    },
  }), [key])

  return [
    typeof (location.current.state || {})[key] === 'undefined' ? initial : location.current.state[key],
    setState,
  ]
}

export const createHistoryState = (key, initial) => () => useHistoryState(key, initial)
