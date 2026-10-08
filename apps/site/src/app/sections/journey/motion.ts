import { useEffect, useRef, useState } from 'react'

export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// True once the element has entered the viewport, then never false again
export const useSeen = <T extends Element>(threshold = 0.3) => {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || seen) {
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true)
        observer.disconnect()
      }
    }, { threshold })

    observer.observe(element)
    return () => observer.disconnect()
  }, [seen, threshold])

  return [ref, seen] as const
}

// An entrance on transform and opacity, played once `seen` turns true, skipped under reduced motion
export const enter = (seen: boolean, from: string, delay = 0, duration = 600) => ({
  opacity: seen ? 1 : 0,
  transform: seen ? 'none' : from,
  transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': {
    opacity: 1,
    transform: 'none',
    transition: 'none',
  },
})

// From 0 to `target` over `duration` once `active`, eased out; the final value at once under reduced motion
export const useCountUp = (target: number, active: boolean, duration = 900) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }

    if (reduced()) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setValue(target * (1 - (1 - progress) ** 4))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])

  return value
}

// How many of the moments `at` (ms after `active` turns true) have passed; all of them at once under reduced motion
export const useSteps = (active: boolean, at: number[]) => {
  const [step, setStep] = useState(0)
  const key = at.join(',')

  useEffect(() => {
    if (!active) {
      return
    }

    const moments = key.split(',').map(Number)
    if (reduced()) {
      setStep(moments.length)
      return
    }

    const timers = moments.map((ms, index) => setTimeout(() => setStep(index + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [active, key])

  return step
}

// Writes how far the element has scrolled through the viewport, 0 as its top meets the viewport's bottom and 1 as its
// bottom leaves the viewport's top, in a CSS variable on it: one passive listener, one write per frame
export const useScrollProgress = <T extends HTMLElement>(name: string) => {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || reduced()) {
      return
    }

    let frame = 0
    const write = () => {
      frame = 0
      const { top, height } = element.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, (window.innerHeight - top) / (height + window.innerHeight)))
      element.style.setProperty(name, progress.toFixed(4))
    }

    const onScroll = () => {
      frame ||= requestAnimationFrame(write)
    }

    write()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [name])

  return ref
}

