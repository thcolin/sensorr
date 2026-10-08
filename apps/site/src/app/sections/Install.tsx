import { Fragment, useEffect, useRef, useState } from 'react'
import { buttonStyles } from '@sensorr/ui'
import { DEMO, GITHUB } from '../data'

const COMMAND = 'curl --proto =https -fsSL https://raw.githubusercontent.com/thcolin/sensorr/main/install.sh | sh'
const COMPOSE = 'https://docs.docker.com/compose/install/'
// The command wraps only after a slash or at a space, never inside a word
const SEGMENTS = COMMAND.split(/(?<=\/)(?!\/)/)

type State = 'idle' | 'copied' | 'failed'

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

export const Install = () => (
  <section id='install' sx={Install.styles.element} aria-labelledby='install-title'>
    <h2 id='install-title' sx={Install.styles.title}>Install</h2>
    <p sx={Install.styles.prose}>
      You need <a href={COMPOSE} sx={Install.styles.link}>Docker and Docker Compose</a>,
      on <code sx={Install.styles.code}>linux/amd64</code> or <code sx={Install.styles.code}>linux/arm64</code>.
    </p>
    <Command />
    <p sx={Install.styles.sources}>
      <a href={`${GITHUB}/blob/main/install.sh`} sx={Install.styles.link}>Read the installer</a>
      <a href={`${GITHUB}/blob/main/docker-compose.yml`} sx={Install.styles.link}>Read the compose file</a>
    </p>
    <p sx={Install.styles.prose}>
      The installer asks for a few folders, a login and your <a href='https://www.themoviedb.org/settings/api' sx={Install.styles.link}>TMDB API key</a>, then starts the stack and gives you its URL.
      {' '}<a href={`${GITHUB}#install`} sx={Install.styles.link}>Read the full documentation</a>.
    </p>
    <a href={DEMO} sx={{ ...buttonStyles.outline({ color: 'white' }), ...Install.styles.demo }}>Try the demo first</a>
  </section>
)

Install.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
    paddingY: [1, 0],
    scrollMarginTop: 4,
  },
  title: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: [1, 0],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
  },
  prose: {
    maxWidth: '42em',
    margin: '0px',
    fontSize: 4,
    lineHeight: 'body',
    color: 'text',
    textWrap: 'pretty',
  },
  link: {
    color: 'textLightest',
    textDecoration: 'underline',
    textUnderlineOffset: '0.2em',
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: '2px',
    },
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 5,
  },
  terminal: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'center'],
    gap: 8,
    width: '100%',
    maxWidth: '48em',
    padding: 6,
    backgroundColor: 'grayLightest',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
  },
  pre: {
    flex: 1,
    minWidth: '0px',
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: 5,
    lineHeight: 'body',
    color: 'textLightest',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'normal',
    wordBreak: 'normal',
  },
  prompt: {
    color: 'textDarkest',
    userSelect: 'none',
  },
  copy: {
    flexShrink: 0,
    minWidth: '7em',
    borderColor: 'grayDarker',
    ':hover': {
      borderColor: 'grayDarkest',
    },
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: '2px',
    },
  },
  sources: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 9,
    margin: '0px',
    fontSize: 5,
    color: 'text',
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
    marginTop: 8,
    fontSize: 4,
    paddingX: 2,
    paddingY: 8,
    textDecoration: 'none',
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: '2px',
    },
  },
}
