import { ReactNode, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { months, number, t, type Colophon, type SheetModel } from '../../sheets'
import { Sentence } from '../../Sentence'
import type { Art, StoryModel, StoryProps } from '../types'
import { Cells, Counter, Edges, Exposure, FicheHead, Frame, Hour, Lights, Ring, Scorch, Scrawl, Still, Strip, Title, figures, gestureOf, hash, rng, sentences } from './Labo'
import './labo.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>
type Reel = { name: string, year: number }
type Page = { index: number, reel: Reel, art: Art }

// Each sheet on one stretch of the film, the stretch shared as an image
const Story = ({ story, index, share, sheets, colophon, art }: StoryProps) => {
  const page = { index, reel: { name: share.name, year: share.year }, art }

  switch (story.kind) {
    case 'summary': return <Summary sheets={sheets} colophon={colophon} label={story.label} {...page} />
    case 'opening': return <Opening sheet={story} {...page} />
    case 'rank': return <Rank sheet={story} {...page} />
    case 'streak': return <Streak sheet={story} {...page} />
    case 'months': return <Months sheet={story} {...page} />
    case 'binge': return <Binge sheet={story} {...page} />
    case 'night': return <Night sheet={story} {...page} />
    case 'server': return <Server sheet={story} {...page} />
    case 'figure': return <Figure sheet={story} {...page} />
    case 'duo': return <Duo sheet={story} {...page} />
    case 'posters': return <Posters sheet={story} {...page} />
    case 'genre': return <Genre sheet={story} {...page} />
    case 'finale': return <Finale sheet={story} {...page} />
  }
}

export default Story

// The film pulled into the gate, then each piece printed in turn under the enlarger
const Sheet = ({ story, index, reel, children }: { story: StoryModel, index: number, reel: Reel, children: ReactNode }) => (
  <section className={`labo-story labo-story-${story.kind}`} aria-label={story.label}>
    <Edges index={index} reel={reel} />
    {(Array.isArray(children) ? children.flat() : [children]).filter(Boolean).map((child, at) => <div key={at} className="labo-story-piece" style={{ '--at': at } as React.CSSProperties}>{child}</div>)}
  </section>
)

// The Academy leader counts 3, 2, 1, then the name is printed through the safelight
export const Leader = ({ sheet, stamp }: { sheet: Of<'opening'>, stamp?: ReactNode }) => {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(reduced ? 0 : 3)
  const at = sheet.title.indexOf(sheet.name)
  const [before, after] = at < 0 ? [sheet.title, ''] : [sheet.title.slice(0, at), sheet.title.slice(at + sheet.name.length)]

  useEffect(() => {
    if (reduced) {
      return setCount(0)
    }
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 420)
      return () => clearTimeout(timer)
    }
  }, [count, reduced])

  return (
    <div className="labo-story-leader">
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
      {stamp}
    </div>
  )
}

const Opening = ({ sheet, art, stamp, colophon, ...page }: { sheet: Of<'opening'>, stamp?: ReactNode, colophon?: Colophon } & Page) => (
  <Sheet story={sheet} {...page}>
    <Leader sheet={sheet} stamp={stamp} />
    {sheet.lede && <p className="labo-lede">{sheet.lede}</p>}
    {!!sheet.posters.length && (
      <div className="labo-story-contact">
        {sheet.posters.map((poster, frame) => <Frame key={poster.key} poster={poster} art={art} width={320} code={`${frame + 1}A`} eager />)}
      </div>
    )}
    <ul className="labo-slate">
      {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
    </ul>
    {colophon && (
      <footer className="labo-story-colophon">
        {colophon.short && <p className="labo-colophon-short">{colophon.short}</p>}
        <p>{colophon.text}</p>
      </footer>
    )}
  </Sheet>
)

// The opening again, the reader's rank stamped on its leader
const Summary = ({ sheets, colophon, label, ...page }: { sheets: SheetModel[], colophon: Colophon, label: string } & Page) => {
  const opening = sheets.find((sheet): sheet is Of<'opening'> => sheet.kind === 'opening')!
  const rank = sheets.find((sheet): sheet is Of<'rank'> => sheet.kind === 'rank')

  return (
    <Opening
      sheet={{ ...opening, label }}
      {...page}
      colophon={colophon}
      stamp={rank && (
        <p className="labo-stamp labo-stamp-rank labo-story-stamp" aria-hidden="true">
          <span>{rank.rank}<sup>{rank.suffix}</sup></span>
          <small>{rank.unit}</small>
        </p>
      )}
    />
  )
}

const Rank = ({ sheet, ...page }: { sheet: Of<'rank'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <div className="labo-fiche">
      <FicheHead reel={page.reel} />
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
    <ol className="labo-crowd" aria-hidden="true">
      {Array.from({ length: sheet.users }, (_, seat) => seat === sheet.rank - 1
        ? <li key={seat} className="labo-crowd-you"><Ring /><span className="labo-grease">{t('wrapped.labo.you')}</span></li>
        : <li key={seat} />)}
    </ol>
  </Sheet>
)

// One cell per evening of the run, printed from what was watched that evening, exposed one after the other
const Nights = ({ nights, art }: { nights: Of<'streak'>['nights'], art: Art }) => (
  <ol className="labo-story-nights" aria-hidden="true">
    {nights.map(({ poster }, night) => {
      const src = poster && (art(poster, 'art', 320) || art(poster, 'thumb', 320))
      return <li key={night} style={{ '--night': night, backgroundImage: src ? `url("${src}")` : undefined } as React.CSSProperties} />
    })}
  </ol>
)

const Streak = ({ sheet, art, ...page }: { sheet: Of<'streak'> } & Page) => {
  const figure = (
    <p className="labo-figure">
      <span aria-hidden="true">{number.format(sheet.evenings)}</span>
      <span className="visually-hidden">{sheet.spoken}</span>
      <small aria-hidden="true">{sheet.unit}</small>
    </p>
  )

  return (
    <Sheet story={sheet} {...page}>
      <h2 className="labo-intro">{sheet.intro}</h2>
      {sheet.lead
        ? <div className="labo-figure-pair"><Frame poster={sheet.poster} art={art} width={320} code="1A" />{figure}</div>
        : figure}
      {sheet.lead
        ? <div><h3 className="labo-name">{sheet.poster.title}</h3><p className="labo-body labo-span">{figures(sheet.span)}</p></div>
        : <p className="labo-body">{figures(sheet.details)}</p>}
      {sheet.nights.some((night) => night.poster)
        ? <Nights nights={sheet.nights} art={art} />
        : <Cells count={sheet.evenings} src={art(sheet.poster, 'art', 640) || art(sheet.poster, 'thumb', 320)} seed={sheet.evenings * 31} className="labo-cells-strip" />}
    </Sheet>
  )
}

// The contact sheet: a band per month, one cell per episode of that month's show
const Months = ({ sheet, art, ...page }: { sheet: Of<'months'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Title lines={sheet.lines} />
    <p className="labo-lede">{sheet.lede}</p>
    <div className="labo-paper">
      <div className="labo-planche" role="img" aria-label={sheet.alt}>
        {months().map((month, row) => {
          const show = sheet.shows[row]
          const future = row >= sheet.elapsed
          return (
            <div key={month} className={`labo-planche-row ${future ? 'labo-planche-future' : ''} ${sheet.peak?.index === row ? 'labo-planche-peak' : ''}`} style={{ '--row': row } as React.CSSProperties}>
              <p className="labo-planche-head">
                <span>{month}</span>
                {show && !future && <strong>{show.title}</strong>}
                {show && !future && <span>{t('wrapped.count.episodes', { count: show.episodes })}</span>}
              </p>
              {show && !future
                ? <Cells count={show.episodes} src={art(show, 'art', 640) || art(show, 'thumb', 320)} seed={row * 97 + show.episodes} columns={show.episodes} className="labo-story-band" />
                : <span className="labo-planche-blank" />}
              {sheet.peak?.index === row && <Ring />}
            </div>
          )
        })}
      </div>
    </div>
  </Sheet>
)

// Twelve episodes to a row of the reel at most, the reel advanced through the gate frame by frame
const ROW = 12

const Binge = ({ sheet, art, ...page }: { sheet: Of<'binge'> } & Page) => {
  const { poster, pace } = sheet
  const episodes = sheet.episodes || 0

  return (
    <Sheet story={sheet} {...page}>
      <Title lines={sheet.lines} />
      <Still poster={poster} art={art} code="1A" />
      <div>
        <h3 className="labo-name">{sheet.title}</h3>
        {sheet.date && <p className="labo-intro labo-date">{sheet.date}</p>}
      </div>
      {!!sheet.stats.length && <Counter stats={sheet.stats} />}
      {episodes > 0 && (
        <div className="labo-story-gate" style={{ '--frames': Math.min(episodes, ROW) } as React.CSSProperties}>
          <Cells count={episodes} src={art(poster, 'art', 640) || art(poster, 'thumb', 320)} seed={episodes * 53} columns={Math.ceil(episodes / Math.ceil(episodes / ROW))} className="labo-cells-reel" />
        </div>
      )}
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

// The projection log's last lines, the earlier ones counted
const LINES = 3

// The tail of the reel, the hour the projector stopped written on the leader
const Night = ({ sheet, art, ...page }: { sheet: Of<'night'> } & Page) => {
  const shown = sheet.schedule.slice(-LINES)
  const before = sheet.schedule.length - shown.length

  return (
    <Sheet story={sheet} {...page}>
      <Title lines={sheet.lines} />
      <div className="labo-tail">
        <Frame poster={sheet.poster} art={art} width={320} code="99A" />
        <div className="labo-tail-leader" aria-hidden="true">
          <span className="labo-tail-mark">{t('wrapped.labo.tail')}</span>
          <span className="labo-tail-hour">{sheet.end}</span>
          <span className="labo-tail-mark">{t('wrapped.labo.reelEnd')}</span>
        </div>
      </div>
      <p className="labo-intro">{sheet.date}</p>
      <p className="labo-body"><Sentence i18nKey="wrapped.sheets.night.off" values={{ end: sheet.end }} tag={<Hour />} text={sheet.after} figures={figures} /></p>
      {sheet.listing
        ? (
          <div className="labo-log">
            <p className="labo-intro">{before > 0 ? t('wrapped.sheets.night.listed', { listing: sheet.listing, shown: shown.length, before }) : sheet.listing}</p>
            <ol>
              {shown.map((line, play) => (
                <li key={`${line.start}-${play}`} className={play === shown.length - 1 ? 'labo-log-last' : undefined}>
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
}

const Server = ({ sheet, art, ...page }: { sheet: Of<'server'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Title lines={sheet.lines} />
    <div className="labo-ringed">
      <Frame poster={sheet.poster} art={art} width={640} code="0A" />
      <Ring />
      {sheet.first && <span className="labo-stamp labo-stamp-copy" aria-hidden="true">{t('wrapped.labo.zeroCopy')}</span>}
    </div>
    <h3 className="labo-name">{sheet.title}</h3>
    <div>{sentences(sheet.bare).map((sentence) => <p key={sentence} className="labo-body">{figures(sentence)}</p>)}</div>
  </Sheet>
)

const Figure = ({ sheet, art, ...page }: { sheet: Of<'figure'> } & Page) => {
  const at = sheet.highlight ? sheet.unit.indexOf(sheet.highlight) : -1

  return (
    <Sheet story={sheet} {...page}>
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
          <Frame poster={sheet.posters[0]} art={art} width={320} code={`${page.index * 4}A`} />
          <p className="labo-strip-title">{sheet.posters[0].title}</p>
        </div>
      )}
      {sheet.posters.length > 1 && <Strip posters={sheet.posters.slice(0, 4)} art={art} start={page.index * 4} />}
    </Sheet>
  )
}

// One line per title seen by two: its frame, then who and how far apart
const Duo = ({ sheet, art, ...page }: { sheet: Of<'duo'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Title lines={sheet.lines} />
    <p className="labo-lede">{figures(sheet.lede)}</p>
    <ul className="labo-story-pairs">
      {sheet.posters.slice(0, 4).map((poster, frame) => (
        <li key={poster.key}>
          <div className="labo-strip-film"><Frame poster={poster} art={art} width={320} code={`${page.index * 4 + frame}A`} /></div>
          <p>
            <span className="labo-strip-title">{poster.title}</span>
            <span className="labo-strip-caption">{figures(poster.caption)}</span>
          </p>
        </li>
      ))}
    </ul>
  </Sheet>
)

// Frames boxed in grease pencil, what each one stands for written beside it
const Mark = ({ item: { what, poster, detail, when }, at, index, art, dropped }: { item: Of<'posters'>['items'][number], at: number, index: number, art: Art, dropped: boolean }) => {
  // A film stopped partway is cut on its frame where it stopped
  const stopped = dropped ? /^(\d+)\s?%/.exec(detail) : null

  return (
    <article className="labo-story-mark">
      <div className="labo-marked-frame">
        <Frame poster={poster} art={art} width={320} code={`${index * 4 + at}A`} />
        <Scrawl gesture={stopped ? 'cut' : gestureOf(index, at)} seed={hash(poster.key)} at={stopped ? Number(stopped[1]) : undefined} />
      </div>
      <div>
        <h3 className="labo-grease labo-marked-what" style={{ transform: `rotate(${(rng(hash(poster.key))() - 0.7) * 6}deg)` }}>{what}</h3>
        <p className="labo-marked-title">{poster.title}</p>
        <p className="labo-grease labo-marked-detail" style={{ transform: `rotate(${(rng(hash(poster.key) + 1)() - 0.5) * 6}deg)` }}>{detail}</p>
        {when && <p className="labo-body labo-marked-when">{when}</p>}
      </div>
    </article>
  )
}

const Posters = ({ sheet, art, ...page }: { sheet: Of<'posters'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Title lines={sheet.lines} />
    {sheet.items.slice(0, 3).map((item, at) => <Mark key={item.poster.key} item={item} at={at} index={page.index} art={art} dropped={sheet.variant === 'dropped'} />)}
  </Sheet>
)

// The timing report, typed, the values in blue felt pen, stamped good to print
const Genre = ({ sheet, art, ...page }: { sheet: Of<'genre'> } & Page) => {
  const { lead } = sheet

  return (
    <Sheet story={sheet} {...page}>
      <div className="labo-fiche">
        <FicheHead reel={page.reel} />
        <Title lines={sheet.lines} className="labo-fiche-title" />
        <dl className="labo-fiche-values">
          <div>
            <dt aria-hidden="true">{t('wrapped.labo.dominant')}</dt>
            <dd className="labo-felt labo-felt-large">{sheet.name}</dd>
          </div>
        </dl>
        <p className="labo-fiche-typed">{figures(sheet.count)}</p>
        <Strip posters={sheet.posters.slice(0, 4)} art={art} start={page.index * 4} titled={false} />
        {lead && (
          <p className="labo-fiche-typed labo-fiche-lead">
            <span className="labo-felt">{lead.name}</span> {figures(lead.role)}
          </p>
        )}
        {lead && !!lead.posters.length && <Strip posters={lead.posters.slice(0, 4)} art={art} start={page.index * 4 + 4} titled={false} />}
        <span className="labo-stamp labo-stamp-ok" aria-hidden="true">{t('wrapped.labo.approved')}</span>
      </div>
    </Sheet>
  )
}

// The last frame, then the end leader burning through where the projector held on it
const Finale = ({ sheet, art, ...page }: { sheet: Of<'finale'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Title lines={sheet.lines} />
    <div className="labo-story-last">
      <Frame poster={sheet.poster} art={art} width={640} code={`${page.index * 4}A`} />
      <div>
        <h3 className="labo-name">{sheet.title}</h3>
        <p className="labo-intro">{sheet.date}</p>
        {!sheet.closed && <span className="labo-stamp labo-stamp-draft" aria-hidden="true">{t('wrapped.common.draft')}</span>}
      </div>
    </div>
    <div className="labo-burn">
      <p className="labo-burn-end">{sheet.end}</p>
      <Scorch />
    </div>
  </Sheet>
)
