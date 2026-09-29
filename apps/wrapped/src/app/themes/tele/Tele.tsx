import { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { WrappedPoster } from '@sensorr/sensorr'
import { MONTHS, THIN, number, plural, type SheetModel, type Stat } from '../../sheets'
import type { Art, ThemeProps } from '../types'
import { TestCard } from './States'
import { anchor } from '../../anchor'
import './tele.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>
type Page = { name: string, page: number, art: Art }

// The magazine's sections, printed in the running head of each page
const rubric = (sheet: SheetModel) => {
  switch (sheet.kind) {
    case 'opening': return 'Couverture'
    case 'rank': return 'Audience'
    case 'streak': return 'Feuilleton'
    case 'months': return 'Grille de l’année'
    case 'binge': return 'Soirée spéciale'
    case 'night': return 'Dernière partie de soirée'
    case 'server': return 'Exclusivité'
    case 'figure': return sheet.variant === 'twin' ? 'Ils ont aimé' : 'Rareté'
    case 'duo': return 'Courrier des lecteurs'
    case 'posters': return sheet.variant === 'dropped' ? 'Zapping' : 'Critiques'
    case 'genre': return 'Horoscope'
    case 'finale': return 'Fin des programmes'
  }
}

const Tele = ({ share, sheets, colophon, art }: ThemeProps) => (
  <main className="tele-kiosk">
    {sheets.map((sheet, index) => {
      const page = { name: share.name, page: index * 2, art }
      switch (sheet.kind) {
        case 'opening': return <Opening key={index} sheet={sheet} sheets={sheets} {...page} />
        case 'rank': return <Rank key={index} sheet={sheet} {...page} />
        case 'streak': return <Streak key={index} sheet={sheet} {...page} />
        case 'months': return <Months key={index} sheet={sheet} {...page} />
        case 'binge': return <Binge key={index} sheet={sheet} {...page} />
        case 'night': return <Night key={index} sheet={sheet} {...page} />
        case 'server': return <Server key={index} sheet={sheet} {...page} />
        case 'figure': return <Figure key={index} sheet={sheet} {...page} />
        case 'duo': return <Duo key={index} sheet={sheet} {...page} />
        case 'posters': return <Posters key={index} sheet={sheet} {...page} />
        case 'genre': return <Genre key={index} sheet={sheet} {...page} />
        case 'finale': return <Finale key={index} sheet={sheet} {...page} />
      }
    })}
    <footer className="tele-ours">
      {colophon.short && <p className="tele-ours-short">{colophon.short}</p>}
      <p className="tele-ours-text">{colophon.text}</p>
      <Barcode />
    </footer>
  </main>
)

export default Tele

// Two facing pages on a wide screen, one page after the other on a phone
const Spread = ({ sheet, name, page, left, right, tone }: { sheet: SheetModel, name: string, page: number, left: ReactNode, right?: ReactNode, tone?: 'blue' }) => (
  <section id={`tele-p${page}`} className={`tele-spread${right ? '' : ' tele-spread-single'}${tone ? ` tele-spread-${tone}` : ''}`} aria-label={sheet.label}>
    <div className="tele-page">
      <Folio name={name} rubric={rubric(sheet)} page={page} />
      {left}
    </div>
    {right && (
      <div className="tele-page">
        <Folio name={name} rubric={rubric(sheet)} page={page + 1} />
        {right}
      </div>
    )}
  </section>
)

const Folio = ({ name, rubric, page }: { name: string, rubric: string, page: number }) => (
  <p className="tele-folio" aria-hidden="true">
    <span>Télé {name}</span>
    <b>{rubric}</b>
    <span>p. {page}</span>
  </p>
)

// The last line, or the last word of a single line, sits on a band of colour
const Headline = ({ lines, as: Tag = 'h2' }: { lines: string[], as?: 'h2' | 'h3' }) => {
  const words = lines.length > 1 ? lines : lines[0].split(' ')
  const head = lines.length > 1 ? lines.slice(0, -1).join(' ') : words.slice(0, -1).join(' ')

  return (
    <Tag className="tele-headline">
      {head && <>{head} </>}
      <span className="tele-band">{words[words.length - 1]}</span>
    </Tag>
  )
}

const Photo = ({ poster, art, kind = 'thumb', width = 640, className = '', eager }: { poster: WrappedPoster, art: Art, kind?: 'thumb' | 'art', width?: 320 | 640 | 1280, className?: string, eager?: boolean }) => {
  const src = art(poster, kind, width) || art(poster, kind === 'thumb' ? 'art' : 'thumb', width)

  return src
    ? <img className={`tele-photo tele-photo-${kind} ${className}`} src={src} alt={poster.title} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    : <span className={`tele-photo tele-photo-${kind} tele-photo-none ${className}`} role="img" aria-label={poster.title}><span aria-hidden="true">{poster.title}</span></span>
}

const Big = ({ value, spoken, suffix }: { value: number, spoken: string, suffix?: string }) => (
  <p className="tele-big">
    <span aria-hidden="true">{number.format(value)}{suffix && <sup>{suffix}</sup>}</span>
    <span className="visually-hidden">{spoken}</span>
  </p>
)

const Barcode = () => <span className="tele-barcode" aria-hidden="true"><i /></span>

// A quantity stands out with its unit: not a date, nor the digits of a name or of a title in quotes
const UNIT = 'jours?\\sd’écart|films?\\set\\sséries|(?:soirs?|jours?|épisodes?|films?|séries?|titres?|fois|heures?|personnes?|spectateurs?)(?![\\p{L}])|par jour'
const MONTH = '(?:er)?\\s(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)'
const QUANTITY = new RegExp(`(?<![\\p{L}\\d._])(S\\d+E\\d+|\\d+(?:\\s\\d{3})*(?:\\sh\\s\\d+|\\s?%)?)(?![\\p{L}\\d])(?!${MONTH})(?:\\s(${UNIT}))?`, 'gu')
const figures = (text: string) => text.split(/(«[^»]*»)/).flatMap((part, index) => {
  if (index % 2) return [part]
  const bits: ReactNode[] = []
  let from = 0
  for (const match of part.matchAll(QUANTITY)) {
    bits.push(part.slice(from, match.index), (
      <b key={`${index}-${match.index}`} className="tele-figure">
        <span className="tele-figure-n">{match[1]}</span>{match[2] && <> {match[2]}</>}
      </b>
    ))
    from = match.index + match[0].length
  }
  return [...bits, part.slice(from)]
})

const Opening = ({ sheet, sheets, name, art }: { sheet: Of<'opening'>, sheets: SheetModel[] } & Page) => {
  const reduced = useReducedMotion()
  const [star, ...inset] = sheet.posters
  const [lead, ...rest] = sheet.figures

  return (
    <motion.section
      id="tele-p0"
      className="tele-spread tele-spread-cover"
      aria-label={sheet.label}
      initial={reduced ? false : { y: -36, scale: 1.05, rotate: -2.4, '--lift': 1 }}
      animate={{ y: 0, scale: 1, rotate: 0, '--lift': 0 }}
      transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="tele-cover">
        {star && <div className="tele-cover-star"><Photo poster={star} art={art} width={1280} eager /></div>}
        <header className="tele-mast" aria-hidden="true">
          <p className="tele-logo" style={{ '--letters': name.length + 4 } as React.CSSProperties}>Télé<span>{name}</span></p>
          <p className="tele-issue">N°<b>{sheet.year}</b>Édition annuelle</p>
        </header>
        <p className="tele-sticker" aria-hidden="true"><span>Numéro<b>spécial</b>rétro</span></p>
        <div className="tele-cover-lines">
          {sheet.lede && <p className="tele-cover-lede">{sheet.lede}</p>}
          <h1 className="tele-cover-title">{sheet.title}</h1>
          {lead && <p className="tele-cover-line tele-cover-line-lead">{figures(lead)}</p>}
          {rest.map((figure) => <p key={figure} className="tele-cover-line">{figures(figure)}</p>)}
          {!!inset.length && (
            <ul className="tele-inset">
              {inset.map((poster) => <li key={poster.key}><Photo poster={poster} art={art} width={320} eager /></li>)}
            </ul>
          )}
        </div>
        <Barcode />
      </div>
      <nav className="tele-contents" aria-label="Sommaire">
        <p className="tele-folio" aria-hidden="true"><span>Télé {name}</span><b>Sommaire</b><span>p. 1</span></p>
        <p className="tele-headline" aria-hidden="true">Au <span className="tele-band">sommaire</span></p>
        <ol>
          {sheets.slice(1).map((other, index) => (
            <li key={index}>
              <a href={anchor(`tele-p${(index + 1) * 2}`)}>
                <span className="tele-contents-rubric">{rubric(other)}</span>
                <span className="tele-contents-label">{other.label}</span>
                <span className="tele-contents-page">{(index + 1) * 2}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </motion.section>
  )
}

// Every viewer of the server is a line of the ratings, the reader's highlighted
const Rank = ({ sheet, name, page }: { sheet: Of<'rank'> } & Page) => (
  <Spread
    sheet={sheet}
    name={name}
    page={page}
    left={<>
      <h2 className="tele-headline"><span className="tele-band">Audience</span></h2>
      <Big value={sheet.rank} suffix={sheet.suffix} spoken={`${sheet.rank}${sheet.suffix}`} />
      <p className="tele-unit">{sheet.unit}</p>
      <p className="tele-standfirst">{figures(sheet.detail)}</p>
      <p className="tele-body">{figures(sheet.compare)}</p>
    </>}
    right={<Ratings sheet={sheet} />}
  />
)

// The ratings of the server: the first, the reader, the middle and the last, each with the hours known for it
const Ratings = ({ sheet }: { sheet: Of<'rank'> }) => {
  const middle = Math.ceil(sheet.users / 2)
  const hoursOf = (rank: number) => rank === sheet.rank ? sheet.hours : rank === 1 ? sheet.max : rank === middle ? sheet.median : null
  const top = sheet.max || sheet.hours

  return (
    <table className="tele-ratings" aria-hidden="true">
      <tbody>
        {[...new Set([1, sheet.rank, middle, sheet.users])].sort((a, b) => a - b).flatMap((rank, index, ranks) => {
          const hours = hoursOf(rank)
          return [
            index > 0 && rank - ranks[index - 1] > 1 && <tr key={`gap-${rank}`} className="tele-ratings-gap"><td colSpan={2}>…</td></tr>,
            <tr key={rank} className={rank === sheet.rank ? 'tele-ratings-you' : undefined}>
              <th>{rank}<sup>{rank === 1 ? 'er' : 'e'}</sup></th>
              <td>
                {rank === sheet.rank && <b>Toi</b>}
                {rank !== sheet.rank && rank === middle && <span className="tele-ratings-label">Médiane</span>}
                {hours !== null
                  ? <span className="tele-ratings-bar" style={{ '--share': Math.max(hours / top, 0.04) } as React.CSSProperties}><span>{number.format(hours)} h</span></span>
                  : rank !== sheet.rank && <span className="tele-ratings-blank" />}
              </td>
            </tr>,
          ]
        })}
      </tbody>
    </table>
  )
}

// A daily serial: one episode per evening of the run
const Streak = ({ sheet, art, ...page }: { sheet: Of<'streak'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={<>
      <h2 className="tele-headline"><span className="tele-band">Feuilleton</span></h2>
      <p className="tele-standfirst">{sheet.intro}</p>
      <Big value={sheet.evenings} spoken={sheet.spoken} />
      <p className="tele-unit">{sheet.unit}</p>
      <Calendar from={sheet.from} to={sheet.to} />
    </>}
    right={<>
      {sheet.lead
        ? (
          <article className="tele-pick">
            <Photo poster={sheet.poster} art={art} />
            <div>
              <h3 className="tele-pick-title">{sheet.poster.title}</h3>
              <p>{figures(sheet.span)}</p>
            </div>
          </article>
        )
        : <p className="tele-standfirst">{sheet.details}</p>}
      <ol className="tele-episodes">
        {[...new Set([1, 2, 3, sheet.evenings])].filter((episode) => episode <= sheet.evenings).map((episode, index, episodes) => {
          const { day, poster } = sheet.nights[episode - 1]
          return (
            <li key={episode} className={episode - (episodes[index - 1] || 0) > 1 ? 'tele-episodes-later' : undefined}>
              {poster && <Photo poster={poster} art={art} width={320} className="tele-episodes-poster" />}
              <b>Soir {episode}</b>
              <span className="tele-episodes-day">{day}</span>
              {poster && <span className="tele-episodes-title">{poster.title}</span>}
            </li>
          )
        })}
      </ol>
    </>}
  />
)

const DAY = 86400000
const noon = (date: string) => Date.parse(`${date}T12:00:00Z`)

// The months of the run as a wall calendar, its evenings struck through
const Calendar = ({ from, to }: { from: string, to: string }) => {
  const [start, end] = [noon(from), noon(to)]
  const months: Date[] = []
  for (let month = new Date(start); month.getTime() <= end; month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1, 12))) {
    months.push(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1, 12)))
  }

  return (
    <div className="tele-calendar" aria-hidden="true">
      {months.slice(0, 3).map((month) => {
        const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0, 12)).getUTCDate()
        // Monday first
        const offset = (month.getUTCDay() + 6) % 7
        return (
          <div key={month.getTime()} className="tele-calendar-month">
            <p className="tele-calendar-name">{month.toLocaleDateString('fr-FR', { month: 'long', timeZone: 'UTC' })}</p>
            <ol>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <li key={`h${index}`} className="tele-calendar-head">{day}</li>)}
              {Array.from({ length: days }, (_, index) => {
                const time = month.getTime() + index * DAY
                const on = time >= start && time <= end
                return <li key={index} className={`${on ? 'tele-calendar-on' : ''}${time === end ? ' tele-calendar-last' : ''}`} style={index === 0 ? { gridColumnStart: offset + 1 } : undefined}>{index + 1}</li>
              })}
            </ol>
          </div>
        )
      })}
    </div>
  )
}

// The year as a listings grid, one line per month, the show watched the most in each
const Months = ({ sheet, art, ...page }: { sheet: Of<'months'> } & Page) => {
  const { shows, elapsed, max, peak } = sheet

  return (
    <Spread
      sheet={sheet}
      {...page}
      left={<>
        <Headline lines={sheet.lines} />
        <p className="tele-standfirst">{sheet.lede}</p>
        {peak && (
          <article className="tele-pick">
            <span className="tele-tag" aria-hidden="true">Coup de cœur</span>
            <Photo poster={peak.show} art={art} />
            <div>
              <h3 className="tele-pick-title">{peak.show.title}</h3>
              <p>En <b>{peak.month}</b>{THIN}: {figures(peak.bare)}</p>
            </div>
          </article>
        )}
      </>}
      right={
        <ol className="tele-grid">
          {MONTHS.map((month, index) => {
            const show = shows[index]
            const future = index >= elapsed
            return (
              <li key={month} className={`tele-slot${peak?.index === index ? ' tele-slot-peak' : ''}${future ? ' tele-slot-future' : ''}`}>
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
      }
    />
  )
}

// A paragraph of the model cut at its sentences, so each can take its own place on the page
const sentences = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9«])/)

// A photo with its caption and a credit line, as a magazine prints them
// A still can carry its poster inset, so the title reads at a glance
const Pictured = ({ poster, art, kind = 'thumb', width = 640, line, inset, className = '' }: { poster: WrappedPoster, art: Art, kind?: 'thumb' | 'art', width?: 320 | 640 | 1280, line?: string, inset?: boolean, className?: string }) => (
  <figure className={`tele-pictured ${className}`}>
    {inset
      ? (
        <div className="tele-pictured-frame">
          <Photo poster={poster} art={art} kind={kind} width={width} />
          <Photo poster={poster} art={art} width={320} className="tele-pictured-inset" />
        </div>
      )
      : <Photo poster={poster} art={art} kind={kind} width={width} />}
    <figcaption>
      <b>{poster.title}</b>{line && <> · {line}</>}
      <span className="tele-credit" aria-hidden="true">Photo DR</span>
    </figcaption>
  </figure>
)

// The first poster large, the others inset in a row under it
const Gallery = <P extends WrappedPoster>({ posters, art, caption }: { posters: P[], art: Art, caption?: (poster: P) => string }) => {
  const [lead, ...rest] = posters

  return lead ? (
    <div className="tele-gallery">
      <Pictured poster={lead} art={art} kind={lead.art ? 'art' : 'thumb'} width={1280} line={caption?.(lead)} inset={!!(lead.art && lead.thumb)} className="tele-gallery-lead" />
      {!!rest.length && (
        <ul className="tele-gallery-row" data-count={rest.length}>
          {rest.map((poster) => (
            <li key={poster.key}>
              <Photo poster={poster} art={art} width={320} />
              <span className="tele-thumb-title">{poster.title}</span>
              {caption && <span className="tele-thumb-caption">{caption(poster)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null
}

// Each figure on its own line, set as large as the page allows
const Stats = ({ stats }: { stats: Stat[] }) => (
  <ul className="tele-stats">
    {stats.map((stat) => <li key={stat.unit}><b>{stat.value}</b> <span>{stat.unit}</span></li>)}
  </ul>
)

const Quote = ({ text }: { text: ReactNode }) => <p className="tele-quote">{text}</p>

const Binge = ({ sheet, art, ...page }: { sheet: Of<'binge'> } & Page) => {
  const { pace } = sheet

  return (
    <Spread
      sheet={sheet}
      {...page}
      left={<>
        <Headline lines={sheet.lines} />
        <figure className="tele-still">
          <Photo poster={sheet.poster} art={art} kind="art" width={1280} />
          <span className="tele-tag" aria-hidden="true">Soirée spéciale</span>
        </figure>
        <h3 className="tele-title">{sheet.title}</h3>
        {sheet.date && <p className="tele-standfirst">{sheet.date}</p>}
        <Stats stats={sheet.stats} />
      </>}
      right={pace && sheet.paced_stats.length ? (
        <article className="tele-pick">
          <Photo poster={pace} art={art} />
          <div>
            <h3 className="tele-pick-title">{pace.title}</h3>
            <Stats stats={sheet.paced_stats} />
          </div>
        </article>
      ) : undefined}
    />
  )
}

const Night = ({ sheet, art, ...page }: { sheet: Of<'night'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={<Photo poster={sheet.poster} art={art} width={1280} className="tele-full-poster" />}
    right={<>
      <Headline lines={sheet.lines} />
      <p className="tele-unit">{sheet.date}</p>
      <p className="tele-clock" aria-hidden="true">{sheet.end}</p>
      <p className="tele-body">Tu éteins à <strong>{sheet.end}</strong>{figures(sheet.after)}.</p>
      {sheet.listing
        ? <>
          <p className="tele-box-title">{sheet.listing}</p>
          <ol className="tele-listing">
            {sheet.schedule.map((line, index) => (
              <li key={`${line.start}-${index}`} className={index === sheet.schedule.length - 1 ? 'tele-listing-last' : undefined}>
                <span className="tele-listing-time"><b>{line.start}</b><span>{line.end}</span></span>
                <Photo poster={line.poster} art={art} width={320} className="tele-listing-poster" />
                <span className="tele-listing-title">{line.poster.title}{line.what && <span>{line.what}</span>}</span>
              </li>
            ))}
          </ol>
        </>
        : <p className="tele-body">{sheet.last}</p>}
    </>}
  />
)

const Server = ({ sheet, art, ...page }: { sheet: Of<'server'> } & Page) => {
  const [chapo, ...more] = sentences(sheet.bare)

  return (
    <Spread
      sheet={sheet}
      {...page}
      left={<>
        <figure className="tele-exclusive">
          <Photo poster={sheet.poster} art={art} width={1280} className="tele-full-poster" />
          <span className="tele-ribbon" aria-hidden="true">Exclusivité</span>
        </figure>
        <p className="tele-caption"><b>{sheet.poster.title}</b><span className="tele-credit" aria-hidden="true">Photo DR</span></p>
      </>}
      right={<>
        <Headline lines={sheet.lines} />
        <h3 className="tele-title">{sheet.title}</h3>
        <p className="tele-standfirst">{figures(chapo)}</p>
        {sheet.poster.art && <Pictured poster={sheet.poster} art={art} kind="art" width={1280} />}
        {!!more.length && <Quote text={figures(more.join(' '))} />}
      </>}
    />
  )
}

const Figure = ({ sheet, art, ...page }: { sheet: Of<'figure'> } & Page) => {
  const [before, after] = sheet.highlight ? sheet.unit.split(sheet.highlight) : [sheet.unit]
  const [chapo, ...more] = sentences(sheet.details)
  const twin = sheet.variant === 'twin'

  return (
    <Spread
      sheet={sheet}
      {...page}
      left={<>
        {sheet.lines ? <Headline lines={sheet.lines} /> : <h2 className="tele-headline"><span className="tele-band">Rareté</span></h2>}
        {twin && sheet.highlight && sheet.sides
          ? <Venn name={sheet.highlight} count={sheet.count} spoken={sheet.spoken} sides={sheet.sides} />
          : <Big value={sheet.count} spoken={sheet.spoken} />}
        <div className={twin ? 'tele-venn-caption' : 'tele-figure-caption'}>
          <p className="tele-unit">{before}{sheet.highlight && <><mark className="tele-mark">{sheet.highlight}</mark>{after}</>}</p>
          <p className="tele-standfirst">{figures(chapo)}</p>
        </div>
        {!twin && sheet.posters.length > 1 && (
          <aside className="tele-box">
            <p className="tele-box-title">{more.join(' ')}</p>
            <ol className="tele-palmares">
              {sheet.posters.map((poster) => <li key={poster.key}>{poster.title}</li>)}
            </ol>
          </aside>
        )}
      </>}
      right={sheet.posters.length ? <>
        {twin && !!more.length && <p className="tele-box-title">{more.join(' ')}</p>}
        <Gallery posters={sheet.posters} art={art} />
      </> : undefined}
    />
  )
}

// Two viewers as two circles, the titles they share where they cross
const Venn = ({ name, count, spoken, sides }: { name: string, count: number, spoken: string, sides: { you: number, them: number | null } }) => (
  <div className="tele-venn">
    <p className="tele-venn-side tele-venn-you" aria-hidden="true"><b>Toi</b><span>{number.format(sides.you)}</span></p>
    <p className="tele-venn-side tele-venn-them" aria-hidden="true"><b>{name}</b>{sides.them !== null && <span>{number.format(sides.them)}</span>}</p>
    <p className="tele-venn-shared"><span aria-hidden="true">{number.format(count)}</span><span className="visually-hidden">{spoken}</span></p>
  </div>
)

// Each title watched at two is a reader's letter, signed with the other viewer
const Letter = ({ poster, art, lead }: { poster: Of<'duo'>['posters'][number], art: Art, lead?: boolean }) => (
  <article className={`tele-letter${lead ? ' tele-letter-lead' : ''}`}>
    <Photo poster={poster} art={art} width={lead ? 640 : 320} />
    <div>
      <h3 className="tele-pick-title">{poster.title}</h3>
      <p className="tele-letter-sign">{figures(poster.caption)}</p>
    </div>
  </article>
)

const Duo = ({ sheet, art, ...page }: { sheet: Of<'duo'> } & Page) => {
  const [chapo, ...more] = sentences(sheet.lede)
  const [lead, ...rest] = sheet.posters

  return (
    <Spread
      sheet={sheet}
      {...page}
      left={<>
        <Headline lines={sheet.lines} />
        <p className="tele-standfirst">{figures(chapo)}</p>
        {!!more.length && <p className="tele-box-title">{figures(more.join(' '))}</p>}
        {lead && <Letter poster={lead} art={art} lead />}
      </>}
      right={rest.length ? <div className="tele-letters">{rest.map((poster) => <Letter key={poster.key} poster={poster} art={art} />)}</div> : undefined}
    />
  )
}

// Each figure a review, with its poster
const Review = ({ item: { what, poster, detail, when }, art, lead }: { item: Of<'posters'>['items'][number], art: Art, lead?: boolean }) => (
  <article className={`tele-review${lead ? ' tele-review-lead' : ''}`}>
    <Photo poster={poster} art={art} />
    <div>
      <p className="tele-review-what">{what}</p>
      <h3 className="tele-pick-title">{poster.title}</h3>
      <p className="tele-review-detail">{figures(detail)}</p>
      {when && <p className="tele-review-when">{when}</p>}
    </div>
  </article>
)

// A review on the facing page opens on the film's still, its poster beside the words
const Feature = ({ item: { what, poster, detail, when }, art }: { item: Of<'posters'>['items'][number], art: Art }) => (
  <article className="tele-feature">
    {poster.art && <Photo poster={poster} art={art} kind="art" width={1280} />}
    <div className="tele-feature-body">
      <Photo poster={poster} art={art} />
      <div>
        <p className="tele-review-what">{what}</p>
        <h3 className="tele-title">{poster.title}</h3>
        <Quote text={figures(detail)} />
        {when && <p className="tele-review-when">{when}</p>}
      </div>
    </div>
  </article>
)

const Posters = ({ sheet, art, ...page }: { sheet: Of<'posters'> } & Page) => {
  const [lead, ...rest] = sheet.items

  return (
    <Spread
      sheet={sheet}
      {...page}
      left={<>
        <Headline lines={sheet.lines} />
        {lead && <Review item={lead} art={art} lead />}
        {lead?.poster.art && <Pictured poster={lead.poster} art={art} kind="art" width={1280} line={lead.what} />}
      </>}
      right={rest.length ? rest.map((item) => <Feature key={item.poster.key} item={item} art={art} />) : undefined}
    />
  )
}

const Sign = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" />
    <path d="M28 64 C 34 36, 48 30, 50 50 C 52 70, 66 64, 72 36" />
    <circle className="tele-sign-dot" cx="72" cy="36" r="5" />
  </svg>
)

const Genre = ({ sheet, art, ...page }: { sheet: Of<'genre'> } & Page) => {
  const { lead } = sheet

  return (
    <Spread
      sheet={sheet}
      {...page}
      tone="blue"
      left={<>
        <Headline lines={sheet.lines} />
        <div className="tele-sign">
          <Sign />
          <p><span className="tele-sign-label" aria-hidden="true">Ton signe</span><span className="tele-sign-name">{sheet.name}</span></p>
        </div>
        <p className="tele-standfirst">{figures(sheet.count)}</p>
        <Gallery posters={sheet.posters} art={art} />
      </>}
      right={lead ? <>
        <dl className="tele-reading">
          <dt aria-hidden="true">Ascendant</dt>
          <dd><b className="tele-reading-name">{lead.name}</b> {figures(lead.role)}</dd>
        </dl>
        {lead.posters.length ? <Gallery posters={lead.posters} art={art} /> : <Sign className="tele-sign-wheel" />}
      </> : undefined}
    />
  )
}

// The end of transmission: a test card after the last programme
const Finale = ({ sheet, art, ...page }: { sheet: Of<'finale'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={<>
      <Photo poster={sheet.poster} art={art} width={1280} className="tele-full-poster" />
      <p className="tele-caption"><b>{sheet.poster.title}</b><span className="tele-credit" aria-hidden="true">Photo DR</span></p>
    </>}
    right={<>
      <Headline lines={sheet.lines} />
      <h3 className="tele-title">{sheet.title}</h3>
      <p className="tele-standfirst">{sheet.date}</p>
      {!sheet.closed && <p className="tele-stamp">Provisoire</p>}
      {sheet.poster.art && <Pictured poster={sheet.poster} art={art} kind="art" width={1280} />}
      <TestCard />
      <p className="tele-end">{sheet.end}</p>
    </>}
  />
)
