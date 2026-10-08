import { Fragment, useEffect, useRef, useState } from 'react'
import { Badge, Bar, FADE, Picture, Shadow, TransitionPill, buttonStyles, conceal, pictureSrc, reveal } from '@sensorr/ui'
import { usePalette } from '@sensorr/palette'
import { DEMO, WRAPPED, type Film, type Films, type Release, type Row } from '../data'

const AXES = ['resolution', 'source', 'encoding', 'dub', 'language'] as const

const gb = (bytes: number) => `${(Math.abs(bytes) / 1024 ** 3).toFixed(1)} GB`
const signed = (bytes: number) => `${bytes < 0 ? '−' : '+'}${gb(bytes)}`

// A release name breaks at its dots only, so a long one wraps on whole words
const Name = ({ title }: { title: string }) => (
  <>
    {title.split('.').map((part, index, parts) => (
      <Fragment key={index}>{part}{index < parts.length - 1 && <>.<wbr /></>}</Fragment>
    ))}
  </>
)

// What the sticky column shows at each step
type Stage = {
  emoji: string
  release: Release | null
  banned?: Release
  rows: Row[]
  size?: { from: number, to: number }
  library?: boolean
}

const metaRows = (release: Release): Row[] => AXES
  .filter((axis) => release.meta?.[axis])
  .map((axis) => ({ axis, to: release.meta[axis], state: 'same' }))

const changed = (rows: Row[]) => rows.filter(({ state }) => state !== 'same')

const stagesOf = (film: Film): Stage[] => [
  { emoji: '🍿', release: null, rows: [] },
  { emoji: '📹', release: film.owned, rows: metaRows(film.owned) },
  { emoji: '📼', release: film.owned, rows: metaRows(film.owned), library: true },
  { emoji: '✨', release: film.winner, rows: changed(film.refine.rows), size: { from: film.owned.size, to: film.winner.size } },
  { emoji: '✂️', release: film.shrink, rows: changed(film.shrinked.rows), size: { from: film.winner.size, to: film.shrink.size } },
  { emoji: '🚨', release: film.replacement, banned: film.shrink, rows: changed(film.reported.rows), size: { from: film.shrink.size, to: film.replacement.size } },
  { emoji: '📖', release: film.replacement, rows: metaRows(film.replacement), library: true },
]

const Pills = ({ stage }: { stage: Stage }) => (
  <div sx={Journey.styles.pills}>
    {stage.rows.map(({ axis, from, to, state }) => (
      <TransitionPill
        key={axis}
        compact={true}
        from={from || '?'}
        to={to || '?'}
        state={state}
        neutral={{ from: !from, to: !to }}
        title={state === 'same' ? `${axis}: ${to}` : `${axis}: ${from || '?'} ~ ${to || '?'}`}
      />
    ))}
    {stage.size && (
      <TransitionPill
        compact={true}
        from={gb(stage.size.from)}
        to={gb(stage.size.to)}
        state={stage.size.to < stage.size.from ? 'held' : 'quiet'}
        title={`size: ${gb(stage.size.from)} ~ ${gb(stage.size.to)}`}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      />
    )}
  </div>
)

const deltaOf = (stage: Stage) => stage.size ? stage.size.to - stage.size.from : 0

const Content = ({ stage, delta }: { stage: Stage, delta: number }) => (
  <>
    {stage.banned && (
      <s sx={Journey.styles.banned} title={`Banned: ${stage.banned.title}`}>⛔ <Name title={stage.banned.title} /></s>
    )}
    <p sx={Journey.styles.name}>
      {stage.release ? <Name title={stage.release.title} /> : <span sx={Journey.styles.none}>No release yet, Record is on it</span>}
    </p>
    {stage.release && (
      <p sx={Journey.styles.size}>
        {gb(stage.release.size)}
        {!!delta && <span sx={{ color: delta < 0 ? 'primary' : 'textLight' }}>{signed(delta)}</span>}
        {stage.library && <span sx={Journey.styles.library}>In your library · Plex</span>}
      </p>
    )}
    <Pills stage={stage} />
  </>
)

// The step the column showed before, kept for one fade while the new one comes in over it
const useLeavingStep = (step: number | null) => {
  const previous = useRef(step)
  const [leaving, setLeaving] = useState<number | null>(null)

  useEffect(() => {
    if (previous.current === step) {
      return
    }

    setLeaving(previous.current)
    previous.current = step
    const timeout = setTimeout(() => setLeaving(null), FADE)
    return () => clearTimeout(timeout)
  }, [step])

  return leaving
}

const Aside = ({ film, step }: { film: Film | null, step: number }) => {
  const { palette } = usePalette(film && pictureSrc(film.poster, 'w92'), null, film?.poster)
  const stages = film ? stagesOf(film) : null
  const stage = stages?.[step] ?? null
  const leaving = useLeavingStep(stages ? step : null)

  return (
    <div sx={Journey.styles.aside}>
      <div sx={Journey.styles.bleed} aria-hidden='true'>
        {palette && <Shadow palette={palette} fade={0.4} />}
      </div>
      <div sx={Journey.styles.card}>
        <div sx={Journey.styles.poster} aria-hidden='true'>
          <Picture path={film?.poster} size='w342' ready={!!film} sx={Journey.styles.picture} />
          {stage && (
            <span key={step} sx={{ ...Journey.styles.badge, ...reveal }}>
              <Badge emoji={stage.emoji} compact={true} palette={palette} />
            </span>
          )}
        </div>
        <div sx={Journey.styles.details}>
          <p sx={Journey.styles.movie}>
            {film ? <>{film.title} <span sx={Journey.styles.year}>{film.year}</span></> : <Bar width='9em' height='1em' />}
          </p>
          <div sx={Journey.styles.stack}>
            {stages && leaving !== null && (
              <div key={`leaving-${leaving}`} sx={{ ...Journey.styles.release, ...conceal }} aria-hidden='true'>
                <Content stage={stages[leaving]} delta={deltaOf(stages[leaving])} />
              </div>
            )}
            <div key={step} sx={{ ...Journey.styles.release, ...(film ? reveal : {}) }}>
              {!stage ? (
                <>
                  <Bar width='100%' height='0.875em' />
                  <Bar width='60%' height='0.875em' />
                </>
              ) : (
                <Content stage={stage} delta={deltaOf(stage)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Drawn as the Policies settings screen draws its ⭐ prefer and ⛔ avoid values, one cluster per axis
const Policy = ({ policy }: { policy?: Films['policy'] }) => (
  <dl sx={Journey.styles.policy}>
    {([['⭐ prefer', 'prefer', 'primaryDarker'], ['⛔ avoid', 'avoid', 'error']] as const).map(([label, group, color]) => (
      <div key={group} sx={Journey.styles.group}>
        <dt sx={Journey.styles.groupLabel}>{label}</dt>
        {!policy ? (
          <dd sx={Journey.styles.axis}><Bar inline={true} width='12em' height='1.25em' /></dd>
        ) : Object.entries(policy[group]).filter(([, values]) => values.length).map(([axis, values]) => (
          <dd key={axis} title={axis} sx={Journey.styles.axis}>
            {values.map((value) => <span key={value} sx={{ ...Journey.styles.tag, borderColor: color, backgroundColor: color }}>{value}</span>)}
          </dd>
        ))}
      </div>
    ))}
  </dl>
)

// The film's title and year are in the sticky column, so a candidate shows what follows them
const tail = (title: string, year: number) => {
  const at = title.indexOf(`.${year}.`)
  return at < 0 ? title : title.slice(at + `.${year}.`.length)
}

const Candidates = ({ film }: { film: Film | null }) => {
  if (!film) {
    return (
      <ol sx={Journey.styles.candidates} aria-hidden='true'>
        {Array.from({ length: 5 }, (_, index) => <li key={index} sx={Journey.styles.candidate}><Bar width='100%' height='0.875em' /></li>)}
      </ol>
    )
  }

  const winner = film.candidates.find(({ valid }) => valid)

  return (
    <ol sx={Journey.styles.candidates}>
      {film.candidates.map((release, index) => {
        const won = release === winner

        return (
          <li key={release.title} sx={{ ...Journey.styles.candidate, color: won ? 'primary' : release.valid ? 'text' : 'error' }}>
            <span sx={Journey.styles.rank}>{index + 1}</span>
            <span sx={Journey.styles.title} title={release.title}>{tail(release.title, film.year)}</span>
            <span sx={Journey.styles.number}>{gb(release.size)}</span>
            <span sx={Journey.styles.number}>
              {won && <span role='img' aria-label='Winner'>✓ </span>}
              {release.score}
            </span>
            {!release.valid && release.reason && <span sx={Journey.styles.reason}>{release.reason}</span>}
          </li>
        )
      })}
    </ol>
  )
}

// A film-dependent value, a bar while the films load
const known = (film: Film | null, value: (film: Film) => React.ReactNode, width = '6em') => (
  film ? value(film) : <Bar inline={true} width={width} height='0.875em' />
)

const stepsOf = (film: Film | null, policy?: Films['policy']) => [
  {
    emoji: '🍿',
    label: 'Wished',
    title: 'A friend asks for it',
    body: (
      <>
        <p sx={Journey.styles.body}>
          Alex added {known(film, ({ title }) => <strong>{title}</strong>)} to their Plex watchlist. Friends link their Plex
          account in Keep In Touch, and their watchlist becomes requests.
        </p>
        {film?.director && (
          <p sx={Journey.styles.body}>Or you follow {film.director.name}, so it landed in your calendar.</p>
        )}
      </>
    ),
  },
  {
    emoji: '📹',
    label: 'Record',
    title: 'Your rules, not a quality profile',
    body: (
      <>
        <p sx={Journey.styles.body}>
          Record asks your Torznab indexers, and your policy ranks what they answer. Here is how it ranks{' '}
          {known(film, ({ title }) => <strong>{title}</strong>)} today.
        </p>
        <Policy policy={policy} />
        <Candidates film={film} />
      </>
    ),
  },
  {
    emoji: '📼',
    label: 'Archived',
    title: 'In your library, and in Plex',
    body: (
      <p sx={Journey.styles.body}>
        Record grabbed the best release out at the time and dropped its <code sx={Journey.styles.code}>.torrent</code> in
        the blackhole. Your download client took it from there, and the file landed in your library and in Plex.
      </p>
    ),
  },
  {
    emoji: '✨',
    label: 'Refine',
    title: 'Better',
    body: (
      <p sx={Journey.styles.body}>
        Better releases came out since. Refine looks for one closer to your policy, and the swap shows what changes:{' '}
        {known(film, ({ refine }) => <span sx={Journey.styles.amount}>{signed(refine.size)}</span>, '4em')} for a better copy.
      </p>
    ),
  },
  {
    emoji: '✂️',
    label: 'Shrink',
    title: 'Then lighter',
    body: (
      <p sx={Journey.styles.body}>
        Shrink looks for a smaller release that loses nothing your policy asks for. This one frees{' '}
        {known(film, ({ shrinked }) => <span sx={{ ...Journey.styles.amount, color: 'primary' }}>{gb(shrinked.size)}</span>, '4em')}.
      </p>
    ),
  },
  {
    emoji: '🚨',
    label: 'Report',
    title: 'Reports from Plex, answered',
    body: (
      <>
        <p sx={Journey.styles.body}>
          Alex reports an issue from Plex. Sensorr bans the release they watched, and finds another one to swap in.
        </p>
        <blockquote sx={Journey.styles.report}>
          <span aria-hidden='true'>🚨</span> No sound after the first twenty minutes.
          <cite sx={Journey.styles.cite}>Alex, from Plex</cite>
        </blockquote>
      </>
    ),
  },
  {
    emoji: '📖',
    label: 'Wrapped',
    title: 'A year on your server',
    body: (
      <>
        <p sx={Journey.styles.body}>
          At the end of the year, Tautulli's watch history gives Alex a wrapped of their year on your server.
        </p>
        <a href={WRAPPED} sx={Journey.styles.capture}>
          <img
            src='assets/wrapped.webp'
            width={1400}
            height={850}
            loading='lazy'
            decoding='async'
            alt="Alex's wrapped, a magazine: the cover of TV Alex, 2025 annual edition, 165 hours over 89 nights, next to its contents page"
            sx={Journey.styles.image}
          />
        </a>
        <p sx={Journey.styles.actions}>
          <a href={WRAPPED} sx={Journey.styles.link}>Read Alex's wrapped</a>
          <a href={DEMO} sx={{ ...buttonStyles.contain({ color: 'primary' }), ...Journey.styles.action }}>Try the demo</a>
        </p>
      </>
    ),
  },
]

export const Journey = ({ film, policy }: { film: Film | null, policy?: Films['policy'] }) => {
  const [step, setStep] = useState(0)
  const steps = useRef<(HTMLLIElement | null)[]>([])

  // The step that crosses the middle of the viewport drives the sticky column
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries
      .filter(({ isIntersecting }) => isIntersecting)
      .forEach(({ target }) => setStep(Number((target as HTMLElement).dataset.step))), { rootMargin: '-50% 0px -50% 0px' })

    steps.current.forEach((element) => element && observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <section aria-labelledby='journey'>
      <h2 id='journey' sx={Journey.styles.heading}>One movie, from a wish to a wrapped</h2>
      <div sx={Journey.styles.layout}>
        <Aside film={film} step={step} />
        <ol sx={Journey.styles.steps}>
          {stepsOf(film, policy).map(({ emoji, label, title, body }, index) => (
            <li
              key={label}
              data-step={index}
              ref={(element) => {
                steps.current[index] = element
              }}
              sx={Journey.styles.step}
            >
              <p sx={Journey.styles.label}><span aria-hidden='true'>{emoji}</span> {label}</p>
              <h3 sx={Journey.styles.stepTitle}>{title}</h3>
              {body}
            </li>
          ))}
        </ol>
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

Journey.styles = {
  heading: {
    maxWidth: '72em',
    marginX: 'auto',
    marginY: '0px',
    paddingX: [4, 2],
    paddingBottom: [4, '0px'],
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: [3, 1],
    lineHeight: 'heading',
    color: 'textLightest',
    textAlign: 'center',
    textWrap: 'balance',
  },
  layout: {
    display: ['block', 'grid'],
    gridTemplateColumns: '45fr 55fr',
    maxWidth: '72em',
    marginX: 'auto',
  },
  aside: {
    position: 'sticky',
    top: '0px',
    zIndex: 1,
    alignSelf: 'start',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: ['auto', '100vh'],
    paddingX: [4, 2],
    paddingY: [8, 2],
    backgroundColor: ['white', 'transparent'],
    borderBottom: ['1px solid', 'none'],
    borderColor: 'grayDark',
  },
  bleed: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    pointerEvents: 'none',
    maskImage: ['none', 'radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 100%)'],
  },
  card: {
    display: ['grid', 'flex'],
    gridTemplateColumns: '5em minmax(0px, 1fr)',
    flexDirection: 'column',
    alignItems: ['start', 'center'],
    gap: [6, 4],
    width: '100%',
    maxWidth: ['none', '22em', '24em'],
  },
  poster: {
    position: 'relative',
    width: ['5em', '14em', '18.75em'],
    aspectRatio: '2 / 3',
  },
  picture: {
    borderRadius: '0.25em',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: '-0.75em',
    right: '-0.75em',
    fontSize: [6, 4],
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: [9, 6],
    minWidth: '0px',
    width: '100%',
    textAlign: ['left', 'center'],
  },
  movie: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: [5, 3],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
    overflow: ['hidden', 'visible'],
    whiteSpace: ['nowrap', 'normal'],
    textOverflow: 'ellipsis',
  },
  year: {
    fontFamily: 'monospace',
    fontWeight: 'normal',
    color: 'textLight',
    fontVariantNumeric: 'tabular-nums',
  },
  stack: {
    display: 'grid',
    '>*': {
      gridArea: '1 / 1',
      minWidth: '0px',
    },
  },
  release: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: ['stretch', 'center'],
    gap: [10, 8],
    minHeight: ['auto', '8em'],
  },
  banned: {
    fontFamily: 'monospace',
    fontSize: [7, 6],
    color: 'error',
  },
  name: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [7, 5],
    lineHeight: 'body',
    color: 'text',
  },
  library: {
    fontFamily: 'body',
  },
  none: {
    fontFamily: 'body',
    color: 'textLight',
  },
  size: {
    display: 'flex',
    gap: 8,
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [7, 6],
    color: 'textLight',
    fontVariantNumeric: 'tabular-nums',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: ['flex-start', 'center'],
    gap: 10,
    fontSize: [6, 4],
  },
  steps: {
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
    minHeight: ['auto', '60vh'],
    paddingX: [4, 2],
    paddingY: [0, 2],
  },
  label: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 6,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'textLight',
  },
  stepTitle: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: [2, 1],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
  },
  body: {
    margin: '0px',
    maxWidth: '34em',
    fontSize: 4,
    lineHeight: 'body',
    color: 'text',
    textWrap: 'pretty',
    strong: {
      color: 'textLightest',
    },
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 5,
  },
  amount: {
    fontFamily: 'monospace',
    fontSize: 5,
    fontVariantNumeric: 'tabular-nums',
  },
  policy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: '0px',
  },
  group: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  axis: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    margin: '0px',
  },
  groupLabel: {
    minWidth: '5.5em',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 6,
    color: 'textLight',
  },
  tag: {
    paddingX: 8,
    paddingY: 10,
    border: '1px solid',
    borderRadius: '0.25em',
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: 6,
    color: 'whitePure',
  },
  candidates: {
    display: 'flex',
    flexDirection: 'column',
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
    backgroundColor: 'grayLightest',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
  },
  candidate: {
    display: 'grid',
    gridTemplateColumns: '1.5em minmax(0px, 1fr) 8ch 4em',
    alignItems: 'baseline',
    columnGap: 6,
    rowGap: 11,
    paddingX: 6,
    paddingY: 8,
    fontFamily: 'monospace',
    fontSize: [7, 6],
    fontVariantNumeric: 'tabular-nums',
    ':not(:last-of-type)': {
      borderBottom: '1px solid',
      borderBottomColor: 'grayDark',
    },
  },
  rank: {
    color: 'textLight',
  },
  title: {
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
    fontSize: 7,
  },
  report: {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    maxWidth: '30em',
    margin: '0px',
    paddingX: 6,
    paddingY: 6,
    backgroundColor: 'grayLightest',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
    fontSize: 4,
    color: 'text',
  },
  cite: {
    fontSize: 6,
    fontStyle: 'normal',
    color: 'textLight',
  },
  capture: {
    display: 'block',
    borderRadius: '0.25em',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: 'grayDark',
    ...focus,
  },
  image: {
    display: 'block',
    width: '100%',
    height: 'auto',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    margin: '0px',
  },
  link: {
    color: 'textLightest',
    textDecoration: 'underline',
    textUnderlineOffset: '0.2em',
    ...focus,
  },
  action: {
    display: 'inline-block',
    fontSize: 4,
    paddingX: 2,
    paddingY: 8,
    textDecoration: 'none',
    ...focus,
  },
}
