import { createContext, useContext, useEffect, useState } from 'react'
import { useDevice } from '@sensorr/utils'

const deviceContext = createContext({})

export const Provider = ({ ...props }) => {
  const device = useDevice()
  const [historyResetIndex, setHistoryResetIndex] = useState(0)
  const pwa = window.matchMedia('(display-mode: standalone)').matches
  const ios = (
    (/iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !(window as any).MSStream
  )

  useEffect(() => {
    (window as any).SENSORR_SCROLL_BEHAVIOR = { mobile: 'auto', tablet: 'auto', desktop: 'smooth' }[device]
  }, [device])

  return (
    <deviceContext.Provider {...props} value={{ device, ios, pwa, historyResetIndex, setHistoryResetIndex }} />
  )
}

export const useDeviceContext = () => useContext(deviceContext) as ({ device: 'mobile' | 'tablet' | 'desktop', ios: boolean, pwa: boolean, historyResetIndex: number, setHistoryResetIndex: any })
