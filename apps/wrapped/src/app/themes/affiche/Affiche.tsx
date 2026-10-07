import { ReactNode, useCallback, useEffect, useId, useRef } from 'react'
import { animate, MotionValue, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { WrappedPoster } from '@sensorr/sensorr'
import { QUOTED, months, number, quantity, t, type SheetModel, type Stat } from '../../sheets'
import { Sentence } from '../../Sentence'
import type { Art, ThemeProps } from '../types'
import { Painted, useRevealProgress } from './Painted'
import { Brushed, Lettering, Sheet, lean } from './Sheet'
import './affiche.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>

// A quantity is lettered with its unit: not a date, nor the digits of a name or of a title in quotes
export const figures = (text: string) => text.split(QUOTED).flatMap((part, index) => {
  if (index % 2) return [part]
  const bits: ReactNode[] = []
  let from = 0
  for (const match of part.matchAll(quantity())) {
    bits.push(part.slice(from, match.index), (
      <b key={`${index}-${match.index}`} className="daub" style={{ '--lean': `${(lean(match.index || 0, index + 3) - 0.5) * 8}deg` } as React.CSSProperties}>
        <span className="daub-n">{match[1]}</span>{match[2] && <> <span className="daub-unit">{match[2]}</span></>}
      </b>
    ))
    from = (match.index || 0) + match[0].length
  }
  return [...bits, part.slice(from)]
})

// Figures stacked like the lettering of a poster, each leaning its own way
export const Stats = ({ stats, seed, className = '' }: { stats: Stat[], seed: number, className?: string }) => (
  <ul className={`stats ${className}`}>
    {stats.map((stat, index) => (
      <li key={stat.unit} style={{ '--lean': `${(lean(index, seed) - 0.5) * 9}deg` } as React.CSSProperties}>
        <b>{stat.value}</b> <span>{stat.unit}</span>
      </li>
    ))}
  </ul>
)

// Each figure, heading and poster is seeded so it leans the same way on every visit
const Affiche = ({ sheets, colophon, art }: ThemeProps) => (
  <main className="wall">
    {sheets.map((sheet, index) => {
      switch (sheet.kind) {
        case 'opening': return <Opening key={index} sheet={sheet} art={art} />
        case 'rank': return <Rank key={index} sheet={sheet} />
        case 'streak': return <Streak key={index} sheet={sheet} art={art} />
        case 'months': return <Months key={index} sheet={sheet} art={art} />
        case 'binge': return <Binge key={index} sheet={sheet} art={art} />
        case 'night': return <Night key={index} sheet={sheet} art={art} />
        case 'server': return <Server key={index} sheet={sheet} art={art} />
        case 'figure': return <Figure key={index} sheet={sheet} art={art} />
        case 'duo': return <Duo key={index} sheet={sheet} art={art} />
        case 'posters': return <Posters key={index} sheet={sheet} seed={sheet.variant === 'outliers' ? 20 : 19} art={art} />
        case 'genre': return <Genre key={index} sheet={sheet} art={art} />
        case 'finale': return <Finale key={index} sheet={sheet} art={art} />
      }
    })}
    <footer className="colophon">
      {colophon.short && <p className="colophon-short">{colophon.short}</p>}
      <p>{colophon.text}</p>
    </footer>
  </main>
)

export default Affiche

export const Opening = ({ sheet, art }: { sheet: Of<'opening'>, art: Art }) => {
  const reduced = useReducedMotion()
  const progress = useMotionValue(reduced ? 1 : 0)

  useEffect(() => {
    if (!reduced) {
      const controls = animate(progress, 1, { duration: 2.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] })
      return () => controls.stop()
    }
  }, [reduced])

  return (
    <Sheet className="sheet-opening" label={sheet.label}>
      <div className="collage" data-count={sheet.posters.length}>
        {sheet.posters.map((poster, index) => (
          <Painted key={poster.key} className={`collage-${index}`} src={art(poster)} alt={poster.title} progress={progress} />
        ))}
      </div>
      <Lettering as="h1" className="opening-title" text={sheet.title} highlight={sheet.name} />
      {sheet.lede && <p className="lede">{sheet.lede}</p>}
      <ul className="opening-figures">
        {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
      </ul>
      <svg className="scroll-hint" viewBox="0 0 40 90" aria-hidden="true">
        <path d="M20 4 C 16 30, 25 52, 19 80 M8 64 C 13 72, 17 78, 19 84 C 23 76, 27 70, 33 62" />
      </svg>
    </Sheet>
  )
}

const Streak = ({ sheet, art }: { sheet: Of<'streak'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)
  // The other titles of the run, each once, with the evenings it filled
  const others = sheet.nights.reduce<(WrappedPoster & { evenings: number })[]>((all, { poster }) => {
    if (!poster || (sheet.lead && poster.key === sheet.poster.key)) return all
    const same = all.find((other) => other.key === poster.key)
    return same ? all.map((other) => other === same ? { ...other, evenings: other.evenings + 1 } : other) : [...all, { ...poster, evenings: 1 }]
  }, []).slice(0, 4)

  return (
    <Sheet ref={ref} className="sheet-figures sheet-streak" label={sheet.label} style={{ '--digits': String(sheet.evenings).length } as React.CSSProperties}>
      <Painted className="figures-poster" src={art(sheet.poster)} alt={sheet.poster.title} progress={progress} />
      <p className="figure-intro">{sheet.intro}</p>
      <p className="figure">
        <span aria-hidden="true">{number.format(sheet.evenings)}</span>
        <span className="visually-hidden">{sheet.spoken}</span>
      </p>
      <Lettering className="figure-unit" text={sheet.unit} seed={2} />
      <Tally nights={sheet.nights} lead={sheet.lead ? sheet.poster.key : null} />
      <p className="figure-details">{figures(sheet.details)}</p>
      {!!others.length && <Strip posters={others} layout="row" caption={(poster) => figures(t('wrapped.count.evenings', { count: poster.evenings }))} progress={progress} art={art} />}
    </Sheet>
  )
}

// One brush stroke per evening, struck through by five, crimson on the evenings of the title of the run
export const Tally = ({ nights, lead }: { nights: Of<'streak'>['nights'], lead: string | null }) => (
  <ol className="tally" aria-hidden="true">
    {Array.from({ length: Math.ceil(nights.length / 5) }, (_, group) => (
      <li key={group} className={`tally-group${(group + 1) * 5 <= nights.length ? ' tally-full' : ''}`}>
        {nights.slice(group * 5, group * 5 + 5).map(({ day, poster }, index) => (
          <i key={day} className={lead && poster?.key === lead ? 'tally-lead' : undefined} style={{ '--lean': `${(lean(group * 5 + index, 9) - 0.5) * 12}deg` } as React.CSSProperties} />
        ))}
      </li>
    ))}
  </ol>
)

// Each month is a strip of the show watched the most, as tall as its episodes
const Months = ({ sheet, art }: { sheet: Of<'months'>, art: Art }) => {
  const { shows, elapsed, max, peak } = sheet
  const reduced = useReducedMotion()
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const repaint = useTransform(scrollYProgress, [0, 0.7], [0, 1], { clamp: true })

  const compose = useCallback(async (boxWidth: number, boxHeight: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(boxWidth)
    canvas.height = Math.round(boxHeight)
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const width = canvas.width / 12

    await Promise.all(shows.slice(0, elapsed).map((show, index) => new Promise<void>((resolve) => {
      const src = show && art(show, 'thumb', 320)

      if (!src) {
        return resolve()
      }

      const image = new Image()
      image.onload = () => {
        const height = Math.max(24, (show.episodes / max) * canvas.height)
        const gap = width * 0.08
        const [x, y, w, h] = [index * width + gap, canvas.height - height, width - gap * 2, height]
        const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight)
        const [sw, sh] = [w / scale, h / scale]
        context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, w, h)
        resolve()
      }
      // A poster that fails leaves its month empty rather than holding the others back
      image.onerror = () => resolve()
      image.src = src
    })))

    return canvas
  }, [shows, elapsed, max])

  return (
    <div ref={track} className="track" style={{ '--steps': reduced ? 0 : 1 } as React.CSSProperties}>
      <Sheet className="sheet-year" label={sheet.label}>
        <Brushed lines={sheet.lines} seed={7} />
        <p className="lede">{sheet.lede}</p>
        <Painted className="year-strips" compose={compose} alt={sheet.alt} progress={repaint} />
        <ol className="year-months" aria-hidden="true">
          {months().map((name, index) => <li key={name} className={index >= elapsed ? 'year-month-future' : undefined}>{name[0]}</li>)}
        </ol>
        {peak && (
          <p className="year-peak">
            <Sentence i18nKey="wrapped.sheets.months.peak.then" values={{ month: peak.month }} tag={<span className="year-peak-month" />} text={peak.text} figures={figures} />
          </p>
        )}
      </Sheet>
    </div>
  )
}

// The still of the binge with its poster pasted on, its figures under it
const Binge = ({ sheet, art }: { sheet: Of<'binge'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)
  const { poster, pace } = sheet

  return (
    <Sheet ref={ref} className="sheet-shows" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={4} />
      <div className="show-lead">
        <Painted className="show-lead-still" src={art(poster, poster.art ? 'art' : 'thumb', 1280)} alt={poster.title} progress={progress} />
        {poster.art && poster.thumb && <Painted className="show-lead-poster" src={art(poster, 'thumb', 320)} alt={poster.title} progress={progress} />}
      </div>
      <div className="show-lead-text">
        <Lettering as="h3" className="show-lead-title" text={sheet.title} seed={5} />
        {sheet.date && <p className="meta">{sheet.date}</p>}
      </div>
      <Stats stats={sheet.stats} seed={6} />
      {pace && !!sheet.paced_stats.length && (
        <div className="show-pace">
          <Painted className="show-pace-poster" src={art(pace, 'thumb', 320)} alt={pace.title} progress={progress} />
          <div>
            <Lettering as="h3" className="show-pace-title" text={pace.title} seed={10} />
            <Stats stats={sheet.paced_stats} seed={12} className="stats-small" />
          </div>
        </div>
      )}
    </Sheet>
  )
}

const Night = ({ sheet, art }: { sheet: Of<'night'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)
  const { poster } = sheet

  return (
    <Sheet ref={ref} className="sheet-night" label={sheet.label}>
      <Painted className="night-poster" src={art(poster, poster.thumb ? 'thumb' : 'art', 1280)} alt={poster.title} progress={progress} />
      <div className="night-text">
        <Brushed lines={sheet.lines} seed={8} />
        <p className="night-date">{sheet.date}</p>
        <p className="night-figures"><Sentence i18nKey="wrapped.sheets.night.off" values={{ end: sheet.end }} tag={<strong />} text={sheet.after} figures={figures} /></p>
        {sheet.listing
          ? (
            <ol className="night-schedule" aria-label={sheet.listing}>
              {sheet.schedule.map((line, index) => (
                <li key={`${line.start}-${index}`} className={index === sheet.schedule.length - 1 ? 'night-schedule-last' : undefined}>
                  <span className="night-schedule-time"><b>{line.start}</b><span>{line.end}</span></span>
                  <Painted className="night-schedule-poster" src={art(line.poster, 'thumb', 320)} alt={line.poster.title} progress={progress} />
                  <span className="night-schedule-title">{line.poster.title}{line.what && <span>{line.what}</span>}</span>
                </li>
              ))}
            </ol>
          )
          : <p className="night-figures">{sheet.last}</p>}
      </div>
    </Sheet>
  )
}

// The still painted as the ground of the poster, the poster pasted over it
const Server = ({ sheet, art }: { sheet: Of<'server'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)
  const { poster } = sheet

  return (
    <Sheet ref={ref} className={`sheet-server${poster.art ? ' sheet-server-still' : ''}`} label={sheet.label}>
      {poster.art && <Painted className="server-still" src={art(poster, 'art', 1280)} alt="" progress={progress} />}
      <Brushed lines={sheet.lines} seed={16} />
      <Painted className="server-poster" src={art(poster)} alt={poster.title} progress={progress} />
      <Lettering as="h3" className="server-title" text={sheet.title} seed={17} />
      <p className="lede">{figures(sheet.bare)}</p>
    </Sheet>
  )
}

// A few posters with their titles, the proof behind a count
export const Strip = <P extends WrappedPoster>({ posters, layout, caption, progress, art }: { posters: P[], layout: 'row' | 'grid', caption?: (poster: P) => ReactNode, progress: MotionValue<number>, art: Art }) => (
  <ul className="strip" data-layout={layout}>
    {posters.map((poster) => (
      <li key={poster.key} className="strip-entry">
        <Painted className="strip-poster" src={art(poster, 'thumb', 320)} alt={poster.title} progress={progress} />
        <span className="strip-title">{poster.title}</span>
        {caption && <span className="strip-caption">{caption(poster)}</span>}
      </li>
    ))}
  </ul>
)

const Figure = ({ sheet, art }: { sheet: Of<'figure'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)
  const { sides } = sheet

  return (
    <Sheet ref={ref} className="sheet-figures sheet-strip" label={sheet.label} style={{ '--digits': String(sheet.count).length } as React.CSSProperties}>
      {sheet.lines && <Brushed lines={sheet.lines} seed={23} />}
      {sheet.variant === 'twin' && sheet.highlight && sides
        ? <Twins name={sheet.highlight} count={sheet.count} spoken={sheet.spoken} sides={sides} />
        : (
          <p className="figure">
            <span aria-hidden="true">{number.format(sheet.count)}</span>
            <span className="visually-hidden">{sheet.spoken}</span>
          </p>
        )}
      <Lettering className="figure-unit" text={sheet.unit} highlight={sheet.highlight} seed={sheet.highlight ? 24 : 3} />
      <p className="figure-details">{figures(sheet.details)}</p>
      {!!sheet.posters.length && <Strip posters={sheet.posters} layout="row" progress={progress} art={art} />}
    </Sheet>
  )
}

// Two viewers as two daubs of paint, the titles they share where the paint overlaps
export const Twins = ({ name, count, spoken, sides }: { name: string, count: number, spoken: string, sides: { you: number, them: number | null } }) => {
  const id = useId().replace(/:/g, '')

  return (
    <div className="twins">
      <svg viewBox="0 0 400 240" aria-hidden="true">
        <filter id={`${id}-dry`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed={3} />
          <feDisplacementMap in="SourceGraphic" scale="10" />
        </filter>
        <circle className="twins-you" cx="140" cy="120" r="108" filter={`url(#${id}-dry)`} />
        <circle className="twins-them" cx="260" cy="120" r="108" filter={`url(#${id}-dry)`} />
      </svg>
      <p className="twins-side twins-side-you" aria-hidden="true"><span>{t('wrapped.common.you')}</span><b>{number.format(sides.you)}</b></p>
      <p className="twins-side twins-side-them" aria-hidden="true"><span>{name}</span>{sides.them !== null && <b>{number.format(sides.them)}</b>}</p>
      <p className="twins-shared"><span aria-hidden="true">{number.format(count)}</span><span className="visually-hidden">{spoken}</span></p>
    </div>
  )
}

const Duo = ({ sheet, art }: { sheet: Of<'duo'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)

  return (
    <Sheet ref={ref} className="sheet-duo" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={22} />
      <p className="lede">{figures(sheet.lede)}</p>
      <Strip posters={sheet.posters} layout="grid" caption={(poster) => figures(poster.caption)} progress={progress} art={art} />
    </Sheet>
  )
}

// One poster per figure
const Posters = ({ sheet, seed, art }: { sheet: Of<'posters'>, seed: number, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)

  return (
    <Sheet ref={ref} className="sheet-posters" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={seed} />
      <ol className="posters" data-count={sheet.items.length}>
        {sheet.items.map(({ what, poster, detail, when }) => (
          <li key={poster.key} className="posters-entry">
            <Painted className="posters-poster" src={art(poster, 'thumb', 640)} alt={poster.title} progress={progress} />
            <h3 className="posters-label">{what}</h3>
            <p className="posters-title">{poster.title}</p>
            <p className="posters-detail">{detail.split(', ').map((part, index) => <span key={index}>{figures(part)}</span>)}</p>
            {when && <p className="posters-when">{when}</p>}
          </li>
        ))}
      </ol>
    </Sheet>
  )
}

const Genre = ({ sheet, art }: { sheet: Of<'genre'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)
  const { lead } = sheet

  return (
    <Sheet ref={ref} className="sheet-genre" label={sheet.label} style={{ '--letters': Math.max(...sheet.name.split(/\s+/).map((word) => word.length)) } as React.CSSProperties}>
      <Brushed lines={sheet.lines} seed={18} />
      <Lettering as="p" className="genre-name" text={sheet.name} highlight={sheet.name} seed={21} />
      <p className="genre-count">{figures(sheet.count)}</p>
      <Strip posters={sheet.posters} layout="row" progress={progress} art={art} />
      {lead && lead.posters.length === 1
        ? (
          // A show in the lead is its own poster: pinned beside its name, not titled again
          <div className="genre-lead genre-lead-single">
            <p><span className="genre-lead-name">{lead.name}</span> {figures(lead.role)}</p>
            <Painted className="genre-lead-poster" src={art(lead.posters[0], 'thumb', 640)} alt={lead.posters[0].title} progress={progress} />
          </div>
        )
        : lead && (
          <>
            <p className="genre-lead">
              <span className="genre-lead-name">{lead.name}</span> {figures(lead.role)}
            </p>
            {!!lead.posters.length && <Strip posters={lead.posters} layout="row" progress={progress} art={art} />}
          </>
        )}
    </Sheet>
  )
}

export const Rank = ({ sheet }: { sheet: Of<'rank'> }) => {
  // The hours known on the server, each lettered as large as its share of the first viewer's
  const hours = [
    sheet.max !== null && sheet.rank > 1 && { label: t('wrapped.affiche.first'), hours: sheet.max },
    { label: t('wrapped.common.you'), hours: sheet.hours, you: true },
    { label: t('wrapped.common.median'), hours: sheet.median },
  ].filter(Boolean) as { label: string, hours: number, you?: boolean }[]
  const top = Math.max(...hours.map((entry) => entry.hours), 1)

  return (
    <Sheet className="sheet-rank" label={sheet.label}>
      <p className="rank">
        <span aria-hidden="true">{sheet.rank}<sup>{sheet.suffix}</sup></span>
        <span className="visually-hidden">{sheet.rank}{sheet.suffix}</span>
      </p>
      <Lettering className="rank-unit" text={sheet.unit} seed={11} />
      <ol className="crowd" aria-hidden="true">
        {Array.from({ length: sheet.users }, (_, index) => <li key={index} className={index === sheet.rank - 1 ? 'crowd-you' : undefined} />)}
      </ol>
      <p className="rank-detail">{figures(sheet.detail)}</p>
      <p className="visually-hidden">{sheet.compare}</p>
      <ol className="rank-hours" aria-hidden="true">
        {hours.sort((a, b) => b.hours - a.hours).map((entry, index) => (
          <li key={entry.label} className={entry.you ? 'rank-hours-you' : undefined} style={{ '--share': Math.sqrt(entry.hours / top), '--lean': `${(lean(index, 14) - 0.5) * 8}deg` } as React.CSSProperties}>
            <b>{number.format(entry.hours)}<small>{t('wrapped.affiche.h')}</small></b>
            <span>{entry.label}</span>
          </li>
        ))}
      </ol>
    </Sheet>
  )
}

const Finale = ({ sheet, art }: { sheet: Of<'finale'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)

  return (
    <Sheet ref={ref} className="sheet-finale" label={sheet.label}>
      <Painted className="finale-poster" src={art(sheet.poster, 'thumb', 1280)} alt={sheet.poster.title} progress={progress} />
      <div className="finale-text">
        <Brushed lines={sheet.lines} seed={12} />
        <Lettering as="p" className="finale-title" text={sheet.title} seed={13} />
        <p className="finale-next">{sheet.date}</p>
        {!sheet.closed && <p className="stamp stamp-finale">{t('wrapped.common.draft')}</p>}
        <p className="finale-end">{sheet.end}</p>
      </div>
    </Sheet>
  )
}
