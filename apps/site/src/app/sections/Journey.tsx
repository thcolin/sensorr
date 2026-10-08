import { useState } from 'react'
import { Badge, Bar, Icon, Picture, Shadow, TransitionPill, pictureSrc } from '@sensorr/ui'
import { usePalette, type Palette as Colors } from '@sensorr/palette'
import { type Film, type Films, type Release as File, type Row } from '../data'
import { EASE, enter, useCountUp, useScrollProgress, useSeen, useSteps } from './journey/motion'
import { Name, Statistics, Tags, gb, language, rangeOf } from './journey/release'

type Palette = Colors | null
type Visual = { film: Film | null, seen: boolean, palette: Palette, policy?: Films['policy'] }

const tmdb = (size: string, path: string) => `https://image.tmdb.org/t/p/${size}${path}`

// A language a release does not name is its original version, as the app's parser reads it
const named = (rows: Row[]) => rows.map((row) => row.axis === 'language' ? { ...row, from: language(row.from), to: language(row.to) } : row)

// Only the axes known on both sides, what changed first, a new language ahead of it, then what stayed
const ordered = (rows: Row[]) => {
  const known = named(rows).filter(({ from, to }) => from && to)
  const changed = known.filter(({ state }) => state !== 'same')
  return [
    ...changed.filter(({ axis }) => axis === 'language'),
    ...changed.filter(({ axis }) => axis !== 'language'),
    ...known.filter(({ state }) => state === 'same'),
  ]
}

// Every axis as the app draws a swap: what changed as a transition in the policy's verdict, what stayed as its value alone
const Pills = ({ rows }: { rows: Row[] }) => (
  <div sx={Journey.styles.pills}>
    {ordered(rows).map(({ axis, from, to, state }) => (
      <TransitionPill
        key={axis}
        from={from}
        to={to}
        state={state}
        title={state === 'same' ? `${axis}: ${to}` : `${axis}: ${from} ~ ${to}`}
      />
    ))}
  </div>
)

// What the swap costs or frees on disk: lighter is the machine's yes, heavier stays in the text's color
const Delta = ({ from, to }: { from: number, to: number }) => (
  <span sx={{ ...Journey.styles.delta, color: to < from ? 'primary' : 'text' }}>
    {to < from ? '−' : '+'}{gb(to - from)}
  </span>
)

// A movie state badge pinned inside its poster's top-right corner, as the app's Poster pins its own; it pops when it changes
const Corner = ({ emoji, label }: { emoji: string, label: string }) => (
  <span sx={Journey.styles.corner}>
    <Badge key={emoji} emoji={emoji} label={label} compact={true} sx={Journey.styles.badge} />
  </span>
)

// The ways a movie becomes 🍿 Wished: each card names its way with the state's emoji, then the poster turns 🍿 Wished
const Paths = ({ film, palette }: { film: Film | null, palette: Palette }) => {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  // The three ways land one after another, then the poster's badge turns 🍿 Wished
  const step = useSteps(seen, [2100])

  return (
    <div ref={ref} sx={Journey.styles.paths}>
      <ul sx={Journey.styles.ways}>
        <li sx={{ ...Journey.styles.way, ...enter(seen, 'translateY(0.75em)', 300) }}>
          <span sx={Journey.styles.wayEmoji} aria-hidden='true'>🍻</span>
          <span sx={Journey.styles.wayText}>
            <strong>Alex requests it</strong>
            <span>From their Plex watchlist</span>
          </span>
          <Icon value='plex' role='img' aria-label='Plex' sx={Journey.styles.wayIcon} />
        </li>
        <li sx={{ ...Journey.styles.way, ...enter(seen, 'translateY(0.75em)', 800) }}>
          <span sx={Journey.styles.wayEmoji} aria-hidden='true'>📅</span>
          <span sx={Journey.styles.wayText}>
            <strong>In your calendar</strong>
            <span>{film?.director ? `You follow ${film.director.name}` : <Bar inline={true} width='8em' height='1em' />}</span>
          </span>
          {film?.director?.profile
            ? <img src={tmdb('w185', film.director.profile)} alt='' loading='lazy' decoding='async' sx={Journey.styles.wayAvatar} />
            : <span sx={Journey.styles.wayAvatar} />}
        </li>
        <li sx={{ ...Journey.styles.way, ...enter(seen, 'translateY(0.75em)', 1300) }}>
          <span sx={Journey.styles.wayEmoji} aria-hidden='true'>🍿</span>
          <span sx={Journey.styles.wayText}>
            <strong>You wish it yourself</strong>
            <span>From Search or Discover</span>
          </span>
        </li>
      </ul>
      <div sx={{ ...Journey.styles.poster, ...enter(seen, 'scale(0.94)', 0, 700) }}>
        <Picture path={film?.poster} size='w500' ready={!!film} palette={palette} sx={Journey.styles.picture} />
        {step > 0 && <Corner emoji='🍿' label='Wished' />}
      </div>
    </div>
  )
}

const AXES = ['resolution', 'source', 'encoding', 'language', 'dub', 'flags']

// The axes as the app's filters name them (libs/i18n jobs.js `filters`)
const AXIS_LABELS = { resolution: '🎞️ Resolution', source: '💽 Source', encoding: '🎥 Encoding', language: '🇺🇳 Language', dub: '🔈 Dub', flags: '🚩 Flags' }

// The policy axis by axis, as Settings › Policies lays it out: each axis named, ⭐ what it prefers and ⛔ what it avoids
// in the colors of its tags (`colors` in libs/ui/src/inputs/Select/SortableSelect.tsx)
const Policy = ({ policy }: { policy?: Films['policy'] }) => (
  <div sx={Journey.styles.policy}>
    {policy ? AXES.filter((axis) => policy.prefer[axis]?.length || policy.avoid[axis]?.length).map((axis) => (
      <dl key={axis} sx={Journey.styles.axis}>
        <dt sx={Journey.styles.axisName}>{AXIS_LABELS[axis] || axis}</dt>
        {(['prefer', 'avoid'] as const).filter((group) => policy[group][axis]?.length).map((group) => (
          <dd key={group} sx={Journey.styles.axisGroup}>
            <span role='img' aria-label={group}>{group === 'prefer' ? '⭐' : '⛔'}</span>
            {policy[group][axis].map((value) => (
              <span key={value} title={`${group} ${axis}: ${value}`} sx={{ ...Journey.styles.tag, bg: group === 'prefer' ? 'primaryDarker' : 'error', borderColor: group === 'prefer' ? 'primaryDarker' : 'error' }}>{value}</span>
            ))}
          </dd>
        ))}
      </dl>
    )) : <Bar width='16em' height='1.5em' pill={true} />}
  </div>
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

// The movie in the library, as Plex shows it: the release Record picked, over its backdrop
const Archived = ({ film, seen, palette }: Visual) => {
  const file = film?.owned

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
          <Badge emoji='📼' label='Archived' compact={true} sx={Journey.styles.badge} />
        </span>
      </div>
      <div sx={{ ...Journey.styles.file, ...enter(seen, 'translateY(1.5em)', 350) }}>
        <p sx={Journey.styles.fileTitle}>
          {film ? <>{film.title} <span sx={Journey.styles.year}>{film.year}</span></> : <Bar inline={true} width='8em' height='1em' />}
        </p>
        <div sx={Journey.styles.specs}>
          {file ? SPECS.map((axis) => [axis, axis === 'language' ? language(file.meta.language) : file.meta[axis]] as const).filter(([, value]) => value).map(([axis, value]) => (
            <TransitionPill key={axis} to={value} state='same' compact={true} title={`${axis}: ${value}`} />
          )) : <Bar width='12em' height='1.5em' pill={true} />}
        </div>
        <p sx={Journey.styles.fileName}>
          {film && file ? <Name title={file.title} year={film.year} /> : <Bar width='100%' height='1em' />}
        </p>
        <p sx={Journey.styles.fileMeta}>
          {file ? gb(file.size) : <Bar inline={true} width='4em' height='1em' />}
        </p>
        <p sx={Journey.styles.inPlex}>
          <Icon value='plex' role='img' aria-label='Plex' sx={Journey.styles.plexIcon} />
          In your Plex library
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
            <span sx={Journey.styles.swapSize}>{gb(to.size)} <Delta from={from?.size || 0} to={to.size} /></span>
          </>
        ) : <Bar width='80%' height='1em' />}
      </p>
      <div sx={enter(seen, 'translateY(1em)', 900)}>
        {film && rows ? <Pills rows={rows} /> : <Bar width='60%' height='1.5em' pill={true} />}
      </div>
    </div>
  </div>
)

const Refine = ({ film, seen }: Visual) => (
  <Swap
    film={film}
    seen={seen}
    from={film?.owned}
    to={film?.winner}
    rows={film?.refine.rows}
    badge={(
      <span sx={enter(seen, 'scale(1.8)', 1100, 500)}>
        <Corner emoji='💎' label='Refined' />
      </span>
    )}
  />
)

const Shrink = ({ film, seen }: Visual) => {
  const freed = useCountUp(film ? Math.abs(film.shrinked.size) : 0, seen && !!film)

  return (
    <div sx={Journey.styles.swap}>
      {film?.backdrop && <img src={tmdb('w1280', film.backdrop)} alt='' loading='lazy' decoding='async' sx={Journey.styles.swapBackdrop} />}
      <div sx={Journey.styles.swapPoster}>
        <Picture path={film?.poster} size='w342' ready={!!film} sx={Journey.styles.picture} />
        <span sx={enter(seen, 'scale(1.8)', 1000, 500)}>
          <Corner emoji='💍' label='Shrinked' />
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
          {film ? (
            <>
              <li>
                <span>Better resolution</span>
                <TransitionPill
                  from={film.winner.meta.resolution}
                  to={film.shrink.meta.resolution}
                  state={film.shrinked.rows.find(({ axis }) => axis === 'resolution')?.state || 'held'}
                  compact={true}
                  title={`resolution: ${film.winner.meta.resolution} ~ ${film.shrink.meta.resolution}`}
                />
              </li>
              <li>
                <span>Same language</span>
                <TransitionPill to={language(film.shrink.meta.language)} state='same' compact={true} title={`language: ${language(film.shrink.meta.language)}`} />
              </li>
            </>
          ) : <Bar width='14em' height='1.5em' pill={true} />}
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
      <blockquote sx={Journey.styles.quote}>Subtitles are out of sync.</blockquote>
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
          <Badge emoji='🚫' label='Banned' compact={true} sx={Journey.styles.badge} />
        </span>
      )}
    />
  </div>
)

// The README's pipeline, the states of a movie and the scheduled jobs that move it on, as each scene's eyebrow: the
// scene's own step bright, the ones before it dimmed, the ones after it fainter
const PIPELINE = [
  { emoji: '🍿', label: 'Wished' },
  { emoji: '📹', label: 'Record' },
  { emoji: '📼', label: 'Archived' },
  { emoji: '✨', label: 'Refine' },
  { emoji: '💎', label: 'Refined' },
  { emoji: '✂️', label: 'Shrink' },
  { emoji: '💍', label: 'Shrinked' },
]

// `compact` keeps the other steps to their emoji at every width, for a column narrower than the scenes'
const Pipeline = ({ at, compact = false }: { at: string, compact?: boolean }) => {
  const current = PIPELINE.findIndex(({ label }) => label === at)

  return (
    <p sx={Journey.styles.pipeline}>
      {PIPELINE.map(({ emoji, label }, index) => (
        <span
          key={label}
          aria-current={index === current ? 'step' : undefined}
          sx={{ ...Journey.styles.step, ...(index === current ? Journey.styles.stepNow : index < current ? Journey.styles.stepDone : {}) }}
        >
          <span aria-hidden='true'>{emoji}</span>
          <span sx={index === current ? {} : compact ? Journey.styles.hidden : Journey.styles.stepName}>{label}</span>
        </span>
      ))}
    </p>
  )
}

const SCENES = [
  { emoji: '📹', label: 'Record', title: 'Your rules, not a quality profile.', line: 'A scheduled job, like every step after it: on each run Record asks your indexers for the movies you wished, and your policy ranks every release.', Visual: Record },
  { emoji: '📼', label: 'Archived', title: 'Recorded. In your library, in Plex.', line: 'The .torrent goes to the blackhole, your download client does the rest.', Visual: Archived },
  { emoji: '✨', label: 'Refine', title: 'Not your rules yet. Refine keeps looking.', line: 'Until your copy meets your policy, a release that wins on it replaces the one in Plex: here your language, for a little more space.', Visual: Refine },
  { emoji: '✂️', label: 'Shrink', title: 'Your rules are met. Shrink takes over.', line: 'Now a lighter release that loses nothing: a better resolution, the same language, the space back on your disk.', Visual: Shrink },
  { emoji: '🚨', label: 'Report', title: 'A friend reports, Sensorr swaps.', line: 'At any step. The copy they watched is banned, another one takes its place.', Visual: Report },
]

const Scene = ({ index, film, palette, policy }: { index: number, film: Film | null, palette: Palette, policy?: Films['policy'] }) => {
  const [ref, seen] = useSeen<HTMLElement>(0.25)
  const { emoji, label, title, line, Visual } = SCENES[index]

  return (
    <article ref={ref} aria-labelledby={`journey-${label.toLowerCase()}`} sx={Journey.styles.scene}>
      <header sx={Journey.styles.text}>
        {PIPELINE.some((step) => step.label === label)
          ? <Pipeline at={label} />
          : <p sx={Journey.styles.label}><span aria-hidden='true'>{emoji}</span> {label}</p>}
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
            <Pipeline at='Wished' compact={true} />
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
      </div>
    </section>
  )
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
    overflow: 'clip',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
  opening: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    minHeight: ['85svh', '100svh'],
    overflow: 'clip',
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
    // Side by side once the cards leave the text a column of its own, stacked on a phone and a tablet
    gridTemplateColumns: ['minmax(0px, 1fr)', 'minmax(0px, 1fr)', 'minmax(0px, 1fr) auto'],
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
  // 🍿 Wished: the ways in, then the poster they lead to
  paths: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0px, 1fr) 7.5em', '19em 15em'],
    alignItems: 'center',
    columnGap: [6, 3],
    fontSize: [5, 4],
  },
  ways: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  way: {
    display: 'grid',
    gridTemplateColumns: '2em minmax(0px, 1fr) auto',
    alignItems: 'center',
    columnGap: [8, 6],
    paddingX: [8, 6],
    paddingY: [8, 6],
    backgroundColor: 'grayLightest',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
  },
  wayEmoji: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2em',
    height: '2em',
    borderRadius: '50%',
    backgroundColor: 'gray',
    fontSize: '1em',
    lineHeight: 1,
  },
  wayIcon: {
    display: 'block',
    width: '1.25em',
    height: '1.25em',
  },
  wayAvatar: {
    display: 'block',
    width: '1.75em',
    height: '1.75em',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: 'grayDark',
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
  // The blurred backdrop follows the scenes, faded in from the opening's black and out under the Report scene into the
  // page's black, where the Wrapped section starts: a mask on its own layer, so no edge of it shows between two sections
  track: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    pointerEvents: 'none',
    maskImage: 'linear-gradient(to bottom, transparent, black 50svh, black calc(100% - 30svh), transparent)',
  },
  ambient: {
    position: 'sticky',
    top: '0px',
    height: '100svh',
    overflow: 'clip',
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
  // The eyebrow's line: on a phone and a tablet the other steps keep their emoji alone
  pipeline: {
    display: 'flex',
    alignItems: 'center',
    gap: ['0.45em', '0.45em', '0.9em'],
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: [6, 6, 5],
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    // One line wherever it fits; in a column narrower than that, the next line rather than over its neighbour
    flexWrap: 'wrap',
    rowGap: 10,
  },
  step: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4em',
    color: 'textLight',
    opacity: 0.35,
    // The README's arrow before every step but the first
    ':not(:first-of-type)::before': {
      content: '"→"',
      marginRight: ['0.45em', '0.45em', '0.9em'],
      letterSpacing: '0px',
      opacity: 0.6,
    },
  },
  stepDone: {
    opacity: 0.65,
  },
  stepNow: {
    opacity: 1,
    color: 'textLightest',
  },
  stepName: {
    display: ['none', 'none', 'inline'],
  },
  picture: {
    borderRadius: '0.25em',
    overflow: 'clip',
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
    display: 'grid',
    gridTemplateColumns: ['repeat(2, minmax(0px, 1fr))', 'repeat(3, minmax(0px, 1fr))', 'repeat(6, minmax(0px, 1fr))'],
    gap: 8,
    margin: '0px',
    fontSize: 5,
  },
  axis: {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    margin: '0px',
    paddingX: 8,
    paddingY: 8,
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-white) 85%, transparent)',
  },
  axisName: {
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 5,
    whiteSpace: 'nowrap',
  },
  tag: {
    paddingX: 9,
    paddingY: 11,
    border: '1px solid',
    borderRadius: '2px',
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: 6,
    color: 'whitePure',
    whiteSpace: 'nowrap',
  },
  axisGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    margin: '0px',
  },
  // The release list, on the app's black, one rule under each row
  table: {
    ...card,
    backgroundColor: 'color-mix(in srgb, var(--theme-ui-colors-white) 92%, transparent)',
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
    overflow: 'clip',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: ['1.25em minmax(0px, 1fr)', '1.5em minmax(0px, 1fr) auto auto'],
    gridTemplateAreas: ['"state name" ". tags" ". stats"', '"state name tags stats"'],
    alignItems: 'center',
    columnGap: [8, 6],
    rowGap: 9,
    minHeight: '2.75em',
    paddingX: [8, 6],
    paddingY: 8,
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
    fontSize: [5, 4],
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
    gap: 11,
    minWidth: '0px',
    fontFamily: 'monospace',
    fontSize: 6,
    lineHeight: 'heading',
    color: 'textLightest',
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
    fontSize: '0.875em',
    color: 'grayDarker',
  },
  rowTags: {
    gridArea: 'tags',
    justifyContent: ['flex-start', 'flex-end'],
    fontSize: 5,
  },
  rowStats: {
    gridArea: 'stats',
    justifyContent: ['flex-start', 'flex-end'],
    fontSize: 7,
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
    overflow: 'clip',
    isolation: 'isolate',
  },
  library: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    overflow: 'clip',
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
  inPlex: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0px',
    fontSize: [5, 4],
    color: 'text',
  },
  // ✨ Refine, ✂️ Shrink, and the swap of 🚨 Report
  swap: {
    ...card,
    display: 'grid',
    position: 'relative',
    gridTemplateColumns: ['minmax(0px, 1fr)', '11em minmax(0px, 1fr)'],
    alignItems: 'center',
    overflow: 'clip',
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
  delta: {
    marginLeft: 8,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
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
    overflow: 'clip',
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
    // The bubble overlaps the card's top edge, the struck release starts below it
    '> div': {
      paddingTop: [6, '3.5em'],
    },
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
}
