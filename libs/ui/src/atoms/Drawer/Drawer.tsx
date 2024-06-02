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
  close: (e?: any) => void
  level?: number
  children: React.ReactNode
}

const UIDrawer = ({
  height = '75vh',
  background: backgroundColor = 'primary',
  knob: knobColor = 'whitePure',
  open,
  close,
  children,
  level = 0,
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

  const animateToggle = useCallback(async (open) => {
    if (open) {
      setHidden(false)
      await animate(scope.current, { visibility: 'visible', zIndex: (5 + level) }, { duration: 0 })
      animate(scope.current, { opacity: [0, 1] })
      await animate(drawer.current, { y: ['100%', '0%'] }, { ease: 'easeInOut', duration: 0.3 })
    } else {
      animate(scope.current, { opacity: [1, 0] }, { duration: 0.3, delay: 0.15 })
      animate(scope.current, { visibility: 'hidden', zIndex: 0 }, { duration: 0, delay: 0.6 })
      await animate(drawer.current, { y: [(typeof y.get() === 'number' ? y.get() : 0), dimensions.height] }, { ease: 'easeInOut', duration: 0.3 })
      setHidden(true)
    }
  }, [dimensions, level])

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
      initial={{ opacity: 0, visibility: 'hidden' }}
      style={{
        position: 'fixed',
        zIndex: 0,
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
          <button sx={UIDrawer.styles.knob(knobColor)} onPointerDown={(e) => controls.start(e)}></button>
        )}
        <div sx={UIDrawer.styles.wrapper} style={{ opacity: !hidden ? 1 : 0 }}>
          {!hidden && children}
        </div>
        <div sx={UIDrawer.styles.spinner} style={{ visibility: !hidden ? 'hidden' : 'visible' }}>
          <Icon value='spinner' color='gray-100' />
        </div>
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
    zIndex: 1,
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
