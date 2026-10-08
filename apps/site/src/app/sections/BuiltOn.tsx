import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import oleoo, { type OleooResult, type RulePattern } from 'oleoo'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'
import { usePalette } from '@sensorr/palette'
import { pictureSrc } from '@sensorr/ui'
import type { Film } from '../data'

const EXAMPLE = 'Arrival.2016.MULTi.2160p.WEB-DL.x265.EAC3-VCR'
const CELLS = 10000
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const LOGO = [
  ' ▒█████   ██▓    ▓█████  ▒█████   ▒█████ ',
  '▒██▒  ██▒▓██▒    ▓█   ▀ ▒██▒  ██▒▒██▒  ██▒',
  '▒██░  ██▒▒██░    ▒███   ▒██░  ██▒▒██░  ██▒',
  '▒██   ██░▒██░    ▒▓█  ▄ ▒██   ██░▒██   ██░',
  '░ ████▓▒░░██████▒░▒████▒░ ████▓▒░░ ████▓▒░',
  '░ ▒░▒░▒░ ░ ▒░▓  ░░░ ▒░ ░░ ▒░▒░▒░ ░ ▒░▒░▒░ ',
]

// The README's own edge, the gradient its logo is drawn with
const EDGE = '░▒▓█'.repeat(120)

const FACTS: [string, string][] = [
  ['6697', 'releases, the same result in all three'],
  ['3', 'packages, JavaScript, Go and Rust, one version number'],
  ['0', 'dependency on npm'],
  ['rules.json + SPEC.md', 'the same rules and spec in all three'],
]

const FIELDS: [string, (result: OleooResult) => string | null][] = [
  ['title', (result) => result.title || null],
  ['year', (result) => result.year],
  ['language', (result) => result.language],
  ['resolution', (result) => result.resolution],
  ['source', (result) => result.source],
  ['encoding', (result) => result.encoding],
  ['dub', (result) => result.dub],
  ['group', (result) => result.group],
  ['flags', (result) => result.flags.join(' ') || null],
]

const SNIPPET = `import VirtualGrid
  from 'react-responsive-virtual-grid'

<VirtualGrid
  total={${CELLS}}
  cell={{ height: 64, width: 64 }}
  child={Cell}
  scrollContainer={frame}
/>`

const parse = (name: string) => {
  if (!name.trim()) {
    return null
  }

  try {
    return oleoo.parse(name, { strict: false, flagged: true })
  } catch {
    return null
  }
}

type Mark = { start: number, end: number, field: string }

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Where in the name each field was read: the rules of the value oleoo found, matched again on the name
const marksOf = (value: string, result: OleooResult | null) => {
  if (!result) {
    return []
  }

  const marks: Mark[] = []
  const free = (start: number, end: number) => marks.every((mark) => end <= mark.start || start >= mark.end)
  const mark = (field: string, patterns: RulePattern[]) => {
    for (const rule of patterns) {
      let regexp: RegExp

      try {
        regexp = new RegExp(`(?<![a-z0-9])(?:${typeof rule === 'string' ? rule : rule.pattern})(?![a-z0-9])`, 'gi')
      } catch {
        continue
      }

      for (const match of value.matchAll(regexp)) {
        const start = match.index ?? 0
        const end = start + match[0].length

        if (match[0] && free(start, end)) {
          marks.push({ start, end, field })
          return
        }
      }
    }
  }

  if (result.group) {
    const start = value.lastIndexOf(result.group)

    if (start > 0 && free(start, start + result.group.length)) {
      marks.push({ start, end: start + result.group.length, field: 'group' })
    }
  }

  if (result.year) {
    mark('year', [escape(result.year)])
  }

  if (result.resolution) {
    mark('resolution', oleoo.rules.resolution[result.resolution])
  }

  if (result.source) {
    mark('source', oleoo.rules.source[result.source])
  }

  if (result.encoding) {
    mark('encoding', oleoo.rules.encoding[result.encoding])
  }

  if (result.dub) {
    mark('dub', oleoo.rules.dub[result.dub])
  }

  result.languages.forEach((language) => mark('language', oleoo.rules.language[language]))
  result.flags.forEach((flag) => mark('flags', oleoo.rules.flags[flag]))

  // The title runs from the start up to the first field read
  const first = Math.min(value.length, ...marks.map(({ start }) => start))
  const title = value.slice(0, first).replace(/[.\-_\s([]+$/, '')

  if (result.title && title) {
    marks.push({ start: 0, end: title.length, field: 'title' })
  }

  return marks.sort((a, b) => a.start - b.start)
}

// Shown once scrolled into view; reduced motion shows it at once through the styles
const useReveal = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true)
        observer.disconnect()
      }
    }, { rootMargin: '0px 0px -20% 0px' })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, shown] as const
}

const Links = ({ links, link }: { links: [string, string][], link: object }) => (
  <ul sx={BuiltOn.styles.links}>
    {links.map(([label, href]) => (
      <li key={href}>
        <a href={href} sx={link}>{label}</a>
      </li>
    ))}
  </ul>
)

type Piece = { word: string, separator: string, field?: string, label?: boolean }

const SEPARATOR = /([.\-_\s()[\]]+)/

// The name cut at its separators, each word carrying the field it fed and the separator after it,
// the field named under its first word
const piecesOf = (value: string, marks: Mark[]) => {
  const pieces: Piece[] = []
  const cut = (text: string, field?: string) => text.split(SEPARATOR).forEach((part, index) => {
    if (index % 2) {
      pieces[pieces.length - 1].separator += part
    } else if (part || !pieces.length) {
      const label = !!field && !pieces.some((piece) => piece.field === field)
      pieces.push({ word: part, separator: '', field: part ? field : undefined, label })
    }
  })
  let cursor = 0

  marks.forEach(({ start, end, field }) => {
    cut(value.slice(cursor, start))
    cut(value.slice(start, end), field)
    cursor = end
  })

  cut(value.slice(cursor))
  return pieces.filter((piece) => piece.word || piece.separator)
}

// The textarea grows with the name through an invisible copy of it laid out the same way
const Release = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
  const result = useMemo(() => parse(value), [value])
  const pieces = useMemo(() => piecesOf(value, marksOf(value, result)), [value, result])

  return (
    <Fragment>
      <div sx={BuiltOn.styles.oleoo.prompt}>
        <span aria-hidden='true' sx={BuiltOn.styles.oleoo.caret}>&gt;</span>
        <div sx={BuiltOn.styles.oleoo.release}>
          <div aria-hidden='true' sx={BuiltOn.styles.oleoo.mirror}>{value || EXAMPLE}{'​'}</div>
          <textarea
            id='builton-release'
            rows={1}
            value={value}
            placeholder={EXAMPLE}
            spellCheck={false}
            autoComplete='off'
            autoCapitalize='off'
            onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
            onChange={(event) => onChange(event.target.value.replace(/[\r\n]+/g, ''))}
            sx={BuiltOn.styles.oleoo.input}
          />
        </div>
      </div>
      <p aria-hidden='true' sx={BuiltOn.styles.oleoo.tokens}>
        {pieces.map(({ word, separator, field, label }, index) => (
          <span key={index}>
            <span data-field={label ? field : undefined} sx={field ? BuiltOn.styles.oleoo.token : BuiltOn.styles.oleoo.piece}>{word}</span>
            <span sx={BuiltOn.styles.oleoo.piece}>{separator}</span>
          </span>
        ))}
      </p>
      <dl aria-live='polite' sx={BuiltOn.styles.oleoo.fields}>
        {FIELDS.map(([key, read]) => {
          const found = result ? read(result) : null

          return (
            <div key={key} sx={{ ...BuiltOn.styles.oleoo.field, ...(key === 'title' ? BuiltOn.styles.oleoo.wide : {}) }}>
              <dt>{key}</dt>
              <dd sx={found ? {} : BuiltOn.styles.oleoo.missing}>{found ?? '—'}</dd>
            </div>
          )
        })}
      </dl>
    </Fragment>
  )
}

const Oleoo = ({ film }: { film: Film | null }) => {
  const [typed, setTyped] = useState<string | null>(null)
  const [ref, shown] = useReveal<HTMLDivElement>()
  const { palette } = usePalette(film && pictureSrc(film.poster, 'w92'), null, film?.poster)
  const value = typed ?? film?.winner.title ?? EXAMPLE
  // Typed over, the name is no longer this film's
  const own = !!film && value === film.winner.title

  return (
    <article
      aria-labelledby='builton-oleoo'
      sx={BuiltOn.styles.oleoo.element}
      style={palette?.backgroundColor ? { '--tint': palette.backgroundColor } as object : undefined}
    >
      {film?.backdrop && (
        <img
          src={pictureSrc(film.backdrop, 'w1280') ?? undefined}
          alt=''
          loading='lazy'
          decoding='async'
          sx={{ ...BuiltOn.styles.oleoo.backdrop, opacity: own ? 0.28 : 0.08 }}
        />
      )}
      <div aria-hidden='true' sx={BuiltOn.styles.oleoo.edge}>{EDGE}</div>
      <div ref={ref} sx={{ ...BuiltOn.styles.column, ...BuiltOn.styles.oleoo.body }}>
        <h3 id='builton-oleoo' sx={BuiltOn.styles.hidden}>oleoo</h3>
        <div sx={BuiltOn.styles.oleoo.top}>
          <div sx={BuiltOn.styles.oleoo.brand}>
            <pre aria-hidden='true' sx={BuiltOn.styles.oleoo.logo}>
              {LOGO.map((line, index) => (
                <span
                  key={index}
                  style={{ transitionDelay: `${index * 70}ms` }}
                  sx={{ ...BuiltOn.styles.oleoo.line, ...(shown ? BuiltOn.styles.shown : {}) }}
                >
                  {line}
                </span>
              ))}
            </pre>
            <p sx={BuiltOn.styles.oleoo.subtitle}>Scene/P2P/Warez release name parser</p>
            <p sx={BuiltOn.styles.oleoo.forum}>
              <span aria-hidden='true'>🏴‍☠️✨🎟 </span>Named after an old French warez forum closed in 2008.
            </p>
          </div>
          <dl sx={BuiltOn.styles.oleoo.facts}>
            {FACTS.map(([fact, detail]) => (
              <div key={fact} sx={BuiltOn.styles.oleoo.fact}>
                <dt sx={/^\d+$/.test(fact) ? BuiltOn.styles.oleoo.number : BuiltOn.styles.oleoo.word}>{fact}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div sx={{ ...BuiltOn.styles.oleoo.parser, ...(film ? BuiltOn.styles.oleoo.withPoster : {}) }}>
          {film && (
            <img
              src={pictureSrc(film.poster, 'w342') ?? undefined}
              alt={film.title}
              loading='lazy'
              decoding='async'
              sx={{ ...BuiltOn.styles.oleoo.poster, opacity: own ? 1 : 0.3 }}
            />
          )}
          <div sx={BuiltOn.styles.oleoo.parse}>
            <label htmlFor='builton-release' sx={BuiltOn.styles.oleoo.label}>
              {own ? `The release Sensorr picked for ${film.title}, parsed as you type` : 'Release name, parsed as you type'}
            </label>
            <Release value={value} onChange={setTyped} />
          </div>
        </div>

        <Links
          link={BuiltOn.styles.oleoo.link}
          links={[
            ['npm', 'https://www.npmjs.com/package/oleoo'],
            ['crates.io', 'https://crates.io/crates/oleoo'],
            ['pkg.go.dev', 'https://pkg.go.dev/github.com/thcolin/oleoo/packages/go/v3'],
            ['GitHub', 'https://github.com/thcolin/oleoo'],
          ]}
        />
      </div>
    </article>
  )
}

const Cell = ({ style, index }: { style: object, index: number }) => (
  <div style={style} sx={BuiltOn.styles.grid.cell}>
    <span sx={{ backgroundColor: SHADES[index % SHADES.length] }}>{index + 1}</span>
  </div>
)

const SHADES = ['gray-200', 'gray-300', 'gray-100', 'gray-400', 'gray-200', 'gray-50', 'gray-300']

const VirtualGrid = () => {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [rendered, setRendered] = useState(0)
  const [ref, shown] = useReveal<HTMLDivElement>()
  const raf = useRef(0)

  // The grid calls it while it renders: the count waits for the next frame
  const onRender = useCallback((children: unknown[]) => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => setRendered(children.length))
  }, [])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <article aria-labelledby='builton-grid' sx={BuiltOn.styles.grid.element}>
      <div ref={ref} sx={{ ...BuiltOn.styles.column, ...BuiltOn.styles.grid.body }}>
        <div sx={BuiltOn.styles.grid.head}>
          <h3 id='builton-grid' sx={BuiltOn.styles.grid.title}>
            <span aria-hidden='true' sx={BuiltOn.styles.grid.emoji}>💀🚟</span>
            <span>react-<wbr />responsive-<wbr />virtual-<wbr />grid</span>
          </h3>
          <p sx={BuiltOn.styles.grid.text}>
            Dead-simple react virtual grid library that act like a normal <code>{'<div>'}</code>.
          </p>
        </div>
        <div sx={{ ...BuiltOn.styles.grid.stage, ...(shown ? BuiltOn.styles.shown : {}) }}>
          <div
            ref={setFrame}
            tabIndex={0}
            role='region'
            aria-label={`Virtual grid of ${CELLS} cells, scroll it`}
            sx={BuiltOn.styles.grid.frame}
          >
            <div sx={BuiltOn.styles.grid.track}>
              {frame && (
                <ResponsiveVirtualGrid
                  total={CELLS}
                  cell={{ height: 64, width: 64 }}
                  child={Cell}
                  onRender={onRender}
                  scrollContainer={frame}
                  scrollDirection='vertical'
                />
              )}
            </div>
          </div>
          <p aria-live='polite' sx={BuiltOn.styles.grid.counter}>
            <span sx={BuiltOn.styles.grid.count}>{rendered}</span>
            <span>rendered of 10&nbsp;000 cells</span>
          </p>
        </div>
        <div sx={BuiltOn.styles.grid.foot}>
          <pre sx={BuiltOn.styles.grid.snippet}><code>{SNIPPET}</code></pre>
          <Links
            link={BuiltOn.styles.grid.link}
            links={[
              ['npm', 'https://www.npmjs.com/package/react-responsive-virtual-grid'],
              ['GitHub', 'https://github.com/thcolin/react-responsive-virtual-grid'],
              ['Example', 'https://thcolin.github.io/react-responsive-virtual-grid/'],
            ]}
          />
        </div>
      </div>
    </article>
  )
}

export const BuiltOn = ({ film }: { film: Film | null }) => (
  <section aria-labelledby='builton-title' sx={BuiltOn.styles.element}>
    <header sx={{ ...BuiltOn.styles.column, ...BuiltOn.styles.header }}>
      <h2 id='builton-title' sx={BuiltOn.styles.heading}>Built on</h2>
      <p sx={BuiltOn.styles.intro}>Two libraries written for Sensorr, published on their own.</p>
    </header>
    <Oleoo film={film} />
    <VirtualGrid />
  </section>
)

const focus = {
  outline: 'none',
  ':focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary',
    outlineOffset: '2px',
  },
}

const entrance = {
  opacity: 0,
  transform: 'translateY(1.5em)',
  transitionProperty: 'opacity, transform',
  transitionDuration: '600ms',
  transitionTimingFunction: EASE,
  '@media (prefers-reduced-motion: reduce)': {
    opacity: 1,
    transform: 'none',
    transition: 'none',
  },
}

const button = {
  display: 'block',
  paddingX: [6, 4],
  paddingY: 8,
  fontFamily: 'monospace',
  fontSize: 5,
  textAlign: 'center',
  textDecoration: 'none',
  border: '1px solid',
  borderRadius: '0.25em',
  transitionProperty: 'background-color, color',
  transitionDuration: '150ms',
  transitionTimingFunction: 'ease-out',
  ...focus,
}

// Textarea and its mirror lay the name out the same way, character for character
const releaseText = {
  margin: '0px',
  paddingY: [6, 4],
  paddingX: '0px',
  fontFamily: 'monospace',
  fontSize: 'inherit',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  overflowWrap: 'anywhere',
}

BuiltOn.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
  },
  column: {
    width: '100%',
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    // ponytail: band rhythm sits above the 2em top of the spacing scale
    paddingTop: ['4em', '6em'],
    paddingBottom: ['2em', '3em'],
  },
  heading: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    color: 'text',
    textWrap: 'balance',
  },
  intro: {
    margin: '0px',
    fontSize: [3, 2],
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'balance',
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    overflow: 'clip',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
  shown: {
    opacity: 1,
    transform: 'none',
  },
  links: {
    display: ['grid', 'flex'],
    gridTemplateColumns: ['repeat(2, minmax(0, 1fr))', 'none'],
    flexWrap: 'wrap',
    gap: 8,
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  oleoo: {
    element: {
      position: 'relative',
      paddingBottom: ['3em', '5em'],
      backgroundColor: 'blackPure',
      // The drawn film's dominant color, low behind the parser
      backgroundImage: 'radial-gradient(70% 55% at 20% 85%, color-mix(in srgb, var(--tint, transparent) 32%, transparent), transparent)',
      color: 'whitePure',
      fontFamily: 'monospace',
      lineHeight: 'body',
      overflow: 'clip',
    },
    // The film behind its own release, faded into the band at both ends
    backdrop: {
      position: 'absolute',
      left: '0px',
      bottom: '0px',
      width: '100%',
      height: '75%',
      objectFit: 'cover',
      objectPosition: 'center 30%',
      maskImage: 'linear-gradient(to bottom, transparent, black 45%, transparent)',
      pointerEvents: 'none',
      transitionProperty: 'opacity',
      transitionDuration: '300ms',
      transitionTimingFunction: 'ease-out',
    },
    edge: {
      position: 'relative',
      overflow: 'clip',
      whiteSpace: 'nowrap',
      fontSize: 4,
      lineHeight: 1,
      color: 'gray-800',
      userSelect: 'none',
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      gap: ['2em', '3em'],
      paddingTop: ['3em', '5em'],
    },
    top: {
      display: 'flex',
      flexDirection: ['column', 'row'],
      justifyContent: 'space-between',
      alignItems: ['stretch', 'flex-end'],
      gap: ['2em', '2em'],
    },
    brand: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 4,
      minWidth: 0,
    },
    logo: {
      margin: '0px',
      fontFamily: 'monospace',
      // 42 columns of Fira Code: about 25em wide, so 3.3vw fits 390px and 1.7rem fills 60% of the desktop column
      fontSize: 'round(min(3.3vw, 1.7rem), 1px)',
      // Block glyphs tile at 1, anything above leaves a seam between rows
      lineHeight: 1,
      overflow: 'visible',
      whiteSpace: 'pre',
    },
    line: {
      display: 'block',
      opacity: 0,
      transform: 'translateX(-0.75em)',
      transitionProperty: 'opacity, transform',
      transitionDuration: '500ms',
      transitionTimingFunction: EASE,
      '@media (prefers-reduced-motion: reduce)': {
        opacity: 1,
        transform: 'none',
        transition: 'none',
      },
    },
    subtitle: {
      margin: '0px',
      paddingX: 4,
      paddingY: 8,
      border: '1px solid',
      borderColor: 'whitePure',
      fontSize: [5, 3],
    },
    forum: {
      margin: '0px',
      fontSize: [5, 4],
      color: 'gray-400',
    },
    facts: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      columnGap: ['1.5em', '2.5em'],
      rowGap: ['1.5em', '2em'],
      flex: ['none', '1 1 0'],
      minWidth: 0,
      maxWidth: ['none', '26em'],
      margin: '0px',
    },
    fact: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 9,
      minWidth: 0,
      dd: {
        margin: '0px',
        fontSize: [6, 5],
        lineHeight: 1.4,
        color: 'gray-400',
      },
    },
    number: {
      fontSize: 'clamp(3rem, 4.6vw, 4.25rem)',
      fontWeight: 'bold',
      lineHeight: 0.9,
      letterSpacing: '-0.04em',
      fontVariantNumeric: 'tabular-nums',
    },
    word: {
      fontSize: [4, 3],
      fontWeight: 'bold',
      lineHeight: 1.2,
    },
    parser: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: ['1.5em', '2.5em'],
      alignItems: 'start',
    },
    // On a phone the poster sits next to the label, the parse runs full width under them
    withPoster: {
      gridTemplateColumns: ['6em minmax(0, 1fr)', '12em minmax(0, 1fr)'],
      columnGap: ['1em', '2.5em'],
      '> div': {
        display: ['contents', 'flex'],
      },
      '> div > :not(label)': {
        gridColumn: ['1 / -1', 'auto'],
      },
      '> div > label': {
        alignSelf: ['end', 'auto'],
      },
    },
    poster: {
      display: 'block',
      width: '100%',
      aspectRatio: '2 / 3',
      objectFit: 'cover',
      borderRadius: '0.25em',
      backgroundColor: 'gray-900',
      transitionProperty: 'opacity',
      transitionDuration: '300ms',
      transitionTimingFunction: 'ease-out',
    },
    parse: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
    },
    label: {
      fontSize: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'gray-400',
    },
    prompt: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 6,
      paddingX: [6, 2],
      border: '1px solid',
      borderColor: 'gray-600',
      borderRadius: '0.25em',
      backgroundColor: 'blackPure',
      fontSize: 'clamp(1rem, 1.6vw, 1.375rem)',
      transitionProperty: 'border-color',
      transitionDuration: '150ms',
      ':focus-within': {
        borderColor: 'whitePure',
      },
    },
    caret: {
      ...releaseText,
      color: 'gray-500',
      whiteSpace: 'pre',
    },
    release: {
      position: 'relative',
      flex: 1,
      minWidth: 0,
    },
    mirror: {
      ...releaseText,
      visibility: 'hidden',
    },
    tokens: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      // Room under each row for the field's name
      rowGap: '1.25em',
      margin: '0px',
      paddingBottom: '1.25em',
      fontSize: 'clamp(1.375rem, 2.8vw, 2.25rem)',
      fontWeight: 'semibold',
      lineHeight: 1.1,
      wordBreak: 'break-all',
    },
    piece: {
      color: 'gray-600',
    },
    token: {
      position: 'relative',
      color: 'whitePure',
      textDecoration: 'underline',
      textDecorationThickness: '2px',
      textUnderlineOffset: '0.25em',
      textDecorationColor: 'gray-500',
      '::after': {
        content: 'attr(data-field)',
        position: 'absolute',
        left: '0px',
        top: '100%',
        marginTop: '0.5em',
        fontSize: 'max(0.3em, 10px)',
        fontWeight: 'normal',
        lineHeight: 1,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        color: 'gray-400',
      },
    },
    input: {
      ...releaseText,
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      overflow: 'clip',
      resize: 'none',
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      color: 'whitePure',
      caretColor: 'whitePure',
      '::placeholder': {
        color: 'gray-550',
      },
    },
    fields: {
      display: 'grid',
      gridTemplateColumns: ['repeat(2, minmax(0, 1fr))', 'repeat(4, minmax(0, 1fr))'],
      gap: '1px',
      margin: '0px',
      backgroundColor: 'gray-800',
      border: '1px solid',
      borderColor: 'gray-800',
      borderRadius: '0.25em',
      overflow: 'clip',
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minWidth: 0,
      padding: [6, 4],
      backgroundColor: 'blackPure',
      dt: {
        fontSize: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'gray-400',
      },
      dd: {
        margin: '0px',
        fontSize: 'clamp(1.125rem, 2.2vw, 2rem)',
        lineHeight: 1.2,
        fontVariantNumeric: 'tabular-nums',
        overflowWrap: 'anywhere',
      },
    },
    wide: {
      gridColumn: '1 / -1',
    },
    missing: {
      color: 'gray-600',
    },
    link: {
      ...button,
      color: 'whitePure',
      borderColor: 'whitePure',
      ':hover': {
        backgroundColor: 'whitePure',
        color: 'blackPure',
      },
    },
  },
  grid: {
    element: {
      paddingY: ['3em', '5em'],
      // The example's own world: a gainsboro page, dark ink
      backgroundColor: 'gray-200',
      color: 'gray-900',
      lineHeight: 'body',
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      gap: ['1.5em', '2em'],
    },
    head: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    title: {
      display: 'flex',
      flexDirection: ['column', 'row'],
      alignItems: ['flex-start', 'baseline'],
      gap: [10, 6],
      margin: '0px',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: ['2.25rem', 'clamp(2rem, 3.4vw, 3.1rem)'],
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      color: 'gray-900',
    },
    emoji: {
      fontSize: '1em',
      letterSpacing: '0px',
      flexShrink: 0,
    },
    text: {
      margin: '0px',
      fontSize: [3, 2],
      color: 'gray-700',
      textWrap: 'balance',
      code: {
        fontFamily: 'monospace',
        color: 'gray-900',
      },
    },
    stage: {
      ...entrance,
      position: 'relative',
    },
    frame: {
      height: ['360px', '520px'],
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      touchAction: 'pan-y',
      padding: 11,
      backgroundColor: 'whitePure',
      border: '1px solid',
      borderColor: 'gray-400',
      borderRadius: '0.25em',
      ...focus,
    },
    // Whole columns only, centred: the grid floors its columns and would leave the remainder on the right
    track: {
      width: 'round(down, 100%, 64px)',
      marginX: 'auto',
    },
    cell: {
      boxSizing: 'border-box',
      padding: 11,
      span: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        color: 'gray-800',
        borderRadius: '0.25em',
        fontFamily: 'monospace',
        fontSize: 5,
        fontVariantNumeric: 'tabular-nums',
        // Mounted as it scrolls in: the fade shows the virtualization at work
        animation: `builton-cell 300ms ${EASE} backwards`,
        '@keyframes builton-cell': {
          from: { opacity: 0, transform: 'scale(0.85)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      },
    },
    counter: {
      position: 'absolute',
      top: ['0.75em', '1em'],
      right: ['0.75em', '1.5em'],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 10,
      margin: '0px',
      paddingX: [8, 4],
      paddingY: [9, 6],
      backgroundColor: 'gray-900',
      color: 'gray-300',
      borderRadius: '0.25em',
      fontFamily: 'monospace',
      fontSize: [7, 5],
      pointerEvents: 'none',
    },
    count: {
      fontSize: ['1.75rem', '3rem'],
      fontWeight: 'bold',
      lineHeight: 1,
      letterSpacing: '-0.03em',
      fontVariantNumeric: 'tabular-nums',
      color: 'whitePure',
    },
    foot: {
      display: 'grid',
      gridTemplateColumns: ['minmax(0, 1fr)', 'minmax(0, 1fr)', 'minmax(0, 1fr) auto'],
      gap: 2,
      alignItems: 'end',
    },
    snippet: {
      margin: '0px',
      padding: [6, 4],
      overflowX: 'auto',
      whiteSpace: ['pre-wrap', 'pre'],
      wordBreak: ['break-word', 'normal'],
      backgroundColor: 'whitePure',
      color: 'gray-900',
      border: '1px solid',
      borderColor: 'gray-400',
      borderRadius: '0.25em',
      fontFamily: 'monospace',
      fontSize: [6, 5],
      lineHeight: 'body',
    },
    link: {
      ...button,
      color: 'gray-900',
      borderColor: 'gray-900',
      ':hover': {
        backgroundColor: 'gray-900',
        color: 'whitePure',
      },
    },
  },
}
