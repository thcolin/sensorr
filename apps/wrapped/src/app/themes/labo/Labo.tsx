import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { WrappedPoster } from '@sensorr/sensorr'
import { MONTHS, THIN, number, plural, type SheetModel, type Stat } from '../../sheets'
import type { Art, ThemeProps } from '../types'
import './labo.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>
type Reel = { name: string, year: number }

// Deterministic, so each frame is cut from the same spot of its picture on every visit
const rng = (seed: number) => {
  let state = (Math.abs(Math.round(seed)) % 2147483646) + 1
  return () => (state = (state * 16807) % 2147483647) / 2147483647
}

const two = (value: number) => String(value).padStart(2, '0')

// A quantity is written over the print in grease pencil with its unit: not a date, nor the digits of a name or of a title in quotes
const UNIT = 'jours?\\sd’écart|films?\\set\\sséries|(?:soirs?|jours?|épisodes?|films?|séries?|titres?|fois|heures?|personnes?|spectateurs?)(?![\\p{L}])|par jour'
const MONTH = '(?:er)?\\s(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)'
const QUANTITY = new RegExp(`(?<![\\p{L}\\d._])(S\\d+E\\d+|\\d+(?:\\s\\d{3})*(?:\\sh\\s\\d+|\\s?%)?)(?![\\p{L}\\d])(?!${MONTH})(?:\\s(${UNIT}))?`, 'gu')
const figures = (text: string) => text.split(/(«[^»]*»)/).flatMap((part, index) => {
  if (index % 2) return [part]
  const bits: ReactNode[] = []
  let from = 0
  for (const match of part.matchAll(QUANTITY)) {
    bits.push(part.slice(from, match.index), (
      <b key={`${index}-${match.index}`} className="labo-fig">
        <span className="labo-fig-n">{match[1]}</span>{match[2] && <> {match[2]}</>}
      </b>
    ))
    from = match.index + match[0].length
  }
  return [...bits, part.slice(from)]
})

// A paragraph of the model cut at its sentences
const sentences = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9«])/)

// The whole page is one strip of film: every sheet is a stretch of it, printed along both edges
const Labo = ({ share, sheets, colophon, art }: ThemeProps) => {
  const reel = { name: share.name, year: share.year }
  const negatives = (sheets.find((sheet) => sheet.kind === 'opening') as Of<'opening'> | undefined)?.posters || []

  return (
    <>
      <Negatives posters={negatives} art={art} />
      <main className="labo-reel">
        {sheets.map((sheet, index) => {
          const frame = { index, reel }
          switch (sheet.kind) {
            case 'opening': return <Opening key={index} {...frame} sheet={sheet} art={art} />
            case 'rank': return <Rank key={index} {...frame} sheet={sheet} />
            case 'streak': return <Streak key={index} {...frame} sheet={sheet} art={art} />
            case 'months': return <Months key={index} {...frame} sheet={sheet} art={art} />
            case 'binge': return <Binge key={index} {...frame} sheet={sheet} art={art} episodes={sheet.episodes || 0} />
            case 'night': return <Night key={index} {...frame} sheet={sheet} art={art} />
            case 'server': return <Server key={index} {...frame} sheet={sheet} art={art} />
            case 'figure': return <Figure key={index} {...frame} sheet={sheet} art={art} />
            case 'duo': return <Duo key={index} {...frame} sheet={sheet} art={art} />
            case 'posters': return <Posters key={index} {...frame} sheet={sheet} art={art} />
            case 'genre': return <Genre key={index} {...frame} sheet={sheet} art={art} />
            case 'finale': return <Finale key={index} {...frame} sheet={sheet} art={art} />
          }
        })}
        <footer className="labo-colophon">
          <Edges index={sheets.length} reel={reel} />
          {colophon.short && <p className="labo-colophon-short">{colophon.short}</p>}
          <p>{colophon.text}</p>
        </footer>
      </main>
    </>
  )
}

export default Labo

// Edge printing: film stock, the reel's name and a key number that climbs down the page
export const Edges = ({ index, reel }: { index: number, reel?: Reel }) => {
  const marks = [`KODAK 5219`, reel && `${reel.name.toUpperCase()} ${reel.year}`, `▸ ${two(index * 4 + 1)}`, 'SAFETY FILM', `▸ ${two(index * 4 + 3)}`].filter(Boolean) as string[]
  return (
    <>
      {['left', 'right'].map((side) => (
        <div key={side} className={`labo-edge labo-edge-${side}`} aria-hidden="true">
          {marks.map((mark) => <span key={mark}>{mark}</span>)}
        </div>
      ))}
    </>
  )
}

const Sheet = ({ sheet, index, reel, className, children }: { sheet: SheetModel, index: number, reel: Reel, className?: string, children: ReactNode }) => (
  <section className={`labo-sheet labo-sheet-${sheet.kind} ${className || ''}`} aria-label={sheet.label}>
    <Edges index={index} reel={reel} />
    {children}
  </section>
)

const Title = ({ lines, as: Tag = 'h2', className }: { lines: string[], as?: 'h2' | 'h3', className?: string }) => (
  <Tag className={`labo-title ${className || ''}`}>
    {lines.map((line, index) => <span key={index}>{index > 0 && ' '}{line}</span>)}
  </Tag>
)

// A frame of the film: the poster printed warm, a missing one left unexposed with its title
const Frame = ({ poster, art, kind = 'thumb', width = 640, code, eager, className, children }: { poster: WrappedPoster, art: Art, kind?: 'thumb' | 'art', width?: 320 | 640 | 1280, code?: string, eager?: boolean, className?: string, children?: ReactNode }) => {
  const src = art(poster, kind, width) || art(poster, kind === 'thumb' ? 'art' : 'thumb', width)
  return (
    <figure className={`labo-frame ${kind === 'art' ? 'labo-frame-wide' : ''} ${className || ''}`}>
      {src
        ? <img src={src} alt={poster.title} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        : <span className="labo-frame-blank">{poster.title}</span>}
      {code && <span className="labo-frame-code" aria-hidden="true">{code}</span>}
      {children}
    </figure>
  )
}

// So many frames cut from one picture, each from its own spot, as many as there are evenings or episodes
const Cells = ({ count, src, seed, columns, className }: { count: number, src?: string, seed: number, columns?: number, className?: string }) => {
  const random = rng(seed)
  return (
    <ol className={`labo-cells ${className || ''}`} aria-hidden="true" style={{ '--src': src ? `url("${src}")` : 'none', gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : undefined } as React.CSSProperties}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} style={{ backgroundPosition: `${Math.round(random() * 100)}% ${Math.round(random() * 100)}%` }} />
      ))}
    </ol>
  )
}

// Grease pencil strokes draw themselves once in view, and stay drawn without script or motion
const useDraw = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const reduced = useReducedMotion()
  const [state, setState] = useState<'drawn' | 'wait'>('drawn')

  useLayoutEffect(() => {
    const node = ref.current
    if (reduced || !node || typeof IntersectionObserver === 'undefined') {
      return
    }

    setState('wait')
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setState('drawn')
        observer.disconnect()
      }
    }, { threshold: 0.35 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced])

  return [ref, state] as const
}

const Ring = ({ className }: { className?: string }) => (
  <svg className={`labo-ring ${className || ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M52 4 C 88 1, 98 26, 97 52 C 96 88, 64 98, 32 96 C 8 94, 2 64, 4 38 C 6 10, 34 3, 64 8" />
  </svg>
)

// What an editor scrawls on a frame in grease pencil, each gesture in the frame's own box
const GESTURES = {
  crop: 'M1 5 L 98 2 M 96 0 L 98 97 M 100 95 L 3 98 M 5 100 L 2 3',
  ring: 'M52 -2 C 97 -3, 107 30, 105 55 C 103 95, 64 102, 30 101 C 1 99, -6 64, -4 36 C -1 5, 34 -3, 67 3',
  corners: 'M-3 18 L -3 -3 L 18 -3 M 82 -3 L 103 -3 L 103 18 M 103 82 L 103 103 L 82 103 M 18 103 L -3 103 L -3 82',
  slash: 'M 3 97 C 28 72, 66 32, 98 4 M 8 99 C 34 74, 70 36, 99 10',
  squiggle: 'M 4 95 C 12 90, 16 100, 24 95 S 38 90, 46 95 S 60 100, 68 95 S 82 90, 90 95 S 96 99, 98 93',
  arrow: 'M -16 -14 C -10 8, 2 20, 22 26 M 22 26 L 9 29 M 22 26 L 15 14',
}

type Gesture = keyof typeof GESTURES

const hash = (text: string) => [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 2147483646, 7)

// A different gesture for each frame, and from one sheet of frames to the next
const gestureOf = (sheet: number, item: number) => {
  const gestures = Object.keys(GESTURES) as Gesture[]
  return gestures[(sheet * 2 + item) % gestures.length]
}

// A cut across the frame at a height, with the editor's tick where the scissors go
const cutAt = (at: number) => `M 0 ${at + 1} C 20 ${at - 2}, 60 ${at + 3}, 104 ${at - 1} M 93 ${at - 8} L 104 ${at - 1} L 94 ${at + 6}`

// Every point of the gesture moved a little, so no two frames carry the same stroke
const wobble = (path: string, random: () => number) => path.replace(/-?\d+(?:\.\d+)?/g, (value) => (Number(value) + (random() - 0.5) * 7).toFixed(1))

const Scrawl = ({ gesture, seed, at }: { gesture: Gesture | 'cut', seed: number, at?: number }) => {
  const random = rng(seed)
  const style = { '--stroke': 2.5 + random() * 2.5, transform: `rotate(${(random() - 0.5) * 5}deg)` } as React.CSSProperties
  return (
    <svg className={`labo-ring labo-scrawl labo-scrawl-${gesture}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={style}>
      <path d={wobble(gesture === 'cut' ? cutAt(Math.min(Math.max(at ?? 50, 6), 94)) : GESTURES[gesture], random)} />
    </svg>
  )
}

// Drying on the line behind the reel, the year's posters as colour negatives
const Negatives = ({ posters, art }: { posters: WrappedPoster[], art: Art }) => {
  if (!posters.length) {
    return null
  }

  const hang = (offset: number) => Array.from({ length: 6 }, (_, index) => posters[(index + offset) % posters.length])
  return (
    <div className="labo-line" aria-hidden="true">
      {[0, 2].map((offset) => (
        <div key={offset} className="labo-negative">
          <span className="labo-negative-clip" />
          {hang(offset).map((poster, index) => {
            const src = art(poster, 'thumb', 320)
            return <span key={index} className="labo-negative-frame">{src && <img src={src} alt="" loading="lazy" decoding="async" />}</span>
          })}
        </div>
      ))}
    </div>
  )
}

// The Academy leader counts 5, 4, 3, then the name is printed through the safelight
const Opening = ({ sheet, index, reel, art }: { sheet: Of<'opening'>, index: number, reel: Reel, art: Art }) => {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(reduced ? 0 : 5)
  const at = sheet.title.indexOf(sheet.name)
  const [before, after] = at < 0 ? [sheet.title, ''] : [sheet.title.slice(0, at), sheet.title.slice(at + sheet.name.length)]

  useEffect(() => {
    if (reduced) {
      return setCount(0)
    }
    if (count > 0) {
      const timer = setTimeout(() => setCount(count > 3 ? count - 1 : 0), 850)
      return () => clearTimeout(timer)
    }
  }, [count, reduced])

  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <div className={`labo-leader ${count ? 'labo-leader-counting' : 'labo-leader-printed'} ${reduced ? 'labo-still' : ''}`}>
        <svg className="labo-leader-dial" viewBox="0 0 400 300" aria-hidden="true">
          <line x1="200" y1="0" x2="200" y2="300" />
          <line x1="0" y1="150" x2="400" y2="150" />
          <circle cx="200" cy="150" r="118" />
          <circle cx="200" cy="150" r="100" />
          <path className="labo-leader-sweep" d="M200 150 L200 32 A118 118 0 0 1 318 150 Z" />
        </svg>
        {!!count && <span className="labo-leader-count" aria-hidden="true">{count}</span>}
        <h1 className="labo-leader-title" style={{ '--len': Math.max(sheet.name.length, 4) } as React.CSSProperties}>
          {at < 0 ? <strong>{before}</strong> : (
            <>
              <small>{before.trim()}</small>{' '}
              <strong>{sheet.name}</strong>{' '}
              {after.trim() && <small>{after.trim()}</small>}
            </>
          )}
        </h1>
      </div>
      {sheet.lede && <p className="labo-lede">{sheet.lede}</p>}
      {!!sheet.posters.length && (
        <div className="labo-contact" data-count={sheet.posters.length}>
          {sheet.posters.map((poster, frame) => <Frame key={poster.key} poster={poster} art={art} width={frame ? 320 : 640} code={`${frame + 1}A`} eager />)}
        </div>
      )}
      <ul className="labo-slate">
        {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
      </ul>
    </Sheet>
  )
}

// The lab's form, the rank stamped on it, and a strip with one frame per viewer, yours ringed
const Rank = ({ sheet, index, reel }: { sheet: Of<'rank'>, index: number, reel: Reel }) => {
  const [ref, draw] = useDraw<HTMLOListElement>()

  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <div className="labo-fiche">
        <FicheHead reel={reel} />
        <div className="labo-fiche-row">
          <h2 className="labo-fiche-title">{sheet.label}</h2>
          <p className="labo-stamp labo-stamp-rank">
            <span>{sheet.rank}<sup>{sheet.suffix}</sup></span>
            <small>{sheet.unit}</small>
          </p>
        </div>
        <p className="labo-fiche-typed">{figures(sheet.detail)}</p>
        <Lights sheet={sheet} />
      </div>
      <ol ref={ref} className="labo-crowd" data-draw={draw} aria-hidden="true">
        {Array.from({ length: sheet.users }, (_, seat) => seat === sheet.rank - 1
          ? <li key={seat} className="labo-crowd-you"><Ring /><span className="labo-grease">toi</span></li>
          : <li key={seat} />)}
      </ol>
    </Sheet>
  )
}

// The printer lights of the form: the reader's hours, the median's and the first viewer's, each a density on the strip
const Lights = ({ sheet }: { sheet: Of<'rank'> }) => {
  const lights = [
    { label: 'Toi', hours: sheet.hours, you: true },
    { label: 'Médiane', hours: sheet.median },
    // An edition frozen before the first viewer's hours were kept does not know them
    ...(sheet.max !== null && sheet.rank !== 1 ? [{ label: '1er', hours: sheet.max }] : []),
  ]
  const top = Math.max(...lights.map((light) => light.hours), 1)

  return (
    <dl className="labo-fiche-values labo-lights">
      {lights.map((light) => (
        <div key={light.label} className={'you' in light ? 'labo-lights-you' : undefined}>
          <dt>{light.label}</dt>
          <dd className="labo-felt">{number.format(light.hours)}{THIN}h</dd>
          <span className="labo-lights-bar" style={{ '--share': Math.max(light.hours / top, 0.02) } as React.CSSProperties} aria-hidden="true" />
        </div>
      ))}
    </dl>
  )
}

const FicheHead = ({ reel, children }: { reel: Reel, children?: ReactNode }) => (
  <header className="labo-fiche-head" aria-hidden="true">
    <span>Fiche d’étalonnage<br />Bobine {reel.year}</span>
    <strong>{reel.name}</strong>
    {children}
  </header>
)

// As many frames as evenings in a row, all cut from the show that filled them
// One frame per evening of the run, printed from what was watched that evening
const Streak = ({ sheet, index, reel, art }: { sheet: Of<'streak'>, index: number, reel: Reel, art: Art }) => {
  const figure = (
    <p className="labo-figure">
      <span aria-hidden="true">{number.format(sheet.evenings)}</span>
      <span className="visually-hidden">{sheet.spoken}</span>
      <small aria-hidden="true">{sheet.unit}</small>
    </p>
  )

  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <h2 className="labo-intro">{sheet.intro}</h2>
      {sheet.lead
        ? (
          <>
            <div className="labo-figure-pair">
              <Frame poster={sheet.poster} art={art} code="1A" />
              {figure}
            </div>
            <div>
              <h3 className="labo-name">{sheet.poster.title}</h3>
              <p className="labo-body labo-span">{figures(sheet.span)}</p>
            </div>
          </>
        )
        : <>{figure}<p className="labo-body">{figures(sheet.details)}</p></>}
      {sheet.nights.some((night) => night.poster)
        ? (
          <ol className="labo-nights" data-long={sheet.nights.length > 21 || undefined}>
            {sheet.nights.map(({ day, poster }, night) => (
              <li key={night}>
                <div className="labo-strip-film">
                  {poster
                    ? <Frame poster={poster} art={art} width={320} code={`${night + 1}`} />
                    : <span className="labo-frame labo-nights-blank" aria-hidden="true" />}
                </div>
                <span className="labo-nights-day">{day}</span>
              </li>
            ))}
          </ol>
        )
        : <Cells count={sheet.evenings} src={art(sheet.poster, 'art', 640) || art(sheet.poster, 'thumb', 320)} seed={sheet.evenings * 31} className="labo-cells-strip" />}
    </Sheet>
  )
}

// The contact sheet: a row per month, one frame per episode of that month's show
const Months = ({ sheet, index, reel, art }: { sheet: Of<'months'>, index: number, reel: Reel, art: Art }) => {
  const [ref, draw] = useDraw<HTMLDivElement>()

  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <Title lines={sheet.lines} />
      <p className="labo-lede">{sheet.lede}</p>
      <div className="labo-paper">
        <div ref={ref} className="labo-planche" role="img" aria-label={sheet.alt} data-draw={draw}>
          {MONTHS.map((month, row) => {
            const show = sheet.shows[row]
            const future = row >= sheet.elapsed
            return (
              <div key={month} className={`labo-planche-row ${future ? 'labo-planche-future' : ''} ${sheet.peak?.index === row ? 'labo-planche-peak' : ''}`}>
                <p className="labo-planche-head">
                  <span>{month}</span>
                  {show && !future && <strong>{show.title}</strong>}
                  {show && !future && <span>{plural(show.episodes, 'épisode', 'épisodes')}</span>}
                </p>
                {show && !future
                  ? <Cells count={show.episodes} src={art(show, 'art', 640) || art(show, 'thumb', 320)} seed={row * 97 + show.episodes} />
                  : <span className="labo-planche-blank" />}
                {sheet.peak?.index === row && <Ring />}
              </div>
            )
          })}
        </div>
        {sheet.peak && (
          <div className="labo-planche-foot">
            <Frame poster={sheet.peak.show} art={art} width={320} code={`${sheet.peak.index + 1}A`} />
            <p className="labo-grease labo-planche-note">En {sheet.peak.month}{THIN}: {figures(sheet.peak.bare)}</p>
          </div>
        )}
      </div>
    </Sheet>
  )
}

// One evening's binge, a frame per episode
// The footage counter of the printer, one window per figure
const Counter = ({ stats }: { stats: Stat[] }) => (
  <ul className="labo-counter">
    {stats.map((stat) => <li key={stat.unit}><b>{stat.value}</b><span>{stat.unit}</span></li>)}
  </ul>
)

// A still, its poster clipped to the corner so the show reads at a glance
const Still = ({ poster, art, code }: { poster: WrappedPoster, art: Art, code: string }) => (
  <div className="labo-still-print">
    <Frame poster={poster} art={art} kind="art" width={1280} code={code} />
    {poster.art && poster.thumb && <Frame poster={poster} art={art} width={320} className="labo-still-poster" />}
  </div>
)

// One evening's binge, a frame per episode
const Binge = ({ sheet, index, reel, art, episodes }: { sheet: Of<'binge'>, index: number, reel: Reel, art: Art, episodes: number }) => {
  const { poster, pace } = sheet
  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <Title lines={sheet.lines} />
      <Still poster={poster} art={art} code="1A" />
      <div>
        <h3 className="labo-name">{sheet.title}</h3>
        {sheet.date && <p className="labo-intro labo-date">{sheet.date}</p>}
      </div>
      {!!sheet.stats.length && <Counter stats={sheet.stats} />}
      {episodes > 0 && <Cells count={episodes} src={art(poster, 'art', 640) || art(poster, 'thumb', 320)} seed={episodes * 53} columns={Math.ceil(episodes / Math.ceil(episodes / 6))} className="labo-cells-reel" />}
      {pace && (
        <div className="labo-pace">
          <Frame poster={pace} art={art} width={320} code="2A" />
          <div>
            <h3 className="labo-name">{pace.title}</h3>
            {sheet.paced_stats.length ? <Counter stats={sheet.paced_stats} /> : sheet.paced && <p className="labo-body">{figures(sheet.paced)}</p>}
          </div>
        </div>
      )}
    </Sheet>
  )
}

// The tail of the reel, the hour the projector stopped marked on the leader
const Night = ({ sheet, index, reel, art }: { sheet: Of<'night'>, index: number, reel: Reel, art: Art }) => (
  <Sheet sheet={sheet} index={index} reel={reel}>
    <Title lines={sheet.lines} />
    <div className="labo-tail">
      <Frame poster={sheet.poster} art={art} code="99A" />
      <div className="labo-tail-leader" aria-hidden="true">
        <span className="labo-tail-mark">Queue</span>
        <span className="labo-tail-hour">{sheet.end}</span>
        <span className="labo-tail-mark">Fin de bobine</span>
      </div>
    </div>
    <p className="labo-intro">{sheet.date}</p>
    <p className="labo-body">Tu éteins à <b className="labo-fig"><span className="labo-fig-n">{sheet.end}</span></b>{figures(sheet.after)}.</p>
    {sheet.listing
      ? (
        <div className="labo-log">
          <p className="labo-intro">{sheet.listing}</p>
          <ol>
            {sheet.schedule.map((line, play) => (
              <li key={`${line.start}-${play}`} className={play === sheet.schedule.length - 1 ? 'labo-log-last' : undefined}>
                <span className="labo-log-time"><b>{line.start}</b><span>{line.end}</span></span>
                <Frame poster={line.poster} art={art} width={320} />
                <span className="labo-log-title">{line.poster.title}{line.what && <span>{line.what}</span>}</span>
              </li>
            ))}
          </ol>
        </div>
      )
      : <p className="labo-body">{sheet.last}</p>}
  </Sheet>
)

const Server = ({ sheet, index, reel, art }: { sheet: Of<'server'>, index: number, reel: Reel, art: Art }) => {
  const [ref, draw] = useDraw<HTMLDivElement>()
  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <Title lines={sheet.lines} />
      <div ref={ref} className="labo-ringed" data-draw={draw}>
        <Frame poster={sheet.poster} art={art} code="0A" />
        <Ring />
        {sheet.first && <span className="labo-stamp labo-stamp-copy" aria-hidden="true">Copie zéro</span>}
      </div>
      <h3 className="labo-name">{sheet.title}</h3>
      {sentences(sheet.bare).map((sentence) => <p key={sentence} className="labo-body">{figures(sentence)}</p>)}
      {sheet.poster.art && <Frame poster={sheet.poster} art={art} kind="art" width={1280} code="0B" className="labo-server-still" />}
    </Sheet>
  )
}

// A few frames side by side on a cut of film, the titles under them
const Strip = <P extends WrappedPoster>({ posters, art, caption, start = 1, titled = true }: { posters: P[], art: Art, caption?: (poster: P) => ReactNode, start?: number, titled?: boolean }) => (
  <ul className="labo-strip" data-count={posters.length}>
    {posters.map((poster, frame) => (
      <li key={poster.key}>
        <div className="labo-strip-film">
          <Frame poster={poster} art={art} width={320} code={`${start + frame}A`} />
        </div>
        {titled && <span className="labo-strip-title">{poster.title}</span>}
        {caption && <span className="labo-strip-caption">{caption(poster)}</span>}
      </li>
    ))}
  </ul>
)

const Figure = ({ sheet, index, reel, art }: { sheet: Of<'figure'>, index: number, reel: Reel, art: Art }) => {
  const at = sheet.highlight ? sheet.unit.indexOf(sheet.highlight) : -1
  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      {sheet.lines ? <Title lines={sheet.lines} /> : <h2 className="visually-hidden">{sheet.label}</h2>}
      {sheet.variant === 'twin' && sheet.highlight && sheet.sides
        ? <Exposure name={sheet.highlight} count={sheet.count} spoken={sheet.spoken} sides={sheet.sides} />
        : (
          <p className="labo-figure labo-figure-alone">
            <span aria-hidden="true">{number.format(sheet.count)}</span>
            <span className="visually-hidden">{sheet.spoken}</span>
          </p>
        )}
      <p className="labo-unit">
        {at < 0 ? sheet.unit : <>{sheet.unit.slice(0, at)}<em>{sheet.highlight}</em>{sheet.unit.slice(at + sheet.highlight!.length)}</>}
      </p>
      <p className="labo-body">{figures(sheet.details)}</p>
      {sheet.posters.length === 1 && (
        <div className="labo-single">
          <Frame poster={sheet.posters[0]} art={art} code={`${index * 4}A`} />
          <p className="labo-strip-title">{sheet.posters[0].title}</p>
        </div>
      )}
      {sheet.posters.length > 1 && <Strip posters={sheet.posters} art={art} start={index * 4} />}
    </Sheet>
  )
}

// Two reels printed on one frame: where they overlap, the titles both viewers saw
const Exposure = ({ name, count, spoken, sides }: { name: string, count: number, spoken: string, sides: { you: number, them: number | null } }) => (
  <div className="labo-exposure">
    <p className="labo-exposure-reel labo-exposure-you" aria-hidden="true"><b>Toi</b><span>{number.format(sides.you)}</span></p>
    <p className="labo-exposure-reel labo-exposure-them" aria-hidden="true"><b>{name}</b>{sides.them !== null && <span>{number.format(sides.them)}</span>}</p>
    <p className="labo-exposure-shared"><span aria-hidden="true">{number.format(count)}</span><span className="visually-hidden">{spoken}</span></p>
  </div>
)

const Duo = ({ sheet, index, reel, art }: { sheet: Of<'duo'>, index: number, reel: Reel, art: Art }) => (
  <Sheet sheet={sheet} index={index} reel={reel}>
    <Title lines={sheet.lines} />
    <p className="labo-lede">{figures(sheet.lede)}</p>
    <Strip posters={sheet.posters} art={art} caption={(poster) => figures(poster.caption)} start={index * 4} />
  </Sheet>
)

// Frames boxed in grease pencil, what each one stands for written over it
const Posters = ({ sheet, index, reel, art }: { sheet: Of<'posters'>, index: number, reel: Reel, art: Art }) => {
  const [ref, draw] = useDraw<HTMLOListElement>()
  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <Title lines={sheet.lines} />
      <ol ref={ref} className="labo-marked" data-count={sheet.items.length} data-draw={draw}>
        {sheet.items.map(({ what, poster, detail, when }, item) => {
          // A film stopped partway is cut on its frame where it stopped
          const stopped = sheet.variant === 'dropped' ? /^(\d+)\s?%/.exec(detail) : null
          return (
            <li key={poster.key}>
              <h3 className="labo-grease labo-marked-what" style={{ transform: `rotate(${(rng(hash(poster.key))() - 0.7) * 10}deg)` }}>{what}</h3>
              <div className="labo-marked-frame">
                <Frame poster={poster} art={art} code={`${index * 4 + item}A`} />
                <Scrawl gesture={stopped ? 'cut' : gestureOf(index, item)} seed={hash(poster.key)} at={stopped ? Number(stopped[1]) : undefined} />
              </div>
              <p className="labo-marked-title">{poster.title}</p>
              <p className="labo-grease labo-marked-detail" style={{ transform: `rotate(${(rng(hash(poster.key) + 1)() - 0.5) * 6}deg)` }}>{detail}</p>
              {when && <p className="labo-body labo-marked-when">{when}</p>}
            </li>
          )
        })}
      </ol>
    </Sheet>
  )
}

// The timing report, typed, the values in blue felt pen, a film clip pinned to it
const Genre = ({ sheet, index, reel, art }: { sheet: Of<'genre'>, index: number, reel: Reel, art: Art }) => {
  const { lead } = sheet
  return (
    <Sheet sheet={sheet} index={index} reel={reel}>
      <div className="labo-fiche">
        <FicheHead reel={reel} />
        <Title lines={sheet.lines} className="labo-fiche-title" />
        <dl className="labo-fiche-values">
          <div>
            <dt aria-hidden="true">Dominante</dt>
            <dd className="labo-felt labo-felt-large">{sheet.name}</dd>
          </div>
        </dl>
        <p className="labo-fiche-typed">{figures(sheet.count)}</p>
        <Strip posters={sheet.posters} art={art} start={index * 4} />
        {lead && (
          <p className="labo-fiche-typed labo-fiche-lead">
            <span className="labo-felt">{lead.name}</span> {figures(lead.role)}
          </p>
        )}
        {lead && !!lead.posters.length && <Strip posters={lead.posters} art={art} start={index * 4 + 4} titled={!(lead.posters.length === 1 && lead.name.includes(lead.posters[0].title))} />}
        <span className="labo-stamp labo-stamp-ok" aria-hidden="true">Bon à tirer</span>
      </div>
    </Sheet>
  )
}

// The last frame, then the end leader, burnt through where the projector stopped on it
const Finale = ({ sheet, index, reel, art }: { sheet: Of<'finale'>, index: number, reel: Reel, art: Art }) => (
  <Sheet sheet={sheet} index={index} reel={reel}>
    <Title lines={sheet.lines} />
    <Frame poster={sheet.poster} art={art} width={1280} code={`${index * 4}A`} className="labo-frame-last" />
    <h3 className="labo-name">{sheet.title}</h3>
    <div className="labo-finale-date">
      <p className="labo-intro">{sheet.date}</p>
      {!sheet.closed && <span className="labo-stamp labo-stamp-draft" aria-hidden="true">Provisoire</span>}
    </div>
    <div className="labo-burn">
      <p className="labo-burn-end">{sheet.end}</p>
      <Scorch />
    </div>
  </Sheet>
)

// Holes burnt through the film where the projector held on one frame
export const Scorch = () => (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id="labo-scorch">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" />
            <feDisplacementMap in="SourceGraphic" scale="46" />
          </filter>
          <radialGradient id="labo-hole">
            <stop offset="0.52" stopColor="#070403" />
            <stop offset="0.6" stopColor="#fff2c4" />
            <stop offset="0.68" stopColor="#ffb238" />
            <stop offset="0.78" stopColor="#ff4b1f" />
            <stop offset="0.9" stopColor="#4a1606" stopOpacity="0.85" />
            <stop offset="1" stopColor="#4a1606" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g filter="url(#labo-scorch)">
          <circle cx="330" cy="70" r="120" fill="url(#labo-hole)" />
          <circle cx="60" cy="262" r="62" fill="url(#labo-hole)" />
        </g>
      </svg>
)
