import { useBreakpointIndex } from '@sensorr/utils'

export const useDevice = () => {
  const breakpoint = useBreakpointIndex()
  const device = ['mobile', 'tablet', 'desktop'][breakpoint]
  return device
}
