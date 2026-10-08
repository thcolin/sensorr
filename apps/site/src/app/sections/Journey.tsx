import { useState } from 'react'
import { Badge, Bar, Icon, Picture, Shadow, TransitionPill, buttonStyles, pictureSrc } from '@sensorr/ui'
import { usePalette, type Palette as Colors } from '@sensorr/palette'
import { DEMO, type Film, type Films, type Release as File, type Row } from '../data'
import { EASE, enter, useCountUp, useScrollProgress, useSeen, useSteps } from './journey/motion'
import { Name, Statistics, Tags, gb, language, rangeOf } from './journey/release'

type Palette = Colors | null
type Visual = { film: Film | null, seen: boolean, palette: Palette, policy?: Films['policy'] }

const tmdb = (size: string, path: string) => `https://image.tmdb.org/t/p/${size}${path}`

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

// A movie state badge pinned inside its poster's top-right corner, as the app's Poster pins its own; it pops when it changes
const Corner = ({ emoji, label, palette }: { emoji: string, label: string, palette?: Palette }) => (
  <span sx={Journey.styles.corner}>
    <Badge key={emoji} emoji={emoji} label={label} compact={true} palette={palette} sx={Journey.styles.badge} />
  </span>
)

// The ways a movie becomes 🍿 Wished, each one drawing its line into the poster
const Paths = ({ film, palette }: { film: Film | null, palette: Palette }) => {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  // The request lands first, then the three lines reach the poster, and the request is accepted
  const step = useSteps(seen, [900, 2300])

  return (
    <div ref={ref} sx={Journey.styles.paths}>
      <ul sx={Journey.styles.ways}>
        <li sx={{ ...Journey.styles.way, ...enter(seen, 'translateX(-2em)', 300) }} data-joined={step > 1}>
          <Icon value='plex' sx={Journey.styles.wayIcon} />
          <span sx={Journey.styles.wayText}>
            <strong><span aria-hidden='true'>🍻</span> Alex requests it</strong>
            <span>From their Plex watchlist</span>
          </span>
        </li>
        <li sx={{ ...Journey.styles.way, ...enter(seen, 'translateX(-2em)', 900) }} data-joined={step > 1}>
          {film?.director?.profile
            ? <img src={tmdb('w185', film.director.profile)} alt='' loading='lazy' decoding='async' sx={Journey.styles.wayIcon} />
            : <span sx={Journey.styles.wayIcon} aria-hidden='true'>⭐</span>}
          <span sx={Journey.styles.wayText}>
            <strong><span aria-hidden='true'>📅</span> In your calendar</strong>
            <span>{film?.director ? `You follow ${film.director.name}` : <Bar inline={true} width='8em' height='1em' />}</span>
          </span>
        </li>
        <li sx={{ ...Journey.styles.way, ...enter(seen, 'translateX(-2em)', 1500) }} data-joined={step > 1}>
          <span sx={Journey.styles.wayIcon} aria-hidden='true'>🔍</span>
          <span sx={Journey.styles.wayText}>
            <strong>You wish it yourself</strong>
            <span>From Search or Discover</span>
          </span>
        </li>
      </ul>
      <div sx={{ ...Journey.styles.poster, ...enter(seen, 'scale(0.94)', 0, 700) }}>
        <Picture path={film?.poster} size='w500' ready={!!film} palette={palette} sx={Journey.styles.picture} />
        {step > 0 && <Corner emoji={step > 1 ? '🍿' : '🍻'} label={step > 1 ? 'Wished' : 'Requested'} palette={palette} />}
      </div>
    </div>
  )
}

const AXES = ['resolution', 'source', 'encoding', 'language', 'dub', 'flags']

// The policy on two lines, ⭐ what it prefers and ⛔ what it avoids, each value in the app's gray tag
const Policy = ({ policy }: { policy?: Films['policy'] }) => (
  <dl sx={Journey.styles.policy}>
    {(['prefer', 'avoid'] as const).map((group) => (
      <div key={group} sx={Journey.styles.policyLine}>
        <dt><span role='img' aria-label={group}>{group === 'prefer' ? '⭐' : '⛔'}</span></dt>
        <dd sx={Journey.styles.tags}>
          {policy ? AXES.flatMap((axis) => (policy[group][axis] || []).map((value) => (
            <TransitionPill key={`${axis}-${value}`} to={value} state='same' compact={true} title={`${group} ${axis}: ${value}`} />
          ))) : <Bar width='16em' height='1.5em' pill={true} />}
        </dd>
      </div>
    ))}
  </dl>
)

// The candidates as the app's release list draws them: state, name, axis tags, then 💯 🌍 📦
const Record = ({ film, seen, policy }: Visual) => {
  const winner = film?.candidates.find(({ valid }) => valid)
  const releases = film ? film.candidates.slice(0, 4) : []
  const range = rangeOf(releases.length ? releases : [{ score: 0, seeders: 0, size: 1 } as File])
  const landed = 300 + releases.length * 90 + 500

  return (
    <div sx={Journey.styles.record}>
      <Policy policy={policy} />
      <ol sx={Journey.styles.table}>
        {!film && Array.from({ length: 4 }, (_, index) => (
          <li key={index} sx={Journey.styles.row}><span sx={{ gridColumn: '1 / -1' }}><Bar width='100%' height='1.5em' /></span></li>
        ))}
        {film && releases.map((release, index) => {
          const won = release === winner

          return (
            <li
              key={release.title}
              sx={{ ...Journey.styles.row, ...enter(seen, 'translateY(1em)', 200 + index * 90) }}
            >
              <span sx={Journey.styles.state}>
                {!release.valid ? <span role='img' aria-label='Rejected'>🚨</span> : (
                  <>
                    <span aria-hidden={won} sx={won ? { ...Journey.styles.stateOut, transitionDelay: `${landed}ms`, opacity: seen ? 0 : 1 } : {}}>⭐</span>
                    {won && (
                      <span role='img' aria-label='Winner' sx={{ ...Journey.styles.stateIn, ...enter(seen, 'scale(2.4)', landed, 500) }}>✓</span>
                    )}
                  </>
                )}
              </span>
              <span sx={Journey.styles.name}>
                <Name title={release.title} year={film.year} sx={!release.valid ? Journey.styles.rejected : won ? Journey.styles.winner : {}} />
                {!release.valid && release.reason && <code sx={Journey.styles.reason}>{release.reason}</code>}
              </span>
              <Tags meta={release.meta} sx={Journey.styles.rowTags} />
              <Statistics release={release} range={range} sx={Journey.styles.rowStats} />
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const SPECS = ['resolution', 'source', 'encoding', 'language'] as const

// The Plex logo, with its name beside it in the text's color
const Plex = () => (
  <span sx={Journey.styles.plex}><Icon value='plex' sx={Journey.styles.plexIcon} />Plex</span>
)

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
          <Badge emoji='📼' label='Archived' compact={true} palette={palette} sx={Journey.styles.badge} />
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
          {film && file ? <Name title={file.title} year={film.year} /> : <Bar width='100%' height='1em' />}
        </p>
        <p sx={Journey.styles.fileMeta}>
          {file ? <span>{gb(file.size)}</span> : <Bar inline={true} width='4em' height='1em' />}
          <span sx={Journey.styles.play}><span aria-hidden='true'>{'▶︎'}</span> Ready in <Plex /></span>
        </p>
      </div>
    </div>
  )
}

// One release swapped for another, as the Swaps screen draws it
const Swap = ({ film, seen, from, to, rows, struck = 'textLight', mark, badge }: {
  film: Film | null
  seen: boolean
  from?: File
  to?: File
  rows?: Row[]
  struck?: string
  mark?: React.ReactNode
  badge?: React.ReactNode
}) => (
  <div sx={Journey.styles.swap}>
    {film?.backdrop && <img src={tmdb('w1280', film.backdrop)} alt='' loading='lazy' decoding='async' sx={Journey.styles.swapBackdrop} />}
    <div sx={Journey.styles.swapPoster}>
      <Picture path={film?.poster} size='w342' ready={!!film} sx={Journey.styles.picture} />
      {badge}
    </div>
    <div sx={Journey.styles.swapBody}>
      <p sx={{ ...Journey.styles.swapFrom, color: struck }}>
        {film && from ? (
          <>
            <s sx={{ ...Journey.styles.strike, textDecorationColor: seen ? 'currentColor' : 'transparent' }}>
              <Name title={from.title} year={film.year} />
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
            <Name title={to.title} year={film.year} />
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

const Refine = ({ film, seen, palette }: Visual) => (
  <Swap
    film={film}
    seen={seen}
    from={film?.owned}
    to={film?.winner}
    rows={film?.refine.rows}
    badge={(
      <span sx={enter(seen, 'scale(1.8)', 1100, 500)}>
        <Corner emoji='💎' label='Refined' palette={palette} />
      </span>
    )}
  />
)

const Shrink = ({ film, seen, palette }: Visual) => {
  const freed = useCountUp(film ? Math.abs(film.shrinked.size) : 0, seen && !!film)
  const kept = film && (['resolution', 'language'] as const).map((axis) => [axis, axis === 'language' ? language(film.shrink.meta.language) : film.shrink.meta.resolution] as const)

  return (
    <div sx={Journey.styles.swap}>
      {film?.backdrop && <img src={tmdb('w1280', film.backdrop)} alt='' loading='lazy' decoding='async' sx={Journey.styles.swapBackdrop} />}
      <div sx={Journey.styles.swapPoster}>
        <Picture path={film?.poster} size='w342' ready={!!film} sx={Journey.styles.picture} />
        <span sx={enter(seen, 'scale(1.8)', 1000, 500)}>
          <Corner emoji='💍' label='Shrinked' palette={palette} />
        </span>
      </div>
      <div sx={Journey.styles.shrink}>
        <p sx={Journey.styles.counter} aria-label={film ? `${gb(film.shrinked.size)} freed` : undefined}>
          {film ? <span aria-hidden='true'>−{gb(freed)}</span> : <Bar inline={true} width='4em' height='0.8em' />}
        </p>
        <div sx={Journey.styles.gauge} aria-hidden='true'>
          <span sx={{ ...Journey.styles.gaugeFill, transform: seen && film ? `scaleX(${film.shrink.size / film.winner.size})` : 'scaleX(1)' }} />
        </div>
        <p sx={Journey.styles.counterLine}>
          {film ? <>{gb(film.winner.size)} <span aria-hidden='true'>→</span> {gb(film.shrink.size)}</> : <Bar inline={true} width='10em' height='1em' />}
        </p>
        <ul sx={{ ...Journey.styles.kept, ...enter(seen, 'translateY(1em)', 600) }}>
          {kept ? kept.map(([axis, value]) => (
            <li key={axis}>
              <span>Same {axis}</span>
              <TransitionPill to={value} state='same' compact={true} title={`${axis}: ${value}`} />
            </li>
          )) : <Bar width='14em' height='1.5em' pill={true} />}
        </ul>
      </div>
    </div>
  )
}

const Report = ({ film, seen }: Visual) => (
  <div sx={Journey.styles.report}>
    <figure sx={{ ...Journey.styles.bubble, ...enter(seen, 'translateY(2em) scale(0.92)', 0, 600) }}>
      <figcaption sx={Journey.styles.bubbleHead}>
        <span sx={Journey.styles.avatar} aria-hidden='true'>A</span>
        <span sx={Journey.styles.bubbleText}><strong>Alex</strong> reported an issue</span>
        <Icon value='plex' role='img' aria-label='on Plex' sx={Journey.styles.plexIcon} />
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
  { emoji: '📹', label: 'Record', title: 'Your rules, not a quality profile.', line: 'Your indexers answer, your policy ranks every release.', Visual: Record },
  { emoji: '📼', label: 'Archived', title: 'Recorded. In your library, in Plex.', line: 'The .torrent goes to the blackhole, your download client does the rest.', Visual: Archived },
  { emoji: '✨', label: 'Refine', title: 'Closer to your rules.', line: 'A release that wins on your policy replaces the copy you have: a higher resolution, or your language.', Visual: Refine },
  { emoji: '✂️', label: 'Shrink', title: 'The same movie, lighter.', line: 'A smaller release that loses nothing: the same resolution, the same language, the space back on your disk.', Visual: Shrink },
  { emoji: '🚨', label: 'Report', title: 'A friend reports, Sensorr swaps.', line: 'The release they watched is banned, another one takes its place.', Visual: Report },
]

const Scene = ({ index, film, palette, policy }: { index: number, film: Film | null, palette: Palette, policy?: Films['policy'] }) => {
  const [ref, seen] = useSeen<HTMLElement>(0.25)
  const { emoji, label, title, line, Visual } = SCENES[index]

  return (
    <article ref={ref} aria-labelledby={`journey-${label.toLowerCase()}`} sx={Journey.styles.scene}>
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

// The movie over its backdrop, and how it becomes 🍿 Wished
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
        <div sx={Journey.styles.openingText}>
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
          <div sx={Journey.styles.openingScene}>
            <p sx={Journey.styles.label}><span aria-hidden='true'>🍿</span> Wished</p>
            <h3 id='journey-wished' sx={Journey.styles.openingTitle}>Wish it, or let it come to you.</h3>
            <p sx={Journey.styles.line}>A friend's request, a star you follow, or your own search: each way ends wished.</p>
          </div>
        </div>
        <Paths film={film} palette={palette} />
      </div>
    </div>
  )
}

export const Journey = ({ film, policy }: { film: Film | null, policy?: Films['policy'] }) => {
  const { palette } = usePalette(film && pictureSrc(film.poster, 'w92'), null, film?.poster)
  const stage = useScrollProgress<HTMLDivElement>('--stage')

  return (
    <section aria-labelledby='journey' sx={Journey.styles.element}>
      <span id='journey' sx={Journey.styles.hidden}>One movie, from a wish to your library</span>
      <Opening film={film} palette={palette} />
      <div ref={stage} sx={Journey.styles.stage}>
        <div sx={Journey.styles.track} aria-hidden='true'>
          <div sx={Journey.styles.ambient}>
            {film?.backdrop && <img key={film.backdrop} src={tmdb('w1280', film.backdrop)} alt='' loading='lazy' decoding='async' sx={Journey.styles.ambientImage} />}
            {palette && <Shadow palette={palette} fade={0.6} />}
            <div sx={Journey.styles.ambientVeil} />
          </div>
        </div>
        {SCENES.map((_, index) => <Scene key={index} index={index} film={film} palette={palette} policy={policy} />)}
        <div sx={Journey.styles.close}>
          <p sx={Journey.styles.closeTitle}>Try it with your own rules.</p>
          <a href={DEMO} sx={{ ...buttonStyles.contain({ color: 'primary' }), ...Journey.styles.action }}>Try the demo</a>
        </div>
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

// The width of the line a way draws into the poster
const reach = ['1.25em', '3em']

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
    overflow: 'hidden',
    isolation: 'isolate',
  },
  // Its last rows masked out on its own layer: the scaled backdrop never shows a line under the veil
  media: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    maskImage: 'linear-gradient(to top, transparent, black 2em)',
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
      'linear-gradient(to top, var(--theme-ui-colors-white) 30%, color-mix(in srgb, var(--theme-ui-colors-white) 55%, transparent) 65%, color-mix(in srgb, var(--theme-ui-colors-white) 20%, transparent) 100%)',
      'linear-gradient(to right, var(--theme-ui-colors-white) 0%, color-mix(in srgb, var(--theme-ui-colors-white) 60%, transparent) 35%, transparent 60%), linear-gradient(to top, var(--theme-ui-colors-white) 0%, color-mix(in srgb, var(--theme-ui-colors-white) 70%, transparent) 30%, transparent 60%)',
    ],
  },
  openingContent: {
    ...column,
    display: 'grid',
    gridTemplateColumns: ['minmax(0px, 1fr)', 'minmax(0px, 1fr) auto'],
    alignItems: 'end',
    gap: ['2.5em', '3em'],
    paddingTop: ['40svh', '6em'],
    paddingBottom: ['3em', '5em'],
  },
  openingText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: '0px',
  },
  film: {
    display: 'flex',
    alignItems: 'flex-end',
    height: 'clamp(6rem, 16vw, 11rem)',
    width: '100%',
    margin: '0px',
  },
  logo: {
    display: 'block',
    maxWidth: 'min(30rem, 80vw)',
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
    fontSize: 'clamp(3rem, 8vw, 6.5rem)',
  },
  meta: {
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [5, 3],
    color: 'textLightest',
    fontVariantNumeric: 'tabular-nums',
  },
  openingScene: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: [4, 2],
  },
  openingTitle: {
    ...display,
    fontSize: 'clamp(2.25rem, 4.5vw, 4rem)',
    maxWidth: '12em',
  },
  // 🍿 Wished: the ways in, then the poster they reach
  paths: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0px, 1fr) 8em', '20em 18em'],
    alignItems: 'center',
    columnGap: reach,
    fontSize: [5, 4],
  },
  ways: {
    display: 'flex',
    flexDirection: 'column',
    gap: [8, 6],
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  way: {
    ...card,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: [8, 6],
    paddingX: [8, 6],
    paddingY: 8,
    // The line into the poster, drawn once every way is in
    '::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '100%',
      width: reach,
      height: '2px',
      marginLeft: '1px',
      backgroundColor: 'primary',
      transformOrigin: 'left center',
      transform: 'scaleX(0)',
      transition: `transform 500ms ${EASE}`,
    },
    '&[data-joined="true"]': {
      borderColor: 'color-mix(in srgb, var(--theme-ui-colors-primary) 60%, transparent)',
      '::after': {
        transform: 'scaleX(1)',
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '::after': {
        transition: 'none',
      },
    },
  },
  wayIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '2.25em',
    height: '2.25em',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: 'grayDark',
    fontSize: '1em',
    lineHeight: 1,
    'svg&': {
      borderRadius: '0.25em',
      backgroundColor: 'transparent',
    },
  },
  wayText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
    minWidth: '0px',
    color: 'textLight',
    fontSize: [6, 5],
    lineHeight: 'heading',
    strong: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'heading',
      fontWeight: 800,
      fontSize: [5, 4],
      color: 'textLightest',
    },
  },
  poster: {
    position: 'relative',
    aspectRatio: '2 / 3',
  },
  stage: {
    position: 'relative',
    isolation: 'isolate',
  },
  // The blurred backdrop follows the scenes, faded in from the opening's black and out into the page's black below
  // the close: a mask on its own layer, so no edge of it shows between two sections
  track: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    pointerEvents: 'none',
    maskImage: 'linear-gradient(to bottom, transparent, black 50svh, black calc(100% - 50svh), transparent)',
  },
  ambient: {
    position: 'sticky',
    top: '0px',
    height: '100svh',
    overflow: 'hidden',
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
    maxWidth: '40em',
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
  // A badge pinned inside its poster's top-right corner, as the app's Poster pins its own
  corner: {
    position: 'absolute',
    top: '0.5em',
    right: '0.5em',
    zIndex: 1,
    fontSize: [6, 4],
  },
  // The label sits next to its emoji, not a full em away; a new state pops in
  badge: {
    fontSize: '1em',
    '& > span + span': {
      marginLeft: '0.375em',
    },
    animation: `journey-pop 500ms ${EASE} backwards`,
    '@keyframes journey-pop': {
      from: { transform: 'scale(1.8)', opacity: 0 },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  year: {
    fontFamily: 'monospace',
    fontWeight: 'normal',
    fontSize: '0.6em',
    letterSpacing: '0em',
    color: 'textLight',
  },
  avatar: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '2em',
    height: '2em',
    borderRadius: '50%',
    backgroundColor: 'grayDark',
    fontFamily: 'heading',
    fontWeight: 800,
    color: 'textLightest',
  },
  plex: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    verticalAlign: 'bottom',
    fontFamily: 'heading',
    fontWeight: 800,
  },
  plexIcon: {
    display: 'block',
    flexShrink: 0,
    width: '1.25em',
    height: '1.25em',
  },
  // 📹 Record
  record: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  policy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: '0px',
  },
  policyLine: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    dd: {
      margin: '0px',
    },
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
  },
  // The release list, on the app's black, one rule under each row
  table: {
    ...card,
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-white) 92%, transparent)',
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
    overflow: 'hidden',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: ['1.75em minmax(0px, 1fr)', '2.25em minmax(0px, 1fr) auto auto'],
    gridTemplateAreas: ['"state name" ". tags" ". stats"', '"state name tags stats"'],
    alignItems: 'center',
    columnGap: [8, 4],
    rowGap: 8,
    paddingLeft: [8, 6],
    paddingRight: [8, 4],
    paddingY: [4, 2],
    ':not(:last-of-type)': {
      borderBottom: '1px solid',
      borderBottomColor: 'gray',
    },
  },
  state: {
    gridArea: 'state',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: [4, 3],
    lineHeight: 1,
  },
  stateOut: {
    transition: `opacity 200ms ${EASE}`,
    '@media (prefers-reduced-motion: reduce)': {
      opacity: '0 !important',
      transition: 'none',
    },
  },
  stateIn: {
    position: 'absolute',
    fontFamily: 'monospace',
    fontWeight: 600,
    color: 'primary',
  },
  name: {
    gridArea: 'name',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: '0px',
    fontFamily: 'monospace',
    fontSize: [6, 5],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
  },
  winner: {
    color: 'primary',
  },
  rejected: {
    color: 'grayDarker',
    textDecorationLine: 'line-through',
  },
  reason: {
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'grayDarker',
  },
  rowTags: {
    gridArea: 'tags',
    justifyContent: ['flex-start', 'flex-end'],
    fontSize: [5, 4],
  },
  rowStats: {
    gridArea: 'stats',
    fontSize: [6, 7],
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
    textWrap: 'balance',
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    paddingX: 6,
    paddingY: 9,
    borderRadius: '1em',
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-white) 70%, transparent)',
  },
  // ✨ Refine, ✂️ Shrink, and the swap of 🚨 Report
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
    position: 'relative',
    width: ['7em', 'auto'],
    aspectRatio: '2 / 3',
    fontSize: [6, 5],
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
    rowGap: 10,
    width: '100%',
    margin: '0px',
    fontFamily: 'monospace',
    fontSize: [5, 4],
    lineHeight: 'heading',
  },
  // Struck line after line as the name wraps: a text decoration, inline, fading in
  strike: {
    minWidth: '0px',
    textDecorationLine: 'line-through',
    textDecorationThickness: '2px',
    textWrap: 'balance',
    transition: `text-decoration-color 600ms ${EASE} 400ms`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      textDecorationColor: 'currentColor !important',
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
    rowGap: 10,
    width: '100%',
    margin: '0px',
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: [4, 2],
    lineHeight: 'heading',
    color: 'primary',
    '>:first-of-type': {
      minWidth: '0px',
      textWrap: 'balance',
    },
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
    minWidth: '0px',
  },
  counter: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: 'clamp(3.5rem, 11vw, 9rem)',
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
  kept: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 4,
    rowGap: 8,
    margin: '0px',
    marginTop: 8,
    padding: '0px',
    listStyle: 'none',
    li: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: [5, 4],
      color: 'textLight',
    },
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
  bubbleText: {
    flex: 1,
    minWidth: '0px',
    strong: {
      color: 'textLightest',
    },
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
    paddingTop: ['2em', '4em'],
    paddingBottom: ['6em', '10em'],
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
}
