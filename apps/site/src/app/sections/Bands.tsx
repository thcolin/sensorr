import { useEffect, useRef, useState } from 'react'
import { Badge, Bar, Picture, TransitionPill, buttonStyles } from '@sensorr/ui'
import { usePalette } from '@sensorr/palette'
import { Films, GITHUB } from '../data'

const MONTH = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const DAY = new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
const dateOf = (date: string) => new Date(`${date}T00:00:00Z`)

// Shown once scrolled into view, at once under reduced motion through the band's own styles
const useReveal = () => {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true)
        observer.disconnect()
      }
    }, { rootMargin: '0px 0px -15% 0px' })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, shown] as const
}

const Band = ({ emoji, label, title, children, visual, reversed = false }: {
  emoji: string
  label: string
  title: string
  children: React.ReactNode
  visual: React.ReactNode
  reversed?: boolean
}) => {
  const [ref, shown] = useReveal()

  return (
    <section
      ref={ref}
      sx={{
        ...Band.styles.element,
        gridTemplateAreas: ['"text" "visual"', reversed ? '"visual text"' : '"text visual"'],
        opacity: shown ? 1 : 0,
      }}
    >
      <div sx={Band.styles.text}>
        <p sx={Band.styles.label}><span aria-hidden='true'>{emoji}</span> {label}</p>
        <h2 sx={Band.styles.title}>{title}</h2>
        <p sx={Band.styles.body}>{children}</p>
      </div>
      <div sx={Band.styles.visual}>{visual}</div>
    </section>
  )
}

Band.styles = {
  element: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', 'minmax(0, 1fr) minmax(0, 1fr)'],
    alignItems: 'center',
    columnGap: 0,
    rowGap: 2,
    paddingY: 0,
    transition: 'opacity 400ms ease-in-out',
    '@media (prefers-reduced-motion: reduce)': {
      opacity: '1 !important',
      transition: 'none',
    },
  },
  text: {
    gridArea: 'text',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxWidth: '28em',
  },
  label: {
    margin: '0px',
    fontSize: 6,
    fontWeight: 'semibold',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'textLight',
  },
  title: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: [1, 0],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
  },
  body: {
    margin: '0px',
    fontSize: 4,
    lineHeight: 'body',
    color: 'text',
    textWrap: 'pretty',
  },
  visual: {
    gridArea: 'visual',
    minWidth: 0,
  },
}

// A poster of the library, its state in a badge cut out of its corner
const Cover = ({ path, badge }: { path?: string, badge?: { emoji: string, label: string } }) => (
  <span sx={Cover.styles.element}>
    <span sx={Cover.styles.frame} aria-hidden='true'>
      {path ? <Picture path={path} size='w185' sx={Cover.styles.picture} /> : <Bar height='100%' />}
    </span>
    {badge && (
      <span sx={Cover.styles.badge}>
        <Badge emoji={badge.emoji} compact={true} role='img' aria-label={badge.label} title={badge.label} />
      </span>
    )}
  </span>
)

Cover.styles = {
  element: {
    position: 'relative',
    display: 'block',
  },
  frame: {
    display: 'block',
    aspectRatio: '2 / 3',
    borderRadius: '0.25em',
    overflow: 'hidden',
  },
  picture: {
    minHeight: '0px',
  },
  badge: {
    position: 'absolute',
    top: '-0.75em',
    right: '-0.75em',
    fontSize: [6, 5],
    borderRadius: '50%',
    border: '0.25em solid',
    borderColor: 'white',
    backgroundColor: 'white',
  },
}

const Library = ({ data }: { data: Films | null }) => {
  const films = data?.films.slice(0, 3) || []
  const shows = data?.shows.slice(0, 3) || []
  const entries = data
    ? films.flatMap((film, index) => [
      { id: `movie-${film.id}`, title: film.title, year: film.year, poster: film.poster, badge: index === 1 ? { emoji: '🍿', label: 'Wished' } : { emoji: '📼', label: 'Archived' } },
      ...(shows[index] ? [{ id: `show-${shows[index].id}`, title: shows[index].title, year: shows[index].year, poster: shows[index].poster, badge: { emoji: '📺', label: 'Followed' } }] : []),
    ])
    : Array.from({ length: 6 }, (_, index) => ({ id: String(index), title: '', year: 0, poster: undefined, badge: undefined }))

  return (
    <ul sx={Library.styles.element}>
      {entries.map((entry) => (
        <li key={entry.id} sx={Library.styles.entry}>
          <Cover path={entry.poster} badge={entry.badge} />
          {entry.title ? (
            <span sx={Library.styles.caption}>
              <strong sx={Library.styles.title} title={entry.title}>{entry.title}</strong>
              <span sx={Library.styles.year}>{entry.year || ''}</span>
            </span>
          ) : (
            <span sx={Library.styles.caption}>
              <Bar width='70%' height='0.875em' />
              <Bar width='30%' height='0.625em' />
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

Library.styles = {
  element: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    columnGap: [3, 2],
    rowGap: [3, 2],
    margin: '0px',
    paddingTop: 6,
    paddingRight: 6,
    paddingBottom: '0px',
    paddingLeft: '0px',
    listStyle: 'none',
  },
  entry: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
  },
  caption: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 0,
  },
  title: {
    fontFamily: 'heading',
    fontWeight: 'semibold',
    fontSize: [6, 5],
    color: 'text',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  year: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: 'grayDarkest',
  },
}

// The owned episodes over the aired ones, drawn as `ProgressPill` draws them for a series that no longer airs. Not
// `ProgressPill` itself: its label goes through `@sensorr/i18n`, which follows the browser to French and sets the
// page's `lang`, on a page that is English only
const Episodes = ({ owned, aired }: { owned: number, aired: number }) => {
  const caught = owned >= aired
  const label = `${owned} of ${aired} aired episodes owned`

  return (
    <TransitionPill role='img' aria-label={label} title={label} from={owned} to={aired} state={caught ? 'held' : 'quiet'} neutral={{ from: !caught }} compact={true} />
  )
}

const Seasons = ({ data }: { data: Films | null }) => {
  const show = data?.shows.reduce((most, show) => show.seasons.length > most.seasons.length ? show : most, data.shows[0])
  const seasons = show?.seasons.slice(0, 6)

  return (
    <div sx={Seasons.styles.element}>
      <div sx={Seasons.styles.head}>
        <span sx={Seasons.styles.poster}>
          <Cover path={show?.poster} />
        </span>
        <span sx={Seasons.styles.heading}>
          {show ? (
            <>
              <strong sx={Seasons.styles.title}>{show.title}</strong>
              <span sx={Seasons.styles.meta}>{show.year} · {show.seasons.length} seasons · {show.episodes} episodes</span>
            </>
          ) : (
            <>
              <Bar width='8em' height='1.25em' />
              <Bar width='12em' height='0.75em' />
            </>
          )}
        </span>
      </div>
      <ul sx={Seasons.styles.list}>
        {seasons ? seasons.map((season, index) => {
          // Every season owned, the last one halfway through
          const owned = index === seasons.length - 1 ? Math.ceil(season.episodes / 2) : season.episodes

          return (
            <li key={season.number} sx={Seasons.styles.row}>
              <span sx={Seasons.styles.season}>
                <span role='img' aria-label={owned === season.episodes ? 'Archived' : 'Wished'}>{owned === season.episodes ? '📼' : '🍿'}</span>
                Season {season.number}
              </span>
              <Episodes owned={owned} aired={season.episodes} />
            </li>
          )
        }) : Array.from({ length: 5 }, (_, index) => (
          <li key={index} sx={Seasons.styles.row}>
            <Bar width='6em' height='1em' />
            <Bar width='4em' height='1.25em' pill={true} />
          </li>
        ))}
      </ul>
    </div>
  )
}

Seasons.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: [4, 3],
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'grayDark',
    backgroundColor: 'grayLightest',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  poster: {
    flexShrink: 0,
    width: '3.5em',
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    minWidth: 0,
  },
  title: {
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 3,
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
  },
  meta: {
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'grayDarkest',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingY: 8,
    borderTop: '1px solid',
    borderColor: 'grayDark',
  },
  season: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 5,
    fontWeight: 'semibold',
    color: 'text',
  },
}

const Calendar = ({ data }: { data: Films | null }) => {
  const months = data
    ? Object.entries([...data.upcoming].sort((a, b) => a.date.localeCompare(b.date)).reduce((months, film) => {
      const month = MONTH.format(dateOf(film.date))
      return { ...months, [month]: [...(months[month] || []), film] }
    }, {} as Record<string, Films['upcoming']>))
    : Array.from({ length: 3 }, (_, index) => [String(index), null] as const)

  return (
    <div sx={Calendar.styles.element} tabIndex={0} role='region' aria-label='Upcoming films, month by month'>
      {months.map(([month, films]) => (
        <div key={month} sx={Calendar.styles.month}>
          {films ? <h3 sx={Calendar.styles.name}>{month}</h3> : <Bar width='7em' height='1em' />}
          <ul sx={Calendar.styles.films}>
            {(films || [null, null]).map((film, index) => (
              <li key={film?.id ?? index} sx={Calendar.styles.film}>
                <Cover path={film?.poster} />
                {film ? (
                  <>
                    <span sx={Calendar.styles.day}><time dateTime={film.date}>{DAY.format(dateOf(film.date))}</time></span>
                    <span sx={Calendar.styles.title} title={film.title}>{film.title}</span>
                  </>
                ) : <Bar width='60%' height='0.625em' />}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

Calendar.styles = {
  element: {
    display: 'flex',
    overflowX: 'auto',
    overscrollBehaviorX: 'contain',
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'grayDark',
    backgroundColor: 'grayLightest',
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: '2px',
    },
  },
  month: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 5,
    ':not(:last-of-type)': {
      borderRight: '1px solid',
      borderColor: 'grayDark',
    },
  },
  name: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 5,
    lineHeight: 'heading',
    color: 'textLightest',
    whiteSpace: 'nowrap',
  },
  films: {
    display: 'flex',
    gap: 6,
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  film: {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    width: ['4.5em', '5em'],
  },
  day: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: 'textLight',
  },
  title: {
    fontSize: 7,
    color: 'grayDarkest',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
}

const Phone = ({ data }: { data: Films | null }) => {
  const film = data?.films[0]
  const { palette } = usePalette(film ? `https://image.tmdb.org/t/p/w92${film.poster}` : null, null, film?.poster)
  // What the swap changes first: an axis the policy holds or breaks before one it only moves
  const rows = film?.refine.rows
    .filter(({ state, from, to }) => state !== 'quiet' && state !== 'same' && from && to)
    .sort((a, b) => Number(a.state === 'moved') - Number(b.state === 'moved'))
    .slice(0, 2)

  return (
    <div sx={Phone.styles.element}>
      <div sx={Phone.styles.screen} style={{ backgroundColor: palette?.backgroundColor }}>
        <span sx={Phone.styles.clock} style={{ color: palette?.color }} aria-hidden='true'>9:41</span>
        <div sx={Phone.styles.notification}>
          <div sx={Phone.styles.app}>
            <img src='assets/favicon.png' alt='' width={24} height={24} sx={Phone.styles.icon} />
            <span sx={Phone.styles.name}>Sensorr</span>
            <span sx={Phone.styles.now}>now</span>
          </div>
          {film ? (
            <>
              <strong sx={Phone.styles.title}>✨ Refine proposal: {film.title}</strong>
              <span sx={Phone.styles.release} title={film.winner.title}>{film.winner.title}</span>
              <span sx={Phone.styles.pills}>
                {rows?.map((row) => <TransitionPill key={row.axis} from={row.from} to={row.to} state={row.state} compact={true} title={row.axis} />)}
              </span>
            </>
          ) : (
            <>
              <Bar width='80%' height='0.75em' />
              <Bar width='100%' height='0.625em' />
              <Bar width='60%' height='1.25em' pill={true} />
            </>
          )}
          <span sx={Phone.styles.actions} aria-hidden='true'>
            <span sx={{ ...buttonStyles.contain({ color: 'primary' }), ...Phone.styles.action }}>Accept</span>
            <span sx={{ ...buttonStyles.outline({ color: 'gray' }), ...Phone.styles.action }}>Refuse</span>
          </span>
        </div>
      </div>
    </div>
  )
}

Phone.styles = {
  element: {
    width: ['16em', '18em'],
    maxWidth: '100%',
    marginX: 'auto',
    padding: 9,
    borderRadius: '2em',
    border: '1px solid',
    borderColor: 'grayDark',
    backgroundColor: 'grayLightest',
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    aspectRatio: '9 / 17',
    paddingX: 8,
    paddingY: 2,
    borderRadius: '1.75em',
    backgroundColor: 'white',
    transition: 'background-color 800ms ease-in-out',
  },
  clock: {
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 0,
    lineHeight: 'heading',
    color: 'textLightest',
    fontVariantNumeric: 'tabular-nums',
    transition: 'color 800ms ease-in-out',
  },
  notification: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    padding: 7,
    borderRadius: '1em',
    border: '1px solid',
    borderColor: 'grayDark',
    backgroundColor: 'grayLightest',
    fontSize: 5,
  },
  app: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: '1.5em',
    height: '1.5em',
    borderRadius: '0.25em',
  },
  name: {
    flex: 1,
    fontSize: 6,
    fontWeight: 'semibold',
    color: 'textLight',
  },
  now: {
    fontSize: 7,
    color: 'grayDarkest',
  },
  title: {
    fontSize: 6,
    fontWeight: 'strong',
    color: 'textLightest',
  },
  release: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: 'grayDarkest',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    minWidth: 0,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  action: {
    display: 'block',
    textAlign: 'center',
    fontSize: 6,
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
    title: <><a href={`${GITHUB}#backup-and-restore`}>Backups</a> and <a href={`${GITHUB}#update-from-the-app`}>updates</a></>,
    body: <>from <em>Settings</em>, with a weekly dump once turned on.</>,
  },
  {
    emoji: '🌍',
    title: 'English and French,',
    body: 'for the interface, the mails and the wrapped.',
  },
]

const Also = () => {
  const [ref, shown] = useReveal()

  return (
    <section ref={ref} sx={{ ...Also.styles.element, opacity: shown ? 1 : 0 }}>
      <h2 sx={Also.styles.heading}>And also</h2>
      <ul sx={Also.styles.list}>
        {ALSO.map(({ emoji, title, body }) => (
          <li key={emoji} sx={Also.styles.item}>
            <span sx={Also.styles.emoji} aria-hidden='true'>{emoji}</span>
            <p sx={Also.styles.text}><strong>{title}</strong> {body}</p>
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
    gap: 4,
    transition: 'opacity 400ms ease-in-out',
    '@media (prefers-reduced-motion: reduce)': {
      opacity: '1 !important',
      transition: 'none',
    },
  },
  heading: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 'heading',
    fontSize: 2,
    lineHeight: 'heading',
    color: 'textLightest',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', 'repeat(3, minmax(0, 1fr))'],
    gap: 4,
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  item: {
    display: 'flex',
    gap: 6,
    padding: 4,
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'grayDark',
    backgroundColor: 'grayLightest',
  },
  emoji: {
    fontSize: 3,
    lineHeight: 'reset',
  },
  text: {
    margin: '0px',
    fontSize: 5,
    lineHeight: 'body',
    color: 'text',
    textWrap: 'pretty',
    strong: {
      fontWeight: 'semibold',
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

export const Bands = ({ data }: { data: Films | null }) => (
  <div sx={Bands.styles.element}>
    <Band emoji='📼' label='Movies and shows' title='One library for everything' visual={<Library data={data} />}>
      Movies and shows side by side, with the same rules and the same jobs, kept in sync with your Plex. No Radarr next to Sonarr.
    </Band>
    <Band emoji='📺' label='Shows' title='Whole series, seasons or episodes' visual={<Seasons data={data} />} reversed={true}>
      Follow a show, a season or a single episode. Sensorr looks for the whole series first, then season packs, then episodes,
      and hard links finished files into your library.
    </Band>
    <Band emoji='🔔' label='People' title='Follow the people you love' visual={<Calendar data={data} />}>
      Follow a director, an actor or a composer, and their next films land in your calendar, month by month.
    </Band>
    <Band emoji='📱' label='Notifications' title='In your pocket' visual={<Phone data={data} />} reversed={true}>
      Install Sensorr on your phone like an app, and accept a proposal right from its notification.
    </Band>
    <Also />
  </div>
)

Bands.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
    paddingY: 0,
  },
}
