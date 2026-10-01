import { useEffect } from 'react'
import { animate, MotionValue, useMotionValue, useReducedMotion } from 'framer-motion'
import { MONTHS, THIN, number, plural, type Colophon, type SheetModel } from '../../sheets'
import type { Art, StoryProps } from '../types'
import { Opening, Rank, Stats, Strip, Tally, Twins, figures } from './Affiche'
import { AtOnce, Painted } from './Painted'
import { Brushed, Lettering, Sheet } from './Sheet'
import './affiche.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>
type Page = { art: Art, progress: MotionValue<number> }

// Each sheet as one poster pasted on the wall, its posters repainted as it arrives, the poster shared as an image
const Story = ({ story, sheets, colophon, art }: StoryProps) => {
  const reduced = useReducedMotion()
  const progress = useMotionValue(reduced ? 1 : 0)

  // The repaint runs in time, as on the opening: a story does not scroll
  useEffect(() => {
    if (!reduced) {
      const controls = animate(progress, 1, { duration: 2.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] })
      return () => controls.stop()
    }
  }, [reduced])

  const page = { art, progress }

  return (
    <AtOnce.Provider value>
      <div className={`affiche-story affiche-story-${story.kind}${'variant' in story ? ` affiche-story-${story.variant}` : ''}`}>
        {(() => {
          switch (story.kind) {
            case 'summary': return <Summary sheets={sheets} colophon={colophon} art={art} />
            case 'opening': return <Opening sheet={story} art={art} />
            case 'rank': return <Rank sheet={story} />
            case 'streak': return <Streak sheet={story} {...page} />
            case 'months': return <Months sheet={story} {...page} />
            case 'binge': return <Binge sheet={story} {...page} />
            case 'night': return <Night sheet={story} {...page} />
            case 'server': return <Server sheet={story} {...page} />
            case 'figure': return <Figure sheet={story} {...page} />
            case 'duo': return <Duo sheet={story} {...page} />
            case 'posters': return <Posters sheet={story} seed={story.variant === 'outliers' ? 20 : 19} {...page} />
            case 'genre': return <Genre sheet={story} {...page} />
            case 'finale': return <Finale sheet={story} {...page} />
          }
        })()}
      </div>
    </AtOnce.Provider>
  )
}

export default Story

// The opening again, the reader's place among the viewers stamped over the collage, the closing note at its foot
const Summary = ({ sheets, colophon, art }: { sheets: SheetModel[], colophon: Colophon, art: Art }) => {
  const opening = sheets.find((sheet): sheet is Of<'opening'> => sheet.kind === 'opening')!
  const rank = sheets.find((sheet): sheet is Of<'rank'> => sheet.kind === 'rank')

  return (
    <>
      <Opening sheet={opening} art={art} />
      {rank && <p className="stamp affiche-story-place"><b>{rank.rank}<sup>{rank.suffix}</sup></b> {rank.unit}</p>}
      <footer className="affiche-story-colophon">
        {colophon.short && <p className="colophon-short">{colophon.short}</p>}
        <p>{colophon.text}</p>
      </footer>
    </>
  )
}

const Streak = ({ sheet, art, progress }: { sheet: Of<'streak'> } & Page) => (
  <Sheet className="sheet-figures sheet-streak" label={sheet.label} style={{ '--digits': String(sheet.evenings).length } as React.CSSProperties}>
    <Painted className="figures-poster" src={art(sheet.poster)} alt={sheet.poster.title} progress={progress} />
    <p className="figure-intro">{sheet.intro}</p>
    <p className="figure">
      <span aria-hidden="true">{number.format(sheet.evenings)}</span>
      <span className="visually-hidden">{sheet.spoken}</span>
    </p>
    <Lettering className="figure-unit" text={sheet.unit} seed={2} />
    <Tally nights={sheet.nights} lead={sheet.lead ? sheet.poster.key : null} />
    <p className="figure-details">{figures(sheet.details)}</p>
  </Sheet>
)

// Each month a strip of its show, as tall as its episodes, painted one after the other
const Months = ({ sheet, art, progress }: { sheet: Of<'months'> } & Page) => {
  const { shows, elapsed, max, peak } = sheet

  return (
    <Sheet className="sheet-year" label={sheet.label}>
      <Brushed lines={sheet.lines} seed={7} />
      <p className="lede">{sheet.lede}</p>
      <ol className="affiche-story-strips" role="img" aria-label={sheet.alt}>
        {MONTHS.map((month, index) => {
          const show = index < elapsed ? shows[index] : null
          return (
            <li key={month} style={{ '--share': show ? Math.max(0.08, show.episodes / max) : 0 } as React.CSSProperties}>
              {show && <Painted src={art(show, 'thumb', 320)} alt="" progress={progress} />}
            </li>
          )
        })}
      </ol>
      <ol className="year-months" aria-hidden="true">
        {MONTHS.map((name, index) => <li key={name} className={index >= elapsed ? 'year-month-future' : undefined}>{name[0]}</li>)}
      </ol>
      {peak && (
        <p className="year-peak">
          En <span className="year-peak-month">{peak.month}</span>, {figures(peak.text)}
        </p>
      )}
    </Sheet>
  )
}

const Binge = ({ sheet, art, progress }: { sheet: Of<'binge'> } & Page) => {
  const { poster, pace } = sheet

  return (
    <Sheet className="sheet-shows" label={sheet.label}>
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

// The night's last lines of the programme, the earlier ones counted
const LINES = 3

const Night = ({ sheet, art, progress }: { sheet: Of<'night'> } & Page) => {
  const { poster } = sheet
  const shown = sheet.schedule.slice(-LINES)
  const before = sheet.schedule.length - shown.length

  return (
    <Sheet className="sheet-night" label={sheet.label}>
      <Painted className="night-poster" src={art(poster, poster.thumb ? 'thumb' : 'art', 1280)} alt={poster.title} progress={progress} />
      <div className="night-text">
        <Brushed lines={sheet.lines} seed={8} />
        <p className="night-date">{sheet.date}</p>
        <p className="night-figures">Tu éteins à <strong>{sheet.end}</strong>{figures(sheet.after)}.</p>
        {sheet.listing
          ? (
            <>
              <p className="affiche-story-listing">{sheet.listing}{before > 0 && `${THIN}: les ${shown.length} dernières lignes, ${plural(before, 'autre', 'autres')} avant`}</p>
              <ol className="night-schedule">
                {shown.map((line, index) => (
                  <li key={`${line.start}-${index}`} className={index === shown.length - 1 ? 'night-schedule-last' : undefined}>
                    <span className="night-schedule-time"><b>{line.start}</b><span>{line.end}</span></span>
                    <Painted className="night-schedule-poster" src={art(line.poster, 'thumb', 320)} alt={line.poster.title} progress={progress} />
                    <span className="night-schedule-title">{line.poster.title}{line.what && <span>{line.what}</span>}</span>
                  </li>
                ))}
              </ol>
            </>
          )
          : <p className="night-figures">{sheet.last}</p>}
      </div>
    </Sheet>
  )
}

const Server = ({ sheet, art, progress }: { sheet: Of<'server'> } & Page) => {
  const { poster } = sheet

  return (
    <Sheet className={`sheet-server${poster.art ? ' sheet-server-still' : ''}`} label={sheet.label}>
      {poster.art && <Painted className="server-still" src={art(poster, 'art', 1280)} alt="" progress={progress} />}
      <Brushed lines={sheet.lines} seed={16} />
      <Painted className="server-poster" src={art(poster)} alt={poster.title} progress={progress} />
      <Lettering as="h3" className="server-title" text={sheet.title} seed={17} />
      <p className="lede">{figures(sheet.bare)}</p>
    </Sheet>
  )
}

const Figure = ({ sheet, art, progress }: { sheet: Of<'figure'> } & Page) => {
  const { sides } = sheet

  return (
    <Sheet className="sheet-figures sheet-strip" label={sheet.label} style={{ '--digits': String(sheet.count).length } as React.CSSProperties}>
      {sheet.lines && <Brushed lines={sheet.lines} seed={23} />}
      {sheet.variant === 'twin' && sheet.highlight && sides
        ? (
          // The other viewer's name sized to its daub
          <div className="affiche-story-twins" style={{ '--letters': sheet.highlight.length } as React.CSSProperties}>
            <Twins name={sheet.highlight} count={sheet.count} spoken={sheet.spoken} sides={sides} />
          </div>
        )
        : (
          <p className="figure">
            <span aria-hidden="true">{number.format(sheet.count)}</span>
            <span className="visually-hidden">{sheet.spoken}</span>
          </p>
        )}
      <Lettering className="figure-unit" text={sheet.unit} highlight={sheet.highlight} seed={sheet.highlight ? 24 : 3} />
      <p className="figure-details">{figures(sheet.details)}</p>
      {!!sheet.posters.length && <Strip posters={sheet.posters.slice(0, 4)} layout="row" progress={progress} art={art} />}
    </Sheet>
  )
}

const Duo = ({ sheet, art, progress }: { sheet: Of<'duo'> } & Page) => (
  <Sheet className="sheet-duo" label={sheet.label}>
    <Brushed lines={sheet.lines} seed={22} />
    <p className="lede">{figures(sheet.lede)}</p>
    <Strip posters={sheet.posters.slice(0, 4)} layout="grid" caption={(poster) => figures(poster.caption)} progress={progress} art={art} />
  </Sheet>
)

const Posters = ({ sheet, seed, art, progress }: { sheet: Of<'posters'>, seed: number } & Page) => (
  <Sheet className="sheet-posters" label={sheet.label}>
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

const Genre = ({ sheet, art, progress }: { sheet: Of<'genre'> } & Page) => {
  const { lead } = sheet

  return (
    <Sheet className="sheet-genre" label={sheet.label} style={{ '--letters': Math.max(...sheet.name.split(/\s+/).map((word) => word.length)) } as React.CSSProperties}>
      <Brushed lines={sheet.lines} seed={18} />
      <Lettering as="p" className="genre-name" text={sheet.name} highlight={sheet.name} seed={21} />
      <p className="genre-count">{figures(sheet.count)}</p>
      <Strip posters={sheet.posters.slice(0, 4)} layout="row" progress={progress} art={art} />
      {lead && lead.posters.length === 1
        ? (
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
            {!!lead.posters.length && <Strip posters={lead.posters.slice(0, 4)} layout="row" progress={progress} art={art} />}
          </>
        )}
    </Sheet>
  )
}

const Finale = ({ sheet, art, progress }: { sheet: Of<'finale'> } & Page) => (
  <Sheet className="sheet-finale" label={sheet.label}>
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
