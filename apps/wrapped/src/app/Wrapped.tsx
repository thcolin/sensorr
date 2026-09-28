import { Suspense, useEffect, useRef, useState } from 'react'
import { WRAPPED_THEME_NAMES, type WrappedTheme } from '@sensorr/sensorr'
import type { Share } from './App'
import { sheetsOf } from './sheets'
import { THEMES, THEME_COLORS } from './themes'
import type { Art } from './themes/types'

const storageKey = (token: string) => `wrapped-look:${token}`

const stored = (token: string) => {
  try {
    const theme = window.localStorage.getItem(storageKey(token))
    return theme && theme in THEMES ? theme as WrappedTheme : null
  } catch (error) {
    // Private browsing or blocked storage: the page opens on the look Thomas set
    return null
  }
}

export const WrappedPage = ({ share, token }: { share: Share, token: string }) => {
  const { look } = share
  const [theme, setTheme] = useState<WrappedTheme>(() => (look.choice && stored(token)) || look.theme)
  const Theme = THEMES[theme]
  const { sheets, colophon, closed } = sheetsOf(share)
  const art: Art = (item, kind = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  }, [theme])

  // Where the switch that was used sat on screen, so the new look opens at the same place
  const anchor = useRef<{ at: string, top: number } | null>(null)

  useEffect(() => {
    const kept = anchor.current

    if (!kept) {
      return
    }

    // The new look and its images settle over a few frames, the switch is held in place meanwhile
    let frame = 0
    const until = performance.now() + 1500
    const stop = () => { cancelAnimationFrame(frame); anchor.current = null }
    const hold = () => {
      const target = document.querySelector(`.theme-switch[data-at="${kept.at}"]`)
      target && window.scrollBy(0, target.getBoundingClientRect().top - kept.top)
      frame = performance.now() < until ? requestAnimationFrame(hold) : 0
    }
    hold()
    window.addEventListener('wheel', stop, { once: true })
    window.addEventListener('touchstart', stop, { once: true })

    return () => {
      stop()
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
  }, [theme])

  const choose = (next: WrappedTheme, from: HTMLElement) => {
    anchor.current = { at: from.dataset.at || 'start', top: from.getBoundingClientRect().top }
    setTheme(next)

    try {
      window.localStorage.setItem(storageKey(token), next)
    } catch (error) {
      // Not remembered on this device, the look still changes for this visit
    }
  }

  const Switch = ({ at }: { at: 'start' | 'end' }) => (
    <label className="theme-switch" data-at={at}>
      <span>{at === 'start' ? 'Voir en' : 'Revoir en'}</span>
      <select name={`theme-${at}`} value={theme} onChange={(event) => choose(event.target.value as WrappedTheme, event.currentTarget.parentElement as HTMLElement)}>
        {(Object.keys(THEMES) as WrappedTheme[]).map((id) => <option key={id} value={id}>{WRAPPED_THEME_NAMES[id]}</option>)}
      </select>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
    </label>
  )

  return (
    <>
      {look.choice && <Switch at="start" />}
      <Suspense fallback={<div className="theme-loading" aria-busy="true" />}>
        <Theme share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
      </Suspense>
      {look.choice && <Switch at="end" />}
    </>
  )
}
