import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  // Safari's toolbars leave too little height: the chrome then sits over the story rather than shrink it
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
  const { t } = useTranslation()
  const [{ scale, roomy }, setFit] = useState(fitOf)
  const go = useRef(onIndex)
  go.current = onIndex

  useLayoutEffect(() => {
    const resize = () => setFit(fitOf())
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const frame = useRef<HTMLDivElement>(null)
  const shown = useRef(index)

  // The story that comes is read next, wherever focus was
  useEffect(() => {
    if (shown.current !== index) {
      shown.current = index
      frame.current?.focus({ preventScroll: true })
    }
  }, [index])

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
          {Array.from({ length: count }, (_, at) => <li key={at} data-done={at < index || undefined} data-current={at === index || undefined} />)}
        </ol>
        <div ref={frame} className="stories-frame" role="group" tabIndex={-1} aria-roledescription="story" aria-label={t('wrapped.stories.position', { index: index + 1, count, label })}>
          <div className="stories-page">{children}</div>
          {/* Touch zones over the page, kept away from screen readers exploring it: the bar has the same steps as buttons */}
          <button type="button" className="stories-tap stories-tap-previous" tabIndex={-1} aria-hidden="true" disabled={index === 0} onClick={() => onIndex(index - 1)} />
          <button type="button" className="stories-tap stories-tap-next" tabIndex={-1} aria-hidden="true" disabled={index === count - 1} onClick={() => onIndex(index + 1)} />
        </div>
        <div className="stories-bar">
          <button type="button" className="stories-step" aria-disabled={index === 0} onClick={() => index > 0 && onIndex(index - 1)}>{t('wrapped.stories.previous')}</button>
          {bar}
          <button type="button" className="stories-step" aria-disabled={index === count - 1} onClick={() => index < count - 1 && onIndex(index + 1)}>{t('wrapped.stories.next')}</button>
        </div>
      </div>
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
      // A lazy image clipped out of the page would never load, and the card would never be ready
      images.forEach((image) => (image.loading = 'eager'))
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

type Shared = { status: 'loading' } | { status: 'ready', file: File } | { status: 'error' }
// Each image asked once per visit, so coming back to a story finds it ready
const files = new Map<string, Promise<File>>()

const fileOf = (url: string, name: string) => {
  if (!files.has(url)) {
    const file = fetch(url)
      .then((res) => res.ok ? res.blob() : Promise.reject(new Error(`${res.status}`)))
      .then((blob) => new File([blob], name, { type: blob.type || 'image/jpeg' }))
    file.catch(() => files.delete(url))
    files.set(url, file)
  }
  return files.get(url) as Promise<File>
}

// The phone's own share sheet with the image alone; a browser that cannot share a file downloads it
const send = async (file: File) => {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      return await navigator.share({ files: [file] })
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      // Safari refuses once the tap is too old: the image is still saved
      console.error('Unable to share the image, downloaded instead', error)
    }
  }
  const href = URL.createObjectURL(file)
  const link = Object.assign(document.createElement('a'), { href, download: file.name })
  link.click()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

// Asks for its image as soon as it shows, so the tap that shares it finds it ready
export const ShareImage = ({ url, name, label: asked, compact }: { url: string, name: string, label?: string, compact?: boolean }) => {
  const { t } = useTranslation()
  const label = asked || t('wrapped.share.label')
  const [shared, setShared] = useState<Shared>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setShared({ status: 'loading' })
    // The API draws one image at a time: a story tapped through is not drawn ahead of the one read
    const wait = setTimeout(() => fileOf(url, name).then(
      (file) => !cancelled && setShared({ status: 'ready', file }),
      (error) => {
        console.error('Unable to draw the image', error)
        !cancelled && setShared({ status: 'error' })
      },
    ), files.has(url) ? 0 : 700)
    return () => {
      cancelled = true
      clearTimeout(wait)
    }
  }, [url, name, attempt])

  return (
    <button
      type="button"
      className="stories-share"
      data-compact={compact || undefined}
      aria-label={shared.status === 'ready' ? t('wrapped.share.image', { label }) : undefined}
      // Not `disabled`: a retry tapped would drop focus while the image is drawn again
      aria-disabled={shared.status === 'loading'}
      aria-busy={shared.status === 'loading'}
      onClick={() => shared.status === 'ready' ? send(shared.file) : shared.status === 'error' && setAttempt(attempt + 1)}
    >
      {compact && shared.status === 'error'
        ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" /></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M8 11H6v10h12V11h-2" /></svg>}
      <span className={compact ? 'visually-hidden' : undefined}>{shared.status === 'loading' ? t('wrapped.share.preparing') : shared.status === 'error' ? t('wrapped.share.retry') : label}</span>
    </button>
  )
}
