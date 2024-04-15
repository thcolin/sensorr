import { useDevice } from '@sensorr/utils'
import { createContext, useContext } from 'react'

const deviceContext = createContext({})

export const Provider = ({ ...props }) => {
  const device = useDevice()
  const ios = (/iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !(window as any).MSStream

  return (
    <deviceContext.Provider {...props} value={{ device, ios }} />
  )
}

export const useDeviceContext = () => useContext(deviceContext) as ({ device: 'mobile' | 'tablet' | 'desktop', ios: boolean })
