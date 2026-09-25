import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

function reviver(key, value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return new Date(value)
  }

  return value
}

// Every entry opened by a full page load, typed URL or new tab, has the `default` key, whatever its page: its pathname tells them apart
const entryOf = (location) => location.key === 'default' ? location.pathname : location.key

export const useHistoryState = (key, defaultValue, {
  enabled = true,
  hydrateFromLocationState = true,
  transferStateOnSamePathnameLocationReplace = true,
} = {}) => {
  if (!enabled) {
    return [defaultValue, () => {}]
  }

  const location = useLocation()
  const navigationType = useNavigationType()
  const previousLocation = useRef(null)

  const getHistoryState = useRef(null)
  getHistoryState.current = () => {
    const hydratableFromLocationState = hydrateFromLocationState && typeof (location.state || {})[key] !== 'undefined'
    const value = sessionStorage.getItem(`${entryOf(location)}-${key}`)

    if (value === null) {
      if (hydratableFromLocationState) {
        return (location.state || {})[key]
      }

      return defaultValue
    }

    try {
      const parsed = JSON.parse(value, reviver)

      if (hydratableFromLocationState) {
        return { ...(location.state || {})[key], ...parsed }
      }

      return parsed
    } catch (e) {
      if (hydratableFromLocationState) {
        return (location.state || {})[key]
      }

      return value
    }
  }

  // Ugly af, but needed to force re-render on setState()
  const [, setLocalState] = useState(getHistoryState.current)

  // save state to sessionStorage and force re-render
  const setState = useCallback((stateOrFn) => {
    let value = stateOrFn

    if (typeof stateOrFn === 'function') {
      value = stateOrFn(getHistoryState.current())
    }

    setLocalState(value)
    sessionStorage.setItem(`${entryOf(location)}-${key}`, JSON.stringify(value))
  }, [location.key, location.pathname, key])

  // transferStateOnSamePathnameLocationReplace
  useEffect(() => {
    if (!transferStateOnSamePathnameLocationReplace) {
      return
    }

    if (!(navigationType === 'REPLACE' && previousLocation.current?.pathname === location.pathname)) {
      return
    }

    sessionStorage.setItem(`${entryOf(location)}-${key}`, sessionStorage.getItem(`${entryOf(previousLocation.current)}-${key}`))
    sessionStorage.removeItem(`${entryOf(previousLocation.current)}-${key}`)
  }, [location.key])

  useEffect(() => {
    previousLocation.current = location
  }, [location.key])

  return [getHistoryState.current(), setState]
}
