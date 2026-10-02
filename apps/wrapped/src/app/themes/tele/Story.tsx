import { ReactNode, useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import type { WrappedPoster } from '@sensorr/sensorr'
import { MONTHS, THIN, plural, type Colophon, type SheetModel } from '../../sheets'
import type { Art, StoryModel, StoryProps } from '../types'
import { TestCard } from './States'
import { Big, Cover, Folio, Headline, Photo, Ratings, Review, Sign, Stats, Venn, Letter, figures, rubric, sentences } from './Tele'
import './tele.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>
type Page = { name: string, page: number, art: Art }

// Each sheet on one page of the magazine, the page shared as an image
const Story = ({ story, index, share, sheets, colophon, art }: StoryProps) => {
  const page = { name: share.name, page: index * 2, art }

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

// A page put down on the table, its pieces landing one after the other
const Sheet = ({ story, name, page, tone, className = '', children }: { story: StoryModel, name: string, page: number, tone?: 'blue', className?: string, children: ReactNode }) => (
  <section className={`tele-story${tone ? ` tele-spread-${tone}` : ''} ${className}`} aria-label={story.label}>
    {story.kind !== 'opening' && story.kind !== 'summary' && <Folio name={name} rubric={rubric(story)} page={page} />}
    {Array.isArray(children) ? children.flat().filter(Boolean).map((child, at) => <div key={at} className="tele-story-piece" style={{ '--at': at } as React.CSSProperties}>{child}</div>) : <div className="tele-story-piece">{children}</div>}
  </section>
)

const Count = ({ value, suffix, spoken }: { value: number, suffix?: string, spoken: string }) => {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)

  useEffect(() => {
    if (!reduced) {
      const controls = animate(0, value, { duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1], onUpdate: (latest) => setShown(Math.round(latest)) })
      return () => controls.stop()
    }
  }, [reduced, value])

  return <Big value={shown} suffix={suffix} spoken={spoken} />
}

const Band = ({ text }: { text: string }) => <h2 className="tele-headline"><span className="tele-band">{text}</span></h2>

const Row = ({ posters, art, titles = true, small }: { posters: WrappedPoster[], art: Art, titles?: boolean, small?: boolean }) => (
  <ul className={`tele-story-row${small ? ' tele-story-row-small' : ''}`}>
    {posters.slice(0, 4).map((poster, at) => (
      <li key={poster.key} style={{ '--at': at } as React.CSSProperties}>
        <Photo poster={poster} art={art} width={320} />
        {titles && <span className="tele-thumb-title">{poster.title}</span>}
      </li>
    ))}
  </ul>
)

const Pick = ({ poster, art, children }: { poster: WrappedPoster, art: Art, children: ReactNode }) => (
  <article className="tele-pick">
    <Photo poster={poster} art={art} width={320} />
    <div>
      <h3 className="tele-pick-title">{poster.title}</h3>
      {children}
    </div>
  </article>
)

const Opening = ({ sheet, name, art, sticker, colophon }: { sheet: Of<'opening'>, sticker?: ReactNode, colophon?: Colophon } & Page) => (
  <section className="tele-story tele-story-cover" aria-label={sheet.label}>
    <Cover sheet={sheet} name={name} art={art} sticker={sticker} colophon={colophon} />
  </section>
)

// The cover again, the reader's place among the viewers stuck on it
const Summary = ({ sheets, colophon, label, ...page }: { sheets: SheetModel[], colophon: Colophon, label: string } & Page) => {
  const opening = sheets.find((sheet): sheet is Of<'opening'> => sheet.kind === 'opening')!
  const rank = sheets.find((sheet): sheet is Of<'rank'> => sheet.kind === 'rank')

  return (
    <Opening
      sheet={{ ...opening, label }}
      {...page}
      colophon={colophon}
      sticker={rank && <p className="tele-sticker tele-sticker-rank"><span>Audience<b>{rank.rank}<sup>{rank.suffix}</sup></b>sur {rank.users}</span></p>}
    />
  )
}

const Rank = ({ sheet, ...page }: { sheet: Of<'rank'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Band text="Audience" />
    <div className="tele-story-figure">
      <Count value={sheet.rank} suffix={sheet.suffix} spoken={`${sheet.rank}${sheet.suffix}`} />
      <p className="tele-unit">{sheet.unit}</p>
    </div>
    <p className="tele-standfirst">{figures(sheet.detail)}</p>
    <Ratings sheet={sheet} />
  </Sheet>
)

const DAY = 86400000
const noon = (date: string) => Date.parse(`${date}T12:00:00Z`)

// The months of the run as bands of days, each evening of it struck in turn
const Days = ({ from, to }: { from: string, to: string }) => {
  const [start, end] = [noon(from), noon(to)]
  const months: Date[] = []
  for (let month = new Date(Date.UTC(new Date(start).getUTCFullYear(), new Date(start).getUTCMonth(), 1, 12)); month.getTime() <= end; month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1, 12))) {
    months.push(month)
  }
  let struck = 0

  return (
    <div className="tele-days" aria-hidden="true">
      {months.slice(0, 3).map((month) => (
        <div key={month.getTime()} className="tele-days-month">
          <p>{month.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' })}</p>
          <ol>
            {Array.from({ length: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0, 12)).getUTCDate() }, (_, day) => {
              const time = month.getTime() + day * DAY
              const on = time >= start && time <= end
              return <li key={day} className={on ? 'tele-days-on' : undefined} style={on ? { '--day': struck++ } as React.CSSProperties : undefined} />
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}

const Streak = ({ sheet, art, ...page }: { sheet: Of<'streak'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Band text="Feuilleton" />
    <p className="tele-standfirst">{sheet.intro}</p>
    <div className="tele-story-figure">
      <Count value={sheet.evenings} spoken={sheet.spoken} />
      <p className="tele-unit">{sheet.unit}</p>
    </div>
    <Days from={sheet.from} to={sheet.to} />
    {sheet.lead
      ? <Pick poster={sheet.poster} art={art}><p>{figures(sheet.span)}</p></Pick>
      : <p className="tele-body">{sheet.details}</p>}
  </Sheet>
)

const Months = ({ sheet, art, ...page }: { sheet: Of<'months'> } & Page) => {
  const { shows, elapsed, max, peak } = sheet

  return (
    <Sheet story={sheet} {...page}>
      <Headline lines={sheet.lines} />
      <ol className="tele-grid">
        {MONTHS.map((month, at) => {
          const show = shows[at]
          const future = at >= elapsed
          return (
            <li key={month} className={`tele-slot${peak?.index === at ? ' tele-slot-peak' : ''}${future ? ' tele-slot-future' : ''}`} style={{ '--at': at } as React.CSSProperties}>
              <span className="tele-slot-month">{month}</span>
              {show ? <Photo poster={show} art={art} width={320} className="tele-slot-poster" /> : <span className="tele-slot-poster" aria-hidden="true" />}
              <span className="tele-slot-text">
                {show
                  ? <>
                    <span className="tele-slot-title">{show.title}</span>
                    <span className="tele-slot-episodes">{plural(show.episodes, 'épisode', 'épisodes')}</span>
                    <span className="tele-slot-bar" style={{ '--share': show.episodes / max } as React.CSSProperties} aria-hidden="true" />
                  </>
                  : <span className="tele-slot-none">{future ? 'À suivre' : 'Pas de série'}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </Sheet>
  )
}

const Binge = ({ sheet, art, ...page }: { sheet: Of<'binge'> } & Page) => {
  const { pace } = sheet

  return (
    <Sheet story={sheet} {...page}>
      <Headline lines={sheet.lines} />
      <figure className="tele-still">
        <Photo poster={sheet.poster} art={art} kind="art" width={1280} />
        <span className="tele-tag" aria-hidden="true">Soirée spéciale</span>
      </figure>
      <h3 className="tele-title">{sheet.title}</h3>
      {sheet.date && <p className="tele-standfirst">{sheet.date}</p>}
      {!!sheet.stats.length && <Stats stats={sheet.stats} />}
      {pace && !!sheet.paced_stats.length && <Pick poster={pace} art={art}><Stats stats={sheet.paced_stats} /></Pick>}
    </Sheet>
  )
}

// The night's last lines of the listing, the earlier ones counted
const LINES = 3

const Night = ({ sheet, art, ...page }: { sheet: Of<'night'> } & Page) => {
  const shown = sheet.schedule.slice(-LINES)
  const before = sheet.schedule.length - shown.length

  return (
    <Sheet story={sheet} className="tele-story-night" {...page}>
      <div className="tele-story-backdrop">
        <Photo poster={sheet.poster} art={art} kind="art" width={1280} />
        <Headline lines={sheet.lines} />
        <p className="tele-unit">{sheet.date}</p>
        <p className="tele-clock" aria-hidden="true">{sheet.end}</p>
      </div>
      <p className="tele-body">Tu éteins à <strong>{sheet.end}</strong>{figures(sheet.after)}.</p>
      {sheet.listing
        ? <>
          <p className="tele-box-title">{sheet.listing}{before > 0 && `${THIN}: les ${shown.length} dernières lignes, ${plural(before, 'autre', 'autres')} avant`}</p>
          <ol className="tele-listing">
            {shown.map((line, at) => (
              <li key={`${line.start}-${at}`} className={at === shown.length - 1 ? 'tele-listing-last' : undefined}>
                <span className="tele-listing-time"><b>{line.start}</b><span>{line.end}</span></span>
                <Photo poster={line.poster} art={art} width={320} className="tele-listing-poster" />
                <span className="tele-listing-title">{line.poster.title}{line.what && <span>{line.what}</span>}</span>
              </li>
            ))}
          </ol>
        </>
        : <p className="tele-body">{sheet.last}</p>}
    </Sheet>
  )
}

const Server = ({ sheet, art, ...page }: { sheet: Of<'server'> } & Page) => {
  const [chapo, ...more] = sentences(sheet.bare)

  return (
    <Sheet story={sheet} className="tele-story-full" {...page}>
      <figure className="tele-exclusive">
        <Photo poster={sheet.poster} art={art} kind="art" width={1280} className="tele-full-poster" />
        <span className="tele-ribbon" aria-hidden="true">Exclusivité</span>
      </figure>
      <Headline lines={sheet.lines} />
      <h3 className="tele-title">{sheet.title}</h3>
      <p className="tele-standfirst">{figures(chapo)}</p>
      {!!more.length && <p className="tele-body">{figures(more.join(' '))}</p>}
    </Sheet>
  )
}

const Figure = ({ sheet, art, ...page }: { sheet: Of<'figure'> } & Page) => {
  const [before, after] = sheet.highlight ? sheet.unit.split(sheet.highlight) : [sheet.unit]
  const [chapo] = sentences(sheet.details)
  const twin = sheet.variant === 'twin'

  return (
    <Sheet story={sheet} {...page}>
      {sheet.lines ? <Headline lines={sheet.lines} /> : <Band text="Rareté" />}
      {twin && sheet.highlight && sheet.sides
        ? <Venn name={sheet.highlight} count={sheet.count} spoken={sheet.spoken} sides={sheet.sides} />
        : <Count value={sheet.count} spoken={sheet.spoken} />}
      <p className="tele-unit">{before}{sheet.highlight && <><mark className="tele-mark">{sheet.highlight}</mark>{after}</>}</p>
      <p className="tele-standfirst">{figures(chapo)}</p>
      {!!sheet.posters.length && <Row posters={sheet.posters} art={art} />}
    </Sheet>
  )
}

const Duo = ({ sheet, art, ...page }: { sheet: Of<'duo'> } & Page) => {
  const [chapo] = sentences(sheet.lede)

  return (
    <Sheet story={sheet} {...page}>
      <Headline lines={sheet.lines} />
      <p className="tele-standfirst">{figures(chapo)}</p>
      <div className="tele-letters">{sheet.posters.map((poster) => <Letter key={poster.key} poster={poster} art={art} />)}</div>
    </Sheet>
  )
}

const Posters = ({ sheet, art, ...page }: { sheet: Of<'posters'> } & Page) => (
  <Sheet story={sheet} {...page}>
    <Headline lines={sheet.lines} />
    {sheet.items.slice(0, 3).map((item) => <Review key={item.poster.key} item={item} art={art} />)}
  </Sheet>
)

const Genre = ({ sheet, art, ...page }: { sheet: Of<'genre'> } & Page) => {
  const { lead } = sheet

  return (
    <Sheet story={sheet} tone="blue" {...page}>
      <Headline lines={sheet.lines} />
      <div className="tele-sign">
        <Sign />
        <p><span className="tele-sign-label" aria-hidden="true">Ton signe</span><span className="tele-sign-name">{sheet.name}</span></p>
      </div>
      <p className="tele-standfirst">{figures(sheet.count)}</p>
      <Row posters={sheet.posters} art={art} titles={false} small />
      {lead && <dl className="tele-reading">
        <dt aria-hidden="true">Ascendant</dt>
        <dd><b className="tele-reading-name">{lead.name}</b> {figures(lead.role)}</dd>
      </dl>}
      {lead && !!lead.posters.length && <Row posters={lead.posters} art={art} titles={false} small />}
    </Sheet>
  )
}

// The end of transmission: a test card after the last programme
const Finale = ({ sheet, art, ...page }: { sheet: Of<'finale'> } & Page) => (
  <Sheet story={sheet} className="tele-story-full" {...page}>
    <Photo poster={sheet.poster} art={art} width={1280} className="tele-full-poster" />
    <Headline lines={sheet.lines} />
    <h3 className="tele-title">{sheet.title}</h3>
    <p className="tele-standfirst">{sheet.date}</p>
    {!sheet.closed && <p className="tele-stamp">Provisoire</p>}
    <div className="tele-story-end">
      <TestCard />
      <p className="tele-end">{sheet.end}</p>
    </div>
  </Sheet>
)
