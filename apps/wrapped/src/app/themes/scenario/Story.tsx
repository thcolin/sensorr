import { ReactNode, useEffect, useRef } from 'react'
import { MONTHS, THIN, number, plural, type Colophon, type SheetModel } from '../../sheets'
import type { Art, StoryProps } from '../types'
import { Act, Binge, Caps, Duo, Figure, Finale, Genre, Insert, Mark, Opening, Page, Pencil, Rank, Shout, Slug, TRANSITIONS, Tally, figures, scenesOf, sentences } from './Scenario'
import './scenario.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>
type Scene = { scene: number, art: Art }

// Each sheet on one page of the script, the page shared as an image
const Story = ({ story, index, share, sheets, colophon, art }: StoryProps) => {
  if (story.kind === 'summary') return <Summary sheets={sheets} colophon={colophon} label={story.label} art={art} />
  if (story.kind === 'opening') return <Sheet kind="opening"><Opening sheet={story} art={art} /></Sheet>

  // Scenes are numbered on from the pages before, as in the script
  const scene = { scene: sheets.slice(0, index).reduce((count, sheet) => count + scenesOf(sheet), 1), art }
  const body = (() => {
    switch (story.kind) {
      case 'rank': return <Rank sheet={story} name={share.name} {...scene} />
      case 'streak': return <Streak sheet={story} {...scene} />
      case 'months': return <Months sheet={story} {...scene} />
      case 'binge': return <Binge sheet={story} {...scene} />
      case 'night': return <Night sheet={story} {...scene} />
      case 'server': return <Server sheet={story} {...scene} />
      case 'figure': return <Figure sheet={story} {...scene} />
      case 'duo': return <Duo sheet={story} {...scene} />
      case 'posters': return <Posters sheet={story} {...scene} />
      case 'genre': return <Genre sheet={story} {...scene} />
      case 'finale': return <Finale sheet={story} {...scene} />
    }
  })()

  return (
    <Sheet kind={story.kind}>
      <Page sheet={story} index={index} transition={index === sheets.length - 1 ? null : TRANSITIONS[index % TRANSITIONS.length]}>{body}</Page>
    </Sheet>
  )
}

export default Story

// The pencil's marks on the page, numbered in reading order so they come one after the other
const MARKS = '.scenario-mark, .scenario-pencil-note, .scenario-tally, .scenario-swipe, .scenario-slate'

// The page lands typed, then the marks are added to it one by one
const Sheet = ({ kind, children }: { kind: string, children: ReactNode }) => {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>(MARKS).forEach((mark, at) => mark.style.setProperty('--mark', String(at)))
  }, [])

  return <div ref={root} className={`scenario-story scenario-story-${kind}`}>{children}</div>
}

// The title page again, the friend's place among the viewers noted in red pencil and the closing note typed under it
const Summary = ({ sheets, colophon, label, art }: { sheets: SheetModel[], colophon: Colophon, label: string, art: Art }) => {
  const opening = sheets.find((sheet): sheet is Of<'opening'> => sheet.kind === 'opening')!
  const rank = sheets.find((sheet): sheet is Of<'rank'> => sheet.kind === 'rank')

  return (
    <Sheet kind="summary">
      <Opening sheet={{ ...opening, label }} art={art} />
      <div className="scenario-story-close">
        {rank && <Pencil className="scenario-story-rank">{rank.rank}<sup>{rank.suffix}</sup> {rank.unit}</Pencil>}
        <footer className="scenario-story-colophon">
          {colophon.short && <p>{colophon.short}</p>}
          <p>{colophon.text}</p>
        </footer>
      </div>
    </Sheet>
  )
}

// The first evening and the last two, the run in tally marks beside its poster
const Streak = ({ sheet, scene, art }: { sheet: Of<'streak'> } & Scene) => {
  const shown = sheet.evenings <= 3 ? sheet.nights.map((_, at) => at) : [0, sheet.evenings - 2, sheet.evenings - 1]

  return (
    <>
      <Act>{sheet.label}</Act>
      <Slug scene={scene}>Int. salon – soir</Slug>
      <p className="scenario-action">{sheet.intro}{THIN}:</p>
      <div className={`scenario-beside${sheet.lead ? '' : ' scenario-beside-alone'}`}>
        {sheet.lead && <Insert poster={sheet.poster} art={art} width={320} caption={<Caps>{sheet.poster.title}</Caps>} />}
        <div className="scenario-story-run">
          <Shout figure={number.format(sheet.evenings)}>{sheet.unit}</Shout>
          <Tally count={sheet.evenings} />
        </div>
      </div>
      <p className="scenario-action">{figures(sheet.lead ? sheet.span : sheet.details)}</p>
      <ol className="scenario-nights">
        {shown.map((at, position) => {
          const { day, poster } = sheet.nights[at]
          return (
            <li key={at} data-gap={position > 0 && at - shown[position - 1] > 1 ? '' : undefined}>
              {poster && <Insert poster={poster} art={art} width={320} className="scenario-insert-thumb" />}
              <p>
                <span className="scenario-night-slug">Soir {at + 1} – {day}</span>
                {poster && <Caps>{poster.title}</Caps>}
              </p>
            </li>
          )
        })}
      </ol>
    </>
  )
}

// The twelve scenes as one line each, the month in the margin, the felt-tip stroke under the title
const Months = ({ sheet, scene, art }: { sheet: Of<'months'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    <p className="scenario-action">{sheet.lede}</p>
    <ol className="scenario-story-months">
      {sheet.shows.slice(0, sheet.elapsed).map((show, at) => (
        <li key={at} className={sheet.peak?.index === at ? 'scenario-month-peak' : undefined} style={{ '--at': at } as React.CSSProperties}>
          <span className="scenario-scene" aria-hidden="true">{scene + at}</span>
          <span className="scenario-story-month">{MONTHS[at]}</span>
          <span className="scenario-story-line">
            <span className="scenario-story-said">
              {show
                ? <><span className="scenario-story-title"><Caps>{show.title}</Caps></span><span>, {figures(plural(show.episodes, 'épisode', 'épisodes'))}.</span></>
                : 'Rien.'}
            </span>
            {show && <span className="scenario-swipe" aria-hidden="true" style={{ '--share': show.episodes / sheet.max } as React.CSSProperties} />}
          </span>
          {show && <Insert poster={show} art={art} width={320} className="scenario-insert-thumb" />}
        </li>
      ))}
    </ol>
  </>
)

// The night's last lines of the log, the earlier ones counted
const LINES = 3

const Night = ({ sheet, scene, art }: { sheet: Of<'night'> } & Scene) => {
  const shown = sheet.schedule.slice(-LINES)
  const before = sheet.schedule.length - shown.length

  return (
    <>
      <Act>{sheet.lines.join(' ')}</Act>
      <Slug scene={scene}>{sheet.late ? 'Int. salon – nuit' : 'Int. salon – soir'}</Slug>
      <p className="scenario-action scenario-date">{sheet.date}.</p>
      <Shout figure={sheet.end} className="scenario-shout-time" />
      <p className="scenario-action scenario-centred">Tu éteins à {sheet.end}{figures(sheet.after)}.</p>
      {sheet.listing
        ? (
          <div>
            <p className="scenario-log-title">{sheet.listing}{before > 0 && `${THIN}: les ${shown.length} dernières lignes, ${plural(before, 'autre', 'autres')} avant`}</p>
            <ol className="scenario-log">
              {shown.map((line, at) => (
                <li key={`${line.start}-${at}`} className={at === shown.length - 1 ? 'scenario-log-last' : undefined}>
                  <span className="scenario-log-time">{at === shown.length - 1 ? <Mark>{line.start}</Mark> : line.start}<span>{line.end}</span></span>
                  <span className="scenario-log-title-line"><Caps>{line.poster.title}</Caps>{line.what && <span>{line.what}</span>}</span>
                  <Insert poster={line.poster} art={art} width={320} className="scenario-insert-thumb" />
                </li>
              ))}
            </ol>
          </div>
        )
        : (
          <div className="scenario-beside">
            <Insert poster={sheet.poster} art={art} width={320} />
            <p className="scenario-action">{sheet.last}</p>
          </div>
        )}
    </>
  )
}

// The poster and its pencil note, without the still the page adds under the text
const Server = ({ sheet, scene, art }: { sheet: Of<'server'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    <Slug scene={scene}>Int. salle de projection – soir</Slug>
    <div className="scenario-beside">
      <Insert poster={sheet.poster} art={art} caption={<Caps>{sheet.title}</Caps>} />
      {sheet.first && <Pencil className="scenario-pencil-side">Première projection</Pencil>}
    </div>
    {sentences(sheet.bare).map((sentence) => <p key={sentence} className="scenario-action">{figures(sentence)}</p>)}
  </>
)

// One short scene per poster, its title typed beside it with the pencil note and the figure
const Posters = ({ sheet, scene, art }: { sheet: Of<'posters'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    {sheet.items.slice(0, 3).map(({ what, poster, detail, when }, at) => (
      <div key={poster.key} className="scenario-story-item">
        <Slug scene={scene + at}>Int. salon – soir</Slug>
        <div className="scenario-beside">
          <div className="scenario-verdict">
            <Pencil>{what}</Pencil>
            <p className="scenario-verdict-figure"><Mark>{detail}</Mark></p>
            <p className="scenario-story-title"><Caps>{poster.title}</Caps></p>
            {when && <p className="scenario-verdict-when">{when}</p>}
          </div>
          <Insert poster={poster} art={art} width={320} />
        </div>
      </div>
    ))}
  </>
)
