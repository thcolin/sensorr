import { useBreakpointIndex } from '@theme-ui/match-media'

export const useDevice = () => {
  const breakpoint = useBreakpointIndex()
  const device = ['mobile', 'tablet', 'desktop'][breakpoint]
  return device
}
