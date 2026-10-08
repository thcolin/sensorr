import { useEffect, useRef, useState } from 'react'
import { Badge, Bar, Picture } from '@sensorr/ui'

export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const tmdb = (size: string, path: string) => `https://image.tmdb.org/t/p/${size}${path}`

// Decorative motion stays off under reduced motion: whatever the state, the element sits where it lands
export const STILL = {
  '@media (prefers-reduced-motion: reduce)': {
    opacity: '1 !important',
    transform: 'none !important',
    transition: 'none !important',
    animation: 'none !important',
  },
}

// True once a quarter of the element has been on screen
export const useReveal = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true)
        observer.disconnect()
      }
    }, { threshold: 0.25 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, shown] as const
}

// Writes `--progress` on the element, from -1 as it enters at the bottom of the viewport to 1 as it leaves at the top,
// for its scenery to drift on scroll
export const useProgress = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const { top, height } = element.getBoundingClientRect()
      const viewport = window.innerHeight

      if (top > viewport || top + height < 0) {
        return
      }

      const progress = 1 - ((top + height) / (viewport + height)) * 2
      element.style.setProperty('--progress', progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}

// A wall of posters behind a band, blurred and tilted, drifting with the band's `--progress`
export const Wall = ({ posters }: { posters?: string[] }) => (
  <div sx={Wall.styles.element} aria-hidden='true'>
    <div sx={Wall.styles.grid}>
      {(posters?.length ? posters : Array.from({ length: 40 }, () => undefined)).map((path, index) => (
        <span key={index} sx={Wall.styles.tile}>
          {path && <img src={tmdb('w185', path)} alt='' loading='lazy' decoding='async' sx={Wall.styles.picture} />}
        </span>
      ))}
    </div>
  </div>
)

Wall.styles = {
  element: {
    position: 'absolute',
    inset: '0px',
    zIndex: -2,
    overflow: 'clip',
    opacity: 0.85,
    filter: 'blur(9px) saturate(1.2)',
  },
  grid: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '140%',
    display: 'grid',
    gridTemplateColumns: ['repeat(6, minmax(0, 1fr))', 'repeat(10, minmax(0, 1fr))'],
    gap: 6,
    transform: 'translate(-50%, calc(-50% + var(--progress, 0) * -8%)) rotate(-12deg)',
    '@media (prefers-reduced-motion: reduce)': {
      transform: 'translate(-50%, -50%) rotate(-12deg)',
    },
  },
  tile: {
    display: 'block',
    aspectRatio: '2 / 3',
    borderRadius: '0.25em',
    overflow: 'clip',
    backgroundColor: 'grayDark',
  },
  picture: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}

// One image behind a band, blurred, scaling slightly as the band scrolls by
export const Scenery = ({ src, blur = 12, opacity = 0.55 }: { src?: string | null, blur?: number, opacity?: number }) => (
  <div sx={Scenery.styles.element} style={{ opacity, filter: `blur(${blur}px)` }} aria-hidden='true'>
    {src && <img src={src} alt='' loading='lazy' decoding='async' sx={Scenery.styles.picture} />}
  </div>
)

Scenery.styles = {
  element: {
    position: 'absolute',
    inset: '-5%',
    zIndex: -2,
  },
  picture: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(calc(1.08 - var(--progress, 0) * 0.06))',
    ...STILL,
  },
}

// A poster of the library, its state in a badge on its corner, as the app's grid draws it
export const Cover = ({ path, size = 'w342', badge, children }: {
  path?: string
  size?: 'w185' | 'w342' | 'w500'
  badge?: { emoji: string, label: string }
  children?: React.ReactNode
}) => (
  <span sx={Cover.styles.element}>
    <span sx={Cover.styles.frame} aria-hidden='true'>
      {path ? <Picture path={path} size={size} sx={Cover.styles.picture} /> : <Bar height='100%' />}
    </span>
    {badge && (
      <span sx={Cover.styles.badge}>
        <Badge emoji={badge.emoji} label={badge.label} compact={true} />
      </span>
    )}
    {children}
  </span>
)

Cover.styles = {
  element: {
    position: 'relative',
    display: 'block',
  },
  frame: {
    display: 'block',
    aspectRatio: '2 / 3',
    borderRadius: '0.25em',
    overflow: 'clip',
  },
  picture: {
    minHeight: '0px',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: [6, 4],
  },
}
