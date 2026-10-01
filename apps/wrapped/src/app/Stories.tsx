import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { StoryModel } from './themes/types'

// The size every story is composed at: about a phone's width, in the 9:16 of the 1080 × 1920 image it is shared as
export const STORY = { width: 396, height: 704 }
// The segments above a story and the bar under it, outside it when the screen has the room
const CHROME = { top: 24, bottom: 64 }

// How a story is named in the address of its image: `figure-twin`, `summary`
export const idOf = (story: StoryModel) => 'variant' in story ? `${story.kind}-${story.variant}` : story.kind

// The scale a story is shown at, and whether its chrome fits outside it
const fitOf = () => {
  const { innerWidth: width, innerHeight: height } = window
  const inside = Math.min(width / STORY.width, height / STORY.height)
  const outside = Math.min(width / STORY.width, (height - CHROME.top - CHROME.bottom) / STORY.height)
  // Safari leaves a phone 699 px of its 844: the chrome then sits over the story rather than shrink it
  return outside >= inside * 0.95 ? { scale: outside, roomy: true } : { scale: inside, roomy: false }
}

export const Stories = ({ count, index, onIndex, label, children, bar }: {
  count: number
  index: number
  onIndex: (index: number) => void
  label: string
  children: ReactNode
  bar?: ReactNode
}) => {
  const [{ scale, roomy }, setFit] = useState(fitOf)
  const go = useRef(onIndex)
  go.current = onIndex

  useLayoutEffect(() => {
    const resize = () => setFit(fitOf())
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLSelectElement) {
        return
      }
      if (event.key === 'ArrowRight' && index < count - 1) {
        go.current(index + 1)
      }
      if (event.key === 'ArrowLeft' && index > 0) {
        go.current(index - 1)
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [index, count])

  return (
    <main className="stories" data-roomy={roomy || undefined} style={{ '--scale': scale, '--story-width': `${STORY.width}px`, '--story-height': `${STORY.height}px` } as React.CSSProperties}>
      <div className="stories-stage">
        <ol className="stories-segments" aria-hidden="true">
          {Array.from({ length: count }, (_, at) => <li key={at} data-done={at <= index || undefined} />)}
        </ol>
        <div className="stories-frame" role="group" aria-roledescription="story" aria-label={`${index + 1} sur ${count}, ${label}`}>
          <div className="stories-page">{children}</div>
          <button type="button" className="stories-tap stories-tap-previous" aria-label="Story précédente" disabled={index === 0} onClick={() => onIndex(index - 1)} />
          <button type="button" className="stories-tap stories-tap-next" aria-label="Story suivante" disabled={index === count - 1} onClick={() => onIndex(index + 1)} />
        </div>
        <div className="stories-bar">{bar}</div>
      </div>
      <p className="visually-hidden" aria-live="polite">{`${index + 1} sur ${count}, ${label}`}</p>
    </main>
  )
}

// A single story at its own size, for the API's browser to capture: `data-card` says when it is ready, or missing
export const Card = ({ children, missing }: { children: ReactNode, missing: boolean }) => {
  const frame = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.documentElement

    if (missing) {
      root.dataset.card = 'missing'
      return
    }

    let cancelled = false
    const settle = async () => {
      // The look's chunk loads behind Suspense: wait for the page to be drawn
      while (!cancelled && !frame.current?.firstElementChild) {
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
      await document.fonts.ready
      const images = Array.from(frame.current?.querySelectorAll('img') || [])
      await Promise.all(images.map((image) => image.complete ? null : new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true })
        image.addEventListener('error', resolve, { once: true })
      })))
      await Promise.all(images.map((image) => image.naturalWidth ? image.decode().catch(() => null) : null))
      !cancelled && (root.dataset.card = 'ready')
    }
    settle()

    return () => {
      cancelled = true
    }
  }, [missing])

  return <div ref={frame} className="stories-card">{children}</div>
}
