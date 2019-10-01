import { useEffect } from 'react'
import { withRouter } from 'react-router-dom'

export const triggerScrollToTop = () => window.scrollTo(0, 0)

const ScrollToTop = ({ children, location: { pathname } }) => {
  useEffect(() => {
    triggerScrollToTop()
  }, [pathname])

  return children || null
}

export default withRouter(ScrollToTop)
