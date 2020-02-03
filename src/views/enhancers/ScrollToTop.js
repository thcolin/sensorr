import { useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import nanobounce from 'nanobounce'

if (window && window.history && window.history.scrollRestoration) {
  window.history.scrollRestoration = 'manual';
}

const debounce = nanobounce(200)

export const triggerScrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const ScrollToTop = ({ children, location: { pathname } }) => {
  useEffect(() => {
    debounce(() => triggerScrollToTop())
  }, [pathname])

  return children || null
}

export default withRouter(ScrollToTop)
