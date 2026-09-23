import { memo, useEffect, useState } from 'react'
import { useThemeUI } from 'theme-ui'
import { Shadow } from '../Shadow/Shadow'
import { Icon } from '../Icon/Icon'

export interface PaneProps {
  position: 'right' | 'left'
  width?: string | string[]
  background?: string
  open: boolean
  toggleOpen: () => void
  level?: number | number[]
  order?: number
  shadow?: boolean
  dimmed?: boolean
  onDimmedClick?: () => void
  children: React.ReactNode
}

const UIPane = ({ position, width = '25em', background: backgroundColor = 'primary', open, toggleOpen, children, level = 0, order = 0, shadow = true, dimmed = false, onDimmedClick, ...props }: PaneProps) => {
  const { theme } = useThemeUI()
  const levels = [].concat(level)
  const [ready, setReady] = useState(open)

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
                `translate3d(${open ? `-${order * 25}em, 0px, 0px` : '100%, 0px, 0px'})`,
              ],
              zIndex: levels.map(level => 8 + level),
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
                `translate3d(${open ? `${order * 25}em, 0px, 0px` : '-100%, 0px, 0px'})`,
              ],
              zIndex: levels.map(level => 8 + level),
            },
          }[position],
        }}
      >
        <div sx={UIPane.styles.wrapper} style={{ opacity: ready ? 1 : 0, zIndex: 8 + levels[0] }}>
          {ready && children}
        </div>
        <div sx={UIPane.styles.spinner} style={{ visibility: ready ? 'hidden' : 'visible' }}>
          <Icon value='spinner' color='gray-100' />
        </div>
        {/* On desktop a sub pane slides out from under this one, so this one carries the sub pane's shadow itself */}
        {onDimmedClick && (
          <button
            sx={UIPane.styles.dim}
            onClick={onDimmedClick}
            style={{
              zIndex: dimmed ? 9 + levels[0] : -1,
              transition: `opacity 400ms ease, z-index ${dimmed ? '0ms' : '400ms'} linear`,
              opacity: dimmed ? 1 : 0,
            }}
          >
            <Shadow palette={{ backgroundColor: theme.rawColors.gray }} fade={0.1} />
          </button>
        )}
      </aside>
      {/* Above the header, which rises to 6 while the search results are open (Header.tsx). */}
      {shadow && (
        <button
          key='shadow'
          sx={{
            ...UIPane.styles.shadow,
            ...(order ? { '>div': { ...UIPane.styles.shadow['>div'], display: ['block', 'none'] } } : {}),
          }}
          onClick={toggleOpen}
          style={{
            zIndex: open ? (7 + levels[0]) : -1,
            transition: `opacity 400ms ease, z-index ${open ? '0ms' : '400ms'} linear`,
            opacity: open ? 1 : 0,
          }}
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
    transition: 'transform 400ms ease',
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
  dim: {
    variant: 'button.reset',
    position: 'absolute',
    display: ['none', 'block'],
    top: '0em',
    left: '0em',
    height: '100%',
    width: '100%',
    '>div': {
      top: '0em',
      left: '0em',
    },
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
