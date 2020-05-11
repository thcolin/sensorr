import { useEffect } from 'react'
import { useLocation, useHistory } from 'react-router-dom'

export const triggerScrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const ScrollRestoration = ({ children }) => {
  const { pathname } = useLocation()
  const { action } = useHistory()

  useEffect(() => {
    if (['PUSH'].includes(action)) {
      triggerScrollToTop()
    }
  }, [pathname])

  return children || null
}

export default ScrollRestoration
