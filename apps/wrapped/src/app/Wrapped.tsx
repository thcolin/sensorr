import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { WrappedTheme } from '@sensorr/sensorr'
import { useTranslation } from 'react-i18next'
import type { Share } from './App'
import { sheetsOf } from './sheets'
import { DEFAULT_THEME, LOADERS, STORIES, STORY_LOADERS, THEMES, THEME_COLORS } from './themes'
import type { Art, StoryModel } from './themes/types'
import { Card, ShareImage, Stories, idOf } from './Stories'
import { known, read, write } from './look'
import { anchor as hrefOf } from './anchor'

type At = 'start' | 'end'

// A phone, or any screen narrower than a look's two facing pages, reads the stories
const PHONE = '(max-width: 1023px)'
const subscribe = (change: () => void) => {
  const query = window.matchMedia(PHONE)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}
const usePhone = () => useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches)

// Set by the API's browser when it renders a story as an image: `?card=<story>&look=<look>&lang=<language>`
const query = new URLSearchParams(window.location.search)
const card = { story: query.get('card'), look: query.get('look') }

const Switch = ({ at, theme, looks, onChoose }: { at: At, theme: WrappedTheme, looks: WrappedTheme[], onChoose: (theme: WrappedTheme, at: At, from: HTMLElement) => void }) => {
  const { t } = useTranslation()
  return (
    <label className="theme-switch" data-at={at}>
      <span>{t(`wrapped.switch.${at}`)}</span>
      <select name={`theme-${at}`} value={theme} onChange={(event) => onChoose(event.target.value as WrappedTheme, at, event.currentTarget)}>
        {looks.map((id) => <option key={id} value={id}>{t(`wrapped.themes.${id}`)}</option>)}
      </select>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
    </label>
  )
}

// Another year is another page: it opens on its first sheet, and the browser's back returns to this one
const Edition = ({ token, year, editions, compact }: { token: string, year: number, editions: number[], compact?: boolean }) => {
  // The year chosen while its page loads; a page restored by the back button starts over from its own
  const { t } = useTranslation()
  const [pending, setPending] = useState<number | null>(null)

  useEffect(() => {
    const restored = (event: PageTransitionEvent) => event.persisted && setPending(null)
    window.addEventListener('pageshow', restored)
    return () => window.removeEventListener('pageshow', restored)
  }, [])

  const choose = (next: number) => {
    setPending(next)
    window.location.assign(`/wrapped/${encodeURIComponent(token)}/${next}`)
  }

  return (
    <label className="theme-switch edition-switch" aria-busy={pending !== null}>
      <span className={compact ? 'visually-hidden' : undefined}>{t('wrapped.switch.year')}</span>
      <select name="edition" value={pending ?? year} onChange={(event) => choose(Number(event.target.value))}>
        {[...editions].reverse().map((edition) => <option key={edition} value={edition}>{edition}</option>)}
      </select>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
    </label>
  )
}

export const WrappedPage = ({ share, token }: { share: Share, token: string }) => {
  const { t, i18n } = useTranslation()
  const { look } = share
  // In the order of the list, whatever order the config keeps them in
  const looks = (Object.keys(THEMES) as WrappedTheme[]).filter((id) => !look.looks || look.looks.includes(id))
  const chosen = read('chosen', token)
  // A look chosen earlier and since turned off gives way to the one Thomas set
  const [theme, setTheme] = useState<WrappedTheme>(() => (card.story && known(card.look) ? card.look : null) || (look.choice && chosen && looks.includes(chosen) ? chosen : null) || (known(look.theme) ? look.theme : DEFAULT_THEME))
  const Theme = THEMES[theme]
  const Story = STORIES[theme]
  const phone = usePhone()
  // Kept here, so a story stays the one being read when the look changes
  // In the address too, so a reload or a tab the phone dropped opens on the same story
  const [index, setIndex] = useState(() => Math.max(0, (Number.parseInt(window.location.hash.slice(1), 10) || 1) - 1))
  const show = (next: number) => {
    setIndex(next)
    window.history.replaceState(null, '', hrefOf(String(next + 1)))
  }
  const { sheets, colophon, closed } = sheetsOf(share)
  const stories: StoryModel[] = [...sheets, { kind: 'summary', label: t('wrapped.title', { name: share.name, year: share.year }) }]
  // An address from another day can name a story this one no longer has
  const current = Math.min(index, stories.length - 1)
  const art: Art = (item, kind = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined
  const cardOf = (id: string) => `/api/wrapped/share/${encodeURIComponent(token)}/cards/${theme}/${id}?year=${share.year}&lang=${i18n.language}`
  const nameOf = (id: string) => `retrospective-${share.name}-${share.year}-${id}.jpg`.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
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
      // Loaded first, so the page never shows the new look's colours without its sheet, or its stories
      await Promise.all([LOADERS[next](), phone && STORY_LOADERS[next]?.()])
    } catch (error) {
      console.error(`Unable to load the "${next}" look`, error)
      return
    }

    anchor.current = { at, top }
    setTheme(next)
    write('chosen', token, next)
  }

  const choice = look.choice && looks.length > 1
  const years = share.editions.length > 1

  if (card.story) {
    const story = stories.find((other) => idOf(other) === card.story)
    return (
      <Card missing={!Story || !story}>
        {Story && story && (
          <Suspense fallback={null}>
            <Story story={story} index={stories.indexOf(story)} share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
          </Suspense>
        )}
      </Card>
    )
  }

  if (phone && Story) {
    const story = stories[current]
    const at = current === 0 ? 'start' : current === stories.length - 1 ? 'end' : null
    return (
      <Stories
        count={stories.length}
        index={current}
        onIndex={show}
        label={story.label}
        bar={<>
          {choice && at && <Switch at={at} theme={theme} looks={looks} onChoose={choose} />}
          {years && at && <Edition token={token} year={share.year} editions={share.editions} compact={choice} />}
          <ShareImage key={idOf(story)} url={cardOf(idOf(story))} name={nameOf(idOf(story))} compact={choice && years && !!at} />
        </>}
      >
        <Suspense fallback={null}>
          <Story key={current} story={story} index={current} share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
        </Suspense>
      </Stories>
    )
  }

  return (
    <>
      {(choice || years) && (
        <div className="theme-switches">
          {choice && <Switch at="start" theme={theme} looks={looks} onChoose={choose} />}
          {years && <Edition token={token} year={share.year} editions={share.editions} />}
        </div>
      )}
      <Suspense fallback={<div className="theme-loading" aria-busy="true" />}>
        <Theme share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
      </Suspense>
      {(choice || years) && (
        <div className="theme-switches">
          {choice && <Switch at="end" theme={theme} looks={looks} onChoose={choose} />}
          {years && <Edition token={token} year={share.year} editions={share.editions} />}
        </div>
      )}
      {Story && <div className="theme-share"><ShareImage url={cardOf('summary')} name={nameOf('summary')} label={t('wrapped.share.summary')} /></div>}
    </>
  )
}
