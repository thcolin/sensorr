import { useEffect } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import nanobounce from 'nanobounce'

const debounce = nanobounce(200)

export const triggerScrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const ScrollRestoration = ({ children }) => {
  const { pathname } = useLocation()
  const { action } = useHistory()

  useEffect(() => {
    if (['PUSH'].includes(action)) {
      debounce(() => triggerScrollToTop())
    }
  }, [pathname])

  return children || null
}

export default ScrollRestoration
