import { MutableRefObject, useCallback, useRef } from 'react'
import { animate, inertia, motionValue } from 'framer-motion'

const THRESHOLD = 10

// The resistance of iOS past an edge: the further out, the less the content follows the pointer
const rubber = (distance: number, dimension: number) => (1 - 1 / ((distance * 0.55) / dimension + 1)) * dimension

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [tabindex]'

// The row's background: the row itself, or the padding of a wrapper it lays out. What a wrapper holds, a
// poster, a card, a pill, keeps its click, hover and text selection.
const background = (element: HTMLElement, target: EventTarget) => target === element || (
  (target as Element).parentElement === element && !(target as Element).matches(INTERACTIVE)
)

const swallow = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const attach = (element: HTMLElement, active: MutableRefObject<boolean>) => {
  const x = motionValue(element.scrollLeft)
  let animation = null
  let press = null
  let dragging = false

  const max = () => element.scrollWidth - element.clientWidth

  const unsubscribe = x.on('change', (value) => {
    const left = Math.max(0, Math.min(value, max()))
    element.scrollLeft = left

    for (const child of Array.from(element.children) as HTMLElement[]) {
      child.style.translate = value === left ? '' : `${left - value}px`
    }
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

    if (e.grabbed || !active.current || e.pointerType !== 'mouse' || e.button !== 0 || max() <= 0 || below || !background(element, e.target)) {
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

  // An item's content inherits no grab, the pointer shows it where a press would take the row
  const onPointerOver = (e: PointerEvent) => {
    if (!dragging) {
      element.style.cursor = active.current && max() > 0 && background(element, e.target) ? 'grab' : ''
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
  element.addEventListener('wheel', onWheel, { passive: true })

  return () => {
    release()

    if (dragging) {
      document.body.style.cursor = ''
    }

    animation?.stop()
    unsubscribe()
    x.destroy()
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointerover', onPointerOver)
    element.removeEventListener('wheel', onWheel)
  }
}

// A mouse grabs the element by its background to scroll it sideways, with an inertia and the rubber band
// of iOS; a touch keeps the native scroll. The release that ends a drag is not a click. Returns the ref to put on the element.
export const useDragScroll = <T extends HTMLElement>(ref?: MutableRefObject<T>, enabled = true) => {
  const active = useRef(enabled)
  const detach = useRef<() => void>(null)
  active.current = enabled

  return useCallback((element: T) => {
    detach.current?.()
    detach.current = element ? attach(element, active) : null

    if (ref) {
      ref.current = element
    }
  }, [])
}
