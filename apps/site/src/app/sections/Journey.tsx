import { Fragment, useEffect, useRef, useState } from 'react'
import { Badge, Bar, Picture, Shadow, TransitionPill, buttonStyles, pictureSrc } from '@sensorr/ui'
import { usePalette, type Palette as Colors } from '@sensorr/palette'
import { DEMO, type Film, type Films, type Release as File, type Row } from '../data'
import { EASE, enter, useCountUp, useScrollProgress, useSeen } from './journey/motion'

type Palette = Colors | null
type Visual = { film: Film | null, seen: boolean, palette: Palette, policy?: Films['policy'] }

const tmdb = (size: string, path: string) => `https://image.tmdb.org/t/p/${size}${path}`
const gb = (bytes: number) => `${(Math.abs(bytes) / 1024 ** 3).toFixed(1)} GB`

// The title and the year are on screen already: a release shows what follows them
const tail = (title: string, year: number) => {
  const at = title.indexOf(`.${year}.`)
  return at < 0 ? title : title.slice(at + `.${year}.`.length)
}

// Only the axes known on both sides, what changed first, then what stayed
const ordered = (rows: Row[]) => {
  const known = rows.filter(({ from, to }) => from && to)
  return [...known.filter(({ state }) => state !== 'same'), ...known.filter(({ state }) => state === 'same')]
}

const Pills = ({ rows, size }: { rows: Row[], size?: { from: number, to: number } }) => (
  <div sx={Journey.styles.pills}>
    {ordered(rows).map(({ axis, from, to, state }) => (
      <TransitionPill key={axis} from={from} to={to} state={state} title={state === 'same' ? `${axis}: ${to}` : `${axis}: ${from} ~ ${to}`} />
    ))}
    {size && (
      <TransitionPill
        from={gb(size.from)}
        to={gb(size.to)}
        state={size.to < size.from ? 'held' : 'quiet'}
        title={`size: ${gb(size.from)} ~ ${gb(size.to)}`}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      />
    )}
  </div>
)

// A release name breaks at its dots only: its hyphens are non-breaking, so a long one wraps on whole words
const Release = ({ title, year, ...props }: { title: string, year: number } & React.HTMLAttributes<HTMLSpanElement>) => (
  <span title={title} {...props}>
    {tail(title, year).replace(/-/g, '‑').split('.').map((part, index, parts) => (
      <Fragment key={index}>{part}{index < parts.length - 1 && <>.<wbr /></>}</Fragment>
    ))}
  </span>
)

// A friend's watchlist on Plex, become a request in Sensorr
const Wished = ({ film, seen, palette }: Visual) => (
  <div sx={Journey.styles.wished}>
    <div sx={{ ...Journey.styles.watch, ...enter(seen, 'translateY(3em)', 0, 700) }}>
      {film?.backdrop && <img src={tmdb('w1280', film.backdrop)} alt='' loading='lazy' decoding='async' sx={Journey.styles.watchBackdrop} />}
      <div sx={Journey.styles.watchPoster}>
        <Picture path={film?.poster} size='w342' ready={!!film} palette={palette} sx={Journey.styles.picture} />
        <span sx={{ ...Journey.styles.corner, ...enter(seen, 'scale(2.2) rotate(-12deg)', 650, 500) }}>
          <Badge emoji='🍿' label='Requested' compact={true} palette={palette} sx={Journey.styles.badge} />
        </span>
      </div>
      <p sx={Journey.styles.watchHead}>
        <span sx={Journey.styles.avatar} aria-hidden='true'>A</span>
        <span sx={Journey.styles.watchText}><strong>Alex</strong> added to their watchlist</span>
        <span sx={Journey.styles.plex}>Plex</span>
      </p>
      <p sx={Journey.styles.watchTitle}>
        {film ? <>{film.title} <span sx={Journey.styles.year}>{film.year}</span></> : <Bar inline={true} width='8em' height='1em' />}
      </p>
      <p sx={{ ...Journey.styles.watchRequest, ...enter(seen, 'translateY(1em)', 900) }}>
        <span aria-hidden='true'>🍿</span> Requested by Alex in Sensorr
      </p>
    </div>
    {film?.director && (
      <p sx={{ ...Journey.styles.director, ...enter(seen, 'translateY(1.5em)', 1050) }}>
        {film.director.profile
          ? <img src={tmdb('w185', film.director.profile)} alt='' loading='lazy' decoding='async' sx={Journey.styles.profile} />
          : <span sx={Journey.styles.profile} aria-hidden='true' />}
        <span>
          <span sx={Journey.styles.eyebrow}><span aria-hidden='true' sx={{ marginRight: 9 }}>⭐</span>Following</span>
          <span sx={Journey.styles.followName}>You follow {film.director.name}</span>
        </span>
      </p>
    )}
  </div>
)

const AXES = ['resolution', 'source', 'encoding', 'language', 'dub', 'flags']

// Drawn as the Policies settings screen draws its ⭐ prefer and ⛔ avoid values, one box per axis
const Policy = ({ policy }: { policy?: Films['policy'] }) => {
  const axes = policy ? AXES.filter((axis) => policy.prefer[axis]?.length || policy.avoid[axis]?.length) : AXES.slice(0, 4)

  return (
    <dl sx={Journey.styles.policy}>
      {axes.map((axis) => (
        <div key={axis} sx={Journey.styles.axis}>
          <dt sx={Journey.styles.axisName}>{axis}</dt>
          {!policy ? (
            <dd sx={Journey.styles.tags}><Bar width='100%' height='1.5em' /></dd>
          ) : (['prefer', 'avoid'] as const).filter((group) => policy[group][axis]?.length).map((group) => (
            <dd key={group} sx={Journey.styles.tags}>
              <span aria-label={group} role='img'>{group === 'prefer' ? '⭐' : '⛔'}</span>
              {policy[group][axis].map((value) => (
                <span key={value} sx={{ ...Journey.styles.tag, backgroundColor: group === 'prefer' ? 'primaryDarker' : 'error' }}>{value}</span>
              ))}
            </dd>
          ))}
        </div>
      ))}
    </dl>
  )
}

const Record = ({ film, seen, policy }: Visual) => {
  const winner = film?.candidates.find(({ valid }) => valid)
  const rows = film ? film.candidates.slice(0, 5) : Array.from({ length: 5 }, () => null)

  return (
    <div sx={Journey.styles.record}>
      <Policy policy={policy} />
      <ol sx={Journey.styles.table}>
        {rows.map((release, index) => {
          const won = !!release && release === winner

          return (
            <li
              key={release?.title || index}
              sx={{
                ...Journey.styles.row,
                ...enter(seen, 'translateX(-3em)', 200 + index * 90),
                ...(won ? Journey.styles.won : {}),
                color: !release ? 'text' : won ? 'primary' : release.valid ? 'text' : 'error',
              }}
            >
              <span sx={Journey.styles.rank}>{won ? <span role='img' aria-label='Winner'>✓</span> : index + 1}</span>
              {release && film ? (
                <>
                  <Release title={release.title} year={film.year} sx={Journey.styles.ellipsis} />
                  <span sx={Journey.styles.number}>{gb(release.size)}</span>
                  <span sx={Journey.styles.number}>{release.score}</span>
                  {!release.valid && release.reason && <span sx={Journey.styles.reason}>{release.reason}</span>}
                </>
              ) : (
                <span sx={{ gridColumn: '2 / -1' }}><Bar width='100%' height='1em' /></span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const SPECS = ['resolution', 'source', 'encoding', 'language'] as const

// The movie in the library, as Plex shows it: the release Record picked, over its backdrop
const Archived = ({ film, seen, palette }: Visual) => {
  const file = film?.winner

  return (
    <div sx={Journey.styles.archived}>
      <div sx={Journey.styles.library} aria-hidden='true'>
        {film?.backdrop && (
          <img
            src={tmdb('w1280', film.backdrop)}
            alt=''
            loading='lazy'
            decoding='async'
            sx={{ ...Journey.styles.libraryBackdrop, transform: seen ? 'scale(1)' : 'scale(1.08)' }}
          />
        )}
        {palette && <Shadow palette={palette} fade={0.45} />}
        <div sx={Journey.styles.libraryVeil} />
      </div>
      <div sx={{ ...Journey.styles.tile, ...enter(seen, 'translateY(-3em) scale(0.94)', 0, 700) }}>
        <Picture path={film?.poster} size='w500' ready={!!film} palette={palette} sx={Journey.styles.picture} />
        <span sx={{ ...Journey.styles.corner, ...enter(seen, 'scale(0)', 600, 500) }}>
          <Badge emoji='📼' compact={true} palette={palette} role='img' aria-label='Archived' sx={Journey.styles.badge} />
        </span>
      </div>
      <div sx={{ ...Journey.styles.file, ...enter(seen, 'translateY(1.5em)', 350) }}>
        <p sx={Journey.styles.fileTitle}>
          {film ? <>{film.title} <span sx={Journey.styles.year}>{film.year}</span></> : <Bar inline={true} width='8em' height='1em' />}
        </p>
        <div sx={Journey.styles.specs}>
          {file ? SPECS.filter((axis) => file.meta[axis]).map((axis) => (
            <TransitionPill key={axis} to={file.meta[axis]} state='same' compact={true} title={`${axis}: ${file.meta[axis]}`} />
          )) : <Bar width='12em' height='1.5em' pill={true} />}
        </div>
        <p sx={Journey.styles.fileName}>
          {film && file ? <Release title={file.title} year={film.year} /> : <Bar width='100%' height='1em' />}
        </p>
        <p sx={Journey.styles.fileMeta}>
          {file ? <span>{gb(file.size)}</span> : <Bar inline={true} width='4em' height='1em' />}
          <span sx={Journey.styles.play}><span aria-hidden='true'>{'▶\uFE0E'}</span> Ready in <span sx={Journey.styles.plex}>Plex</span></span>
        </p>
      </div>
    </div>
  )
}

// One release swapped for another, as the Swaps screen draws it
const Swap = ({ film, seen, from, to, rows, struck = 'textLight', mark }: {
  film: Film | null
  seen: boolean
  from?: File
  to?: File
  rows?: Row[]
  struck?: string
  mark?: React.ReactNode
}) => (
  <div sx={Journey.styles.swap}>
    {film?.backdrop && <img src={tmdb('w1280', film.backdrop)} alt='' loading='lazy' decoding='async' sx={Journey.styles.swapBackdrop} />}
    <div sx={Journey.styles.swapPoster} aria-hidden='true'>
      <Picture path={film?.poster} size='w342' ready={!!film} sx={Journey.styles.picture} />
    </div>
    <div sx={Journey.styles.swapBody}>
      <p sx={{ ...Journey.styles.swapFrom, color: struck }}>
        {film && from ? (
          <>
            <s sx={{ ...Journey.styles.strike, backgroundSize: seen ? '100% 2px' : '0% 2px' }}>
              <Release title={from.title} year={film.year} />
            </s>
            <span sx={Journey.styles.swapSize}>{gb(from.size)}</span>
            {mark}
          </>
        ) : <Bar width='70%' height='1em' />}
      </p>
      <span sx={Journey.styles.arrow} aria-hidden='true'>↓</span>
      <p sx={{ ...Journey.styles.swapTo, ...enter(seen, 'translateY(1em)', 700) }}>
        {film && to ? (
          <>
            <Release title={to.title} year={film.year} />
            <span sx={Journey.styles.swapSize}>{gb(to.size)}</span>
          </>
        ) : <Bar width='80%' height='1em' />}
      </p>
      <div sx={enter(seen, 'translateY(1em)', 900)}>
        {film && rows && from && to ? <Pills rows={rows} size={{ from: from.size, to: to.size }} /> : <Bar width='60%' height='1.5em' pill={true} />}
      </div>
    </div>
  </div>
)

const Refine = ({ film, seen }: Visual) => (
  <Swap film={film} seen={seen} from={film?.owned} to={film?.winner} rows={film?.refine.rows} />
)

const Shrink = ({ film, seen }: Visual) => {
  const freed = useCountUp(film ? Math.abs(film.shrinked.size) : 0, seen && !!film)

  return (
    <div sx={Journey.styles.shrink}>
      <p sx={Journey.styles.counter} aria-label={film ? `${gb(film.shrinked.size)} freed` : undefined}>
        {film ? <span aria-hidden='true'>−{gb(freed)}</span> : <Bar inline={true} width='4em' height='0.8em' />}
      </p>
      <div sx={Journey.styles.gauge} aria-hidden='true'>
        <span
          sx={{ ...Journey.styles.gaugeFill, transform: seen && film ? `scaleX(${film.shrink.size / film.winner.size})` : 'scaleX(1)' }}
        />
      </div>
      <p sx={Journey.styles.counterLine}>
        {film ? <>{gb(film.winner.size)} <span aria-hidden='true'>→</span> {gb(film.shrink.size)}</> : <Bar inline={true} width='10em' height='1em' />}
      </p>
      <div sx={enter(seen, 'translateY(1em)', 500)}>
        {film && <Pills rows={film.shrinked.rows} />}
      </div>
    </div>
  )
}

const Report = ({ film, seen }: Visual) => (
  <div sx={Journey.styles.report}>
    <figure sx={{ ...Journey.styles.bubble, ...enter(seen, 'translateY(2em) scale(0.92)', 0, 600) }}>
      <figcaption sx={Journey.styles.bubbleHead}>
        <span sx={Journey.styles.avatar} aria-hidden='true'>A</span>
        <span sx={Journey.styles.watchText}><strong>Alex</strong> reported an issue</span>
        <span sx={Journey.styles.plex}>Plex</span>
      </figcaption>
      <blockquote sx={Journey.styles.quote}>The French track has no sound.</blockquote>
    </figure>
    <Swap
      film={film}
      seen={seen}
      from={film?.shrink}
      to={film?.replacement}
      rows={film?.reported.rows}
      struck='error'
      mark={(
        <span sx={{ ...Journey.styles.banned, ...enter(seen, 'scale(1.6)', 450, 400) }}>
          <Badge emoji='🚫' label='Banned' compact={true} sx={{ ...Journey.styles.badge, ...Journey.styles.bannedBadge }} />
        </span>
      )}
    />
  </div>
)

const SCENES = [
  { emoji: '🍿', label: 'Wished', title: 'A friend asks for it.', line: 'Alex adds it to their Plex watchlist, and it becomes a request.', Visual: Wished },
  { emoji: '📹', label: 'Record', title: 'Your rules, not a quality profile.', line: 'Your indexers answer, your policy ranks every release.', Visual: Record },
  { emoji: '📼', label: 'Archived', title: 'Recorded. In your library, in Plex.', line: 'The .torrent goes to the blackhole, your download client does the rest.', Visual: Archived },
  { emoji: '✨', label: 'Refine', title: 'Closer to your rules.', line: 'An older copy in your library gets swapped for a release your policy ranks higher.', Visual: Refine },
  { emoji: '✂️', label: 'Shrink', title: 'The same movie, lighter.', line: 'A smaller release, ranked by the same policy.', Visual: Shrink },
  { emoji: '🚨', label: 'Report', title: 'A friend reports, Sensorr swaps.', line: 'The release they watched is banned, another one takes its place.', Visual: Report },
]

const Scene = ({ index, film, palette, policy }: { index: number, film: Film | null, palette: Palette, policy?: Films['policy'] }) => {
  const [ref, seen] = useSeen<HTMLElement>(0.25)
  const { emoji, label, title, line, Visual } = SCENES[index]

  return (
    <article ref={ref} data-scene={index} aria-labelledby={`journey-${label.toLowerCase()}`} sx={Journey.styles.scene}>
      <header sx={Journey.styles.text}>
        <p sx={Journey.styles.label}><span aria-hidden='true'>{emoji}</span> {label}</p>
        <h3 id={`journey-${label.toLowerCase()}`} sx={{ ...Journey.styles.title, ...enter(seen, 'translateY(0.4em)', 0, 700) }}>{title}</h3>
        <p sx={Journey.styles.line}>{line}</p>
      </header>
      <div sx={column}>
        <div sx={Journey.styles.visual}>
          <Visual film={film} seen={seen} palette={palette} policy={policy} />
        </div>
      </div>
    </article>
  )
}

const Opening = ({ film, palette }: { film: Film | null, palette: Palette }) => {
  const ref = useScrollProgress<HTMLDivElement>('--opening')
  const [logo, setLogo] = useState(false)

  return (
    <div ref={ref} sx={Journey.styles.opening}>
      <div sx={Journey.styles.media} aria-hidden='true'>
        {film?.backdrop ? (
          <img key={film.backdrop} src={tmdb('w1280', film.backdrop)} alt='' decoding='async' sx={Journey.styles.backdrop} />
        ) : (
          <div sx={Journey.styles.blocks}>
            {Array.from({ length: 24 }, (_, index) => <span key={index} sx={Journey.styles.block} />)}
          </div>
        )}
        {palette && <Shadow palette={palette} fade={0.55} />}
        <div sx={Journey.styles.veil} />
      </div>
      <div sx={Journey.styles.openingContent}>
        <h2 sx={Journey.styles.film}>
          {!film ? (
            <Bar width='min(28rem, 70vw)' height='60%' />
          ) : film.logo ? (
            <img
              src={tmdb('w500', film.logo)}
              alt={film.title}
              decoding='async'
              onLoad={() => setLogo(true)}
              sx={{ ...Journey.styles.logo, opacity: logo ? 1 : 0, transform: logo ? 'none' : 'translateY(0.5em) scale(0.97)' }}
            />
          ) : (
            <span sx={Journey.styles.filmTitle}>{film.title}</span>
          )}
        </h2>
        <p sx={Journey.styles.meta}>
          {film
            ? [film.year, `${film.runtime} min`, film.director?.name].filter(Boolean).join(' · ')
            : <Bar inline={true} width='16em' height='1em' />}
        </p>
        <p sx={Journey.styles.openingLine}>One movie, from a friend's wish to your library.</p>
      </div>
    </div>
  )
}

// While the visitor is in the scenes, which movie this is and which job it is at
const Chip = ({ film, step, shown }: { film: Film | null, step: number, shown: boolean }) => (
  <div sx={{ ...Journey.styles.chip, opacity: shown && film ? 1 : 0, transform: shown && film ? 'none' : 'translateY(1em)' }} aria-hidden='true'>
    {film && <img src={tmdb('w92', film.poster)} alt='' decoding='async' sx={Journey.styles.chipPoster} />}
    <span sx={Journey.styles.chipTitle}>{film?.title}</span>
    <span key={step} sx={Journey.styles.chipEmoji}>{SCENES[step].emoji}</span>
  </div>
)

export const Journey = ({ film, policy }: { film: Film | null, policy?: Films['policy'] }) => {
  const { palette } = usePalette(film && pictureSrc(film.poster, 'w92'), null, film?.poster)
  const stage = useScrollProgress<HTMLDivElement>('--stage')
  const [step, setStep] = useState(0)
  const [inside, setInside] = useState(false)
  const scenes = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scenes.current
    if (!root) {
      return
    }

    // The scene that crosses the middle of the viewport is the current job
    const steps = new IntersectionObserver((entries) => entries
      .filter(({ isIntersecting }) => isIntersecting)
      .forEach(({ target }) => setStep(Number((target as HTMLElement).dataset.scene))), { rootMargin: '-50% 0px -50% 0px' })
    const within = new IntersectionObserver(([entry]) => setInside(entry.isIntersecting), { rootMargin: '-40% 0px -40% 0px' })

    root.querySelectorAll('[data-scene]').forEach((element) => steps.observe(element))
    within.observe(root)

    return () => {
      steps.disconnect()
      within.disconnect()
    }
  }, [])

  return (
    <section aria-labelledby='journey' sx={Journey.styles.element}>
      <span id='journey' sx={Journey.styles.hidden}>One movie, from a friend's wish to your library</span>
      <Opening film={film} palette={palette} />
      <div ref={stage} sx={Journey.styles.stage}>
        <div sx={Journey.styles.ambient} aria-hidden='true'>
          {film?.backdrop && <img key={film.backdrop} src={tmdb('w1280', film.backdrop)} alt='' loading='lazy' decoding='async' sx={Journey.styles.ambientImage} />}
          {palette && <Shadow palette={palette} fade={0.6} />}
          <div sx={Journey.styles.ambientVeil} />
        </div>
        <div ref={scenes}>
          {SCENES.map((_, index) => <Scene key={index} index={index} film={film} palette={palette} policy={policy} />)}
        </div>
      </div>
      <div sx={Journey.styles.close}>
        <p sx={Journey.styles.closeTitle}>Try it with your own rules.</p>
        <a href={DEMO} sx={{ ...buttonStyles.contain({ color: 'primary' }), ...Journey.styles.action }}>Try the demo</a>
      </div>
      <Chip film={film} step={step} shown={inside} />
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

const column = {
  width: '100%',
  maxWidth: '72em',
  marginX: 'auto',
  paddingX: [4, 2],
}

const display = {
  margin: '0px',
  fontFamily: 'heading',
  fontWeight: 800,
  fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
  lineHeight: 1.05,
  letterSpacing: '-0.02em',
  color: 'textLightest',
  textWrap: 'balance',
}

// A film's backdrop inside a card, faded out towards the card's poster
const backdropFade = {
  position: 'absolute',
  inset: '0px',
  zIndex: -1,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center 30%',
  maskImage: ['linear-gradient(to bottom, transparent 10%, black 90%)', 'linear-gradient(to right, transparent 15%, black 75%)'],
}

const card = {
  backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-white) 82%, transparent)',
  border: '1px solid',
  borderColor: 'grayDark',
  borderRadius: '0.25em',
  backdropFilter: 'blur(12px)',
}

Journey.styles = {
  element: {
    position: 'relative',
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
  opening: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    minHeight: ['85svh', '100svh'],
    paddingY: [0, 0],
    overflow: 'hidden',
    isolation: 'isolate',
  },
  media: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    backgroundColor: 'white',
  },
  backdrop: {
    position: 'absolute',
    inset: '0px',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 30%',
    transform: 'scale(calc(1.02 + var(--opening, 0) * 0.14))',
    animation: `journey-in 1200ms ${EASE} backwards`,
    '@keyframes journey-in': {
      from: { opacity: 0, transform: 'scale(1.12)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transform: 'none',
    },
  },
  blocks: {
    position: 'absolute',
    inset: '0px',
    display: 'grid',
    gridTemplateColumns: ['repeat(4, 1fr)', 'repeat(8, 1fr)'],
    gap: 6,
    padding: 6,
    opacity: 0.5,
  },
  block: {
    aspectRatio: '2 / 3',
    borderRadius: '0.25em',
    backgroundColor: 'grayDark',
  },
  veil: {
    position: 'absolute',
    inset: '0px',
    background: [
      'linear-gradient(to top, var(--theme-ui-colors-white) 8%, color-mix(in srgb, var(--theme-ui-colors-white) 55%, transparent) 50%, color-mix(in srgb, var(--theme-ui-colors-white) 20%, transparent) 100%)',
      'linear-gradient(to right, var(--theme-ui-colors-white) 0%, color-mix(in srgb, var(--theme-ui-colors-white) 60%, transparent) 30%, transparent 55%), linear-gradient(to top, var(--theme-ui-colors-white) 0%, color-mix(in srgb, var(--theme-ui-colors-white) 70%, transparent) 30%, transparent 60%)',
    ],
  },
  openingContent: {
    ...column,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    paddingBottom: ['3em', '5em'],
  },
  film: {
    display: 'flex',
    alignItems: 'flex-end',
    height: 'clamp(7rem, 22vw, 15rem)',
    width: '100%',
    margin: '0px',
  },
  logo: {
    display: 'block',
    maxWidth: 'min(36rem, 80vw)',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    objectPosition: 'left bottom',
    filter: 'drop-shadow(0 0 2em rgba(0, 0, 0, 0.6))',
    transition: `opacity 700ms ${EASE}, transform 700ms ${EASE}`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      transform: 'none',
    },
  },
  filmTitle: {
    ...display,
    fontSize: 'clamp(3rem, 9vw, 8rem)',
    color: 'textLightest',
  },
  meta: {
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [5, 3],
    color: 'textLightest',
    fontVariantNumeric: 'tabular-nums',
  },
  openingLine: {
    margin: '0px',
    maxWidth: '22em',
    fontSize: [3, 2],
    lineHeight: 'heading',
    color: 'textLight',
    textWrap: 'balance',
  },
  stage: {
    position: 'relative',
    isolation: 'isolate',
    // The sticky backdrop hangs 100svh below its last scene: clipped here, so it never covers the close
    overflow: 'clip',
    // After the blurred backdrop and under the scenes: the opening's black runs into it, and it runs into what follows
    '::after': {
      content: '""',
      position: 'absolute',
      inset: '0px',
      zIndex: -1,
      pointerEvents: 'none',
      background: 'linear-gradient(to bottom, var(--theme-ui-colors-white), transparent 50svh), linear-gradient(to top, var(--theme-ui-colors-white), transparent 50svh)',
    },
  },
  ambient: {
    position: 'sticky',
    top: '0px',
    height: '100svh',
    marginBottom: '-100svh',
    overflow: 'hidden',
    zIndex: -1,
    backgroundColor: 'white',
  },
  ambientImage: {
    position: 'absolute',
    inset: '-10%',
    width: '120%',
    height: '120%',
    objectFit: 'cover',
    objectPosition: 'calc(var(--stage, 0.5) * 100%) center',
    filter: 'blur(28px) saturate(1.4) brightness(0.8)',
    opacity: 0.9,
  },
  ambientVeil: {
    position: 'absolute',
    inset: '0px',
    background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-ui-colors-white) 75%, transparent) 0%, color-mix(in srgb, var(--theme-ui-colors-white) 35%, transparent) 60%, color-mix(in srgb, var(--theme-ui-colors-white) 20%, transparent) 100%)',
  },
  scene: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: [2, 0],
    minHeight: ['auto', '100svh'],
    paddingY: ['4em', '4em'],
  },
  text: {
    ...column,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: [6, 5],
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'textLight',
  },
  title: {
    ...display,
    maxWidth: '14em',
  },
  line: {
    margin: '0px',
    maxWidth: '44em',
    fontSize: [3, 2],
    lineHeight: 'heading',
    color: 'textLight',
    textWrap: 'pretty',
  },
  visual: {
    fontSize: [4, 3],
  },
  picture: {
    borderRadius: '0.25em',
    overflow: 'hidden',
  },
  // 🍿 Wished
  wished: {
    display: 'flex',
    flexDirection: 'column',
    gap: [6, 4],
  },
  watch: {
    ...card,
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: ['7em minmax(0px, 1fr)', '13em minmax(0px, 1fr)'],
    gridTemplateRows: ['auto auto auto', 'auto 1fr auto'],
    gridTemplateAreas: ['"head head" "poster title" "request request"', '"poster head" "poster title" "poster request"'],
    columnGap: [6, 2],
    rowGap: [6, 4],
    padding: [6, 4],
    overflow: 'hidden',
    isolation: 'isolate',
  },
  // The film's backdrop behind the card's right side, faded out towards the poster
  watchBackdrop: {
    ...backdropFade,
    opacity: 0.4,
  },
  watchPoster: {
    gridArea: 'poster',
    position: 'relative',
    aspectRatio: '2 / 3',
    alignSelf: 'start',
  },
  watchHead: {
    gridArea: 'head',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0px',
    fontSize: [5, 4],
    color: 'text',
  },
  watchText: {
    flex: 1,
    minWidth: '0px',
    strong: {
      color: 'textLightest',
    },
  },
  avatar: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '2em',
    height: '2em',
    borderRadius: '50%',
    backgroundColor: 'plex',
    fontFamily: 'heading',
    fontWeight: 800,
    color: 'blackPure',
  },
  plex: {
    fontFamily: 'heading',
    fontWeight: 800,
    color: 'plex',
  },
  watchTitle: {
    gridArea: 'title',
    alignSelf: ['center', 'end'],
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: ['1.5em', 'clamp(2em, 3.5vw, 3em)'],
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    color: 'textLightest',
    textWrap: 'balance',
    overflowWrap: 'anywhere',
  },
  watchRequest: {
    gridArea: 'request',
    alignSelf: 'end',
    justifySelf: 'start',
    margin: '0px',
    paddingX: 6,
    paddingY: 9,
    borderRadius: '1em',
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-white) 70%, transparent)',
    fontFamily: 'monospace',
    fontSize: [5, 4],
    color: 'textLightest',
  },
  // A badge pinned inside its poster's top-right corner, as the app's Poster pins its own
  corner: {
    position: 'absolute',
    top: '0.5em',
    right: '0.5em',
    zIndex: 1,
    fontSize: [6, 4],
  },
  // The label sits next to its emoji, not a full em away
  badge: {
    fontSize: '1em',
    '& > span + span': {
      marginLeft: '0.375em',
    },
  },
  year: {
    fontFamily: 'monospace',
    fontWeight: 'normal',
    fontSize: '0.6em',
    letterSpacing: '0em',
    color: 'textLight',
  },
  director: {
    ...card,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '0px',
    paddingX: [6, 4],
    paddingY: 6,
  },
  profile: {
    flexShrink: 0,
    width: '3.5em',
    height: '3.5em',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: 'grayDark',
  },
  eyebrow: {
    display: 'block',
    fontSize: 6,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'textLight',
  },
  followName: {
    display: 'block',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: [3, 1],
    lineHeight: 'heading',
    color: 'textLightest',
  },
  // 📹 Record
  record: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  policy: {
    display: 'grid',
    gridTemplateColumns: ['repeat(2, minmax(0px, 1fr))', 'repeat(auto-fit, minmax(9em, 1fr))'],
    gap: 8,
    margin: '0px',
    fontSize: [6, 5],
  },
  axis: {
    ...card,
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    padding: 8,
  },
  axisName: {
    fontFamily: 'heading',
    fontWeight: 800,
    textTransform: 'capitalize',
    color: 'textLightest',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    margin: '0px',
  },
  tag: {
    paddingX: 8,
    paddingY: 11,
    borderRadius: '0.25em',
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: 6,
    color: 'whitePure',
  },
  table: {
    ...card,
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
    overflow: 'hidden',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: ['1.5em minmax(0px, 1fr) 4.5em', '2em minmax(0px, 1fr) 6em 4em'],
    alignItems: 'baseline',
    columnGap: 6,
    rowGap: 11,
    paddingX: 6,
    paddingY: 8,
    fontFamily: 'monospace',
    fontSize: [6, 5],
    fontVariantNumeric: 'tabular-nums',
    borderLeft: '3px solid transparent',
    ':not(:last-of-type)': {
      borderBottom: '1px solid',
      borderBottomColor: 'grayDark',
    },
    '>:nth-of-type(4)': {
      display: ['none', 'block'],
    },
  },
  won: {
    borderLeftColor: 'primary',
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-primary) 14%, transparent)',
    fontWeight: 600,
  },
  rank: {
    color: 'inherit',
    opacity: 0.7,
  },
  ellipsis: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  number: {
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  reason: {
    gridColumn: '2 / -1',
    fontSize: 6,
  },
  // 📼 Archived
  archived: {
    ...card,
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: ['9em minmax(0px, 1fr)', '14em minmax(0px, 1fr)'],
    gridTemplateAreas: ['"tile ." "file file"', '"tile file"'],
    alignItems: 'end',
    gap: [6, 2],
    padding: [6, 2],
    paddingTop: [6, '6em'],
    overflow: 'hidden',
    isolation: 'isolate',
  },
  library: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    overflow: 'hidden',
  },
  libraryBackdrop: {
    position: 'absolute',
    inset: '0px',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 30%',
    transition: `transform 1400ms ${EASE}`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      transform: 'none !important',
    },
  },
  libraryVeil: {
    position: 'absolute',
    inset: '0px',
    background: [
      'linear-gradient(to top, var(--theme-ui-colors-white) 35%, color-mix(in srgb, var(--theme-ui-colors-white) 40%, transparent) 75%, transparent 100%)',
      'linear-gradient(to top, color-mix(in srgb, var(--theme-ui-colors-white) 92%, transparent) 0%, transparent 70%), linear-gradient(to right, color-mix(in srgb, var(--theme-ui-colors-white) 60%, transparent) 0%, transparent 60%)',
    ],
  },
  tile: {
    gridArea: 'tile',
    position: 'relative',
    aspectRatio: '2 / 3',
  },
  file: {
    gridArea: 'file',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: '0px',
  },
  fileTitle: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: ['1.5em', 'clamp(2em, 3.5vw, 3em)'],
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    color: 'textLightest',
    textWrap: 'balance',
    overflowWrap: 'anywhere',
  },
  specs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    fontSize: [4, 3],
  },
  fileName: {
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [5, 4],
    lineHeight: 'heading',
    color: 'text',
    overflowWrap: 'anywhere',
  },
  fileMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 4,
    rowGap: 8,
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [5, 4],
    color: 'textLightest',
    fontVariantNumeric: 'tabular-nums',
  },
  play: {
    paddingX: 6,
    paddingY: 9,
    borderRadius: '1em',
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-white) 70%, transparent)',
  },
  // ✨ Refine, and the swap of 🚨 Report
  swap: {
    ...card,
    display: 'grid',
    position: 'relative',
    gridTemplateColumns: ['minmax(0px, 1fr)', '11em minmax(0px, 1fr)'],
    alignItems: 'center',
    overflow: 'hidden',
    isolation: 'isolate',
    gap: [6, 2],
    paddingX: [6, 4],
    paddingY: [6, 4],
  },
  swapBackdrop: {
    ...backdropFade,
    opacity: 0.3,
  },
  // Above the release on a phone, so the pills get the card's whole width
  swapPoster: {
    width: ['5em', 'auto'],
    aspectRatio: '2 / 3',
  },
  swapBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: '0px',
  },
  swapFrom: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 6,
    width: '100%',
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [5, 4],
    overflowWrap: 'anywhere',
  },
  // Drawn across the name, line after line as it wraps
  strike: {
    textDecoration: 'none',
    backgroundImage: 'linear-gradient(currentColor, currentColor)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 55%',
    transition: `background-size 700ms ${EASE} 300ms`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      backgroundSize: '100% 2px !important',
    },
  },
  swapSize: {
    fontSize: '0.8em',
    opacity: 0.8,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  arrow: {
    fontSize: 2,
    lineHeight: 1,
    color: 'textLight',
  },
  swapTo: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 6,
    width: '100%',
    margin: '0px',
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: [4, 2],
    lineHeight: 'heading',
    color: 'primary',
    overflowWrap: 'anywhere',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 8,
    fontSize: [4, 3],
  },
  // ✂️ Shrink
  shrink: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  counter: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: 'clamp(4.5rem, 15vw, 12rem)',
    lineHeight: 0.95,
    letterSpacing: '-0.03em',
    color: 'primary',
    fontVariantNumeric: 'lining-nums tabular-nums',
    whiteSpace: 'nowrap',
  },
  gauge: {
    position: 'relative',
    height: '0.75em',
    borderRadius: '1em',
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-primary) 30%, transparent)',
    overflow: 'hidden',
  },
  gaugeFill: {
    position: 'absolute',
    inset: '0px',
    borderRadius: '1em',
    backgroundColor: 'textLightest',
    transformOrigin: 'left center',
    transition: `transform 900ms ${EASE}`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  counterLine: {
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [5, 4],
    color: 'text',
    fontVariantNumeric: 'tabular-nums',
  },
  // 🚨 Report
  // The report lands on the swap card's corner, as a speech bubble
  report: {
    display: 'flex',
    flexDirection: 'column',
  },
  bubble: {
    ...card,
    position: 'relative',
    zIndex: 1,
    alignSelf: ['stretch', 'flex-end'],
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: ['auto', '26em'],
    margin: '0px',
    marginRight: ['0px', '1.5em'],
    marginBottom: ['0.75em', '-2em'],
    padding: 6,
    borderBottomRightRadius: '0px',
    backgroundColor: 'white',
    transformOrigin: 'right bottom',
  },
  bubbleHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 5,
    color: 'text',
  },
  quote: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: [3, 2],
    lineHeight: 'heading',
    color: 'textLightest',
    '::before': { content: '"“"' },
    '::after': { content: '"”"' },
  },
  banned: {
    display: 'inline-flex',
    alignSelf: 'center',
    fontSize: [6, 5],
  },
  bannedBadge: {
    backgroundColor: 'error',
    color: 'whitePure',
  },
  // Close
  close: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: [2, 1],
    paddingX: [4, 2],
    paddingY: ['6em', '10em'],
    borderTop: '1px solid',
    borderTopColor: 'grayDark',
    backgroundColor: 'white',
    backgroundImage: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--theme-ui-colors-primary) 12%, transparent) 0%, transparent 60%)',
    textAlign: 'center',
  },
  closeTitle: {
    ...display,
  },
  action: {
    display: 'inline-block',
    fontSize: 2,
    fontWeight: 'bold',
    paddingX: 2,
    paddingY: 6,
    textDecoration: 'none',
    ...focus,
  },
  // The chip
  chip: {
    position: 'fixed',
    left: '1.5em',
    bottom: '1.5em',
    zIndex: 10,
    display: ['none', 'flex'],
    alignItems: 'center',
    gap: 8,
    maxWidth: '20em',
    padding: 9,
    paddingRight: 6,
    ...card,
    borderRadius: '0.5em',
    pointerEvents: 'none',
    transition: `opacity 400ms ${EASE}, transform 400ms ${EASE}`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      transform: 'none',
    },
  },
  chipPoster: {
    width: '2.25em',
    aspectRatio: '2 / 3',
    borderRadius: '0.25em',
    objectFit: 'cover',
  },
  chipTitle: {
    minWidth: '0px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: 5,
    color: 'textLightest',
  },
  chipEmoji: {
    fontSize: 3,
    lineHeight: 1,
    animation: `journey-pop 400ms ${EASE} backwards`,
    '@keyframes journey-pop': {
      from: { transform: 'scale(0.4)', opacity: 0 },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
}
