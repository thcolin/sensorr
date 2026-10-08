import { ReactNode, useEffect, useState } from 'react'
import type { WrappedPoster } from '@sensorr/sensorr'
import { QUOTED, months, number, quantity, quoted, suffix, t, type SheetModel, type Stat } from '../../sheets'
import { Sentence } from '../../Sentence'
import type { Art, ThemeProps } from '../types'
import './videoclub.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>

// Tape and case colours, picked from the key so a show keeps its colour from one shelf to the next
const TAPES = ['#c3242b', '#1c4fb8', '#1e8a4a', '#d99a12', '#6c2bb3', '#d9531e']
export const tapeOf = (key: string) => TAPES[[...key].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7) % TAPES.length]
const tilts = (count: number) => Array.from({ length: count }, (_, index) => count > 1 ? (index / (count - 1) - 0.5) * 24 : 0)

// A quantity is priced with its unit: not a date, nor the digits of a name or of a title in quotes
export const figures = (text: string) => text.split(QUOTED).flatMap((part, index) => {
  if (index % 2) return [part]
  const bits: ReactNode[] = []
  let from = 0
  for (const match of part.matchAll(quantity())) {
    bits.push(part.slice(from, match.index), (
      <b key={`${index}-${match.index}`} className="videoclub-figure">
        <span className="videoclub-figure-n">{match[1]}</span>{match[2] && <> {match[2]}</>}
      </b>
    ))
    from = match.index + match[0].length
  }
  return [...bits, part.slice(from)]
})

// A paragraph of the model cut at its sentences
export const sentences = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9«“])/)

// Price tags hung side by side, one figure each, the unit under it
export const Tags = ({ stats }: { stats: Stat[] }) => (
  <ul className="videoclub-tags">
    {stats.map((stat, index) => (
      <li key={stat.unit} className="videoclub-tag" style={{ '--turn': `${index % 2 ? 3 : -3}deg` } as React.CSSProperties}>
        <b>{stat.value}</b> <span>{stat.unit}</span>
      </li>
    ))}
  </ul>
)

const Videoclub = ({ share, sheets, colophon, art }: ThemeProps) => (
  <main className="videoclub">
    {sheets.map((sheet, index) => {
      switch (sheet.kind) {
        case 'opening': return <Opening key={index} sheet={sheet} art={art} first={sheet.first ?? undefined} />
        case 'rank': return <Rank key={index} sheet={sheet} name={share.name} server={share.server} />
        case 'streak': return <Streak key={index} sheet={sheet} art={art} />
        case 'months': return <Months key={index} sheet={sheet} art={art} />
        case 'binge': return <Binge key={index} sheet={sheet} art={art} episodes={sheet.episodes || 0} />
        case 'night': return <Night key={index} sheet={sheet} art={art} />
        case 'server': return <Server key={index} sheet={sheet} art={art} />
        case 'figure': return sheet.variant === 'twin' ? <Twin key={index} sheet={sheet} art={art} /> : <Nobody key={index} sheet={sheet} art={art} />
        case 'duo': return <Duo key={index} sheet={sheet} art={art} />
        case 'posters': return <Posters key={index} sheet={sheet} art={art} />
        case 'genre': return <Genre key={index} sheet={sheet} art={art} />
        case 'finale': return <Finale key={index} sheet={sheet} art={art} />
        default: return null
      }
    })}
    <footer className="videoclub-colophon">
      {colophon.short && <p className="videoclub-colophon-short">{colophon.short}</p>}
      <p>{colophon.text}</p>
    </footer>
  </main>
)

export default Videoclub

export const Neon = ({ lines, as: Tag = 'h2', tone = 'pink', className }: { lines: string[], as?: 'h1' | 'h2' | 'p', tone?: 'pink' | 'cyan', className?: string }) => (
  <Tag className={`videoclub-neon videoclub-neon-${tone} ${className || ''}`}>
    {lines.map((line) => <span key={line}>{line}</span>)}
  </Tag>
)

// A VHS case facing out: the sleeve under the plastic lip, a sticker, a handwritten label
export const Box = ({ poster, art, width = 640, tilt = 0, sticker, label, className, eager }: { poster: WrappedPoster, art: Art, width?: 320 | 640 | 1280, tilt?: number, sticker?: string, label?: string, className?: string, eager?: boolean }) => {
  const src = art(poster, 'thumb', width)

  return (
    <figure className={`videoclub-box ${className || ''}`} style={{ '--ry': `${tilt}deg`, '--case': tapeOf(poster.key) } as React.CSSProperties}>
      <span className="videoclub-box-case">
        <span className="videoclub-box-sleeve">
          {src ? <img src={src} alt={poster.title} loading={eager ? 'eager' : 'lazy'} /> : <span className="videoclub-box-blank">{poster.title}</span>}
        </span>
        {sticker && <span className="videoclub-sticker">{sticker}</span>}
      </span>
      {label && <figcaption className="videoclub-label">{label}</figcaption>}
    </figure>
  )
}

// The spine of a tape on its shelf, the title written by hand on its label
export const Spines = ({ poster, count }: { poster: WrappedPoster, count: number }) => (
  <span className="videoclub-spines" aria-hidden="true" style={{ '--tape': tapeOf(poster.key) } as React.CSSProperties}>
    {Array.from({ length: count }, (_, index) => <i key={index} className="videoclub-spine"><span>{poster.title}</span></i>)}
  </span>
)

// Covers standing on a plank, each with its title and an optional handwritten note
const Shelf = ({ posters, art, titled = true, className }: { posters: WrappedPoster[], art: Art, titled?: boolean, className?: string }) => (
  <ul className={`videoclub-shelf ${className || ''}`} data-count={posters.length}>
    {posters.map((poster, index) => (
      <li key={poster.key} className="videoclub-shelf-entry">
        <Box poster={poster} art={art} width={320} tilt={tilts(posters.length)[index]} />
        <span className="videoclub-plank" aria-hidden="true" />
        {titled && <span className="videoclub-shelf-title">{poster.title}</span>}
      </li>
    ))}
  </ul>
)

// The shop's name over its door: the head on the lightbox, the name in tube, the year on its plate
export const Sign = ({ sheet }: { sheet: Of<'opening'> }) => {
  const [lit, setLit] = useState(false)
  const at = sheet.title.indexOf(sheet.name)
  const [head, tail] = at < 0 ? [sheet.title, ''] : [sheet.title.slice(0, at).trim(), sheet.title.slice(at + sheet.name.length).trim()]
  const letters = at < 0 ? [] : [...sheet.name]
  // One tube has gone out, as on any sign that has been up a few winters
  const dead = letters.length > 3 ? Math.floor(letters.length / 2) : -1

  useEffect(() => {
    // The tubes strike once the face is in, or the flicker plays on a fallback font
    let live = true
    const strike = () => live && setLit(true)
    document.fonts?.load('1em "Tilt Neon"').then(strike, strike) ?? strike()
    return () => { live = false }
  }, [])

  return (
    <h1 className={`videoclub-sign ${lit ? 'videoclub-sign-on' : ''}`}>
      <span className="visually-hidden">{sheet.title}</span>
      <span className="videoclub-fascia" aria-hidden="true">
        <span className="videoclub-fascia-face">{head}</span>
      </span>
      {!!letters.length && (
        <span className="videoclub-tube" aria-hidden="true">
          {letters.map((letter, index) => (
            <span
              key={index}
              className={index === dead ? 'videoclub-tube-dead' : undefined}
              style={{ '--delay': `${0.5 + ((index * 7) % 5) * 0.12}s` } as React.CSSProperties}
            >
              {letter === ' ' ? '\u00a0' : letter}
            </span>
          ))}
        </span>
      )}
      {tail && <span className="videoclub-plate" aria-hidden="true">{tail}</span>}
    </h1>
  )
}

export const Opening = ({ sheet, art, first }: { sheet: Of<'opening'>, art: Art, first?: string }) => {
  // The hero case stands in the middle, the others fan out from it
  const order = [3, 1, 0, 2, 4].map((index) => sheet.posters[index]).filter(Boolean)

  return (
    <section className="videoclub-sheet videoclub-opening" aria-label={sheet.label}>
      <Sign sheet={sheet} />
      {!!order.length && (
        <div className="videoclub-front">
          {order.map((poster, index) => (
            <Box
              key={poster.key}
              poster={poster}
              art={art}
              className={poster === sheet.posters[0] ? 'videoclub-box-hero' : undefined}
              tilt={tilts(order.length)[index]}
              sticker={poster.key === first ? t('wrapped.videoclub.firstRental') : undefined}
            />
          ))}
        </div>
      )}
      <div className="videoclub-counter">
        {sheet.lede && <p className="videoclub-lede">{figures(sheet.lede)}</p>}
        <div className="videoclub-ticket videoclub-ticket-receipt">
          <p className="videoclub-ticket-head" aria-hidden="true">{t('wrapped.videoclub.receipt', { year: sheet.year })}</p>
          <ul>
            {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}

// The membership card, its number embossed in the plastic
export const Rank = ({ sheet, name, server }: { sheet: Of<'rank'>, name: string, server: string | null }) => (
  <section className="videoclub-sheet videoclub-rank" aria-label={sheet.label}>
    <Neon lines={[sheet.label]} tone="cyan" />
    <div className="videoclub-card">
      <p className="visually-hidden">{sheet.rank}{sheet.suffix} {sheet.unit}</p>
      <div className="videoclub-card-face" aria-hidden="true">
        <span className="videoclub-card-brand">{t('wrapped.themes.videoclub')}</span>
        {server && <span className="videoclub-card-server">{server}</span>}
        <span className="videoclub-card-chip" />
        <span className="videoclub-card-number">{String(sheet.rank).padStart(4, '0')} / {number.format(sheet.users)}</span>
        <span className="videoclub-card-holder">{name}</span>
        <span className="videoclub-card-since">{sheet.rank}<sup>{sheet.suffix}</sup> {sheet.unit}</span>
      </div>
    </div>
    <div className="videoclub-rank-text">
      <p className="videoclub-lede">{figures(sheet.detail)}</p>
      <Board sheet={sheet} />
    </div>
  </section>
)

// The best customers, pinned on the felt letter board by the till: the first, the reader, the middle and the last
const Board = ({ sheet }: { sheet: Of<'rank'> }) => {
  const middle = Math.ceil(sheet.users / 2)
  const hoursOf = (rank: number) => rank === sheet.rank ? sheet.hours : rank === 1 ? sheet.max : rank === middle ? sheet.median : null

  return (
    <div className="videoclub-board">
      <p className="videoclub-board-head" aria-hidden="true">{t('wrapped.videoclub.topCustomers')}</p>
      <ol aria-hidden="true">
        {[...new Set([1, sheet.rank, middle, sheet.users])].sort((a, b) => a - b).flatMap((rank, index, ranks) => {
          const hours = hoursOf(rank)
          return [
            index > 0 && rank - ranks[index - 1] > 1 && <li key={`gap-${rank}`} className="videoclub-board-gap">…</li>,
            <li key={rank} className={rank === sheet.rank ? 'videoclub-board-you' : undefined}>
              <span>{rank}{suffix(rank)}</span>
              <span>{rank === sheet.rank ? t('wrapped.common.you') : rank === middle ? t('wrapped.common.median') : ''}</span>
              <span>{hours !== null ? t('wrapped.common.hours', { hours: number.format(hours) }) : ''}</span>
            </li>,
          ]
        })}
      </ol>
      <p className="visually-hidden">{sheet.compare}</p>
    </div>
  )
}

// The rental ticket, stamped once per evening of the streak
const Streak = ({ sheet, art }: { sheet: Of<'streak'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-streak" aria-label={sheet.label}>
    <Neon lines={[sheet.intro]} tone="pink" className="videoclub-neon-long" />
    <div className="videoclub-pair">
      <Box poster={sheet.poster} art={art} className="videoclub-box-large" tilt={-8} />
      <div className="videoclub-ticket videoclub-ticket-stamps">
        <p className="videoclub-ticket-head" aria-hidden="true">{t('wrapped.videoclub.rentalTicket')}</p>
        <p className="videoclub-ticket-figure">
          <span aria-hidden="true">{number.format(sheet.evenings)}</span>
          <span className="visually-hidden">{sheet.spoken}</span>
          <span className="videoclub-ticket-unit" aria-hidden="true">{sheet.unit}</span>
        </p>
        <ol className="videoclub-stamps" aria-hidden="true">
          {sheet.nights.map(({ day }, index) => <li key={index} style={{ '--turn': `${((index * 37) % 23) - 11}deg` } as React.CSSProperties}>{day.match(/\d+/)?.[0]}</li>)}
        </ol>
        <p className="videoclub-ticket-foot">{figures(sheet.details)}</p>
      </div>
    </div>
    {sheet.nights.some(({ poster }) => poster) && (
      <div className="videoclub-run">
        <p className="videoclub-aisle-tag" aria-hidden="true">{t('wrapped.videoclub.returned')}</p>
        <ol className="videoclub-run-tapes" data-long={sheet.nights.length > 16 || undefined}>
          {sheet.nights.map(({ short, poster }, index) => (
            <li key={index}>
              {poster
                ? <Box poster={poster} art={art} width={320} className="videoclub-box-mini" />
                : <span className="videoclub-run-empty" aria-hidden="true" />}
              <small>{short}</small>
            </li>
          ))}
        </ol>
      </div>
    )}
  </section>
)

// Twelve shelves, one per month, holding as many tapes as the month had episodes of its show
const Months = ({ sheet, art }: { sheet: Of<'months'>, art: Art }) => {
  const { shows, elapsed, max, peak } = sheet

  return (
    <section className="videoclub-sheet videoclub-months" aria-label={sheet.label}>
      <Neon lines={sheet.lines} tone="cyan" />
      <p className="videoclub-lede">{sheet.lede}</p>
      <ol className="videoclub-rack" role="img" aria-label={sheet.alt}>
        {months().map((month, index) => {
          const show = index < elapsed ? shows[index] : null
          return (
            <li key={month} className={`videoclub-rack-row ${index >= elapsed ? 'videoclub-rack-future' : ''} ${peak?.index === index ? 'videoclub-rack-peak' : ''}`}>
              <span className="videoclub-rack-tag">
                {month}
                {show && <small><b>{number.format(show.episodes)}</b> {t('wrapped.units.episodes', { count: show.episodes })}</small>}
              </span>
              {show && (
                <>
                  <Spines poster={show} count={Math.max(1, Math.round((show.episodes / max) * 12))} />
                  <Box poster={show} art={art} width={320} className="videoclub-box-mini" sticker={peak?.index === index ? 'Top 1' : undefined} />
                </>
              )}
            </li>
          )
        })}
      </ol>
      {peak && (
        <div className="videoclub-pace videoclub-peak">
          <Box poster={peak.show} art={art} width={320} tilt={-6} sticker="Top 1" />
          <div className="videoclub-shelf-card">
            <h3>{peak.show.title}</h3>
            <p><Sentence i18nKey="wrapped.sheets.months.peak.month" values={{ month: peak.month }} tag={<strong />} text={peak.bare} figures={figures} /></p>
          </div>
        </div>
      )}
    </section>
  )
}

// A box set, one spine per episode of that evening
export const Binge = ({ sheet, art, episodes }: { sheet: Of<'binge'>, art: Art, episodes: number }) => (
  <section className={`videoclub-sheet videoclub-binge${sheet.paced_stats.length ? '' : ' videoclub-binge-solo'}`} aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="pink" />
    <div className="videoclub-binge-visual">
      <div className="videoclub-set" style={{ '--count': Math.min(episodes, 40) } as React.CSSProperties}>
        <Box poster={sheet.poster} art={art} className="videoclub-box-large" />
        {!!episodes && <Spines poster={sheet.poster} count={Math.min(episodes, 40)} />}
      </div>
      <div className="videoclub-shelf-card">
        <h3>{sheet.title}</h3>
        {sheet.date && <p>{sheet.date}</p>}
      </div>
      <Tags stats={sheet.stats} />
    </div>
    {sheet.pace && !!sheet.paced_stats.length && (
      <div className="videoclub-binge-text">
        <div className="videoclub-pace">
          <Box poster={sheet.pace} art={art} width={320} tilt={6} />
          <div className="videoclub-pace-text">
            <div className="videoclub-shelf-card">
              <h3>{sheet.pace.title}</h3>
            </div>
            <Tags stats={sheet.paced_stats} />
          </div>
        </div>
      </div>
    )}
  </section>
)

// The night counter: the last tape half through the returns slot
const Night = ({ sheet, art }: { sheet: Of<'night'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-night" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="cyan" />
    <div className="videoclub-returns">
      <div className="videoclub-returns-slot">
        <Box poster={sheet.poster} art={art} className="videoclub-box-returned" />
      </div>
      <p className="videoclub-returns-plate" aria-hidden="true">{t('wrapped.videoclub.returns')}</p>
    </div>
    <div className="videoclub-night-text">
      <p className="videoclub-night-date">{sheet.date}</p>
      <p className="videoclub-lede"><Sentence i18nKey="wrapped.sheets.night.off" values={{ end: sheet.end }} tag={<strong className="videoclub-time" />} text={sheet.after} figures={figures} /></p>
      {sheet.listing
        ? (
          <div className="videoclub-ticket videoclub-ticket-returns">
            <p className="videoclub-ticket-head">{sheet.listing}</p>
            <ol>
              {sheet.schedule.map((line, index) => (
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

export const Server = ({ sheet, art }: { sheet: Of<'server'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-server" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="pink" />
    <div className="videoclub-spot">
      <Box poster={sheet.poster} art={art} className="videoclub-box-large" sticker={t(sheet.first ? 'wrapped.videoclub.exclusive' : 'wrapped.videoclub.sameWeek')} />
    </div>
    <div className="videoclub-shelf-card">
      <h3>{sheet.title}</h3>
      {sentences(sheet.bare).map((sentence) => <p key={sentence}>{figures(sentence)}</p>)}
    </div>
  </section>
)

// Personne d’autre: the shelf of the titles nobody else rents
export const Nobody = ({ sheet, art }: { sheet: Of<'figure'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-nobody" aria-label={sheet.label}>
    <Neon lines={[sheet.label]} tone="cyan" />
    <p className="videoclub-price">
      <span aria-hidden="true">{number.format(sheet.count)}</span>
      <span className="visually-hidden">{sheet.spoken}</span>
      <span className="videoclub-price-unit">{sheet.unit}</span>
    </p>
    <p className="videoclub-lede">{figures(sheet.details)}</p>
    {!!sheet.posters.length && (
      <div className="videoclub-aisle">
        <p className="videoclub-aisle-tag" aria-hidden="true">{t('wrapped.videoclub.rarities')}</p>
        <Shelf posters={sheet.posters} art={art} />
      </div>
    )}
  </section>
)

// Ton jumeau: a loan card both names are written on
export const Twin = ({ sheet, art }: { sheet: Of<'figure'>, art: Art }) => {
  const [before, after] = sheet.highlight ? sheet.unit.split(sheet.highlight) : [sheet.unit, '']
  const [chapo, ...more] = sentences(sheet.details)

  return (
    <section className="videoclub-sheet videoclub-twin" aria-label={sheet.label}>
      <Neon lines={sheet.lines || [sheet.label]} tone="pink" />
      <div className="videoclub-loan">
        <p className="videoclub-loan-head" aria-hidden="true">{t('wrapped.videoclub.loanCard')}</p>
        <p className="videoclub-loan-figure">
          <span aria-hidden="true">{number.format(sheet.count)}</span>
          <span className="visually-hidden">{sheet.spoken}</span>
          <span className="videoclub-loan-unit">{before}{sheet.highlight && <em>{sheet.highlight}</em>}{after}</span>
        </p>
        {sheet.sides && (
          <dl className="videoclub-loan-ledger">
            <div><dt>{t('wrapped.common.you')}</dt><dd>{t('wrapped.count.titles', { count: sheet.sides.you })}</dd></div>
            {sheet.highlight && sheet.sides.them !== null && <div><dt>{sheet.highlight}</dt><dd>{t('wrapped.count.titles', { count: sheet.sides.them })}</dd></div>}
          </dl>
        )}
        {/* The ledger says the first sentence already */}
        {(sheet.sides ? more : [chapo, ...more]).map((sentence) => <p key={sentence} className="videoclub-loan-details">{figures(sentence)}</p>)}
      </div>
      {!!sheet.posters.length && <Shelf posters={sheet.posters} art={art} />}
    </section>
  )
}

// Vus à deux: one loan card per title, the other borrower written in
export const Duo = ({ sheet, art }: { sheet: Of<'duo'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-duo" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="cyan" />
    <p className="videoclub-lede">{figures(sheet.lede)}</p>
    <ul className="videoclub-loans" data-count={sheet.posters.length}>
      {sheet.posters.map((poster, index) => (
        <li key={poster.key} className="videoclub-loan videoclub-loan-small" style={{ '--turn': `${index % 2 ? 1.5 : -1.5}deg` } as React.CSSProperties}>
          <Box poster={poster} art={art} width={320} />
          <div>
            <p className="videoclub-loan-title">{poster.title}</p>
            <p className="videoclub-loan-hand">{figures(poster.caption)}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
)

// One case per figure, the figure written on its label
export const Posters = ({ sheet, art }: { sheet: Of<'posters'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-posters" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone={sheet.variant === 'outliers' ? 'cyan' : 'pink'} />
    <ol className="videoclub-shelf videoclub-shelf-large" data-count={sheet.items.length}>
      {sheet.items.map(({ what, poster, detail, when }, index) => (
        <li key={poster.key} className="videoclub-shelf-entry">
          <Box poster={poster} art={art} tilt={tilts(sheet.items.length)[index]} sticker={what} label={detail} />
          <span className="videoclub-plank" aria-hidden="true" />
          <h3 className="videoclub-shelf-title">{poster.title}</h3>
          {when && <p className="videoclub-shelf-when">{when}</p>}
        </li>
      ))}
    </ol>
  </section>
)

// The genre's own aisle, its sign hanging over the shelves
export const Genre = ({ sheet, art }: { sheet: Of<'genre'>, art: Art }) => {
  const { lead } = sheet

  return (
    <section className="videoclub-sheet videoclub-genre" aria-label={sheet.label}>
      <Neon lines={sheet.lines} tone="cyan" as="h2" />
      <p className="videoclub-aisle-sign">{sheet.name}</p>
      <p className="videoclub-lede">{figures(sheet.count)}</p>
      <Shelf posters={sheet.posters} art={art} />
      {lead && <p className="videoclub-lede"><strong>{lead.name}</strong> {figures(lead.role)}</p>}
      {/* A show in the lead is its own poster, its title already written above */}
      {lead && !!lead.posters.length && <Shelf posters={lead.posters} art={art} titled={!lead.posters.every((poster) => quoted(poster.title) === lead.name)} />}
    </section>
  )
}

// Closing time: the shutter comes down over the last case in the window
export const Finale = ({ sheet, art }: { sheet: Of<'finale'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-finale" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="pink" />
    <div className="videoclub-window" data-closed={sheet.closed}>
      <Box poster={sheet.poster} art={art} className="videoclub-box-large" sticker={sheet.closed ? undefined : t('wrapped.common.draft')} />
      <div className="videoclub-shutter" aria-hidden="true" />
      <p className="videoclub-end">{sheet.end}</p>
    </div>
    <div className="videoclub-shelf-card">
      <h3>{sheet.title}</h3>
      <p>{sheet.date}</p>
    </div>
  </section>
)
