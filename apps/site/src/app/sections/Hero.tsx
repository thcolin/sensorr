import { useState } from 'react'
import { buttonStyles } from '@sensorr/ui'
import { DEMO } from '../data'

const ROWS = 6
// Seconds a row takes to scroll by its own width: each row its own pace, so the wall never lines up
const PACES = [90, 70, 80, 65, 85, 75]

const Tile = ({ path }: { path?: string }) => {
  const [loaded, setLoaded] = useState(false)

  return (
    <span sx={Hero.styles.tile}>
      {path && (
        <img
          src={`https://image.tmdb.org/t/p/w185${path}`}
          alt=''
          loading='lazy'
          decoding='async'
          onLoad={() => setLoaded(true)}
          sx={{ ...Hero.styles.picture, opacity: loaded ? 1 : 0 }}
        />
      )}
    </span>
  )
}

const Wall = ({ wall }: { wall?: string[] }) => {
  // Before the films arrive, the wall keeps its shape in empty tiles
  const posters = wall?.length ? wall : Array.from({ length: ROWS * 16 }, () => undefined)
  const size = Math.ceil(posters.length / ROWS)

  return (
    <div sx={Hero.styles.wall} aria-hidden='true'>
      {Array.from({ length: ROWS }, (_, row) => {
        const line = posters.slice(row * size, (row + 1) * size)

        return (
          <div key={row} sx={Hero.styles.row} style={{ animationDuration: `${PACES[row % PACES.length]}s`, animationDirection: row % 2 ? 'reverse' : 'normal' }}>
            {/* Twice the same line, so the row loops on its own width */}
            {[...line, ...line].map((path, index) => <Tile key={index} path={path} />)}
          </div>
        )
      })}
    </div>
  )
}

export const Hero = ({ wall }: { wall?: string[] }) => (
  <header sx={Hero.styles.element}>
    <Wall wall={wall} />
    <div sx={Hero.styles.veil} />
    <div sx={Hero.styles.content}>
      {/* Drawn as the app's Login screen draws it, live text so it stays sharp at any size */}
      <h1 sx={Hero.styles.title}>
        <span sx={Hero.styles.hidden}>Sensorr</span>
        <span sx={Hero.styles.emoji} aria-hidden='true'>🍿📼</span>
        <span sx={Hero.styles.wordmark} aria-hidden='true'>sensorr</span>
      </h1>
      <p sx={Hero.styles.tagline}>
        Your Friendly Digital Video Recorder.<br />
        Think VCR, but in modern times.
      </p>
      <div sx={Hero.styles.actions}>
        <div sx={Hero.styles.demo}>
          <a href={DEMO} sx={{ ...buttonStyles.contain({ color: 'primary' }), ...Hero.styles.action }}>Try the demo</a>
          <p sx={Hero.styles.login}>login <code>demo</code> / <code>demo</code></p>
        </div>
        <a href='#install' sx={{ ...buttonStyles.outline({ color: 'gray' }), ...Hero.styles.action, ...Hero.styles.install }}>
          Install <span aria-hidden='true'>→</span>
        </a>
      </div>
    </div>
    {/* The app itself, as the README hero shows it: Home in a desktop browser, and on a phone over its corner */}
    <div sx={Hero.styles.screens}>
      <figure sx={Hero.styles.browser}>
        <span sx={Hero.styles.bar} aria-hidden='true'><span /><span /><span /></span>
        <img
          src='assets/app-desktop.webp'
          width={1800}
          height={1125}
          alt="Sensorr's Home in a desktop browser: trending movies and shows, each with its poster, score and state"
          decoding='async'
          // React 18 only passes the attribute through in lowercase, and its types do not know it yet
          {...{ fetchpriority: 'high' }}
          sx={Hero.styles.capture}
        />
      </figure>
      <figure sx={Hero.styles.phone}>
        <img
          src='assets/app-mobile.webp'
          width={600}
          height={1298}
          alt="Sensorr's Home on an iPhone: the same trending movies and shows, in rows of posters"
          decoding='async'
          sx={{ ...Hero.styles.capture, ...Hero.styles.screen }}
        />
      </figure>
    </div>
  </header>
)

// Each block of the hero rises in turn, once, on load
const rise = (delay: number) => ({
  animationName: 'site-hero-rise',
  animationDuration: '700ms',
  animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  animationDelay: `${delay}ms`,
  animationFillMode: 'both',
  '@keyframes site-hero-rise': {
    from: { opacity: 0, transform: 'translateY(1.5rem)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animationName: 'none',
  },
})

const focus = {
  ':focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary',
    outlineOffset: '2px',
  },
}

Hero.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: ['5em', 'clamp(6em, 14vh, 9em)'],
    overflow: 'clip',
    isolation: 'isolate',
  },
  wall: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '160%',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    transform: 'translate(-50%, -50%) rotate(-12deg)',
    opacity: [0.3, 0.45],
    zIndex: -2,
  },
  row: {
    display: 'flex',
    gap: 6,
    width: 'max-content',
    animationName: 'site-wall',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    '@keyframes site-wall': {
      from: { transform: 'translateX(0)' },
      // Half the row is one line: at -50% the second copy stands where the first started
      to: { transform: 'translateX(-50%)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
    },
  },
  tile: {
    flexShrink: 0,
    width: ['6em', '8em'],
    aspectRatio: '2 / 3',
    borderRadius: '0.25em',
    overflow: 'clip',
    backgroundColor: 'grayDark',
  },
  picture: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 400ms ease-in-out',
  },
  veil: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    // Darkest at the top, under the text, the wall showing more around the screens, solid again at the bottom
    background: 'linear-gradient(to bottom, color-mix(in srgb, var(--theme-ui-colors-white) 90%, transparent) 0%, color-mix(in srgb, var(--theme-ui-colors-white) 80%, transparent) 35%, color-mix(in srgb, var(--theme-ui-colors-white) 55%, transparent) 60%, var(--theme-ui-colors-white) 100%)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxSizing: 'border-box',
    width: '100%',
    paddingX: 4,
  },
  title: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.08em',
    margin: '0px',
    fontSize: ['clamp(3.25rem, 16vw, 4.5rem)', 'clamp(4rem, 7vw, 6rem)'],
    lineHeight: 1,
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'clip',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
  emoji: {
    // An app icon above its name, as the app's login draws it
    fontSize: '0.75em',
    letterSpacing: '0.02em',
    ...rise(0),
  },
  wordmark: {
    fontFamily: 'heading-no-emoji',
    fontWeight: 800,
    letterSpacing: '-0.035em',
    textTransform: 'lowercase',
    color: 'textLightest',
    ...rise(60),
  },
  tagline: {
    margin: '0px',
    marginTop: 4,
    fontFamily: 'heading',
    fontWeight: 'strong',
    fontSize: ['1.125rem', '1.375rem'],
    lineHeight: 'heading',
    color: 'textLightest',
    ...rise(140),
  },
  actions: {
    // Two equal halves on a phone, side by side at their own width beyond
    display: ['grid', 'flex'],
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'flex-start',
    gap: 6,
    justifyContent: 'center',
    width: ['100%', 'auto'],
    marginTop: ['2em', '2.5em'],
    ...rise(220),
  },
  screens: {
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '76em',
    marginTop: ['3em', '4em'],
    paddingX: 4,
    // The phone hangs below the browser's bottom edge
    paddingBottom: [0, '3em'],
    display: ['flex', 'block'],
    justifyContent: 'center',
    animationName: 'site-hero-screens',
    animationDuration: '800ms',
    animationTimingFunction: 'ease-out',
    animationDelay: '360ms',
    animationFillMode: 'both',
    '@keyframes site-hero-screens': {
      from: { opacity: 0, transform: 'translateY(40px)' },
      to: { opacity: 1, transform: 'translateY(0px)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
    },
  },
  browser: {
    // A phone only gets the phone
    display: ['none', 'block'],
    width: '84%',
    margin: '0px',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.5em',
    overflow: 'clip',
    backgroundColor: 'white',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    height: '1.75em',
    paddingX: 6,
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    span: {
      width: '0.5em',
      height: '0.5em',
      borderRadius: '50%',
      backgroundColor: 'grayDark',
    },
  },
  capture: {
    display: 'block',
    width: '100%',
    height: 'auto',
  },
  phone: {
    position: ['static', 'absolute'],
    right: 4,
    bottom: '0px',
    width: ['min(64vw, 16em)', '21%'],
    margin: '0px',
    padding: 9,
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '2em',
    backgroundColor: 'white',
  },
  screen: {
    borderRadius: '1.625em',
  },
  demo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  action: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxSizing: 'border-box',
    width: ['100%', 'auto'],
    minWidth: [0, '9.5em'],
    fontSize: 4,
    paddingY: 6,
    paddingX: 3,
    lineHeight: 'reset',
    textDecoration: 'none',
    ...focus,
  },
  install: {
    minWidth: [0, 'auto'],
    ':hover': {
      borderColor: 'textLight',
      color: 'textLightest',
    },
  },
  login: {
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'textLight',
    code: {
      fontFamily: 'inherit',
      color: 'textLightest',
    },
  },
}
