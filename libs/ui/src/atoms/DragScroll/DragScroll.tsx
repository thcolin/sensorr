import { memo } from 'react'
import { useDragScroll } from '@sensorr/utils'

// A horizontal row a mouse can grab, for a row rendered in a loop or without a ref of its own
const UIDragScroll = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const drag = useDragScroll<HTMLDivElement>()

  return (
    <div ref={drag} {...props} />
  )
}

export const DragScroll = memo(UIDragScroll)
