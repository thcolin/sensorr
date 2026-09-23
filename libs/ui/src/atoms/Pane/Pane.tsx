import { memo, useEffect, useRef, useState } from 'react'
import { useThemeUI } from 'theme-ui'
import { Shadow } from '../Shadow/Shadow'
import { Icon } from '../Icon/Icon'

// On desktop a sub pane opens in two steps: its shadow sweeps over the pane before it, then it slides out from under that pane's edge
const SWEEP = 300
const SLIDE = 400

export interface PaneProps {
  position: 'right' | 'left'
  width?: string | string[]
  background?: string
  open: boolean
  toggleOpen: () => void
  level?: number
  order?: number
  shadow?: boolean
  children: React.ReactNode
}

const UIPane = ({ position, width = '25em', background: backgroundColor = 'primary', open, toggleOpen, children, level = 0, order = 0, shadow = true, ...props }: PaneProps) => {
  const { theme } = useThemeUI()
  const [ready, setReady] = useState(open)
  const previousLevel = useRef(level)
  const rising = useRef(false)

  if (level !== previousLevel.current) {
    rising.current = level > previousLevel.current
    previousLevel.current = level
  }

  useEffect(() => {
    const timeout = setTimeout(() => { rising.current = false }, SWEEP + SLIDE)
    return () => clearTimeout(timeout)
  }, [level])

  useEffect(() => {
    if (open) {
      setReady(true)

      return () => {
        setTimeout(() => setReady(false), 300)
      }
    }
  }, [open])

  return (
    <>
      <aside
        sx={{
          ...UIPane.styles.element,
          // A pane coming back up waits for the shadow above it to leave
          transition: [
            `transform ${SLIDE}ms ease, z-index 0ms linear ${rising.current ? SLIDE : 0}ms`,
            order
              ? `transform ${SLIDE}ms ease ${open ? SWEEP : 0}ms, clip-path ${SLIDE}ms ease ${open ? SWEEP : 0}ms`
              : `transform ${SLIDE}ms ease, z-index 0ms linear ${rising.current ? SWEEP + SLIDE : 0}ms`,
          ],
          backgroundColor,
          ...{
            right: {
              height: '100dvh',
              width: width,
              maxWidth: '100vw',
              top: '0em',
              right: '0em',
              bottom: '0em',
              transform: [
                `translate3d(${open ? '0em, 0px, 0px' : '100%, 0px, 0px'})`,
                `translate3d(${open ? `-${order * 25}em, 0px, 0px` : order ? `-${(order - 1) * 25}em, 0px, 0px` : '100%, 0px, 0px'})`,
              ],
              ...(order ? { clipPath: ['none', `inset(0px ${open ? '0%' : '100%'} 0px 0px)`] } : {}),
              zIndex: 8 + level,
            },
            left: {
              height: '100dvh',
              width: width,
              maxWidth: '100vw',
              top: '0em',
              bottom: '0em',
              left: '0em',
              transform: [
                `translate3d(${open ? '0em, 0px, 0px' : '-100%, 0px, 0px'})`,
                `translate3d(${open ? `${order * 25}em, 0px, 0px` : order ? `${(order - 1) * 25}em, 0px, 0px` : '-100%, 0px, 0px'})`,
              ],
              ...(order ? { clipPath: ['none', `inset(0px 0px 0px ${open ? '0%' : '100%'})`] } : {}),
              zIndex: 8 + level,
            },
          }[position],
        }}
      >
        <div sx={UIPane.styles.wrapper} style={{ opacity: ready ? 1 : 0, zIndex: 8 + level }}>
          {ready && children}
        </div>
        <div sx={UIPane.styles.spinner} style={{ visibility: ready ? 'hidden' : 'visible' }}>
          <Icon value='spinner' color='gray-100' />
        </div>
      </aside>
      {/* Above the header, which rises to 6 while the search results are open (Header.tsx). */}
      {shadow && (
        <button
          key='shadow'
          sx={{
            ...UIPane.styles.shadow,
            opacity: [open ? 1 : 0, order || open ? 1 : 0],
            transition: [
              `opacity ${SLIDE}ms ease, z-index ${open ? `0ms linear ${rising.current ? SLIDE : 0}ms` : `${SLIDE}ms linear`}`,
              order
                ? `z-index 0ms linear ${open ? 0 : SWEEP + SLIDE}ms`
                : `opacity ${SLIDE}ms ease, z-index ${open ? `0ms linear ${rising.current ? SWEEP + SLIDE : 0}ms` : `${SLIDE}ms linear`}`,
            ],
            ...(order ? {
              '>div': {
                ...UIPane.styles.shadow['>div'],
                [position]: '0em',
                width: ['100%', `${order * 25}em`],
                transform: ['none', `translate3d(${open ? '0%' : { left: '-100%', right: '100%' }[position]}, 0px, 0px)`],
                transition: ['background-color 800ms ease-in-out', `transform ${SWEEP}ms ease ${open ? 0 : SLIDE}ms, background-color 800ms ease-in-out`],
              },
            } : {}),
          }}
          onClick={toggleOpen}
          style={{ zIndex: open ? (7 + level) : -1 }}
        >
          <Shadow palette={{ backgroundColor: theme.rawColors.gray }} fade={0.1} />
        </button>
      )}
    </>
  )
}

UIPane.styles = {
  element: {
    position: 'fixed',
    display: 'flex',
    color: '#FFF',
    transform: 'translateZ(0)',
  },
  wrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    width: '100%',
    transition: 'opacity 200ms ease',
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'visibility 0ms ease 5000ms',
  },
  shadow: {
    variant: 'button.reset',
    position: 'absolute',
    height: '100%',
    width: '100%',
    top: '0em',
    '>div': {
      top: '0em',
    },
  },
}

export const Pane = memo(UIPane)
