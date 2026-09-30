import { MutableRefObject, useCallback, useRef } from 'react'
import { animate, inertia, motionValue } from 'framer-motion'

const THRESHOLD = 10

// The resistance of iOS past an edge: the further out, the less the content follows the pointer
const rubber = (distance: number, dimension: number) => (1 - 1 / ((distance * 0.55) / dimension + 1)) * dimension

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [tabindex]'

// The row's background: the row itself, or the padding of a wrapper it lays out
const background = (element: HTMLElement, target: EventTarget) => target === element || (
  (target as Element).parentElement === element && !(target as Element).matches(INTERACTIVE)
)

interface DragScrollOptions {
  enabled?: boolean
  // Grabbed by its background only: what its wrappers hold, a poster or a card, keeps its click, hover and
  // text selection. Otherwise a drag takes over the click of whatever it starts on, a pill or a button.
  byBackground?: boolean
}

// Every row the hook holds, and how it glides there: its motion value is the one writer of its scroll
const glides = new WeakMap<HTMLElement, (left: number) => void>()

const swallow = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const attach = (element: HTMLElement, options: MutableRefObject<DragScrollOptions>) => {
  const x = motionValue(element.scrollLeft)
  let animation = null
  let press = null
  let dragging = false

  const max = () => element.scrollWidth - element.clientWidth
  const grabs = (target: EventTarget) => options.current.enabled && (!options.current.byBackground || background(element, target))

  const unsubscribe = x.on('change', (value) => {
    const left = Math.max(0, Math.min(value, max()))
    element.scrollLeft = left

    for (const child of Array.from(element.children) as HTMLElement[]) {
      child.style.translate = value === left ? '' : `${left - value}px`
    }
  })

  // To a position in 400ms on the route curve, taken back by a press or the wheel like any glide
  glides.set(element, (left) => {
    const to = Math.max(0, Math.min(left, max()))

    animation?.stop()
    x.jump(element.scrollLeft)
    animation = matchMedia('(prefers-reduced-motion: reduce)').matches ? (x.set(to), null) : animate(x, to, { duration: 0.4, ease: [0.4, 0, 0.2, 1] })
  })

  const onPointerMove = (e: PointerEvent) => {
    // The button came up outside the window, where no pointerup reached it
    if (!(e.buttons & 1)) {
      return onPointerUp()
    }

    const dx = e.clientX - press.x

    if (!dragging) {
      if (Math.abs(dx) < THRESHOLD) {
        return
      }

      dragging = true
      press.x = e.clientX
      getSelection()?.removeAllRanges()
      element.style.cursor = 'grabbing'
      element.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'

      // The children let the element take the pointer: its cursor shows, and no hover follows the drag
      for (const child of Array.from(element.children) as HTMLElement[]) {
        child.style.pointerEvents = 'none'
      }

      return
    }

    const value = press.left - dx
    const limit = max()

    if (press.still) {
      x.set(Math.max(0, Math.min(value, limit)))
    } else if (value < 0) {
      x.set(-rubber(-value, element.clientWidth))
    } else if (value > limit) {
      x.set(limit + rubber(value - limit, element.clientWidth))
    } else {
      x.set(value)
    }
  }

  const release = () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  const onPointerUp = () => {
    release()

    const value = x.get()
    const out = value < 0 || value > max()

    if (dragging) {
      dragging = false
      element.style.cursor = max() > 0 ? 'grab' : ''
      element.style.userSelect = ''
      document.body.style.cursor = ''

      for (const child of Array.from(element.children) as HTMLElement[]) {
        child.style.pointerEvents = ''
      }

      // The click that follows this release lands on what was grabbed
      window.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }))
    } else if (!out) {
      return
    }

    const velocity = press.still ? 0 : x.getVelocity()
    const limit = max()

    // The generator itself: named by a string, an inertia from where the value already is does not start
    animation = velocity ? animate(x, value, {
      type: inertia,
      velocity,
      min: 0,
      max: limit,
      power: 0.35,
      timeConstant: 250,
      bounceStiffness: 400,
      bounceDamping: 40,
    }) : animate(x, Math.max(0, Math.min(value, limit)), { type: 'spring', stiffness: 400, damping: 40 })
  }

  const onPointerDown = (e: PointerEvent & { grabbed?: boolean }) => {
    // Below the content box is the scrollbar, which scrolls on its own
    const below = e.clientY - element.getBoundingClientRect().top - element.clientTop >= element.clientHeight

    if (e.grabbed || e.pointerType !== 'mouse' || e.button !== 0 || max() <= 0 || below || !grabs(e.target)) {
      return
    }

    // A row inside a row: the innermost that scrolls takes the press, the outer one lets it go
    e.grabbed = true

    animation?.stop()

    const value = x.get()
    x.jump(value < 0 || value > max() ? value : element.scrollLeft)
    press = { x: e.clientX, left: x.get(), still: matchMedia('(prefers-reduced-motion: reduce)').matches }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  // Where a press would take the row, and there only, the pointer shows grab
  const onPointerOver = (e: PointerEvent) => {
    if (!dragging) {
      element.style.cursor = max() > 0 && grabs(e.target) ? 'grab' : ''
    }
  }

  // An artwork is an image in a button: a drag that starts on it would be the browser's own
  const onDragStart = (e: DragEvent) => {
    if (grabs(e.target)) {
      e.preventDefault()
    }
  }

  // Past an edge the spring still brings the row back, within the bounds the wheel takes over
  const onWheel = () => {
    const value = x.get()

    if (value >= 0 && value <= max()) {
      animation?.stop()
    }
  }

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointerover', onPointerOver)
  element.addEventListener('dragstart', onDragStart)
  element.addEventListener('wheel', onWheel, { passive: true })

  return () => {
    glides.delete(element)
    release()

    if (dragging) {
      document.body.style.cursor = ''
    }

    animation?.stop()
    unsubscribe()
    x.destroy()
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointerover', onPointerOver)
    element.removeEventListener('dragstart', onDragStart)
    element.removeEventListener('wheel', onWheel)
  }
}

export const glide = (element: HTMLElement, left: number) => {
  const to = glides.get(element)

  if (to) {
    to(left)
  } else {
    element.scrollLeft = left
  }
}

// The scroll that brings the first item cut at the far edge to the near one. Short of an end by less than a
// quarter of the view, it goes to that end, rather than nudge a row by the padding of its last item.
export const pageOf = (element: HTMLElement, direction: 1 | -1) => {
  const padding = parseFloat(getComputedStyle(element).paddingLeft) || 0
  const origin = element.getBoundingClientRect().left - element.scrollLeft
  const items = (Array.from(element.children) as HTMLElement[]).map((item) => {
    const box = item.getBoundingClientRect()
    return { start: box.left - origin, end: box.right - origin }
  })
  const view = { start: element.scrollLeft + padding, end: element.scrollLeft + element.clientWidth - padding }
  const width = view.end - view.start
  const limit = element.scrollWidth - element.clientWidth
  const cut = direction > 0 ? items.find(item => item.end > view.end + 1) : [...items].reverse().find(item => item.start < view.start - 1)
  const start = direction > 0 ? cut?.start : items.find(item => item.start >= (cut?.end ?? 0) - width - 1)?.start
  const to = Math.max(0, Math.min(typeof start === 'number' ? start - padding : direction * Infinity, limit))

  if (direction > 0) {
    return limit - to < width / 4 ? limit : to
  }

  return to < width / 4 ? 0 : to
}

// A mouse grabs the element to scroll it sideways, with an inertia and the rubber band of iOS; a touch keeps
// the native scroll. The release that ends a drag is not a click. Returns the ref to put on the element.
export const useDragScroll = <T extends HTMLElement>(ref?: MutableRefObject<T>, { enabled = true, byBackground = false }: DragScrollOptions = {}) => {
  const options = useRef<DragScrollOptions>({ enabled, byBackground })
  const detach = useRef<() => void>(null)
  options.current = { enabled, byBackground }

  return useCallback((element: T) => {
    detach.current?.()
    detach.current = element ? attach(element, options) : null

    if (ref) {
      ref.current = element
    }
  }, [])
}
