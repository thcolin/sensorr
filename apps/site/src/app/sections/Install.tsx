import { Fragment, useEffect, useRef, useState } from 'react'
import { buttonStyles } from '@sensorr/ui'
import { DEMO, GITHUB } from '../data'

const COMMAND = 'curl --proto =https -fsSL https://raw.githubusercontent.com/thcolin/sensorr/main/install.sh | sh'
const COMPOSE = 'https://docs.docker.com/compose/install/'
// The command wraps only after a slash or at a space, never inside a word
const SEGMENTS = COMMAND.split(/(?<=\/)(?!\/)/)

type State = 'idle' | 'copied' | 'failed'

// Shown once scrolled into view
const useReveal = () => {
  const ref = useRef<HTMLElement>(null)
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

const shortcut = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘C' : 'Ctrl+C'

const Command = () => {
  const [state, setState] = useState<State>('idle')
  const code = useRef<HTMLElement>(null)
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeout.current), [])

  // Without the clipboard, the command stays selected for the keyboard shortcut
  const select = () => {
    const selection = window.getSelection()

    if (!code.current || !selection) {
      return
    }

    const range = document.createRange()
    range.selectNodeContents(code.current)
    selection.removeAllRanges()
    selection.addRange(range)
    setState('failed')
  }

  const copy = async () => {
    clearTimeout(timeout.current)

    try {
      if (!navigator.clipboard) {
        throw new Error('[Site] No clipboard')
      }

      await navigator.clipboard.writeText(COMMAND)
      setState('copied')
      timeout.current = setTimeout(() => setState('idle'), 2000)
    } catch {
      select()
    }
  }

  return (
    <div sx={Install.styles.terminal}>
      <pre sx={Install.styles.pre}>
        <span sx={Install.styles.prompt} aria-hidden='true'>$ </span>
        <code ref={code}>
          {SEGMENTS.map((segment, index) => <Fragment key={index}>{index > 0 && <wbr />}{segment}</Fragment>)}
        </code>
      </pre>
      <button type='button' onClick={copy} sx={{ ...buttonStyles.outline({ color: 'gray' }), ...Install.styles.copy }}>
        {{ idle: 'Copy', copied: '✓ Copied', failed: `Press ${shortcut()}` }[state]}
      </button>
      <span sx={Install.styles.status} role='status'>
        {{ idle: '', copied: 'Command copied', failed: `Command selected, press ${shortcut()} to copy it` }[state]}
      </span>
    </div>
  )
}

// The other end of the hero's wall, blurred behind the closing call as on the README tiles
const Wall = ({ wall }: { wall?: string[] }) => (
  <div sx={Install.styles.wall} aria-hidden='true'>
    {(wall || []).slice(-40).map((path) => (
      <img key={path} src={`https://image.tmdb.org/t/p/w185${path}`} alt='' loading='lazy' decoding='async' sx={Install.styles.poster} />
    ))}
  </div>
)

export const Install = ({ wall }: { wall?: string[] }) => {
  const [ref, shown] = useReveal()

  return (
    <section id='install' ref={ref} sx={Install.styles.element} data-shown={shown} aria-labelledby='install-title'>
      <Wall wall={wall} />
      <div sx={Install.styles.veil} />
      <div sx={Install.styles.content}>
        <h2 id='install-title' sx={Install.styles.title}>Install it at home.</h2>
        <p sx={Install.styles.lead}>
          One command, with <a href={COMPOSE} sx={Install.styles.link}>Docker and Docker Compose</a> on{' '}
          <code sx={Install.styles.code}>linux/amd64</code> or <code sx={Install.styles.code}>linux/arm64</code>.
        </p>
        <Command />
        <ul sx={Install.styles.sources}>
          <li><a href={`${GITHUB}/blob/main/install.sh`} sx={Install.styles.link}>Read the installer</a></li>
          <li><a href={`${GITHUB}/blob/main/docker-compose.yml`} sx={Install.styles.link}>Read the compose file</a></li>
          <li><a href={`${GITHUB}#install`} sx={Install.styles.link}>Read the full documentation</a></li>
        </ul>
        <a href={DEMO} sx={{ ...buttonStyles.outline({ color: 'white' }), ...Install.styles.demo }}>Try the demo first</a>
      </div>
    </section>
  )
}

const focus = {
  ':focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary',
    outlineOffset: '2px',
  },
}

// Heading, terminal and links rise in turn once the section scrolls in
const rise = (delay: number) => ({
  opacity: 0,
  transform: 'translateY(2rem)',
  transitionProperty: 'opacity, transform',
  transitionDuration: '700ms',
  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  transitionDelay: `${delay}ms`,
  '[data-shown=true] &': {
    opacity: 1,
    transform: 'translateY(0px)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    opacity: 1,
    transform: 'none',
    transition: 'none',
  },
})

Install.styles = {
  element: {
    position: 'relative',
    overflow: 'hidden',
    isolation: 'isolate',
    // One screen, filled on purpose, as the hero fills the first
    display: 'flex',
    alignItems: 'center',
    minHeight: '100svh',
    paddingY: ['5em', '7em'],
    scrollMarginTop: '0px',
  },
  wall: {
    position: 'absolute',
    inset: '-2em',
    display: 'grid',
    gridTemplateColumns: ['repeat(5, 1fr)', 'repeat(10, 1fr)'],
    alignContent: 'center',
    gap: 6,
    filter: 'blur(2.5px)',
    opacity: 0.65,
    transform: 'rotate(-6deg) scale(1.15)',
    zIndex: -2,
  },
  poster: {
    display: 'block',
    width: '100%',
    aspectRatio: '2 / 3',
    objectFit: 'cover',
    borderRadius: '0.25em',
    backgroundColor: 'grayDark',
  },
  veil: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    // Fades into the page at both ends, and darkens only behind the text, so the posters stay readable around it
    background: [
      'radial-gradient(ellipse 75% 45% at 50% 50%, var(--theme-ui-colors-white) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-ui-colors-white) 0%, transparent 20%, transparent 80%, var(--theme-ui-colors-white) 100%)',
      'radial-gradient(ellipse 45% 50% at 32% 50%, var(--theme-ui-colors-white) 35%, transparent 100%), linear-gradient(to bottom, var(--theme-ui-colors-white) 0%, transparent 18%, transparent 82%, var(--theme-ui-colors-white) 100%)',
    ],
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
  },
  title: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    color: 'textLightest',
    textWrap: 'balance',
    ...rise(0),
  },
  lead: {
    maxWidth: '40em',
    margin: '0px',
    marginTop: 6,
    fontSize: [3, 2],
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'pretty',
    ...rise(140),
  },
  link: {
    color: 'textLightest',
    textDecoration: 'underline',
    textDecorationColor: 'grayDarker',
    textUnderlineOffset: '0.2em',
    transition: 'text-decoration-color 200ms ease-in-out',
    ':hover': {
      textDecorationColor: 'currentColor',
    },
    ...focus,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '0.85em',
  },
  terminal: {
    position: 'relative',
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'center'],
    gap: 4,
    width: '100%',
    marginTop: 2,
    paddingX: [4, 2],
    paddingY: [4, 1],
    backgroundColor: 'grayLightest',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
    ...rise(240),
  },
  pre: {
    flex: 1,
    minWidth: '0px',
    margin: '0px',
    fontFamily: 'monospace',
    // 14px keeps the whole command on one line at 1440, beside the Copy button
    fontSize: 5,
    lineHeight: 'body',
    color: 'textLightest',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'normal',
    wordBreak: 'normal',
  },
  prompt: {
    color: 'primary',
    userSelect: 'none',
  },
  copy: {
    flexShrink: 0,
    minWidth: '8em',
    fontSize: 4,
    fontWeight: 'bold',
    paddingX: 4,
    paddingY: 6,
    borderColor: 'grayDarker',
    ':hover': {
      borderColor: 'grayDarkest',
    },
    ...focus,
  },
  sources: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 2,
    rowGap: 8,
    margin: '0px',
    marginTop: 4,
    padding: '0px',
    listStyle: 'none',
    fontSize: [4, 3],
    color: 'text',
    ...rise(320),
  },
  status: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
  demo: {
    display: 'inline-block',
    width: ['100%', 'auto'],
    textAlign: 'center',
    marginTop: 1,
    fontSize: 3,
    fontWeight: 'bold',
    paddingX: 1,
    paddingY: 6,
    textDecoration: 'none',
    ...focus,
    ...rise(400),
  },
}
