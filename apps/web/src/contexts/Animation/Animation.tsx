import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { Prompt } from 'react-router-dom'
import { scrollToTop } from '@sensorr/utils'
import nanobounce from 'nanobounce'

const animationContext = createContext({})

export const Provider = ({ children, ...props }) => {
  const debounce = useMemo(() => nanobounce(600), [])
  const [ongoing, setOngoing] = useState(false)

  const handleChange = useCallback((location, action) => {
    if (['PUSH'].includes(action)) {
      setOngoing(true)
      debounce(() => scrollToTop(() => setOngoing(false)))
    }

    return true
  }, [])

  return (
    <animationContext.Provider {...props} value={{ ongoing }}>
      <Prompt message={handleChange} />
      {children}
    </animationContext.Provider>
  )
}

export const useAnimationContext = () => useContext(animationContext)
