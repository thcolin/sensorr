import { useCallback, useEffect, useRef } from 'react'
import { animate, MotionValue, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { WrappedPoster } from '@sensorr/sensorr'
import { MONTHS, number, type SheetModel } from '../../sheets'
import type { Art, ThemeProps } from '../types'
import { Painted, useRevealProgress } from './Painted'
import { Brushed, Lettering, Sheet } from './Sheet'
import './affiche.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>

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
        case 'posters': return <Posters key={index} sheet={sheet} seed={sheet.label === 'Hors normes' ? 20 : 19} art={art} />
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

const Opening = ({ sheet, art }: { sheet: Of<'opening'>, art: Art }) => {
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
        {sheet.figures.map((figure) => <li key={figure}>{figure}</li>)}
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

  return (
    <Sheet ref={ref} className="sheet-figures" label={sheet.label} style={{ '--digits': String(sheet.evenings).length } as React.CSSProperties}>
      <Painted className="figures-poster" src={art(sheet.poster)} alt={sheet.poster.title} progress={progress} />
      <p className="figure-intro">{sheet.intro}</p>
      <p className="figure">
        <span aria-hidden="true">{number.format(sheet.evenings)}</span>
        <span className="visually-hidden">{sheet.spoken}</span>
      </p>
      <Lettering className="figure-unit" text={sheet.unit} seed={2} />
      <p className="figure-details">{sheet.details}</p>
    </Sheet>
  )
}

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
          {MONTHS.map((name, index) => <li key={name} className={index >= elapsed ? 'year-month-future' : undefined}>{name[0]}</li>)}
        </ol>
        {peak && (
          <p className="year-peak">
            En <span className="year-peak-month">{peak.month}</span>, {peak.text}
          </p>
        )}
      </Sheet>
    </div>
  )
}

const Binge = ({ sheet, art }: { sheet: Of<'binge'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)
  const { poster } = sheet

  return (
    <Sheet ref={ref} className="sheet-shows" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={4} />
      <Painted className="show-lead" src={art(poster, poster.art ? 'art' : 'thumb', 1280)} alt={poster.title} progress={progress} />
      <div className="show-lead-text">
        <Lettering as="h3" className="show-lead-title" text={sheet.title} seed={5} />
        {sheet.meta.map((meta) => <p key={meta} className="meta">{meta}</p>)}
      </div>
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
        <p className="night-figures">Tu éteins à <strong>{sheet.end}</strong>{sheet.after}.</p>
        <p className="night-figures">{sheet.last}</p>
      </div>
    </Sheet>
  )
}

const Server = ({ sheet, art }: { sheet: Of<'server'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)

  return (
    <Sheet ref={ref} className="sheet-server" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={16} />
      <Painted className="server-poster" src={art(sheet.poster)} alt={sheet.poster.title} progress={progress} />
      <Lettering as="h3" className="server-title" text={sheet.title} seed={17} />
      <p className="lede">{sheet.lede}</p>
    </Sheet>
  )
}

// A few posters with their titles, the proof behind a count
const Strip = <P extends WrappedPoster>({ posters, layout, caption, progress, art }: { posters: P[], layout: 'row' | 'grid', caption?: (poster: P) => string, progress: MotionValue<number>, art: Art }) => (
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

  return (
    <Sheet ref={ref} className="sheet-figures sheet-strip" label={sheet.label} style={{ '--digits': String(sheet.count).length } as React.CSSProperties}>
      {sheet.lines && <Brushed lines={sheet.lines} seed={23} />}
      <p className="figure">
        <span aria-hidden="true">{number.format(sheet.count)}</span>
        <span className="visually-hidden">{sheet.spoken}</span>
      </p>
      <Lettering className="figure-unit" text={sheet.unit} highlight={sheet.highlight} seed={sheet.highlight ? 24 : 3} />
      <p className="figure-details">{sheet.details}</p>
      {!!sheet.posters.length && <Strip posters={sheet.posters} layout="row" progress={progress} art={art} />}
    </Sheet>
  )
}

const Duo = ({ sheet, art }: { sheet: Of<'duo'>, art: Art }) => {
  const ref = useRef<HTMLElement>(null)
  const progress = useRevealProgress(ref)

  return (
    <Sheet ref={ref} className="sheet-duo" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={22} />
      <p className="lede">{sheet.lede}</p>
      <Strip posters={sheet.posters} layout="grid" caption={(poster) => poster.caption} progress={progress} art={art} />
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
        {sheet.items.map(({ what, poster, detail }) => (
          <li key={poster.key} className="posters-entry">
            <Painted className="posters-poster" src={art(poster, 'thumb', 640)} alt={poster.title} progress={progress} />
            <h3 className="posters-label">{what}</h3>
            <p className="posters-title">{poster.title}</p>
            <p className="meta">{detail}</p>
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
    <Sheet ref={ref} className="sheet-genre" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={18} />
      <Lettering as="p" className="genre-name" text={sheet.name} highlight={sheet.name} seed={21} />
      <p className="genre-count">{sheet.count}</p>
      <Strip posters={sheet.posters} layout="row" progress={progress} art={art} />
      {lead && (
        <p className="genre-lead">
          <span className="genre-lead-name">{lead.name}</span> {lead.role}
        </p>
      )}
      {lead && !!lead.posters.length && <Strip posters={lead.posters} layout="row" progress={progress} art={art} />}
    </Sheet>
  )
}

const Rank = ({ sheet }: { sheet: Of<'rank'> }) => (
  <Sheet className="sheet-rank" label={sheet.label}>
    <p className="rank">
      <span aria-hidden="true">{sheet.rank}<sup>{sheet.suffix}</sup></span>
      <span className="visually-hidden">{sheet.rank}{sheet.suffix}</span>
    </p>
    <Lettering className="rank-unit" text={sheet.unit} seed={11} />
    <ol className="crowd" aria-hidden="true">
      {Array.from({ length: sheet.users }, (_, index) => <li key={index} className={index === sheet.rank - 1 ? 'crowd-you' : undefined} />)}
    </ol>
    <p className="rank-detail">{sheet.detail}</p>
  </Sheet>
)

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
        {!sheet.closed && <p className="stamp stamp-finale">Provisoire</p>}
        <p className="finale-end">{sheet.end}</p>
      </div>
    </Sheet>
  )
}
