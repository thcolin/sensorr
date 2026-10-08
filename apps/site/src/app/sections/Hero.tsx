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
        <a href={DEMO} sx={{ ...buttonStyles.contain({ color: 'primary' }), ...Hero.styles.action }}>Try the demo</a>
        <a href='#install' sx={{ ...buttonStyles.outline({ color: 'white' }), ...Hero.styles.action }}>Install</a>
      </div>
      <p sx={Hero.styles.login}>
        Login <code>demo</code> / <code>demo</code>, it runs in your browser on a made-up library.
      </p>
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
    justifyContent: 'center',
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
    opacity: 0.35,
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
    background: 'radial-gradient(ellipse 60% 55% at 50% 50%, var(--theme-ui-colors-white) 20%, transparent 100%), linear-gradient(to bottom, transparent 70%, var(--theme-ui-colors-white) 100%)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '48em',
    paddingX: [4, 2],
    paddingY: 0,
    textAlign: 'center',
  },
  title: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0px',
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
    fontSize: 'clamp(4rem, 9vw, 7rem)',
    lineHeight: 1,
    ...rise(0),
  },
  wordmark: {
    fontFamily: 'heading-no-emoji',
    fontWeight: 800,
    // A phone sizes the word from its own width, so it outweighs the tagline
    fontSize: ['clamp(5.5rem, 26vw, 10rem)', 'clamp(4rem, 13vw, 10rem)'],
    lineHeight: 0.9,
    letterSpacing: '-0.03em',
    textTransform: 'lowercase',
    color: 'textLightest',
    // Raleway's descender-free word sits high in its line box: pull it under the emoji
    marginTop: '-0.08em',
    ...rise(80),
  },
  tagline: {
    margin: '0px',
    // Margins count in the element's own em: 24px on a phone, 28px wide, the same step as before the actions
    marginTop: [2, 4],
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: [4, 1],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
    ...rise(180),
  },
  pitch: {
    // The tagline already says it on a phone
    display: ['none', 'block'],
    maxWidth: '36em',
    margin: '0px',
    marginTop: 4,
    fontSize: [4, 3],
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'pretty',
    ...rise(260),
  },
  actions: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: 'stretch',
    justifyContent: 'center',
    width: ['100%', 'auto'],
    maxWidth: ['20em', 'none'],
    gap: 6,
    marginTop: [2, 1],
    ...rise(340),
  },
  action: {
    display: 'inline-block',
    textAlign: 'center',
    fontSize: 3,
    fontWeight: 'bold',
    paddingX: 1,
    paddingY: 6,
    textDecoration: 'none',
    ...focus,
  },
  login: {
    margin: '0px',
    marginTop: 4,
    fontSize: 5,
    color: 'textLight',
    textWrap: 'balance',
    ...rise(400),
    code: {
      fontFamily: 'monospace',
    },
  },
}
