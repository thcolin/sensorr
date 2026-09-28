import { ReactNode, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { WrappedPoster } from '@sensorr/sensorr'
import { MONTHS, number, plural, THIN, type SheetModel } from '../../sheets'
import type { Art, ThemeProps } from '../types'
import './scenario.css'

type Of<K extends SheetModel['kind']> = Extract<SheetModel, { kind: K }>
type Scene = { scene: number, art: Art }

// Production revision colours, in the order a shooting script goes through them
const REVISIONS = [
  ['white', 'blanche'], ['blue', 'bleue'], ['pink', 'rose'], ['yellow', 'jaune'], ['green', 'verte'],
  ['gold', 'or'], ['buff', 'chamois'], ['salmon', 'saumon'], ['cherry', 'cerise'], ['tan', 'havane'],
]

const TRANSITIONS = ['Enchaîné', 'Coupe franche', 'Fondu enchaîné', 'Coupe sur']

// The same lean for the same poster on every visit
const lean = (seed: string | number) => {
  const text = String(seed)
  let hash = 0
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) | 0
  const value = Math.sin(hash) * 43758.5453
  return value - Math.floor(value)
}

// How many numbered scenes each sheet writes, so numbering runs on across pages
const scenesOf = (sheet: SheetModel) => {
  switch (sheet.kind) {
    case 'opening': return 0
    case 'months': return sheet.elapsed
    case 'binge': return sheet.meta.length
    case 'posters': return sheet.items.length
    default: return 1
  }
}

const Scenario = ({ share, sheets, colophon, art }: ThemeProps) => {
  const starts = sheets.reduce<number[]>((all, sheet, index) => [...all, (all[index - 1] || 1) + (index ? scenesOf(sheets[index - 1]) : 0)], [])

  return (
    <div className="scenario-desk">
      <Index sheets={sheets} />
      <main className="scenario-script">
        {sheets.map((sheet, index) => {
          const scene = { scene: starts[index], art }
          const page = (children: ReactNode) => (
            <Page key={index} sheet={sheet} index={index} transition={index === sheets.length - 1 ? null : TRANSITIONS[index % TRANSITIONS.length]}>
              {children}
            </Page>
          )
          switch (sheet.kind) {
            case 'opening': return <Opening key={index} sheet={sheet} art={art} />
            case 'rank': return page(<Rank sheet={sheet} name={share.name} {...scene} />)
            case 'streak': return page(<Streak sheet={sheet} {...scene} />)
            case 'months': return page(<Months sheet={sheet} {...scene} />)
            case 'binge': return page(<Binge sheet={sheet} {...scene} />)
            case 'night': return page(<Night sheet={sheet} {...scene} />)
            case 'server': return page(<Server sheet={sheet} {...scene} />)
            case 'figure': return page(<Figure sheet={sheet} {...scene} />)
            case 'duo': return page(<Duo sheet={sheet} {...scene} />)
            case 'posters': return page(<Posters sheet={sheet} {...scene} />)
            case 'genre': return page(<Genre sheet={sheet} {...scene} />)
            case 'finale': return page(<Finale sheet={sheet} {...scene} />)
          }
        })}
        <footer className="scenario-cover">
          <Holes brads />
          <div className="scenario-cover-label">
            {colophon.short && <p>{colophon.short}</p>}
            <p>{colophon.text}</p>
          </div>
        </footer>
      </main>
      <Props />
    </div>
  )
}

export default Scenario

// On a wide desk, an index card lists the pages, each a link
const Index = ({ sheets }: { sheets: SheetModel[] }) => (
  <nav className="scenario-index" aria-label="Pages">
    <ol>
      {sheets.map((sheet, index) => (
        <li key={index}>
          <a href={`#scenario-p${index}`}>
            <span>{sheet.label}</span>
            <span aria-hidden="true">{index ? `${index + 1}.` : ''}</span>
          </a>
        </li>
      ))}
    </ol>
  </nav>
)

const Props = () => (
  <div className="scenario-props" aria-hidden="true">
    <svg className="scenario-pencil" viewBox="0 0 24 300">
      <path d="M4 40 H20 V280 H4 Z" fill="#b3261e" />
      <path d="M4 40 H9 V280 H4 Z" fill="#8e1d17" />
      <path d="M4 280 H20 V296 H4 Z" fill="#c9a24a" />
      <path d="M4 40 L12 8 L20 40 Z" fill="#e6c9a0" />
      <path d="M9.6 17.6 L12 8 L14.4 17.6 Z" fill="#b3261e" />
    </svg>
    <svg className="scenario-highlighter" viewBox="0 0 40 240">
      <rect x="4" y="60" width="32" height="176" rx="6" fill="#f2e54a" />
      <rect x="4" y="60" width="10" height="176" rx="4" fill="#d9cb2e" />
      <rect x="2" y="4" width="36" height="64" rx="7" fill="#3a3530" />
      <rect x="31" y="14" width="4" height="60" rx="2" fill="#57504a" />
    </svg>
    <svg className="scenario-brads" viewBox="0 0 80 40">
      <circle cx="16" cy="20" r="9" fill="#b8913c" /><circle cx="14" cy="18" r="3" fill="#e4c878" />
      <circle cx="56" cy="14" r="9" fill="#a8822f" /><circle cx="54" cy="12" r="3" fill="#dcbf6e" />
    </svg>
  </div>
)

const Holes = ({ brads }: { brads?: boolean }) => (
  <span className={`scenario-holes${brads ? ' scenario-holes-brads' : ''}`} aria-hidden="true">
    <i /><i /><i />
  </span>
)

const Page = ({ sheet, index, transition, children }: { sheet: SheetModel, index: number, transition: string | null, children: ReactNode }) => {
  const [colour, name] = REVISIONS[(index - 1) % REVISIONS.length]

  return (
    <section id={`scenario-p${index}`} className="scenario-page" data-revision={colour} aria-label={sheet.label} style={{ '--tilt': `${(lean(index) - 0.5) * 0.8}deg` } as React.CSSProperties}>
      <Holes />
      <p className="scenario-head" aria-hidden="true">
        {colour !== 'white' && <span>Révision {name}</span>}
        <span>{index + 1}.</span>
      </p>
      {children}
      <p className="scenario-transition" aria-hidden="true">{transition ? `${transition}${THIN}:` : 'Fondu au noir.'}</p>
      {sheet.kind === 'finale' && <p className="scenario-end">{sheet.end}</p>}
    </section>
  )
}

const Act = ({ children }: { children: ReactNode }) => <h2 className="scenario-act">{children}</h2>

const Slug = ({ scene, children }: { scene: number, children: ReactNode }) => (
  <p className="scenario-slug">
    <span className="scenario-scene" aria-hidden="true">{scene}</span>
    <span>{children}</span>
    <span className="scenario-scene scenario-scene-right" aria-hidden="true">{scene}</span>
  </p>
)

const Caps = ({ children }: { children: ReactNode }) => <span className="scenario-caps">{children}</span>
const Mark = ({ children }: { children: ReactNode }) => <mark className="scenario-mark">{children}</mark>
// A key figure said at the scale of the page: centred capitals, like a line shouted from the room
const Shout = ({ figure, children, long }: { figure: ReactNode, children?: ReactNode, long?: number }) => (
  <div className="scenario-shout" style={long ? { '--length': long } as React.CSSProperties : undefined}>
    <p className={`scenario-shout-figure${long ? ' scenario-shout-word' : ''}`}><Mark>{figure}</Mark></p>
    {children && <p className="scenario-shout-unit">{children}</p>}
  </div>
)

const Pencil = ({ children, className }: { children: ReactNode, className?: string }) => <p className={`scenario-pencil-note ${className || ''}`}>{children}</p>

const Clip = () => (
  <svg className="scenario-clip" viewBox="0 0 22 58" aria-hidden="true">
    <path d="M6 44 V10 a5 5 0 0 1 10 0 V48 a8 8 0 0 1 -16 0 V16" fill="none" stroke="#7d828a" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M7 42 V11 a4 4 0 0 1 4 -4" fill="none" stroke="#d4d8dd" strokeWidth="0.9" strokeLinecap="round" />
  </svg>
)

// A poster paper-clipped to the page, a little askew
const Insert = ({ poster, art, wide, width = 640, caption, className }: { poster: WrappedPoster, art: Art, wide?: boolean, width?: number, caption?: ReactNode, className?: string }) => {
  const src = (wide && art(poster, 'art', 1280)) || art(poster, 'thumb', width)
  const shape = wide && poster.art ? ' scenario-insert-wide' : ''

  return (
    <figure className={`scenario-insert${shape} ${className || ''}`} style={{ '--tilt': `${(lean(poster.key) - 0.5) * 6}deg`, '--clip': `${14 + lean(`${poster.key}-clip`) * 50}%` } as React.CSSProperties}>
      <Clip />
      {src
        ? <img src={src} alt={poster.title} loading="lazy" decoding="async" />
        : <span className="scenario-insert-blank" role="img" aria-label={poster.title}>{poster.title}</span>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

const Inserts = ({ posters, art, caption }: { posters: WrappedPoster[], art: Art, caption?: (poster: WrappedPoster, index: number) => ReactNode }) => (
  <div className="scenario-inserts" data-count={posters.length}>
    {posters.map((poster, index) => (
      <Insert key={poster.key} poster={poster} art={art} width={320} caption={caption ? caption(poster, index) : poster.title} />
    ))}
  </div>
)

// The title page types itself once, the caret keeps blinking where it stopped
const useTyped = (text: string) => {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(reduced ? text.length : 0)

  useEffect(() => {
    if (reduced) {
      setCount(text.length)
      return
    }
    let index = 0
    let timer: ReturnType<typeof setTimeout>
    const next = () => {
      index += 1
      setCount(index)
      if (index < text.length) timer = setTimeout(next, 55 + lean(index) * 90 + (text[index - 1] === ' ' ? 60 : 0))
    }
    timer = setTimeout(next, 700)
    return () => clearTimeout(timer)
  }, [text, reduced])

  return { typed: text.slice(0, count), rest: text.slice(count), caret: !reduced }
}

const Opening = ({ sheet, art }: { sheet: Of<'opening'>, art: Art }) => {
  const { typed, rest, caret } = useTyped(sheet.title)

  return (
    <section id="scenario-p0" className="scenario-page scenario-title-page" data-revision="white" aria-label={sheet.label}>
      <Holes brads />
      <div className="scenario-title-block">
        <h1 className="scenario-title">
          <span className="visually-hidden">{sheet.title}</span>
          <span aria-hidden="true">
            {typed}
            {caret && <span className="scenario-caret" />}
            <span className="scenario-untyped">{rest}</span>
          </span>
        </h1>
        <p className="scenario-byline">écrit par</p>
        <p className="scenario-author"><Mark><Caps>{sheet.name}</Caps></Mark></p>
      </div>
      {!!sheet.posters.length && (
        <div className="scenario-fan" data-count={sheet.posters.length}>
          {sheet.posters.map((poster) => <Insert key={poster.key} poster={poster} art={art} width={320} />)}
        </div>
      )}
      <div className="scenario-draft">
        {sheet.lede && <p>{sheet.lede}</p>}
        <ul>
          {sheet.figures.map((figure) => <li key={figure}>{figure}</li>)}
        </ul>
      </div>
    </section>
  )
}

// A cast list, the friend's name billed at its rank and the other lines left blank
const Rank = ({ sheet, name, scene }: { sheet: Of<'rank'>, name: string } & Scene) => {
  const { rank, users } = sheet
  const shown = [...new Set([1, 2, 3, rank - 1, rank, rank + 1, users])].filter((line) => line >= 1 && line <= users).sort((a, b) => a - b)

  return (
    <>
      <Act>{sheet.label}</Act>
      <Slug scene={scene}>Int. salle de projection – soir</Slug>
      <ol className="scenario-cast" aria-hidden="true">
        {shown.map((line, index) => (
          <li key={line} className={line === rank ? 'scenario-cast-you' : undefined} data-gap={index > 0 && line - shown[index - 1] > 1 ? '' : undefined}>
            <span>{line}.</span>
            {line === rank ? <Mark><Caps>{name}</Caps></Mark> : <i />}
          </li>
        ))}
      </ol>
      <p className="scenario-character">La salle</p>
      <p className="scenario-parenthetical">(en chœur)</p>
      <Shout figure={<>{rank}<sup>{sheet.suffix}</sup></>}>{sheet.unit}</Shout>
      <p className="scenario-dialogue">{sheet.detail}</p>
    </>
  )
}

// Tally marks in red pencil, one stroke per evening
const Tally = ({ count }: { count: number }) => {
  const groups = Math.ceil(count / 5)
  const perRow = 6
  const rows = Math.ceil(groups / perRow)

  return (
    <svg className="scenario-tally" viewBox={`0 0 ${perRow * 34} ${rows * 34}`} aria-hidden="true">
      {Array.from({ length: groups }, (_, group) => {
        const [x, y] = [(group % perRow) * 34 + 4, Math.floor(group / perRow) * 34 + 4]
        const strokes = Math.min(5, count - group * 5)
        return (
          <g key={group} transform={`rotate(${(lean(group) - 0.5) * 6} ${x + 12} ${y + 12})`}>
            {Array.from({ length: Math.min(4, strokes) }, (_, stroke) => (
              <path key={stroke} d={`M${x + stroke * 6 + 2} ${y + 1 + lean(group * 5 + stroke) * 2} L${x + stroke * 6 + 1} ${y + 25}`} />
            ))}
            {strokes === 5 && <path d={`M${x - 2} ${y + 20} L${x + 24} ${y + 6}`} />}
          </g>
        )
      })}
    </svg>
  )
}

const Streak = ({ sheet, scene, art }: { sheet: Of<'streak'> } & Scene) => (
  <>
    <Act>{sheet.label}</Act>
    <Slug scene={scene}>Int. salon – soir</Slug>
    <p className="scenario-action">{sheet.intro}{THIN}:</p>
    <Shout figure={number.format(sheet.evenings)}>{sheet.unit}</Shout>
    <div className="scenario-beside">
      <Insert poster={sheet.poster} art={art} />
      <Tally count={sheet.evenings} />
    </div>
    <p className="scenario-action">{sheet.details}</p>
    <div className="scenario-continued" aria-hidden="true">
      <p>Int. salon – soir (suite)</p>
      <p>Int. salon – soir (suite)</p>
      <p>Int. salon – soir (suite)</p>
    </div>
  </>
)

// Twelve short scenes, one per month, a highlighter swipe as long as its episodes
const Months = ({ sheet, scene, art }: { sheet: Of<'months'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    <p className="scenario-action">{sheet.lede}</p>
    <ol className="scenario-months">
      {sheet.shows.slice(0, sheet.elapsed).map((show, index) => (
        <li key={index} className={sheet.peak?.index === index ? 'scenario-month-peak' : undefined}>
          <Slug scene={scene + index}>Int. canapé – soir – {MONTHS[index]}</Slug>
          <div className="scenario-month">
            <div className="scenario-month-text">
              <p className="scenario-action">
                {show ? <><Caps>{show.title}</Caps>, {plural(show.episodes, 'épisode', 'épisodes')}.</> : 'Rien.'}
              </p>
              {show && <span className="scenario-swipe" aria-hidden="true" style={{ '--share': show.episodes / sheet.max } as React.CSSProperties} />}
            </div>
            {show && <Insert poster={show} art={art} width={320} className="scenario-insert-thumb" />}
          </div>
          {sheet.peak?.index === index && <Pencil>En {sheet.peak.month}, {sheet.peak.text}</Pencil>}
        </li>
      ))}
    </ol>
  </>
)

const Binge = ({ sheet, scene, art }: { sheet: Of<'binge'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    {sheet.meta.map((meta, index) => (
      <div key={meta}>
        <Slug scene={scene + index}>{index ? 'Int. salon – plus tard' : 'Int. salon – soir'}</Slug>
        {!index && <Insert poster={sheet.poster} art={art} wide />}
        {!!index && sheet.pace && <Insert poster={sheet.pace} art={art} />}
        <p className="scenario-action">
          {!index && <><Caps>{sheet.title}</Caps>. </>}
          {meta}
        </p>
      </div>
    ))}
  </>
)

const Night = ({ sheet, scene, art }: { sheet: Of<'night'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    <Slug scene={scene}>{sheet.late ? 'Int. salon – nuit' : 'Int. salon – soir'}</Slug>
    <p className="scenario-action scenario-date">{sheet.date}.</p>
    <Shout figure={sheet.end} />
    <Insert poster={sheet.poster} art={art} />
    <p className="scenario-action">Tu éteins à {sheet.end}{sheet.after}.</p>
    <p className="scenario-action">{sheet.last}</p>
  </>
)

const Server = ({ sheet, scene, art }: { sheet: Of<'server'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    <Slug scene={scene}>Int. salle de projection – soir</Slug>
    <div className="scenario-beside">
      <Insert poster={sheet.poster} art={art} />
      {sheet.first && <Pencil className="scenario-pencil-side">Première projection</Pencil>}
    </div>
    <p className="scenario-action"><Caps>{sheet.title}</Caps>.</p>
    <p className="scenario-action">{sheet.lede}</p>
  </>
)

// « Personne d’autre » has no lines; « Ton jumeau » names the other viewer as a character
const Figure = ({ sheet, scene, art }: { sheet: Of<'figure'> } & Scene) => {
  const unit = sheet.highlight ? sheet.unit.split(sheet.highlight) : [sheet.unit]

  return (
    <>
      <Act>{sheet.lines ? sheet.lines.join(' ') : sheet.label}</Act>
      <Slug scene={scene}>Int. salon – soir</Slug>
      <Shout figure={number.format(sheet.count)}>
        {unit.map((part, index) => (
          <span key={index}>{index > 0 && <Mark>{sheet.highlight}</Mark>}{part}</span>
        ))}
      </Shout>
      <p className="scenario-action">{sheet.details}</p>
      {!!sheet.posters.length && <Inserts posters={sheet.posters} art={art} />}
    </>
  )
}

const Duo = ({ sheet, scene, art }: { sheet: Of<'duo'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    <Slug scene={scene}>Int. salon – soir</Slug>
    <p className="scenario-action">{sheet.lede}</p>
    <Inserts posters={sheet.posters} art={art} caption={(poster, index) => <>{poster.title}<br /><span>{sheet.posters[index].caption}</span></>} />
  </>
)

// One scene per poster, what it stands for noted in red pencil
const Posters = ({ sheet, scene, art }: { sheet: Of<'posters'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    {sheet.items.map(({ what, poster, detail }, index) => (
      <div key={poster.key}>
        <Slug scene={scene + index}>Int. salon – soir</Slug>
        <div className="scenario-beside">
          <Insert poster={poster} art={art} />
          <Pencil className="scenario-pencil-side">{what}</Pencil>
        </div>
        <p className="scenario-action"><Caps>{poster.title}</Caps>, {detail}.</p>
      </div>
    ))}
  </>
)

const Genre = ({ sheet, scene, art }: { sheet: Of<'genre'> } & Scene) => {
  const { lead } = sheet

  return (
    <>
      <Act>{sheet.lines.join(' ')}</Act>
      <Slug scene={scene}>Int. salon – soir</Slug>
      <Shout figure={sheet.name} long={Math.max(sheet.name.length, 5)} />
      <p className="scenario-action">{sheet.count}</p>
      <Inserts posters={sheet.posters} art={art} />
      {lead && <p className="scenario-action"><Mark><Caps>{lead.name}</Caps></Mark> {lead.role}</p>}
      {lead && !!lead.posters.length && <Inserts posters={lead.posters} art={art} />}
    </>
  )
}

const Finale = ({ sheet, scene, art }: { sheet: Of<'finale'> } & Scene) => (
  <>
    <Act>{sheet.lines.join(' ')}</Act>
    <Slug scene={scene}>Int. salon – soir</Slug>
    <div className="scenario-beside">
      <Insert poster={sheet.poster} art={art} />
      {!sheet.closed && <Pencil className="scenario-pencil-side">Provisoire</Pencil>}
    </div>
    <p className="scenario-action"><Caps>{sheet.title}</Caps>.</p>
    <p className="scenario-action">{sheet.date}</p>
  </>
)
