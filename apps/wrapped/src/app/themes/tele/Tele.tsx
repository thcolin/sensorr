import { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { WrappedPoster } from '@sensorr/sensorr'
import { MONTHS, number, plural, type SheetModel } from '../../sheets'
import type { Art, ThemeProps } from '../types'
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
    case 'posters': return 'Critiques'
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

// A few posters with their titles, the proof behind a count
const Posters4 = <P extends WrappedPoster>({ posters, art, caption }: { posters: P[], art: Art, caption?: (poster: P) => string }) => (
  <ul className="tele-thumbs" data-count={posters.length}>
    {posters.map((poster) => (
      <li key={poster.key} className="tele-thumb">
        <Photo poster={poster} art={art} width={320} />
        <span className="tele-thumb-title">{poster.title}</span>
        {caption && <span className="tele-thumb-caption">{caption(poster)}</span>}
      </li>
    ))}
  </ul>
)

const Big = ({ value, spoken, suffix }: { value: number, spoken: string, suffix?: string }) => (
  <p className="tele-big">
    <span aria-hidden="true">{number.format(value)}{suffix && <sup>{suffix}</sup>}</span>
    <span className="visually-hidden">{spoken}</span>
  </p>
)

const Barcode = () => <span className="tele-barcode" aria-hidden="true"><i /></span>

// Figures in the cover lines stand out from their words
const figures = (text: string) => text.split(/(\d[\d\s]*\d|\d)/).map((part, index) => index % 2 ? <b key={index}>{part}</b> : part)

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
              <a href={`#tele-p${(index + 1) * 2}`}>
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
      <p className="tele-standfirst">{sheet.detail}</p>
    </>}
    right={
      <table className="tele-ratings" aria-hidden="true">
        <tbody>
          {[...new Set([1, sheet.rank, sheet.users])].flatMap((rank, index, ranks) => [
            index > 0 && rank - ranks[index - 1] > 1 && <tr key={`gap-${rank}`} className="tele-ratings-gap"><td colSpan={2}>…</td></tr>,
            <tr key={rank} className={rank === sheet.rank ? 'tele-ratings-you' : undefined}>
              <th>{rank}<sup>{rank === 1 ? 'er' : 'e'}</sup></th>
              <td>{rank === sheet.rank ? <b>Toi</b> : <span className="tele-ratings-blank" />}</td>
            </tr>,
          ])}
        </tbody>
      </table>
    }
  />
)

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
    </>}
    right={<>
      <article className="tele-pick">
        <Photo poster={sheet.poster} art={art} />
        <div>
          <h3 className="tele-pick-title">{sheet.poster.title}</h3>
          <p>{sheet.details}</p>
        </div>
      </article>
      <ol className="tele-episodes" aria-hidden="true">
        {[...new Set([1, 2, 3, sheet.evenings])].filter((episode) => episode <= sheet.evenings).map((episode, index, episodes) => (
          <li key={episode} className={episode - (episodes[index - 1] || 0) > 1 ? 'tele-episodes-later' : undefined}>Soir {episode}</li>
        ))}
      </ol>
    </>}
  />
)

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
              <p>En <b>{peak.month}</b>, {peak.text}</p>
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

const Binge = ({ sheet, art, ...page }: { sheet: Of<'binge'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={<>
      <Headline lines={sheet.lines} />
      <figure className="tele-still">
        <Photo poster={sheet.poster} art={art} kind="art" width={1280} />
        <span className="tele-tag" aria-hidden="true">Soirée spéciale</span>
      </figure>
    </>}
    right={<>
      <h3 className="tele-title">{sheet.title}</h3>
      {sheet.meta.map((meta) => <p key={meta} className="tele-body">{meta}</p>)}
    </>}
  />
)

const Night = ({ sheet, art, ...page }: { sheet: Of<'night'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={<Photo poster={sheet.poster} art={art} width={1280} className="tele-full-poster" />}
    right={<>
      <Headline lines={sheet.lines} />
      <p className="tele-unit">{sheet.date}</p>
      <p className="tele-clock" aria-hidden="true">{sheet.end}</p>
      <p className="tele-body">Tu éteins à <strong>{sheet.end}</strong>{sheet.after}.</p>
      <p className="tele-body">{sheet.last}</p>
    </>}
  />
)

const Server = ({ sheet, art, ...page }: { sheet: Of<'server'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={
      <figure className="tele-exclusive">
        <Photo poster={sheet.poster} art={art} width={1280} className="tele-full-poster" />
        <span className="tele-ribbon" aria-hidden="true">Exclusivité</span>
      </figure>
    }
    right={<>
      <Headline lines={sheet.lines} />
      <h3 className="tele-title">{sheet.title}</h3>
      <p className="tele-standfirst">{sheet.lede}</p>
    </>}
  />
)

const Figure = ({ sheet, art, ...page }: { sheet: Of<'figure'> } & Page) => {
  const [before, after] = sheet.highlight ? sheet.unit.split(sheet.highlight) : [sheet.unit]

  return (
    <Spread
      sheet={sheet}
      {...page}
      left={<>
        {sheet.lines ? <Headline lines={sheet.lines} /> : <h2 className="tele-headline"><span className="tele-band">Rareté</span></h2>}
        <Big value={sheet.count} spoken={sheet.spoken} />
        <p className="tele-unit">{before}{sheet.highlight && <><mark className="tele-mark">{sheet.highlight}</mark>{after}</>}</p>
        <p className="tele-standfirst">{sheet.details}</p>
      </>}
      right={sheet.posters.length ? <Posters4 posters={sheet.posters} art={art} /> : undefined}
    />
  )
}

const Duo = ({ sheet, art, ...page }: { sheet: Of<'duo'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={<>
      <Headline lines={sheet.lines} />
      <p className="tele-standfirst">{sheet.lede}</p>
    </>}
    right={<Posters4 posters={sheet.posters} art={art} caption={(poster) => poster.caption} />}
  />
)

// Each figure a review, with its poster
const Review = ({ item: { what, poster, detail }, art, lead }: { item: Of<'posters'>['items'][number], art: Art, lead?: boolean }) => (
  <article className={`tele-review${lead ? ' tele-review-lead' : ''}`}>
    <Photo poster={poster} art={art} />
    <div>
      <p className="tele-review-what">{what}</p>
      <h3 className="tele-pick-title">{poster.title}</h3>
      <p className="tele-body">{detail}</p>
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
      </>}
      right={rest.length ? rest.map((item) => <Review key={item.poster.key} item={item} art={art} />) : undefined}
    />
  )
}

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
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" />
            <path d="M28 64 C 34 36, 48 30, 50 50 C 52 70, 66 64, 72 36" />
            <circle className="tele-sign-dot" cx="72" cy="36" r="5" />
          </svg>
          <p><span className="tele-sign-label" aria-hidden="true">Ton signe</span><span className="tele-sign-name">{sheet.name}</span></p>
        </div>
        <p className="tele-body">{sheet.count}</p>
        <Posters4 posters={sheet.posters} art={art} />
      </>}
      right={lead ? <>
        <dl className="tele-reading">
          <dt aria-hidden="true">Ascendant</dt>
          <dd><b>{lead.name}</b> {lead.role}</dd>
        </dl>
        {!!lead.posters.length && <Posters4 posters={lead.posters} art={art} />}
      </> : undefined}
    />
  )
}

// The end of transmission: a test card after the last programme
const Finale = ({ sheet, art, ...page }: { sheet: Of<'finale'> } & Page) => (
  <Spread
    sheet={sheet}
    {...page}
    left={<Photo poster={sheet.poster} art={art} width={1280} className="tele-full-poster" />}
    right={<>
      <Headline lines={sheet.lines} />
      <h3 className="tele-title">{sheet.title}</h3>
      <p className="tele-body">{sheet.date}</p>
      {!sheet.closed && <p className="tele-stamp">Provisoire</p>}
      <svg className="tele-testcard" viewBox="0 0 280 160" aria-hidden="true">
        {['paper', 'yellow', 'cyan', 'green', 'magenta', 'red', 'blue'].map((fill, index) => <rect key={fill} x={index * 40} y="0" width="40" height="112" style={{ fill: `var(--${fill})` }} />)}
        {['blue', 'ink', 'magenta', 'ink', 'cyan', 'ink', 'paper'].map((fill, index) => <rect key={index} x={index * 40} y="112" width="40" height="16" style={{ fill: `var(--${fill})` }} />)}
        <rect x="0" y="128" width="280" height="32" style={{ fill: 'var(--ink)' }} />
        <circle cx="140" cy="64" r="44" fill="none" strokeWidth="3" style={{ stroke: 'var(--ink)' }} />
      </svg>
      <p className="tele-end">{sheet.end}</p>
    </>}
  />
)
