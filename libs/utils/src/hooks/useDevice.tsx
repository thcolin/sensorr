import { useBreakpointIndex } from './useMatchMedia'

export const useDevice = () => {
  const breakpoint = useBreakpointIndex()
  const device = ['mobile', 'tablet', 'desktop'][breakpoint]
  return device
}
