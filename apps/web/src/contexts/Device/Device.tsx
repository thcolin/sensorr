import { useBreakpointIndex } from '@theme-ui/match-media'
import { createContext, useContext } from 'react'

const deviceContext = createContext({})

export const Provider = ({ ...props }) => {
  const breakpoint = useBreakpointIndex()
  const device = ['mobile', 'tablet', 'desktop'][breakpoint]

  return (
    <deviceContext.Provider {...props} value={{ device }} />
  )
}

export const useDeviceContext = () => useContext(deviceContext) as ({ device: 'mobile' | 'tablet' | 'desktop' })
