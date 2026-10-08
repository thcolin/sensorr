import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import oleoo, { type OleooResult } from 'oleoo'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'
import type { Film } from '../data'

const EXAMPLE = 'Arrival.2016.MULTi.2160p.WEB-DL.x265.EAC3-VCR'
const CELLS = 10000

const LOGO = ` ▒█████   ██▓    ▓█████  ▒█████   ▒█████
▒██▒  ██▒▓██▒    ▓█   ▀ ▒██▒  ██▒▒██▒  ██▒
▒██░  ██▒▒██░    ▒███   ▒██░  ██▒▒██░  ██▒
▒██   ██░▒██░    ▒▓█  ▄ ▒██   ██░▒██   ██░
░ ████▓▒░░██████▒░▒████▒░ ████▓▒░░ ████▓▒░
░ ▒░▒░▒░ ░ ▒░▓  ░░░ ▒░ ░░ ▒░▒░▒░ ░ ▒░▒░▒░

┌─────────────────────────────────────┐
| Scene/P2P/Warez release name parser |
└─────────────────────────────────────┘`

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

const SNIPPET = `import VirtualGrid from 'react-responsive-virtual-grid'

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

const Links = ({ links, link }: { links: [string, string][], link: object }) => (
  <ul sx={BuiltOn.styles.links}>
    {links.map(([label, href]) => (
      <li key={href}>
        <a href={href} sx={link}>{label}</a>
      </li>
    ))}
  </ul>
)

const Oleoo = ({ film }: { film: Film | null }) => {
  const [typed, setTyped] = useState<string | null>(null)
  const value = typed ?? film?.winner.title ?? EXAMPLE
  const result = useMemo(() => parse(value), [value])

  return (
    <article sx={BuiltOn.styles.oleoo.element}>
      <h3 sx={BuiltOn.styles.hidden}>oleoo</h3>
      <pre aria-hidden='true' sx={BuiltOn.styles.oleoo.logo}>{LOGO}</pre>
      <p sx={BuiltOn.styles.oleoo.text}>
        <span aria-hidden='true'>🏴‍☠️✨🎟 </span>Named after an old French warez forum closed in 2008.
      </p>
      <p sx={BuiltOn.styles.oleoo.text}>
        JavaScript, Go and Rust. The three packages read the same <code>rules.json</code>, follow the
        same <code>SPEC.md</code>, and give the same result on 6697 releases. Zero dependency on npm.
        Sensorr reads every release name with it.
      </p>
      <div sx={BuiltOn.styles.oleoo.parser}>
        <label htmlFor='builton-release' sx={BuiltOn.styles.oleoo.label}>Release name</label>
        <div sx={BuiltOn.styles.oleoo.prompt}>
          <span aria-hidden='true'>&gt;</span>
          <input
            id='builton-release'
            type='text'
            value={value}
            placeholder={EXAMPLE}
            spellCheck={false}
            autoComplete='off'
            autoCapitalize='off'
            onChange={(event) => setTyped(event.target.value)}
            sx={BuiltOn.styles.oleoo.input}
          />
        </div>
        <dl sx={BuiltOn.styles.oleoo.fields}>
          {FIELDS.map(([key, read]) => {
            const found = result ? read(result) : null

            return (
              <div key={key} sx={BuiltOn.styles.oleoo.field}>
                <dt>{key}</dt>
                <dd sx={found ? {} : BuiltOn.styles.oleoo.missing}>{found ?? '—'}</dd>
              </div>
            )
          })}
        </dl>
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
    </article>
  )
}

const Cell = ({ style, index }: { style: object, index: number }) => (
  <div style={style} sx={BuiltOn.styles.grid.cell}>
    <span>{index + 1}</span>
  </div>
)

const VirtualGrid = () => {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [rendered, setRendered] = useState(0)
  const raf = useRef(0)

  // The grid calls it while it renders: the count waits for the next frame
  const onRender = useCallback((children: unknown[]) => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => setRendered(children.length))
  }, [])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <article sx={BuiltOn.styles.grid.element}>
      <h3 sx={BuiltOn.styles.grid.title}>react-responsive-virtual-grid</h3>
      <p sx={BuiltOn.styles.grid.text}>
        <span aria-hidden='true'>💀🚟 </span>Dead-simple react virtual grid library that act like a
        normal <code>{'<div>'}</code>. Cells render only when visible, positioned
        with <code>translate3d</code>, and the grid resizes with the window. Sensorr draws its library with it.
      </p>
      <div sx={BuiltOn.styles.grid.demo}>
        <div>
          <div
            ref={setFrame}
            tabIndex={0}
            role='region'
            aria-label={`Virtual grid of ${CELLS} cells`}
            sx={BuiltOn.styles.grid.frame}
          >
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
          <p sx={BuiltOn.styles.grid.counter}>
            <span sx={BuiltOn.styles.grid.count}>{rendered}</span> rendered of 10&nbsp;000 cells
          </p>
        </div>
        <pre sx={BuiltOn.styles.grid.snippet}><code>{SNIPPET}</code></pre>
      </div>
      <Links
        link={BuiltOn.styles.grid.link}
        links={[
          ['npm', 'https://www.npmjs.com/package/react-responsive-virtual-grid'],
          ['GitHub', 'https://github.com/thcolin/react-responsive-virtual-grid'],
          ['Example', 'https://thcolin.github.io/react-responsive-virtual-grid/'],
        ]}
      />
    </article>
  )
}

export const BuiltOn = ({ film }: { film: Film | null }) => (
  <section aria-labelledby='builton-title' sx={BuiltOn.styles.element}>
    <header sx={BuiltOn.styles.header}>
      <h2 id='builton-title' sx={BuiltOn.styles.heading}>Built on</h2>
      <p sx={BuiltOn.styles.intro}>Two libraries written for Sensorr, published on their own.</p>
    </header>
    <div sx={BuiltOn.styles.panels}>
      <Oleoo film={film} />
      <VirtualGrid />
    </div>
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

BuiltOn.styles = {
  element: {
    maxWidth: '80em',
    marginX: 'auto',
    paddingX: 4,
    paddingY: 0,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 2,
  },
  heading: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 1,
    lineHeight: 'heading',
    textWrap: 'balance',
  },
  intro: {
    margin: '0px',
    fontSize: 4,
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'pretty',
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', 'minmax(0, 1fr)', 'repeat(2, minmax(0, 1fr))'],
    gap: 2,
    alignItems: 'start',
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
  links: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  oleoo: {
    element: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      padding: [4, 2],
      backgroundColor: 'blackPure',
      color: 'whitePure',
      fontFamily: 'monospace',
      fontSize: 5,
      lineHeight: 'body',
      borderStyle: ['solid', 'double'],
      borderWidth: ['1px', '4px'],
      borderColor: 'whitePure',
      borderRadius: '0.25em',
    },
    logo: {
      margin: '0px',
      fontFamily: 'monospace',
      fontSize: [7, 5],
      lineHeight: 'normal',
      overflow: 'hidden',
      textAlign: 'center',
    },
    text: {
      margin: '0px',
      textWrap: 'pretty',
      code: {
        fontFamily: 'monospace',
      },
    },
    parser: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      paddingTop: 4,
      borderTop: '1px solid',
      borderColor: 'whitePure',
    },
    label: {
      color: 'gray-400',
    },
    prompt: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      borderBottom: '1px solid',
      borderColor: 'gray-700',
      ':focus-within': {
        borderColor: 'whitePure',
      },
    },
    input: {
      flex: 1,
      minWidth: 0,
      paddingY: 10,
      paddingX: '0px',
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      color: 'whitePure',
      caretColor: 'whitePure',
      fontFamily: 'monospace',
      fontSize: 5,
      '::placeholder': {
        color: 'gray-600',
      },
    },
    fields: {
      display: 'grid',
      gridTemplateColumns: 'max-content minmax(0, 1fr)',
      columnGap: 4,
      rowGap: 11,
      margin: '0px',
      fontVariantNumeric: 'tabular-nums',
    },
    field: {
      display: 'contents',
      dt: {
        color: 'gray-400',
      },
      dd: {
        margin: '0px',
        overflowWrap: 'anywhere',
      },
    },
    missing: {
      color: 'gray-550',
    },
    link: {
      color: 'whitePure',
      textDecoration: 'underline',
      textUnderlineOffset: '0.2em',
      ...focus,
    },
  },
  grid: {
    element: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      padding: [4, 2],
      backgroundColor: 'gray-50',
      color: 'gray-900',
      fontFamily: 'body',
      fontSize: 5,
      lineHeight: 'body',
      border: '1px solid',
      borderColor: 'gray-300',
      borderRadius: '0.25em',
    },
    title: {
      margin: '0px',
      fontFamily: 'monospace',
      fontWeight: 'semibold',
      fontSize: 4,
      overflowWrap: 'anywhere',
    },
    text: {
      margin: '0px',
      textWrap: 'pretty',
      code: {
        fontFamily: 'monospace',
      },
    },
    demo: {
      display: 'grid',
      gridTemplateColumns: ['minmax(0, 1fr)', 'repeat(2, minmax(0, 1fr))', 'minmax(0, 1fr)'],
      gap: 4,
      alignItems: 'start',
    },
    frame: {
      height: ['300px', '360px'],
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      touchAction: 'pan-y',
      backgroundColor: 'whitePure',
      border: '1px solid',
      borderColor: 'gray-300',
      borderRadius: '0.25em',
      ...focus,
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
        backgroundColor: 'gray-200',
        color: 'gray-700',
        borderRadius: '0.25em',
        fontFamily: 'monospace',
        fontSize: 7,
        fontVariantNumeric: 'tabular-nums',
      },
    },
    counter: {
      margin: '0px',
      marginTop: 8,
      fontFamily: 'monospace',
      color: 'gray-700',
    },
    count: {
      fontVariantNumeric: 'tabular-nums',
      color: 'gray-900',
      fontWeight: 'semibold',
    },
    snippet: {
      margin: '0px',
      padding: 4,
      overflowX: 'auto',
      backgroundColor: 'whitePure',
      border: '1px solid',
      borderColor: 'gray-300',
      borderRadius: '0.25em',
      fontFamily: 'monospace',
      fontSize: 6,
      lineHeight: 'body',
      code: {
        fontFamily: 'monospace',
      },
    },
    link: {
      color: 'gray-900',
      textDecoration: 'underline',
      textUnderlineOffset: '0.2em',
      ...focus,
    },
  },
}
