import { useBreakpointIndex } from '@theme-ui/match-media'
import { createContext, useContext } from 'react'

const deviceContext = createContext({})

export const Provider = ({ ...props }) => {
  const breakpoint = useBreakpointIndex()
  const device = ['mobile', 'tablet', 'desktop'][breakpoint]
  const ios = (/iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !(window as any).MSStream

  return (
    <deviceContext.Provider {...props} value={{ device }} />
  )
}

export const useDeviceContext = () => useContext(deviceContext) as ({ device: 'mobile' | 'tablet' | 'desktop', ios: boolean })
