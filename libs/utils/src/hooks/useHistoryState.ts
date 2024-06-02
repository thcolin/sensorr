import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

function reviver(key, value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return new Date(value)
  }

  return value
}

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
    // hydrateFromLocationState
    if (hydrateFromLocationState && typeof (location.state || {})[key] !== 'undefined') {
      return (location.state || {})[key]
    }

    const value = sessionStorage.getItem(`${location.key}-${key}`)

    if (value === null) {
      return defaultValue
    }

    try {
      return JSON.parse(value, reviver)
    } catch (e) {
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
    sessionStorage.setItem(`${location.key}-${key}`, JSON.stringify(value))
  }, [location.key, key])

  // transferStateOnSamePathnameLocationReplace
  useEffect(() => {
    if (!transferStateOnSamePathnameLocationReplace) {
      return
    }

    if (!(navigationType === 'REPLACE' && previousLocation.current?.pathname === location.pathname)) {
      return
    }

    sessionStorage.setItem(`${location.key}-${key}`, sessionStorage.getItem(`${previousLocation.current?.key}-${key}`))
    sessionStorage.removeItem(`${previousLocation.current?.key}-${key}`)
  }, [location.key])

  useEffect(() => {
    previousLocation.current = location
  }, [location.key])

  return [getHistoryState.current(), setState]
}
