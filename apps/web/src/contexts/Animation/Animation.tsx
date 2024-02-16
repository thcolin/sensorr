import { createContext, useContext, useState, useMemo } from 'react'
import { Outlet, useBlocker } from 'react-router-dom'
import { scrollToTop } from '@sensorr/utils'
import nanobounce from 'nanobounce'

const animationContext = createContext({})

export const Provider = ({ children = null, ...props }) => {
  const debounce = useMemo(() => nanobounce(600), [])
  const [ongoing, setOngoing] = useState(false)

  useBlocker(({ currentLocation, nextLocation, historyAction }) => {
    if (historyAction !== 'PUSH') {
      return false
    }

    setOngoing(true)

    debounce(() => {
      const timeout = setTimeout(() => setOngoing(false), 4000)

      scrollToTop(() => {
        setOngoing(false)
        clearTimeout(timeout)
      })
    })

    return false
  })

  return (
    <animationContext.Provider {...props} value={{ ongoing }}>
      <Outlet />
    </animationContext.Provider>
  )
}

export const useAnimationContext = () => useContext(animationContext)
