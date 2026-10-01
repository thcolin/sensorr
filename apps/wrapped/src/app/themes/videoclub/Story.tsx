import { ReactNode } from 'react'
import { MONTHS, THIN, number, plural, type Colophon, type SheetModel } from '../../sheets'
import type { Art, StoryProps } from '../types'
import { Binge, Box, Duo, Finale, Genre, Neon, Nobody, Opening, Posters, Rank, Server, Spines, Twin, figures } from './Videoclub'
import './videoclub.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>

// Each sheet on one screen of the shop, the screen shared as an image
const Story = ({ story, share, sheets, colophon, art }: StoryProps) => {
  switch (story.kind) {
    case 'summary': return <Summary sheets={sheets} colophon={colophon} art={art} />
    case 'opening': return <Shop kind="opening" letters={story.name.length}><Opening sheet={story} art={art} first={story.first ?? undefined} /></Shop>
    case 'rank': return <Shop kind="rank"><Rank sheet={story} name={share.name} server={share.server} /></Shop>
    case 'streak': return <Shop kind="streak"><Streak sheet={story} art={art} /></Shop>
    case 'months': return <Shop kind="months"><Months sheet={story} art={art} /></Shop>
    case 'binge': return <Shop kind="binge"><Binge sheet={story} art={art} episodes={story.episodes || 0} /></Shop>
    case 'night': return <Shop kind="night"><Night sheet={story} art={art} /></Shop>
    case 'server': return <Shop kind="server"><Server sheet={story} art={art} /></Shop>
    case 'figure': return story.variant === 'twin'
      ? <Shop kind="twin"><Twin sheet={story} art={art} /></Shop>
      : <Shop kind="nobody"><Nobody sheet={story} art={art} /></Shop>
    case 'duo': return <Shop kind="duo"><Duo sheet={story} art={art} /></Shop>
    case 'posters': return <Shop kind="posters"><Posters sheet={story} art={art} /></Shop>
    case 'genre': return <Shop kind="genre"><Genre sheet={story} art={art} /></Shop>
    case 'finale': return <Shop kind="finale"><Finale sheet={story} art={art} /></Shop>
  }
}

export default Story

// The lights of the shop come on over the sheet, then its pieces are put out one after the other; the name's length sizes its tube
const Shop = ({ kind, letters, children }: { kind: string, letters?: number, children: ReactNode }) => (
  <div className={`videoclub-story videoclub-story-${kind}`} style={letters ? { '--letters': letters } as React.CSSProperties : undefined}>{children}</div>
)

// The shop front again, the membership card left on the counter and the closing note under it
const Summary = ({ sheets, colophon, art }: { sheets: SheetModel[], colophon: Colophon, art: Art }) => {
  const opening = sheets.find((sheet): sheet is Of<'opening'> => sheet.kind === 'opening')!
  const rank = sheets.find((sheet): sheet is Of<'rank'> => sheet.kind === 'rank')

  return (
    <Shop kind="summary" letters={opening.name.length}>
      <Opening sheet={opening} art={art} first={opening.first ?? undefined} />
      <div className="videoclub-story-close">
        {rank && <p className="videoclub-story-member"><b>{rank.rank}<sup>{rank.suffix}</sup></b> {rank.unit}</p>}
        <footer className="videoclub-story-colophon">
          {colophon.short && <p className="videoclub-colophon-short">{colophon.short}</p>}
          <p>{colophon.text}</p>
        </footer>
      </div>
    </Shop>
  )
}

// The rental ticket alone: its stamps already count the evenings the run of tapes showed
const Streak = ({ sheet, art }: { sheet: Of<'streak'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-streak" aria-label={sheet.label}>
    <Neon lines={[sheet.intro]} tone="pink" className="videoclub-neon-long" />
    <div className="videoclub-pair">
      <Box poster={sheet.poster} art={art} className="videoclub-box-large" tilt={-8} />
      <div className="videoclub-ticket videoclub-ticket-stamps">
        <p className="videoclub-ticket-head" aria-hidden="true">Ticket de location</p>
        <p className="videoclub-ticket-figure">
          <span aria-hidden="true">{number.format(sheet.evenings)}</span>
          <span className="visually-hidden">{sheet.spoken}</span>
          <span className="videoclub-ticket-unit" aria-hidden="true">{sheet.unit}</span>
        </p>
        <ol className="videoclub-stamps" aria-hidden="true">
          {sheet.nights.map(({ day }, index) => <li key={index} style={{ '--turn': `${((index * 37) % 23) - 11}deg`, '--day': index } as React.CSSProperties}>{day.match(/\d+/)?.[0]}</li>)}
        </ol>
        <p className="videoclub-ticket-foot">{figures(sheet.details)}</p>
      </div>
    </div>
  </section>
)

// The bookcase alone, the month at the top already marked on its shelf
const Months = ({ sheet, art }: { sheet: Of<'months'>, art: Art }) => {
  const { shows, elapsed, max, peak } = sheet

  return (
    <section className="videoclub-sheet videoclub-months" aria-label={sheet.label}>
      <Neon lines={sheet.lines} tone="cyan" />
      <p className="videoclub-lede">{sheet.lede}</p>
      <ol className="videoclub-rack" role="img" aria-label={sheet.alt}>
        {MONTHS.map((month, index) => {
          const show = index < elapsed ? shows[index] : null
          return (
            <li key={month} className={`videoclub-rack-row ${index >= elapsed ? 'videoclub-rack-future' : ''} ${peak?.index === index ? 'videoclub-rack-peak' : ''}`} style={{ '--at': index } as React.CSSProperties}>
              <span className="videoclub-rack-tag">
                {month}
                {show && <small><b>{number.format(show.episodes)}</b> {show.episodes > 1 ? 'épisodes' : 'épisode'}</small>}
              </span>
              {show && (
                <>
                  <Spines poster={show} count={Math.max(1, Math.round((show.episodes / max) * 12))} />
                  <Box poster={show} art={art} width={320} className="videoclub-box-mini" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// The night's last lines of the return slip, the earlier ones counted
const LINES = 3

const Night = ({ sheet, art }: { sheet: Of<'night'>, art: Art }) => {
  const shown = sheet.schedule.slice(-LINES)
  const before = sheet.schedule.length - shown.length

  return (
    <section className="videoclub-sheet videoclub-night" aria-label={sheet.label}>
      <Neon lines={sheet.lines} tone="cyan" />
      <div className="videoclub-returns">
        <div className="videoclub-returns-slot">
          <Box poster={sheet.poster} art={art} className="videoclub-box-returned" />
        </div>
        <p className="videoclub-returns-plate" aria-hidden="true">Retours</p>
      </div>
      <div className="videoclub-night-text">
        <p className="videoclub-night-date">{sheet.date}</p>
        <p className="videoclub-lede">Tu éteins à <strong className="videoclub-time">{sheet.end}</strong>{figures(sheet.after)}.</p>
        {sheet.listing
          ? (
            <div className="videoclub-ticket videoclub-ticket-returns">
              <p className="videoclub-ticket-head">{sheet.listing}{before > 0 && `${THIN}: les ${shown.length} dernières lignes, ${plural(before, 'autre', 'autres')} avant`}</p>
              <ol>
                {shown.map((line, index) => (
                  <li key={`${line.start}-${index}`}>
                    <span className="videoclub-ticket-time"><b>{line.start}</b><span>{line.end}</span></span>
                    <Box poster={line.poster} art={art} width={320} className="videoclub-box-mini" />
                    <span className="videoclub-ticket-title">{line.poster.title}{line.what && <b>{line.what}</b>}</span>
                  </li>
                ))}
              </ol>
            </div>
          )
          : <p className="videoclub-lede">{sheet.last}</p>}
      </div>
    </section>
  )
}
