import { Suspense, useEffect, useRef, useState } from 'react'
import { WRAPPED_THEME_NAMES, type WrappedTheme } from '@sensorr/sensorr'
import type { Share } from './App'
import { sheetsOf } from './sheets'
import { DEFAULT_THEME, LOADERS, THEMES, THEME_COLORS } from './themes'
import type { Art } from './themes/types'
import { known, read, write } from './look'

type At = 'start' | 'end'

const Switch = ({ at, theme, looks, onChoose }: { at: At, theme: WrappedTheme, looks: WrappedTheme[], onChoose: (theme: WrappedTheme, at: At, from: HTMLElement) => void }) => (
  <label className="theme-switch" data-at={at}>
    <span>{at === 'start' ? 'Voir en' : 'Revoir en'}</span>
    <select name={`theme-${at}`} value={theme} onChange={(event) => onChoose(event.target.value as WrappedTheme, at, event.currentTarget)}>
      {looks.map((id) => <option key={id} value={id}>{WRAPPED_THEME_NAMES[id]}</option>)}
    </select>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
  </label>
)

export const WrappedPage = ({ share, token }: { share: Share, token: string }) => {
  const { look } = share
  // In the order of the list, whatever order the config keeps them in
  const looks = (Object.keys(THEMES) as WrappedTheme[]).filter((id) => !look.looks || look.looks.includes(id))
  const chosen = read('chosen', token)
  // A look chosen earlier and since turned off gives way to the one Thomas set
  const [theme, setTheme] = useState<WrappedTheme>(() => (look.choice && chosen && looks.includes(chosen) ? chosen : null) || (known(look.theme) ? look.theme : DEFAULT_THEME))
  const Theme = THEMES[theme]
  const { sheets, colophon, closed } = sheetsOf(share)
  const art: Art = (item, kind = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined
  // Where the switch that was used sat on screen, so the new look opens at the same place
  const anchor = useRef<{ at: At, top: number } | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
    write('shown', token, theme)

    const kept = anchor.current
    anchor.current = null

    if (!kept) {
      return
    }

    // Images settle over a few frames, the switch is held in place meanwhile, until the reader moves
    let frame = 0
    const until = performance.now() + 1500
    const hold = () => {
      const target = document.querySelector(`.theme-switch[data-at="${kept.at}"]`)
      target && window.scrollBy(0, target.getBoundingClientRect().top - kept.top)
      frame = performance.now() < until ? requestAnimationFrame(hold) : 0
    }
    const moves = ['wheel', 'touchstart', 'keydown', 'pointerdown']
    const stop = () => {
      cancelAnimationFrame(frame)
      moves.forEach((move) => window.removeEventListener(move, stop))
    }
    moves.forEach((move) => window.addEventListener(move, stop, { passive: true }))
    hold()

    return stop
  }, [theme])

  const choose = async (next: WrappedTheme, at: At, from: HTMLElement) => {
    const top = from.getBoundingClientRect().top

    try {
      // Loaded first, so the page never shows the new look's colours without its sheet
      await LOADERS[next]()
    } catch (error) {
      console.error(`Unable to load the "${next}" look`, error)
      return
    }

    anchor.current = { at, top }
    setTheme(next)
    write('chosen', token, next)
  }

  return (
    <>
      {look.choice && looks.length > 1 && <Switch at="start" theme={theme} looks={looks} onChoose={choose} />}
      <Suspense fallback={<div className="theme-loading" aria-busy="true" />}>
        <Theme share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
      </Suspense>
      {look.choice && looks.length > 1 && <Switch at="end" theme={theme} looks={looks} onChoose={choose} />}
    </>
  )
}
