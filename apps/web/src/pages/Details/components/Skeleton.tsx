import { memo } from 'react'
import { Skeleton as Base } from '@sensorr/ui'

// A block of the page while it loads: its `shape` in bars, in the poster's colors, which becomes the block once ready
const UISkeleton = ({ children, palette, ready, shape, ...props }) => (
  <Base
    clip={false}
    align='start'
    {...props}
    ready={ready}
    placeholder={shape}
    style={{ '--theme-ui-colors-gray': `color-mix(in oklab, ${palette?.color || 'currentColor'} 14%, ${palette?.backgroundColor || 'transparent'})` }}
  >
    {children}
  </Base>
)

export const Skeleton = memo(UISkeleton)
