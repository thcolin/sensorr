import { Children, memo } from 'react'
import { Shadow } from '@sensorr/ui'

const UISkeleton = ({ children, palette, ready, hide = false, placeholder = true, ...props }) => (ready || !hide) && (
  <div
    {...props}
    sx={{
      position: 'relative',
      '>*:first-child': {
        opacity: ready ? 0 : 1,
        visibility: ready ? 'hidden' : 'visible',
        transition: `background-color 800ms ease-in-out, opacity 400ms ease-in-out ${ready ? '400ms' : ''}, visibility 0ms linear ${ready ? '800ms' : '0ms'}`,
        top: '0em',
        left: '0em',
      },
      '>*:not(:first-child)': {
        opacity: ready ? 1 : 0,
        transition: `opacity 400ms ease-in-out ${ready ? '600ms' : ''}`,
        minWidth: ready ? 'auto' : '100%',
        ...(!ready && placeholder) ? {
          '&::after': {
            content: '"\\00a0"',
          },
        } : {},
      },
    }}
  >
    <Shadow palette={palette} fade={0.05} />
    {Children.only(children)}
  </div>
)

export const Skeleton = memo(UISkeleton)
