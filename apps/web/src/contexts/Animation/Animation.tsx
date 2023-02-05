import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { scrollToTop } from '@sensorr/utils'
import nanobounce from 'nanobounce'

const animationContext = createContext({})

export const Provider = ({ children, ...props }) => {
  const debounce = useMemo(() => nanobounce(600), [])
  // TODO: Debug & fix, test: `/home` > [click] `/movie/XXXX`, sometimes `ongoing` doesn't go back to `false`
  const [ongoing, setOngoing] = useState(false)

  const location = useLocation()
  const action = useNavigationType()

  useEffect(() => {
    if (['PUSH'].includes(action)) {
      setOngoing(true)
      debounce(() => scrollToTop(() => setOngoing(false)))
    }
  }, [location.key])

  return (
    <animationContext.Provider {...props} value={{ ongoing }}>
      {children}
    </animationContext.Provider>
  )
}

export const useAnimationContext = () => useContext(animationContext)
