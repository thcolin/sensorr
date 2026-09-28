import { Suspense, useEffect, useState } from 'react'
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

  const choose = (next: WrappedTheme) => {
    setTheme(next)

    try {
      window.localStorage.setItem(storageKey(token), next)
    } catch (error) {
      // Not remembered on this device, the look still changes for this visit
    }
  }

  return (
    <>
      <Suspense fallback={<div className="theme-loading" aria-busy="true" />}>
        <Theme share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
      </Suspense>
      {look.choice && (
        <label className="theme-switch">
          <span className="visually-hidden">Univers de la rétrospective</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="17" r="2" /></svg>
          <select value={theme} onChange={(event) => choose(event.target.value as WrappedTheme)}>
            {(Object.keys(THEMES) as WrappedTheme[]).map((id) => <option key={id} value={id}>{WRAPPED_THEME_NAMES[id]}</option>)}
          </select>
        </label>
      )}
    </>
  )
}
