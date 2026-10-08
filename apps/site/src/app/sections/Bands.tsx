import { usePalette } from '@sensorr/palette'
import { Films, GITHUB } from '../data'
import { EASE, STILL, Scenery, Wall, tmdb, useProgress, useReveal } from './bands/shared'
import { Library } from './bands/Library'
import { Seasons } from './bands/Seasons'
import { Following } from './bands/Following'
import { Phone, phoneFilms } from './bands/Phone'

const PAGE = 'var(--theme-ui-colors-white)'

// A band of the page: its scenery across the whole width, the text in the page's column, and the visual under it, or
// beside it on a wide screen when `side`. A visual bleeds past the column on its own, the band clips it at the viewport
const Band = ({ emoji, label, title, body, visual, scenery, tint, side = false }: {
  emoji: string
  label: string
  title: string
  body: string
  visual: React.ReactNode
  scenery: React.ReactNode
  tint?: string
  side?: boolean
}) => {
  const ref = useProgress<HTMLElement>()

  return (
    <section ref={ref} sx={Band.styles.element}>
      {scenery}
      {tint && <span sx={Band.styles.tint} style={{ backgroundColor: tint }} aria-hidden='true' />}
      <span sx={{ ...Band.styles.veil, background: side ? Band.styles.shades.side : Band.styles.shades.stack }} aria-hidden='true' />
      <div sx={{ ...Band.styles.column, gridTemplateColumns: side ? ['minmax(0, 1fr)', null, 'minmax(0, 1fr) auto'] : 'minmax(0, 1fr)' }}>
        <div sx={{ ...Band.styles.text, maxWidth: side ? '36em' : '64em' }}>
          <p sx={Band.styles.label}><span aria-hidden='true'>{emoji}</span> {label}</p>
          <h2 sx={Band.styles.title}>{title}</h2>
          <p sx={Band.styles.body}>{body}</p>
        </div>
        <div sx={Band.styles.visual}>
          {visual}
        </div>
      </div>
    </section>
  )
}

// Under the text the scenery darkens to 60% black, under the visual it stays almost open, and only the last 8% of each
// end fades to the page's black, for the bands to run into each other
const edges = `linear-gradient(to bottom, ${PAGE} 0%, transparent 8%, transparent 92%, ${PAGE} 100%)`
const shade = (direction: string) => `linear-gradient(${direction}, color-mix(in srgb, ${PAGE} 60%, transparent) 0%, color-mix(in srgb, ${PAGE} 35%, transparent) 35%, color-mix(in srgb, ${PAGE} 12%, transparent) 70%)`

Band.styles = {
  element: {
    position: 'relative',
    isolation: 'isolate',
    marginTop: '-1px',
    paddingY: ['3em', '4em'],
    overflow: 'hidden',
  },
  tint: {
    position: 'absolute',
    inset: '0px',
    zIndex: -2,
    opacity: 0.35,
    mixBlendMode: 'color',
    transition: 'background-color 800ms ease-in-out',
  },
  // One pixel past the band on each side, for the clip at a fractional edge to never show the scenery under it
  veil: {
    position: 'absolute',
    inset: '-1px',
    zIndex: -1,
  },
  shades: {
    stack: `${edges}, ${shade('to bottom')}`,
    side: [`${edges}, ${shade('to bottom')}`, null, `${edges}, ${shade('to right')}`],
  },
  // The page's column, as every other section draws it
  column: {
    display: 'grid',
    alignItems: 'center',
    columnGap: '4em',
    rowGap: [1, 0],
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    margin: '0px',
    fontSize: 6,
    fontWeight: 'strong',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'textLight',
  },
  title: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    color: 'textLightest',
    textWrap: 'balance',
  },
  body: {
    maxWidth: '36em',
    margin: '0px',
    fontSize: [3, 2],
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'pretty',
  },
  visual: {
    minWidth: 0,
  },
}

const ALSO = [
  {
    emoji: '🔁',
    title: 'Coming from Sonarr.',
    body: <><a href={`${GITHUB}/blob/main/docs/jobs.md#migrate-sonarr`}><code>migrate sonarr</code></a> takes over your series as Sonarr follows them.</>,
  },
  {
    emoji: '💾',
    title: 'Backups and updates',
    body: <>from <em>Settings</em>, with a weekly dump once turned on. See <a href={`${GITHUB}#backup-and-restore`}>backup and restore</a> and <a href={`${GITHUB}#update-from-the-app`}>update from the app</a>.</>,
  },
  {
    emoji: '🌍',
    title: 'English and French,',
    body: 'for the interface, the mails and the wrapped.',
  },
]

const Also = () => {
  const [ref, shown] = useReveal<HTMLElement>()

  return (
    <section ref={ref} sx={Also.styles.element}>
      <h2 sx={Band.styles.title}>And also</h2>
      <ul sx={Also.styles.list}>
        {ALSO.map(({ emoji, title, body }, index) => (
          <li
            key={emoji}
            sx={Also.styles.item}
            style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(1.5em)', transitionDelay: `${index * 100}ms` }}
          >
            <p sx={Also.styles.text}><span aria-hidden='true'>{emoji}</span> <strong>{title}</strong> {body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

Also.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
    paddingY: ['3em', '4em'],
  },
  list: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', null, 'repeat(3, minmax(0, 1fr))'],
    gap: [2, 1],
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  item: {
    paddingTop: 4,
    borderTop: '1px solid',
    borderColor: 'grayDark',
    transitionProperty: 'opacity, transform',
    transitionDuration: '600ms',
    transitionTimingFunction: EASE,
    ...STILL,
  },
  text: {
    margin: '0px',
    fontSize: [4, 3],
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'pretty',
    strong: {
      fontFamily: 'heading',
      fontWeight: 'heading',
      color: 'textLightest',
    },
    a: {
      color: 'inherit',
      textDecorationColor: 'grayDarkest',
      textUnderlineOffset: '0.2em',
      ':hover': {
        textDecorationColor: 'currentColor',
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'primary',
        outlineOffset: '2px',
        borderRadius: '0.25em',
      },
    },
    code: {
      fontFamily: 'monospace',
    },
  },
}

export const Bands = ({ data }: { data: Films | null }) => {
  // The show with the most episodes, and the film the phone is notified about: each tints its band
  const show = data?.shows.reduce((most, show) => show.episodes > most.episodes ? show : most, data.shows[0])
  const [film, recorded] = phoneFilms(data)
  const { palette: showPalette } = usePalette(show ? tmdb('w92', show.poster) : null, null, show?.poster)
  const { palette: filmPalette } = usePalette(film ? tmdb('w92', film.poster) : null, null, film?.poster)
  const upcoming = data?.upcoming.map(({ poster }) => poster)

  return (
    <div sx={Bands.styles.element}>
      <Band
        emoji='📼'
        label='Movies · Shows'
        title='One library for everything'
        body='Movies and shows side by side, with the same rules and the same jobs, and no Radarr next to Sonarr.'
        scenery={<Wall posters={data?.wall} />}
        visual={<Library data={data} />}
      />
      <Band
        emoji='📺'
        label='Shows'
        title='Whole series, seasons or episodes'
        body='Sensorr looks for the whole series first, then season packs, then episodes.'
        scenery={<Scenery src={show ? tmdb('w500', show.poster) : null} blur={32} opacity={0.9} />}
        tint={showPalette?.backgroundColor}
        visual={<Seasons show={show} />}
      />
      <Band
        emoji='⭐'
        label='Stars'
        title='Follow the people you love'
        body='Follow a director, an actor or a composer, and their next films land in your calendar.'
        scenery={<Wall posters={upcoming && [...upcoming, ...upcoming, ...upcoming, ...upcoming]} />}
        visual={<Following data={data} />}
      />
      <Band
        emoji='🔔'
        label='Notifications'
        title='In your pocket'
        body='Install Sensorr on your phone like an app, and accept a proposal right from its notification.'
        scenery={<Scenery src={film?.backdrop ? tmdb('w1280', film.backdrop) : null} blur={6} opacity={0.9} />}
        tint={filmPalette?.backgroundColor}
        visual={<Phone film={film} recorded={recorded} />}
        side={true}
      />
      <Also />
    </div>
  )
}

Bands.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
  },
}
