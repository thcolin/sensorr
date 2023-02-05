import { memo, useEffect, useState } from 'react'
import { useThemeUI } from 'theme-ui'
import { Shadow } from '../Shadow/Shadow'
import { Icon } from '../Icon/Icon'

export interface PaneProps {
  position: 'top' | 'right' | 'bottom' | 'left'
  open: boolean
  toggleOpen: () => void
  level?: number
  children: React.ReactNode
}

const UIPane = ({ position, open, toggleOpen, children, level = 0, ...props }: PaneProps) => {
  const { theme } = useThemeUI()
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
        sx={UIPane.styles.element}
        style={{
          top: {
            height: '75vh',
            width: '100vw',
            top: '0em',
            right: '0em',
            left: '0em',
            transform: `translate3d(${open ? '0px, 0px, 0px' : '0px, -100%, 0px'})`,
            zIndex: 5 + level,
          },
          right: {
            height: '100vh',
            width: '25em',
            top: '0em',
            right: '0em',
            bottom: '0em',
            transform: `translate3d(${open ? '0px, 0px, 0px' : '100%, 0px, 0px'})`,
            zIndex: 5 + level,
          },
          bottom: {
            height: '75vh',
            width: '100vw',
            right: '0em',
            bottom: '0em',
            left: '0em',
            transform: `translate3d(${open ? '0px, 0px, 0px' : '0px, 100%, 0px'})`,
            zIndex: 5 + level,
          },
          left: {
            height: '100vh',
            width: '25em',
            top: '0em',
            bottom: '0em',
            left: '0em',
            transform: `translate3d(${open ? '0px, 0px, 0px' : '-100%, 0px, 0px'})`,
            zIndex: 5 + level,
          },
        }[position]}
      >
        <div sx={UIPane.styles.wrapper} style={{ opacity: ready ? 1 : 0, zIndex: 5 + level }}>
          {ready && children}
        </div>
        <div sx={UIPane.styles.spinner} style={{ visibility: ready ? 'hidden' : 'visible' }}>
          <Icon value='spinner' color='gray-100' />
        </div>
      </aside>
      <button
        key='shadow'
        sx={UIPane.styles.shadow}
        onClick={toggleOpen}
        style={{
          zIndex: open ? (4 + level) : -1,
          transition: `opacity 400ms ease, z-index ${open ? '0ms' : '400ms'} linear`,
          opacity: open ? 1 : 0,
        }}
      >
        <Shadow palette={{ backgroundColor: theme.rawColors.gray }} fade={0.1} />
      </button>
    </>
  )
}

UIPane.styles = {
  element: {
    position: 'fixed',
    display: 'flex',
    backgroundColor: 'primary',
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
