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
      <p sx={Hero.styles.pitch}>
        Sensorr watches your Torznab indexers for the movies and shows you want, picks the best release by your rules,
        and hands it to your download client.
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
    alignItems: 'center',
    minHeight: ['92svh', '100svh'],
    overflow: 'hidden',
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
    overflow: 'hidden',
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
    // Dark under the text on the left, the wall left bare on the right; a phone darkens it whole
    background: [
      'linear-gradient(to bottom, color-mix(in srgb, var(--theme-ui-colors-white) 60%, transparent) 0%, color-mix(in srgb, var(--theme-ui-colors-white) 80%, transparent) 60%, var(--theme-ui-colors-white) 100%)',
      'linear-gradient(to right, var(--theme-ui-colors-white) 15%, color-mix(in srgb, var(--theme-ui-colors-white) 70%, transparent) 45%, transparent 75%), linear-gradient(to bottom, transparent 70%, var(--theme-ui-colors-white) 100%)',
    ],
  },
  content: {
    // A block on the column's left edge, as wide as its widest line, its lines centered in it
    display: 'grid',
    gridTemplateColumns: 'minmax(0px, max-content)',
    justifyContent: ['center', 'start'],
    justifyItems: 'center',
    textAlign: 'center',
    width: '100%',
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
    paddingY: 0,
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
    overflow: 'hidden',
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
  pitch: {
    maxWidth: '40ch',
    margin: '0px',
    marginX: 'auto',
    marginTop: [6, 5],
    fontSize: ['0.9375rem', '1.0625rem'],
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'pretty',
    ...rise(220),
  },
  actions: {
    // Two equal halves on a phone, side by side at their own width beyond
    display: ['grid', 'flex'],
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'flex-start',
    gap: 6,
    justifyContent: 'center',
    width: ['100%', 'auto'],
    marginTop: [2, 0],
    ...rise(300),
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
