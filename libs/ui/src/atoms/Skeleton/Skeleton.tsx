import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animations } from '@sensorr/theme'

// The house transition. Whatever arrives after the rest, a badge, a pill, a row of links, takes it
// as an animation rather than a transition: an animation plays when the element mounts, or when
// it is set on an element already there, where a transition only plays on a value that changes.
export const REVEAL = '400ms ease-in-out'

export const reveal = {
  animation: `${animations.reveal} ${REVEAL} backwards`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}

// How long the content takes to fade in over its bar, and out as it goes back to it
export const FADE = 250

// Whatever leaves with the texts going back to their bars fades out with them, out of reach meanwhile: it belongs
// to what is leaving
export const conceal = {
  animation: `${animations.reveal} ${FADE}ms ease-in-out reverse forwards`,
  pointerEvents: 'none',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    opacity: 0,
  },
}

// True while what `shown` held fades out: kept mounted from the render where `shown` turns false
export const useLeaving = (shown: boolean) => {
  const [kept, setKept] = useState(shown)

  useEffect(() => {
    if (shown) {
      setKept(true)
      return
    }

    const timeout = setTimeout(() => setKept(false), FADE)
    return () => clearTimeout(timeout)
  }, [shown])

  return kept && !shown
}

// The bars' color in a poster's colors, and the poster's own block while its picture loads: a seventh of its text
// color into its background
export const barTintOf = (palette) => `color-mix(in oklab, ${palette?.color || 'currentColor'} 14%, ${palette?.backgroundColor || 'transparent'})`

export interface BarProps {
  width?: string
  height?: string
  pill?: boolean
  radius?: string
  inline?: boolean
  color?: string
  [prop: string]: any
}

export const Bar = ({ width = '100%', height = '1em', pill = false, radius = null, inline = false, color = 'gray', ...props }: BarProps) => (
  <span
    {...props}
    aria-hidden={true}
    sx={{
      display: inline ? 'inline-block' : 'block',
      verticalAlign: inline ? 'middle' : undefined,
      width,
      maxWidth: '100%',
      height,
      borderRadius: radius || (pill ? '1em' : '0.25em'),
      backgroundColor: color,
      // A bar in a poster's colors follows them as `Shadow` does
      transition: 'background-color 800ms ease-in-out',
    }}
  />
)

// A bar per line of a paragraph, as high as its text, the lines as far apart as its line height
export const Lines = ({ widths = ['100%', '92%', '64%'], height = '1em', lineHeight = 1.5, ...props }: { widths?: string[], height?: string, lineHeight?: number, [prop: string]: any }) => (
  <span
    {...props}
    aria-hidden={true}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: `calc(${height} * ${lineHeight - 1})`,
      paddingY: `calc(${height} * ${(lineHeight - 1) / 2})`,
    }}
  >
    {widths.map((width, index) => <Bar key={index} width={width} height={height} />)}
  </span>
)

export interface SkeletonProps {
  ready: boolean
  bar?: BarProps
  placeholder?: React.ReactNode
  align?: 'center' | 'start'
  // Cut a text that overflows with an ellipsis, which a block holding menus or badges cannot afford
  clip?: boolean
  // As the content starts to show over its bar, for what shows with it
  onShown?: () => void
  // The bars' color, set on them only: the content keeps its own grays
  tint?: string
  // The width the placeholder's `[data-fit]` bar takes, read on the content laid out unseen, when the content is a
  // block wider than its text
  fit?: (content: HTMLElement) => number | null
  children?: React.ReactNode
  [prop: string]: any
}

const EASING = 'ease-in-out'
const DURATION = 250
// The content inks in over its bar while the bar ends its size, then the bar fades out under it: no time where
// neither shows
const INK = 150

// A bar that becomes its content. Once the content is there, it is laid out unseen in the bar's grid
// cell: the cell eases from the bar's height to the content's, and a lone bar takes the content's
// width; on the way the content fades in over the bar, then the bar fades out under it. A blank line holds
// the cell at the height of one line of the text it waits for. When the content goes, as a pretty moves to
// another movie, the same steps play backwards: the bar comes back under the content, which fades out as the cell
// eases back to the bar's height.
export const Skeleton = ({ ready, bar = {}, placeholder = null, align = 'center', clip = true, onShown = null, fit = null, tint = null, children, ...props }: SkeletonProps) => {
  const cell = useRef<HTMLSpanElement>(null)
  const cover = useRef<HTMLSpanElement>(null)
  const content = useRef<HTMLSpanElement>(null)
  // The cell's height with its bars, and with its content
  const height = useRef<number>(null)
  const full = useRef<number>(null)
  // Ready from the first render, the content shows at once: there was no bar to see
  const [shown, setShown] = useState(ready)
  // The content last shown, kept while it fades out
  const last = useRef(children)
  const leaving = shown && !ready

  if (ready) {
    last.current = children
  }

  const running = useRef<Animation[]>([])
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  const stop = () => {
    clearTimeout(timer.current)
    running.current.forEach(animation => animation.cancel())
    running.current = []
  }

  // Called as the content starts to show, or stays when it was back before it had left: what waits on it shows with it
  useEffect(() => {
    if (shown && ready && typeof onShown === 'function') {
      onShown()
    }
  }, [shown, ready])

  useLayoutEffect(() => stop, [])

  useLayoutEffect(() => {
    if (ready && shown && !running.current.some(animation => animation.playState === 'running')) {
      full.current = cell.current.getBoundingClientRect().height
    }
  })

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timing = { duration: DURATION, easing: EASING }
    // A single bar, given or drawn by the placeholder, takes the content's width and keeps the height of its text;
    // a group of bars only follows the cell's height
    const lone = cover.current?.childElementCount === 1 && !cover.current.firstElementChild.childElementCount && cover.current.firstElementChild as HTMLElement
    const fitted = cover.current?.querySelector('[data-fit]') as HTMLElement
    const morphed = fitted || lone
    const widthOf = () => fitted ? fit?.(content.current) : content.current?.getBoundingClientRect().width

    if (!ready) {
      stop()
      height.current = cell.current.getBoundingClientRect().height

      if (!shown) {
        return
      }

      if (reduced || full.current === null) {
        setShown(false)
        return
      }

      const target = widthOf()
      running.current = [cell.current.animate([{ height: `${full.current}px` }, { height: `${height.current}px` }], timing)]

      if (morphed && target) {
        running.current.push(morphed.animate([{ width: `${target}px` }, { width: `${morphed.getBoundingClientRect().width}px` }], timing))
      }

      timer.current = setTimeout(() => setShown(false), Math.max(DURATION, FADE))
      return
    }

    // Back before the content had left: it stays
    if (shown) {
      stop()
      return
    }

    if (height.current === null || reduced) {
      setShown(true)
      return
    }

    const from = height.current
    const to = cell.current.getBoundingClientRect().height
    const target = widthOf()
    running.current = [cell.current.animate([{ height: `${from}px` }, { height: `${to}px` }], timing)]

    if (morphed && target) {
      running.current.push(morphed.animate([{ width: `${morphed.getBoundingClientRect().width}px` }, { width: `${target}px` }], { ...timing, fill: 'forwards' }))
    }

    timer.current = setTimeout(() => setShown(true), INK)
  }, [ready])

  const visible = shown && ready

  return (
    <span {...props} ref={cell} sx={{ ...Skeleton.styles.element, alignItems: align }}>
      <span aria-hidden={true} sx={Skeleton.styles.strut}>&nbsp;</span>
      <span ref={cover} aria-hidden={true} sx={{ ...Skeleton.styles.cover, ...(ready ? { ...Skeleton.styles.out, justifyContent: align === 'center' ? 'center' : 'flex-start' } : {}), opacity: visible ? 0 : 1, transition: `opacity ${FADE}ms ${EASING} ${visible ? INK : 0}ms` }} style={tint ? { '--theme-ui-colors-gray': tint } as React.CSSProperties : undefined}>
        {placeholder || <Bar {...bar} />}
      </span>
      {(ready || leaving) && (
        <span sx={{ ...Skeleton.styles.content, display: clip ? 'flex' : 'block', ...(leaving ? Skeleton.styles.leaving : shown ? Skeleton.styles.after : { visibility: 'hidden' }) }}>
          <span ref={content} sx={clip ? Skeleton.styles.clip : Skeleton.styles.block}>{ready ? children : last.current}</span>
        </span>
      )}
    </span>
  )
}

Skeleton.styles = {
  element: {
    position: 'relative',
    display: 'grid',
    minWidth: '0px',
    '>*': {
      gridArea: '1 / 1',
      minWidth: '0px',
    },
  },
  strut: {
    visibility: 'hidden',
    width: '0px',
  },
  cover: {
    display: 'block',
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none !important',
    },
  },
  // Out of the flow once the content is there, so the cell takes the content's height and never the bars'
  out: {
    position: 'absolute',
    inset: '0px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  // A flex row lays a text out at its own width, the one a lone bar takes, without the line box an
  // inline block would add under it. Positioned, it paints over the bars once they leave the flow
  content: {
    position: 'relative',
  },
  after: {
    animation: `${animations.reveal} ${FADE}ms ${EASING} backwards`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  // Out of the flow, so the cell eases back to the bars' height, and fading out over the bars coming back
  leaving: {
    position: 'absolute',
    inset: '0px',
    animation: `${animations.reveal} ${FADE}ms ${EASING} reverse forwards`,
  },
  clip: {
    minWidth: '0px',
    whiteSpace: 'inherit',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  block: {
    display: 'block',
  },
}
