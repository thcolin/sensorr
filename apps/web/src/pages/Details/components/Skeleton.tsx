import { memo, useRef } from 'react'
import { Skeleton as Base, barTintOf } from '@sensorr/ui'

// A block of the page while it loads: its `shape` in bars, in the poster's colors, which becomes the block once ready.
// Their color stops following the palette once the block is ready: a palette resolved with the data would turn the
// bars right before they leave
const UISkeleton = ({ children, palette, ready, shape, ...props }) => {
  const tint = useRef(null)

  if (!ready || !tint.current) {
    tint.current = barTintOf(palette)
  }

  return (
    <Base
      clip={false}
      align='start'
      {...props}
      ready={ready}
      placeholder={shape}
      style={{ '--theme-ui-colors-gray': tint.current }}
    >
      {children}
    </Base>
  )
}

export const Skeleton = memo(UISkeleton)
