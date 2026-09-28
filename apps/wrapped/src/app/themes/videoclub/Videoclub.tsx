import { useEffect, useState } from 'react'
import type { WrappedPoster } from '@sensorr/sensorr'
import { MONTHS, number, plural, type SheetModel } from '../../sheets'
import type { Art, ThemeProps } from '../types'
import './videoclub.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>

// Tape and case colours, picked from the key so a show keeps its colour from one shelf to the next
const TAPES = ['#c3242b', '#1c4fb8', '#1e8a4a', '#d99a12', '#6c2bb3', '#d9531e']
const tapeOf = (key: string) => TAPES[[...key].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7) % TAPES.length]
const tilts = (count: number) => Array.from({ length: count }, (_, index) => count > 1 ? (index / (count - 1) - 0.5) * 24 : 0)

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

const Neon = ({ lines, as: Tag = 'h2', tone = 'pink', className }: { lines: string[], as?: 'h1' | 'h2' | 'p', tone?: 'pink' | 'cyan', className?: string }) => (
  <Tag className={`videoclub-neon videoclub-neon-${tone} ${className || ''}`}>
    {lines.map((line) => <span key={line}>{line}</span>)}
  </Tag>
)

// A VHS case facing out: the sleeve under the plastic lip, a sticker, a handwritten label
const Box = ({ poster, art, width = 640, tilt = 0, sticker, label, className }: { poster: WrappedPoster, art: Art, width?: 320 | 640 | 1280, tilt?: number, sticker?: string, label?: string, className?: string }) => {
  const src = art(poster, 'thumb', width)

  return (
    <figure className={`videoclub-box ${className || ''}`} style={{ '--ry': `${tilt}deg`, '--case': tapeOf(poster.key) } as React.CSSProperties}>
      <span className="videoclub-box-case">
        <span className="videoclub-box-sleeve">
          {src ? <img src={src} alt={poster.title} loading="lazy" /> : <span className="videoclub-box-blank">{poster.title}</span>}
        </span>
        {sticker && <span className="videoclub-sticker">{sticker}</span>}
      </span>
      {label && <figcaption className="videoclub-label">{label}</figcaption>}
    </figure>
  )
}

// The spine of a tape on its shelf, the title written by hand on its label
const Spines = ({ poster, count }: { poster: WrappedPoster, count: number }) => (
  <span className="videoclub-spines" aria-hidden="true" style={{ '--tape': tapeOf(poster.key) } as React.CSSProperties}>
    {Array.from({ length: count }, (_, index) => <i key={index} className="videoclub-spine"><span>{poster.title}</span></i>)}
  </span>
)

// Covers standing on a plank, each with its title and an optional handwritten note
const Shelf = ({ posters, art, className }: { posters: WrappedPoster[], art: Art, className?: string }) => (
  <ul className={`videoclub-shelf ${className || ''}`} data-count={posters.length}>
    {posters.map((poster, index) => (
      <li key={poster.key} className="videoclub-shelf-entry">
        <Box poster={poster} art={art} width={320} tilt={tilts(posters.length)[index]} />
        <span className="videoclub-plank" aria-hidden="true" />
        <span className="videoclub-shelf-title">{poster.title}</span>
      </li>
    ))}
  </ul>
)

const Opening = ({ sheet, art, first }: { sheet: Of<'opening'>, art: Art, first?: string }) => {
  const [lit, setLit] = useState(false)
  const at = sheet.title.indexOf(sheet.name)
  const [head, tail] = at < 0 ? [sheet.title, ''] : [sheet.title.slice(0, at).trim(), sheet.title.slice(at + sheet.name.length).trim()]
  const letters = at < 0 ? [] : [...sheet.name]
  // One tube has gone out, as on any sign that has been up a few winters
  const dead = letters.length > 3 ? Math.floor(letters.length / 2) : -1
  // The hero case stands in the middle, the others fan out from it
  const order = [3, 1, 0, 2, 4].map((index) => sheet.posters[index]).filter(Boolean)

  useEffect(() => {
    // The tubes strike once the face is in, or the flicker plays on a fallback font
    let live = true
    const strike = () => live && setLit(true)
    document.fonts?.load('1em "Tilt Neon"').then(strike, strike) ?? strike()
    return () => { live = false }
  }, [])

  return (
    <section className="videoclub-sheet videoclub-opening" aria-label={sheet.label}>
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
      {!!order.length && (
        <div className="videoclub-front">
          {order.map((poster, index) => (
            <Box
              key={poster.key}
              poster={poster}
              art={art}
              className={poster === sheet.posters[0] ? 'videoclub-box-hero' : undefined}
              tilt={tilts(order.length)[index]}
              sticker={poster.key === first ? '1re location' : undefined}
            />
          ))}
        </div>
      )}
      <div className="videoclub-counter">
        {sheet.lede && <p className="videoclub-lede">{sheet.lede}</p>}
        <div className="videoclub-ticket videoclub-ticket-receipt">
          <p className="videoclub-ticket-head" aria-hidden="true">Vidéoclub · N° {sheet.year}</p>
          <ul>
            {sheet.figures.map((figure) => <li key={figure}>{figure}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}

// The membership card, its number embossed in the plastic
const Rank = ({ sheet, name, server }: { sheet: Of<'rank'>, name: string, server: string | null }) => (
  <section className="videoclub-sheet videoclub-rank" aria-label={sheet.label}>
    <Neon lines={[sheet.label]} tone="cyan" />
    <div className="videoclub-card">
      <p className="visually-hidden">{sheet.rank}{sheet.suffix} {sheet.unit}</p>
      <div className="videoclub-card-face" aria-hidden="true">
        <span className="videoclub-card-brand">Vidéoclub</span>
        {server && <span className="videoclub-card-server">{server}</span>}
        <span className="videoclub-card-chip" />
        <span className="videoclub-card-number">{String(sheet.rank).padStart(4, '0')} / {number.format(sheet.users)}</span>
        <span className="videoclub-card-holder">{name}</span>
        <span className="videoclub-card-since">{sheet.rank}<sup>{sheet.suffix}</sup> {sheet.unit}</span>
      </div>
    </div>
    <p className="videoclub-lede">{sheet.detail}</p>
  </section>
)

// The rental ticket, stamped once per evening of the streak
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
          {Array.from({ length: sheet.evenings }, (_, index) => <li key={index} style={{ '--turn': `${((index * 37) % 23) - 11}deg` } as React.CSSProperties} />)}
        </ol>
        <p className="videoclub-ticket-foot">{sheet.details}</p>
      </div>
    </div>
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
        {MONTHS.map((month, index) => {
          const show = index < elapsed ? shows[index] : null
          return (
            <li key={month} className={`videoclub-rack-row ${index >= elapsed ? 'videoclub-rack-future' : ''} ${peak?.index === index ? 'videoclub-rack-peak' : ''}`}>
              <span className="videoclub-rack-tag">
                {month}
                {show && <small>{plural(show.episodes, 'épisode', 'épisodes')}</small>}
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
      {peak && <p className="videoclub-lede videoclub-peak">En <strong>{peak.month}</strong>, {peak.text}</p>}
    </section>
  )
}

// A box set, one spine per episode of that evening
const Binge = ({ sheet, art, episodes }: { sheet: Of<'binge'>, art: Art, episodes: number }) => (
  <section className="videoclub-sheet videoclub-binge" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="pink" />
    <div className="videoclub-set" style={{ '--count': Math.min(episodes, 40) } as React.CSSProperties}>
      <Box poster={sheet.poster} art={art} className="videoclub-box-large" />
      {!!episodes && <Spines poster={sheet.poster} count={Math.min(episodes, 40)} />}
    </div>
    <div className="videoclub-shelf-card">
      <h3>{sheet.title}</h3>
      {sheet.meta.map((meta) => <p key={meta}>{meta}</p>)}
    </div>
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
      <p className="videoclub-returns-plate" aria-hidden="true">Retours</p>
    </div>
    <div className="videoclub-night-text">
      <p className="videoclub-night-date">{sheet.date}</p>
      <p className="videoclub-lede">Tu éteins à <strong className="videoclub-time">{sheet.end}</strong>{sheet.after}.</p>
      <p className="videoclub-lede">{sheet.last}</p>
    </div>
  </section>
)

const Server = ({ sheet, art }: { sheet: Of<'server'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-server" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="pink" />
    <div className="videoclub-spot">
      <Box poster={sheet.poster} art={art} className="videoclub-box-large" sticker={sheet.first ? 'Exclusivité' : 'Même semaine'} />
    </div>
    <div className="videoclub-shelf-card">
      <h3>{sheet.title}</h3>
      <p>{sheet.lede}</p>
    </div>
  </section>
)

// Personne d’autre: the shelf of the titles nobody else rents
const Nobody = ({ sheet, art }: { sheet: Of<'figure'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-nobody" aria-label={sheet.label}>
    <Neon lines={[sheet.label]} tone="cyan" />
    <p className="videoclub-price">
      <span aria-hidden="true">{number.format(sheet.count)}</span>
      <span className="visually-hidden">{sheet.spoken}</span>
      <span className="videoclub-price-unit">{sheet.unit}</span>
    </p>
    <p className="videoclub-lede">{sheet.details}</p>
    {!!sheet.posters.length && (
      <div className="videoclub-aisle">
        <p className="videoclub-aisle-tag" aria-hidden="true">Introuvables</p>
        <Shelf posters={sheet.posters} art={art} />
      </div>
    )}
  </section>
)

// Ton jumeau: a loan card both names are written on
const Twin = ({ sheet, art }: { sheet: Of<'figure'>, art: Art }) => {
  const [before, after] = sheet.highlight ? sheet.unit.split(sheet.highlight) : [sheet.unit, '']

  return (
    <section className="videoclub-sheet videoclub-twin" aria-label={sheet.label}>
      <Neon lines={sheet.lines || [sheet.label]} tone="pink" />
      <div className="videoclub-loan">
        <p className="videoclub-loan-head" aria-hidden="true">Fiche de prêt</p>
        <p className="videoclub-loan-figure">
          <span aria-hidden="true">{number.format(sheet.count)}</span>
          <span className="visually-hidden">{sheet.spoken}</span>
          <span className="videoclub-loan-unit">{before}{sheet.highlight && <em>{sheet.highlight}</em>}{after}</span>
        </p>
        <p className="videoclub-loan-details">{sheet.details}</p>
      </div>
      {!!sheet.posters.length && <Shelf posters={sheet.posters} art={art} />}
    </section>
  )
}

// Vus à deux: one loan card per title, the other borrower written in
const Duo = ({ sheet, art }: { sheet: Of<'duo'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-duo" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="cyan" />
    <p className="videoclub-lede">{sheet.lede}</p>
    <ul className="videoclub-loans" data-count={sheet.posters.length}>
      {sheet.posters.map((poster, index) => (
        <li key={poster.key} className="videoclub-loan videoclub-loan-small" style={{ '--turn': `${index % 2 ? 1.5 : -1.5}deg` } as React.CSSProperties}>
          <Box poster={poster} art={art} width={320} />
          <div>
            <p className="videoclub-loan-title">{poster.title}</p>
            <p className="videoclub-loan-hand">{poster.caption}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
)

// One case per figure, the figure written on its label
const Posters = ({ sheet, art }: { sheet: Of<'posters'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-posters" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone={sheet.variant === 'outliers' ? 'cyan' : 'pink'} />
    <ol className="videoclub-shelf videoclub-shelf-large" data-count={sheet.items.length}>
      {sheet.items.map(({ what, poster, detail }, index) => (
        <li key={poster.key} className="videoclub-shelf-entry">
          <Box poster={poster} art={art} tilt={tilts(sheet.items.length)[index]} sticker={what} label={detail} />
          <span className="videoclub-plank" aria-hidden="true" />
          <h3 className="videoclub-shelf-title">{poster.title}</h3>
        </li>
      ))}
    </ol>
  </section>
)

// The genre's own aisle, its sign hanging over the shelves
const Genre = ({ sheet, art }: { sheet: Of<'genre'>, art: Art }) => {
  const { lead } = sheet

  return (
    <section className="videoclub-sheet videoclub-genre" aria-label={sheet.label}>
      <Neon lines={sheet.lines} tone="cyan" as="h2" />
      <p className="videoclub-aisle-sign">{sheet.name}</p>
      <p className="videoclub-lede">{sheet.count}</p>
      <Shelf posters={sheet.posters} art={art} />
      {lead && <p className="videoclub-lede"><strong>{lead.name}</strong> {lead.role}</p>}
      {lead && !!lead.posters.length && <Shelf posters={lead.posters} art={art} />}
    </section>
  )
}

// Closing time: the shutter comes down over the last case in the window
const Finale = ({ sheet, art }: { sheet: Of<'finale'>, art: Art }) => (
  <section className="videoclub-sheet videoclub-finale" aria-label={sheet.label}>
    <Neon lines={sheet.lines} tone="pink" />
    <div className="videoclub-window" data-closed={sheet.closed}>
      <Box poster={sheet.poster} art={art} className="videoclub-box-large" sticker={sheet.closed ? undefined : 'Provisoire'} />
      <div className="videoclub-shutter" aria-hidden="true" />
      <p className="videoclub-end">{sheet.end}</p>
    </div>
    <div className="videoclub-shelf-card">
      <h3>{sheet.title}</h3>
      <p>{sheet.date}</p>
    </div>
  </section>
)
