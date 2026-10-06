import { useLayoutEffect, useRef } from 'react'

type Layer = { image: string, position: string, size: string }
type Measure = () => { layers: Layer[], moving: boolean }

// The hole a badge cuts in the picture, in the picture's own pixels, or null when the badge does not show.
// Gradients rather than an image: Firefox loads every new mask image asynchronously, and paints the picture
// without it meanwhile, so a mask image redrawn on every frame of a transition makes the picture flicker.
// The rounded rectangle is a cross of three bands and four quarter discs, overlapping by a pixel so no seam shows
export const hole = (
  badge: { left: number, top: number, width: number, height: number },
  picture: { left: number, top: number },
  { radius, width, opacity, scale }: { radius: string, width: number, opacity: number, scale: number },
): Layer[] | null => {
  if (opacity < 0.01 || !width) {
    return null
  }

  const corner = radius.endsWith('%')
    ? parseFloat(radius) / 100 * Math.min(badge.width, badge.height)
    : parseFloat(radius) * badge.width / width
  const [x, y, w, h, r] = [
    badge.left - picture.left,
    badge.top - picture.top,
    badge.width,
    badge.height,
    Math.min(corner, badge.width / 2, badge.height / 2),
  ].map((value) => value * scale)
  const color = `rgba(0,0,0,${opacity.toFixed(2)})`
  const px = (value: number) => `${value.toFixed(1)}px`
  const band = (left: number, top: number, right: number, bottom: number) => (right - left > 0 && bottom - top > 0)
    ? [{ image: `linear-gradient(${color},${color})`, position: `${px(left)} ${px(top)}`, size: `${px(right - left)} ${px(bottom - top)}` }]
    : []
  const disc = (left: number, top: number, at: string) => r > 0
    ? [{ image: `radial-gradient(circle at ${at},${color} ${px(r - 0.5)},transparent ${px(r + 0.5)})`, position: `${px(left)} ${px(top)}`, size: `${px(r)} ${px(r)}` }]
    : []

  return [
    ...band(x + r - 0.5, y, x + w - r + 0.5, y + h),
    ...band(x, y + r - 0.5, x + r, y + h - r + 0.5),
    ...band(x + w - r, y + r - 0.5, x + w, y + h - r + 0.5),
    ...disc(x, y, '100% 100%'),
    ...disc(x + w - r, y, '0 100%'),
    ...disc(x, y + h - r, '100% 0'),
    ...disc(x + w - r, y + h - r, '0 0'),
  ]
}

// Every poster waiting for a frame is measured before any is masked, so a grid lays out once per frame
const pending = new Map<HTMLElement, Measure>()
const drawn = new WeakMap<HTMLElement, string>()
let request: number | null = null

const redraw = () => {
  const measures = Array.from(pending)

  pending.clear()
  request = null

  measures.map(([picture, measure]) => [picture, measure, measure()] as const).forEach(([picture, measure, { layers, moving }]) => {
    // The whole picture, minus every hole added together
    const mask = layers.length ? {
      image: ['linear-gradient(#000,#000)', ...layers.map((layer) => layer.image)].join(','),
      position: ['0 0', ...layers.map((layer) => layer.position)].join(','),
      size: ['100% 100%', ...layers.map((layer) => layer.size)].join(','),
      repeat: 'no-repeat',
      composite: ['subtract', ...layers.map(() => 'add')].join(','),
    } : { image: 'none', position: '', size: '', repeat: '', composite: '' }
    const key = Object.values(mask).join(';')

    if (drawn.get(picture) !== key) {
      drawn.set(picture, key)
      // Safari's prefixed composite only knows the Porter-Duff names
      picture.style.setProperty('-webkit-mask-composite', layers.length ? ['source-out', ...layers.map(() => 'source-over')].join(',') : '')
      Object.entries(mask).forEach(([property, value]) => {
        if (property !== 'composite') {
          picture.style.setProperty(`-webkit-mask-${property}`, value)
        }

        picture.style.setProperty(`mask-${property}`, value)
      })
    }

    if (moving) {
      schedule(picture, measure)
    }
  })
}

const schedule = (picture: HTMLElement, measure: Measure) => {
  pending.set(picture, measure)
  request = request ?? requestAnimationFrame(redraw)
}

// Each `[data-cutout]` badge of `wrapper` cuts its border box out of its `[data-cutout-picture]`, as opaque as the badge.
// The mask is drawn again on every frame while a transition or an animation runs in `wrapper`, so the hole follows the badge
export const useCutout = (wrapper: React.MutableRefObject<HTMLElement>) => {
  const update = useRef<() => void>(null)

  useLayoutEffect(() => {
    const element = wrapper.current
    const picture = element?.querySelector<HTMLElement>('[data-cutout-picture]')

    if (!element || !picture) {
      return
    }

    const measure = () => {
      const box = picture.getBoundingClientRect()
      const moving = element.getAnimations({ subtree: true })
        .some((animation) => animation.playState === 'running' && animation.effect?.getTiming().iterations !== Infinity)

      if (!box.width || !picture.offsetWidth) {
        return { layers: [], moving }
      }

      // From the screen, where transforms apply, to the picture's own pixels
      const scale = picture.offsetWidth / box.width
      const holes = Array.from(element.querySelectorAll<HTMLElement>('[data-cutout]')).map((badge) => {
        const style = getComputedStyle(badge)

        if (style.visibility !== 'visible') {
          return null
        }

        let opacity = 1

        for (let node = badge; node && node !== element; node = node.parentElement) {
          opacity *= Number(getComputedStyle(node).opacity)
        }

        return hole(badge.getBoundingClientRect(), box, { radius: style.borderTopLeftRadius, width: badge.offsetWidth, opacity, scale })
      }).filter(Boolean)

      return { moving, layers: holes.flat() }
    }

    update.current = () => schedule(picture, measure)

    const observer = new ResizeObserver(update.current)
    observer.observe(picture)

    const events = ['transitionrun', 'animationstart', 'pointerover', 'pointerout', 'focusin', 'focusout']
    events.forEach((event) => element.addEventListener(event, update.current))

    return () => {
      pending.delete(picture)
      observer.disconnect()
      events.forEach((event) => element.removeEventListener(event, update.current))
      update.current = null
    }
  }, [wrapper])

  // A render can move, show or hide a badge without a transition
  useLayoutEffect(() => {
    update.current?.()
  })
}
