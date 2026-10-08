import { Bar, TransitionPill, buttonStyles } from '@sensorr/ui'
import { Film, Films, type Release } from '../../data'
import { EASE, STILL, tmdb, useReveal } from './shared'
import { language } from '../journey/release'

const TODAY = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' })

// What a refine changes first: an axis the policy holds or breaks before one it only moves; a language a release does not
// name is its original version
const changesOf = (film: Film) => film.refine.rows
  .map((row) => row.axis === 'language' ? { ...row, from: language(row.from), to: language(row.to) } : row)
  .filter(({ state, from, to }) => state !== 'quiet' && state !== 'same' && from && to)
  .sort((a, b) => Number(a.state === 'moved') - Number(b.state === 'moved'))
  .slice(0, 2)

// The first film with a change to show, and the next one, recorded meanwhile
export const phoneFilms = (data: Films | null): [Film?, Film?] => {
  const film = data?.films.find((film) => changesOf(film).length)
  return [film, data?.films.find((other) => other !== film)]
}

// The size as the push counts it (`filesize` in apps/api/src/app/notifications/push.ts)
const size = (bytes: number) => `${Number((bytes / 1024 ** 3).toFixed(2))} GB`

// A push as the API sends it (`moviePushOf`, same file): the movie and its year, the job's emoji with the indexer, the
// size and the peers, the release name, and the poster beside it
const Push = ({ film, emoji, release }: { film: Film, emoji: string, release: Release }) => (
  <span sx={Phone.styles.push}>
    <span sx={Phone.styles.pushText}>
      <strong sx={Phone.styles.title}>{film.title} ({film.year})</strong>
      <span>{emoji} {release.znab}, {size(release.size)}, {release.seeders} peers</span>
      <span sx={Phone.styles.release} title={release.title}>{release.title}</span>
    </span>
    <img src={tmdb('w185', film.poster)} alt='' loading='lazy' decoding='async' sx={Phone.styles.thumb} />
  </span>
)

const App = () => (
  <div sx={Phone.styles.app}>
    <img src='assets/favicon.png' alt='' width={24} height={24} sx={Phone.styles.icon} />
    <span sx={Phone.styles.name}>Sensorr</span>
    <span sx={Phone.styles.now}>now</span>
  </div>
)

export const Phone = ({ film, recorded }: { film?: Film, recorded?: Film }) => {
  const [ref, shown] = useReveal()

  return (
    <div ref={ref} sx={Phone.styles.element} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(4em)' }}>
      <div sx={Phone.styles.screen}>
        {film && <img src={tmdb('w500', film.poster)} alt='' loading='lazy' decoding='async' sx={Phone.styles.wallpaper} />}
        <span sx={Phone.styles.shade} aria-hidden='true' />
        <span sx={Phone.styles.island} aria-hidden='true' />
        <span sx={Phone.styles.lock} aria-hidden='true'>
          <span sx={Phone.styles.date}>{TODAY.format(new Date())}</span>
          <span sx={Phone.styles.clock}>9:41</span>
        </span>
        <div
          sx={Phone.styles.notification}
          style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(-2.5em) scale(0.96)' }}
        >
          <App />
          {film ? (
            <>
              <Push film={film} emoji='✨' release={film.winner} />
              <span sx={Phone.styles.pills}>
                {changesOf(film).map((row) => <TransitionPill key={row.axis} from={row.from} to={row.to} state={row.state} compact={true} title={row.axis} />)}
              </span>
            </>
          ) : (
            <>
              <Bar width='60%' height='1em' />
              <Bar width='80%' height='0.75em' />
              <Bar width='100%' height='0.625em' />
              <Bar width='60%' height='1.25em' pill={true} />
            </>
          )}
          <span sx={Phone.styles.actions} aria-hidden='true'>
            <span sx={{ ...buttonStyles.contain({ color: 'primary' }), ...Phone.styles.action }}>Accept</span>
            <span sx={{ ...buttonStyles.outline({ color: 'white' }), ...Phone.styles.action }}>Refuse</span>
          </span>
        </div>
        {recorded && (
          <div
            sx={{ ...Phone.styles.notification, ...Phone.styles.second }}
            style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(-2.5em) scale(0.96)' }}
          >
            <App />
            <Push film={recorded} emoji='📹' release={recorded.owned} />
          </div>
        )}
        <span sx={Phone.styles.dock} aria-hidden='true'>
          <span sx={Phone.styles.button}>🔦</span>
          <span sx={Phone.styles.button}>📷</span>
        </span>
        <span sx={Phone.styles.indicator} aria-hidden='true' />
      </div>
    </div>
  )
}

// A drawing of the hardware and of the iOS lock screen: their own radii, not the system's 0.25em
Phone.styles = {
  element: {
    width: ['19em', '22em'],
    maxWidth: '100%',
    marginX: 'auto',
    padding: 9,
    borderRadius: '3.25em',
    border: '1px solid',
    borderColor: 'grayDarker',
    backgroundColor: 'blackPure',
    transitionProperty: 'opacity, transform',
    transitionDuration: '700ms',
    transitionTimingFunction: EASE,
    ...STILL,
  },
  screen: {
    position: 'relative',
    isolation: 'isolate',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    aspectRatio: '9 / 19.5',
    overflow: 'clip',
    paddingX: 8,
    paddingTop: '3em',
    paddingBottom: 8,
    borderRadius: '2.9em',
    backgroundColor: 'grayLight',
    color: 'whitePure',
  },
  wallpaper: {
    position: 'absolute',
    inset: '0px',
    zIndex: -2,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  shade: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    background: 'linear-gradient(to bottom, hsla(0, 0%, 0%, 0.35), hsla(0, 0%, 0%, 0.1) 40%, hsla(0, 0%, 0%, 0.6))',
  },
  island: {
    position: 'absolute',
    top: 8,
    left: '50%',
    width: '30%',
    height: '1.6em',
    borderRadius: '1em',
    backgroundColor: 'blackPure',
    transform: 'translateX(-50%)',
  },
  lock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 11,
    fontFamily: 'heading',
  },
  date: {
    fontWeight: 'strong',
    fontSize: [5, 4],
  },
  clock: {
    fontWeight: 'heading',
    fontSize: ['4em', '5em'],
    lineHeight: 'reset',
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  notification: {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    width: '100%',
    marginTop: 4,
    padding: 6,
    borderRadius: '1.25em',
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-blackPure) 55%, transparent)',
    backdropFilter: 'blur(24px) saturate(1.4)',
    fontSize: [6, 5],
    textAlign: 'left',
    transitionProperty: 'opacity, transform',
    transitionDuration: '600ms',
    transitionTimingFunction: EASE,
    transitionDelay: '550ms',
    ...STILL,
  },
  second: {
    marginTop: '0px',
    transitionDelay: '800ms',
  },
  push: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  pushText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
    flex: 1,
    minWidth: '0px',
    color: 'whitePure',
  },
  thumb: {
    flexShrink: 0,
    width: '2.75em',
    aspectRatio: '2 / 3',
    objectFit: 'cover',
    borderRadius: '0.375em',
  },
  app: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: '1.5em',
    height: '1.5em',
    borderRadius: '0.375em',
  },
  name: {
    flex: 1,
    fontSize: 6,
    fontWeight: 'strong',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'textLight',
  },
  now: {
    fontSize: 6,
    color: 'textLight',
  },
  title: {
    fontWeight: 'strong',
    color: 'whitePure',
    overflow: 'clip',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  release: {
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'textLight',
    overflow: 'clip',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    minWidth: 0,
    marginTop: 10,
  },
  actions: {
    pointerEvents: 'none',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 9,
  },
  action: {
    display: 'block',
    textAlign: 'center',
    fontSize: 6,
  },
  dock: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
    paddingX: 6,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5em',
    height: '2.5em',
    borderRadius: '50%',
    backgroundColor: 'grayShadow',
    backdropFilter: 'blur(12px)',
    fontSize: 5,
  },
  indicator: {
    width: '36%',
    height: '0.3em',
    borderRadius: '1em',
    backgroundColor: 'whitePure',
    opacity: 0.8,
  },
}
