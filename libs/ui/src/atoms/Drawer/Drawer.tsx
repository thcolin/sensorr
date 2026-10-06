import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useThemeUI } from 'theme-ui'
import { motion, useDragControls, useMotionValue, useAnimate } from 'framer-motion'
import useMeasure from 'react-use-measure'
import { useDevice } from '@sensorr/utils'
import { Shadow } from '../Shadow/Shadow'
import { Icon } from '../Icon/Icon'

export interface DrawerProps {
  height?: string
  background?: string
  knob?: string
  open: boolean
  // The dialog's accessible name
  label?: string
  close: (e?: any) => void
  level?: number
  // Pulled down from its content scrolled to the top, the drawer closes like from its knob
  pullable?: boolean
  children: React.ReactNode
}

const isAtTop = (element: HTMLElement, root: HTMLElement) => {
  for (let node = element; node && node !== root; node = node.parentElement) {
    if (node.scrollTop > 0) {
      return false
    }
  }

  return true
}

const UIDrawer = ({
  height = '75vh',
  background: backgroundColor = 'primary',
  knob: knobColor = 'whitePure',
  open,
  close,
  children,
  level = 0,
  pullable = false,
  label = null,
}: DrawerProps) => {
  const device = useDevice()
  const { theme } = useThemeUI()
  const [scope, animate] = useAnimate()
  const drawer = useRef<HTMLElement>(null)
  const [measure, dimensions] = useMeasure()
  const preventEffectAnimation = useRef(false)
  const [hidden, setHidden] = useState(true)

  const y = useMotionValue(0)
  const controls = useDragControls()

  const pull = useRef<{ y: number, atTop: boolean }>(null)

  // A toggle overtaken by a newer one leaves the drawer to it
  const toggles = useRef(0)

  const animateToggle = useCallback(async (open) => {
    const toggle = ++toggles.current

    if (open) {
      setHidden(false)
      await animate(scope.current, { visibility: 'visible', zIndex: (5 + level) }, { duration: 0 })
      animate(scope.current, { opacity: [0, 1] })
      await animate(drawer.current, { y: ['100%', '0%'] }, { ease: 'easeInOut', duration: 0.3 })

      // Into the dialog, unless a field of its content already took the focus
      if (toggle === toggles.current && !scope.current.contains(document.activeElement)) {
        scope.current.focus({ preventScroll: true })
      }
    } else {
      // A delay does not hold `zIndex` back: it drops once the shadow has faded, or the page shows over it
      animate(scope.current, { opacity: [1, 0] }, { duration: 0.3, delay: 0.15 }).then(() => {
        if (toggle === toggles.current) {
          animate(scope.current, { visibility: 'hidden', zIndex: 0 }, { duration: 0 })
        }
      })
      await animate(drawer.current, { y: [(typeof y.get() === 'number' ? y.get() : 0), dimensions.height] }, { ease: 'easeInOut', duration: 0.3 })

      if (toggle === toggles.current) {
        setHidden(true)
      }
    }
  }, [dimensions, level])

  useEffect(() => {
    if (hidden) {
      return
    }

    // A key an open select or input already used is not a request to close.
    const onKeyDown = async (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) {
        return
      }

      await animateToggle(false)
      preventEffectAnimation.current = true
      close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hidden, animateToggle, close])

  useEffect(() => {
    if (preventEffectAnimation.current) {
      preventEffectAnimation.current = false
      return
    }

    animateToggle(open)
  }, [open])

  return (
    <motion.div
      ref={scope}
      {...(!hidden ? { role: 'dialog', 'aria-modal': true, 'aria-label': label || undefined, tabIndex: -1 } : {})}
      initial={{ opacity: 0, visibility: 'hidden' }}
      style={{
        position: 'fixed',
        zIndex: 0,
        // Focused to move the focus into it, not to be pointed at
        outline: 'none',
      }}
    >
      <button
        sx={UIDrawer.styles.shadow}
        onClick={async (e) => {
          if (device === 'mobile') {
            return
          }

          await animateToggle(false)
          preventEffectAnimation.current = true
          close()
        }}
      >
        <Shadow palette={{ backgroundColor: theme.rawColors.gray }} fade={0.1} />
      </button>
      <motion.div
        ref={(el) => {
          measure(el)
          drawer.current = el
        }}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        sx={{ ...UIDrawer.styles.drawer, backgroundColor }}
        style={{ height, y }}
        drag='y'
        dragControls={controls}
        onDragEnd={async () => {
          if (y.get() >= 100) {
            await animateToggle(false)
            preventEffectAnimation.current = true
            close()
          }
        }}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
      >
        {device === 'mobile' && (
          <button
            type='button'
            aria-label='Close'
            sx={UIDrawer.styles.knob(knobColor)}
            // A content taller than the visible drawer sets where the knob sits, through `--drawer-knob`
            style={{ top: 'var(--drawer-knob, 0px)' }}
            onPointerDown={(e) => controls.start(e)}
            onClick={async () => {
              // A drag that did not reach the threshold ends on a click too
              if (Math.abs(y.get()) > 2) {
                return
              }

              await animateToggle(false)
              preventEffectAnimation.current = true
              close()
            }}
          ></button>
        )}
        <div
          sx={UIDrawer.styles.wrapper}
          style={{ opacity: !hidden ? 1 : 0 }}
          {...(pullable ? {
            onPointerDown: (e) => {
              const pullable = e.pointerType === 'touch' && !(e.target as HTMLElement).closest('input, select, textarea, button, [contenteditable]')
              pull.current = pullable ? { y: e.clientY, atTop: isAtTop(e.target as HTMLElement, e.currentTarget) } : null
            },
            onPointerMove: (e) => {
              if (pull.current?.atTop && e.clientY - pull.current.y > 8) {
                pull.current = null
                controls.start(e)
              }
            },
            onPointerUp: () => pull.current = null,
            onPointerCancel: () => pull.current = null,
          } : {})}
        >
          {!hidden && children}
        </div>
        {/* <div sx={UIDrawer.styles.spinner} style={{ visibility: !hidden ? 'hidden' : 'visible' }}>
          <Icon value='spinner' color='gray-100' />
        </div> */}
      </motion.div>
    </motion.div>
  )
}

UIDrawer.styles = {
  drawer: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    bottom: '0px',
    width: '100vw',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    transition: 'opacity 200ms ease',
    // Under the knob, unless a content standing out of the drawer sets `--drawer-content-layer`
    zIndex: 'var(--drawer-content-layer, 1)',
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'visibility 0ms ease 5000ms',
    zIndex: 0,
  },
  shadow: {
    variant: 'button.reset',
    position: 'absolute',
    height: '100vh',
    width: '100vw',
    bottom: '0em',
    '>div': {
      top: '0em',
    },
  },
  knob: (color) => ({
    variant: 'button.reset',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    touchAction: 'none',
    zIndex: 2,
    '::after': {
      content: '""',
      display: 'block',
      height: '0.25em',
      width: '3em',
      background: color,
      borderRadius: '2em',
      margin: 4,
    },
  }),
}

export const Drawer = memo(UIDrawer)
