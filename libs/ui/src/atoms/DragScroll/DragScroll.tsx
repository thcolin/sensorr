import { memo } from 'react'
import { useDragScroll } from '@sensorr/utils'

// A horizontal row a mouse can grab, for a row rendered in a loop or without a ref of its own
const UIDragScroll = ({ byBackground = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { byBackground?: boolean }) => {
  const drag = useDragScroll<HTMLDivElement>(undefined, { byBackground })

  return (
    <div ref={drag} {...props} />
  )
}

export const DragScroll = memo(UIDragScroll)
