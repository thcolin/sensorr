import { useLayoutEffect, useRef } from 'react'

type Measure = () => { mask: string, moving: boolean }

// The hole a badge cuts in the picture, in the picture's own pixels, or null when the badge does not show
export const hole = (
  badge: { left: number, top: number, width: number, height: number },
  picture: { left: number, top: number },
  { radius, width, opacity, scale }: { radius: string, width: number, opacity: number, scale: number },
) => {
  if (opacity < 0.01 || !width) {
    return null
  }

  const corner = radius.endsWith('%')
    ? parseFloat(radius) / 100 * Math.min(badge.width, badge.height)
    : parseFloat(radius) * badge.width / width
  const [x, y, w, h, rx] = [
    badge.left - picture.left,
    badge.top - picture.top,
    badge.width,
    badge.height,
    Math.min(corner, badge.width / 2, badge.height / 2),
  ].map((value) => (value * scale).toFixed(1))

  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill-opacity="${opacity.toFixed(2)}"/>`
}

// Every poster waiting for a frame is measured before any is masked, so a grid lays out once per frame
const pending = new Map<HTMLElement, Measure>()
let request: number | null = null

const redraw = () => {
  const measures = Array.from(pending)

  pending.clear()
  request = null

  measures.map(([picture, measure]) => [picture, measure, measure()] as const).forEach(([picture, measure, { mask, moving }]) => {
    if (picture.style.getPropertyValue('-webkit-mask-image') !== mask) {
      picture.style.setProperty('mask-image', mask)
      picture.style.setProperty('-webkit-mask-image', mask)
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
        return { mask: 'none', moving }
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

      return {
        moving,
        mask: holes.length ? `url("data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${picture.offsetWidth}" height="${picture.offsetHeight}"><mask id="m"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${holes.join('')}</g></mask><rect width="100%" height="100%" mask="url(#m)"/></svg>`,
        )}")` : 'none',
      }
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
