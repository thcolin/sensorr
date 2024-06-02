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
      (ref.current as any).style.viewTransitionName = 'fade'
      return false
    }

    if (window.SENSORR_BODY_VIEW_TRANSITION_NAME) {
      (ref.current as any).style.viewTransitionName = window.SENSORR_BODY_VIEW_TRANSITION_NAME
      window.SENSORR_BODY_VIEW_TRANSITION_NAME = null
      return false
    }

    if (historyAction === 'PUSH') {
      (ref.current as any).style.viewTransitionName = 'forward'
      return false
    }

    if (historyAction === 'POP') {
      (ref.current as any).style.viewTransitionName = 'backward'
      return false
    }

    return false
  })

  // After navigate
  useEffect(() => {
    if (!ref.current) {
      return
    }

    if (navigationType === 'PUSH') {
      (ref.current as any).scroll(0, 0)
      // Ugly af, but it need a time before scroll() to effectivly scroll when a <VirtualGrid /> is used
      const timeout = setTimeout(() => (ref.current as any).scroll(0, 0), 0)
      return () => clearTimeout(timeout)
    } else if (navigationType === 'POP') {
      (ref.current as any).scroll(0, sessionStorage.getItem(`${location.key}-scroll`) || 0)
      // Ugly af, but it need a time before scroll() to effectivly scroll when a <VirtualGrid /> is used
      const timeout = setTimeout(() => (ref.current as any).scroll(0, sessionStorage.getItem(`${location.key}-scroll`) || 0), 0)
      return () => clearTimeout(timeout)
    } else if (navigationType === 'REPLACE') {
      sessionStorage.setItem(`${location.key}-scroll`, (ref.current as any).scrollTop)
    }
  }, [location.key, navigationType])

  const restoreScrollPosition = useCallback(() => {
    (ref.current as any).scroll(0, sessionStorage.getItem(`${location.key}-scroll`) || 0)
  }, [location.key])

  return (
    <scrollPositionContext.Provider {...props} value={{ ref, restoreScrollPosition }} />
  )
}

export const useScrollPositionContext = () => useContext(scrollPositionContext) as ({
  ref: MutableRefObject<HTMLDivElement>
  restoreScrollPosition: () => void
})
