import { useState } from 'react'

export const useHover = (
  {
    mouseEnterDelayMS = 0,
    mouseLeaveDelayMS = 0,
  }: {
    mouseEnterDelayMS?: number
    mouseLeaveDelayMS?: number
  } = {},
  {
    onMouseEnter,
    onMouseLeave,
    reverse = false,
  }: {
    onMouseEnter?: (e?) => void | any
    onMouseLeave?: (e?) => void | any
    reverse?: boolean,
  } = {},
): [boolean, Pick<React.HTMLAttributes<HTMLElement>, 'onMouseEnter' | 'onMouseLeave'>] => {
  const [isHovering, setIsHovering] = useState(false)
  let mouseEnterTimer: any | undefined
  let mouseOutTimer: any | undefined

  return [
    isHovering,
    {
      // TODO: Refacto, create custom util to call n fn? - if possible
      onMouseEnter: () => {
        clearTimeout(mouseOutTimer)
        mouseEnterTimer = setTimeout(() => {
          setIsHovering(true)

          if (!reverse && typeof onMouseEnter === 'function') {
            onMouseEnter()
          }

          if (reverse && typeof onMouseLeave === 'function') {
            onMouseLeave()
          }
        }, mouseEnterDelayMS)
      },
      onMouseLeave: () => {
        clearTimeout(mouseEnterTimer)
        mouseOutTimer = setTimeout(() => {
          setIsHovering(false)

          if (!reverse && typeof onMouseLeave === 'function') {
            onMouseLeave()
          }

          if (reverse && typeof onMouseEnter === 'function') {
            onMouseEnter()
          }
        }, mouseLeaveDelayMS)
      },
    },
  ]
}
