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
      <h1 sx={Hero.styles.title}>
        <img src='assets/logo-dark.webp' alt='Sensorr' width={519} height={368} sx={Hero.styles.logo} />
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
    gap: 6,
    maxWidth: '40em',
    paddingX: 4,
    paddingY: 0,
    textAlign: 'center',
  },
  title: {
    margin: '0px',
    lineHeight: 0,
  },
  logo: {
    width: ['12em', '16em'],
    height: 'auto',
  },
  tagline: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: [3, 2],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
  },
  pitch: {
    margin: '0px',
    fontSize: 4,
    lineHeight: 'body',
    color: 'text',
    textWrap: 'pretty',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  action: {
    display: 'inline-block',
    fontSize: 4,
    paddingX: 2,
    paddingY: 8,
    textDecoration: 'none',
  },
  login: {
    margin: '0px',
    fontSize: 6,
    color: 'textLight',
    code: {
      fontFamily: 'monospace',
    },
  },
}
