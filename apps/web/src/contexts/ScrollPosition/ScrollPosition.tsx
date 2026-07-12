import { MutableRefObject, createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { useBlocker, useLocation, useNavigationType } from 'react-router-dom'
import { useDeviceContext } from '../Device/Device'
import { useDetailsDrawerContext } from '../DetailsDrawer/DetailsDrawer'

const scrollPositionContext = createContext({})

export const Provider = ({ ...props }) => {
  const ref = useRef()
  const { pwa, setHistoryIndex } = useDeviceContext()
  const detailsDrawer = useDetailsDrawerContext()
  const location = useLocation()
  const navigationType = useNavigationType()

  // Before navigate
  useBlocker(({ currentLocation, nextLocation, historyAction }) => {
    if (!ref.current) {
      return
    }

    detailsDrawer.close()

    sessionStorage.setItem(`${location.key}-scroll`, (ref.current as any).scrollTop)
    setHistoryIndex(curr => ({ POP: curr - 1, PUSH: curr + 1, REPLACE: curr }[historyAction]))

    if (!pwa) {
      document.getElementById('main').style.viewTransitionName = 'fade'
      return false
    }

    if (window.SENSORR_BODY_VIEW_TRANSITION_NAME) {
      document.getElementById('main').style.viewTransitionName = window.SENSORR_BODY_VIEW_TRANSITION_NAME
      window.SENSORR_BODY_VIEW_TRANSITION_NAME = null
      return false
    }

    if (historyAction === 'PUSH') {
      document.getElementById('main').style.viewTransitionName = 'forward'
      return false
    }

    if (historyAction === 'POP') {
      document.getElementById('main').style.viewTransitionName = 'backward'
      return false
    }

    return false
  })

  // After navigate
  useEffect(() => {
    if (!ref.current) {
      return
    }

    // On REPLACE we only persist the current position (same page, updated search params), while
    // PUSH (new key, no saved value → 0) and POP (restore saved value) both delegate to the shared
    // restoration helper.
    if (navigationType === 'REPLACE') {
      sessionStorage.setItem(`${location.key}-scroll`, (ref.current as any).scrollTop)
      return
    }

    restoreScrollPosition()
  }, [location.key, navigationType])

  const restoreScrollPosition = useCallback(() => {
    const top = Number(sessionStorage.getItem(`${location.key}-scroll`)) || 0

    // Apply immediately, then re-apply on the next frame: when a <VirtualGrid /> mounts, its full
    // scroll height may only settle after the first paint, so a single synchronous set can be clamped.
    const apply = () => {
      if (ref.current) {
        (ref.current as any).scrollTop = top
      }
    }

    apply()
    requestAnimationFrame(apply)
  }, [location.key])

  return (
    <scrollPositionContext.Provider {...props} value={{ ref, restoreScrollPosition }} />
  )
}

export const useScrollPositionContext = () => useContext(scrollPositionContext) as ({
  ref: MutableRefObject<HTMLDivElement>
  restoreScrollPosition: () => void
})
