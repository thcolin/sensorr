import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { WRAPPED_THEME_NAMES, type WrappedTheme } from '@sensorr/sensorr'
import type { Share } from './App'
import { sheetsOf } from './sheets'
import { DEFAULT_THEME, LOADERS, STORIES, THEMES, THEME_COLORS } from './themes'
import type { Art, StoryModel } from './themes/types'
import { Card, ShareImage, Stories, idOf } from './Stories'
import { known, read, write } from './look'

type At = 'start' | 'end'

// A phone, or any screen narrower than a look's two facing pages, reads the stories
const PHONE = '(max-width: 1023px)'
const subscribe = (change: () => void) => {
  const query = window.matchMedia(PHONE)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}
const usePhone = () => useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches)

// Set by the API's browser when it renders a story as an image: `?card=<story>&look=<look>`
const query = new URLSearchParams(window.location.search)
const card = { story: query.get('card'), look: query.get('look') }

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
  const [theme, setTheme] = useState<WrappedTheme>(() => (card.story && known(card.look) ? card.look : null) || (look.choice && chosen && looks.includes(chosen) ? chosen : null) || (known(look.theme) ? look.theme : DEFAULT_THEME))
  const Theme = THEMES[theme]
  const Story = STORIES[theme]
  const phone = usePhone()
  // Kept here, so a story stays the one being read when the look changes
  const [index, setIndex] = useState(0)
  const { sheets, colophon, closed } = sheetsOf(share)
  const stories: StoryModel[] = [...sheets, { kind: 'summary', label: `Rétrospective de ${share.name} ${share.year}` }]
  const art: Art = (item, kind = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined
  const cardOf = (id: string) => `/api/wrapped/share/${encodeURIComponent(token)}/cards/${theme}/${id}`
  const nameOf = (id: string) => `retrospective-${share.name}-${share.year}-${id}.jpg`.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
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

  const choice = look.choice && looks.length > 1

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
    const story = stories[Math.min(index, stories.length - 1)]
    const at = index === 0 ? 'start' : index === stories.length - 1 ? 'end' : null
    return (
      <Stories
        count={stories.length}
        index={index}
        onIndex={setIndex}
        label={story.label}
        bar={<>
          {choice && at && <Switch at={at} theme={theme} looks={looks} onChoose={choose} />}
          <ShareImage key={idOf(story)} url={cardOf(idOf(story))} name={nameOf(idOf(story))} />
        </>}
      >
        <Suspense fallback={null}>
          <Story key={index} story={story} index={index} share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
        </Suspense>
      </Stories>
    )
  }

  return (
    <>
      {choice && <Switch at="start" theme={theme} looks={looks} onChoose={choose} />}
      <Suspense fallback={<div className="theme-loading" aria-busy="true" />}>
        <Theme share={share} sheets={sheets} colophon={colophon} closed={closed} art={art} />
      </Suspense>
      {choice && <Switch at="end" theme={theme} looks={looks} onChoose={choose} />}
      {Story && <div className="theme-share"><ShareImage url={cardOf('summary')} name={nameOf('summary')} label="Partager ma rétrospective" /></div>}
    </>
  )
}
