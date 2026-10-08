import { Badge, Bar, Picture } from '@sensorr/ui'
import { Films } from '../../data'
import { Cover, EASE, STILL, useReveal } from './shared'

const MONTH = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' })
const DAY = new Intl.DateTimeFormat('en', { month: '2-digit', day: '2-digit', timeZone: 'UTC' })
const LONG = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
const dateOf = (date: string) => new Date(`${date}T00:00:00Z`)
// On a phone, three stars in the row, for every name to hold on one line under its avatar
const PHONE_PEOPLE = 3

// Directors of the films, each once
const People = ({ data, shown }: { data: Films | null, shown: boolean }) => {
  const people = data
    ? [...new Map(data.films.flatMap(({ director }) => director?.profile ? [[director.name, director] as const] : [])).values()].slice(0, 4)
    : Array.from({ length: 4 }, () => null)

  return (
    <div sx={Following.styles.group}>
    <h3 sx={Following.styles.label}><span aria-hidden='true'>🔔</span> Followed</h3>
    <ul sx={Following.styles.people} aria-label='Followed directors'>
      {people.map((person, index) => (
        <li
          key={person?.name ?? index}
          sx={{ ...Following.styles.person, display: index < PHONE_PEOPLE ? 'flex' : ['none', 'flex'] }}
          style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'scale(0.8)', transitionDelay: `${index * 90}ms` }}
        >
          <span sx={Following.styles.avatar} aria-hidden='true'>
            {person?.profile ? <Picture path={person.profile} size='w185' sx={Following.styles.picture} /> : <Bar height='100%' radius='50%' />}
            <span sx={Following.styles.bell}><Badge emoji='🔔' compact={true} /></span>
          </span>
          {person ? <span sx={Following.styles.name} title={person.name}>{person.name}</span> : <Bar width='70%' height='0.875em' />}
        </li>
      ))}
    </ul>
    </div>
  )
}

const Calendar = ({ data, shown }: { data: Films | null, shown: boolean }) => {
  const months = data
    ? Object.entries([...data.upcoming].sort((a, b) => a.date.localeCompare(b.date)).reduce((months, film) => {
      const month = MONTH.format(dateOf(film.date))
      return { ...months, [month]: [...(months[month] || []), film] }
    }, {} as Record<string, Films['upcoming']>))
    : Array.from({ length: 2 }, (_, index) => [String(index), null] as const)

  return (
    <div sx={Following.styles.group}>
    <h3 sx={Following.styles.label}><span aria-hidden='true'>📅</span> Calendar</h3>
    <div
      sx={Following.styles.calendar}
      style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateX(4em)' }}
      tabIndex={0}
      role='region'
      aria-label='Upcoming films, month by month'
    >
      {months.map(([month, films]) => (
        <div key={month} sx={Following.styles.month}>
          {films ? <h4 sx={Following.styles.monthLabel}>{month}</h4> : <Bar width='6em' height='1.5em' />}
          <ul sx={Following.styles.films}>
            {(films || [null, null, null]).map((film, index) => (
              <li key={film?.id ?? index} sx={Following.styles.film}>
                <Cover path={film?.poster} size='w185'>
                  {film && (
                    <span sx={Following.styles.day}>
                      <Badge emoji='📅' label={<time dateTime={film.date} title={LONG.format(dateOf(film.date))}>{DAY.format(dateOf(film.date))}</time>} compact={true} size='small' />
                    </span>
                  )}
                </Cover>
                {film ? <span sx={Following.styles.title} title={film.title}>{film.title}</span> : <Bar width='60%' height='0.75em' />}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    </div>
  )
}

export const Following = ({ data }: { data: Films | null }) => {
  const [ref, shown] = useReveal()

  return (
    <div ref={ref} sx={Following.styles.element}>
      <People data={data} shown={shown} />
      <Calendar data={data} shown={shown} />
    </div>
  )
}

const ENTRANCE = {
  transitionProperty: 'opacity, transform',
  transitionDuration: '600ms',
  transitionTimingFunction: EASE,
  ...STILL,
}

Following.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    gap: [2, 1],
    minWidth: 0,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  label: {
    margin: '0px',
    fontSize: 6,
    fontWeight: 'strong',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'textLight',
  },
  people: {
    display: 'grid',
    gridTemplateColumns: [`repeat(${PHONE_PEOPLE}, minmax(0, 1fr))`, 'repeat(4, 9em)'],
    gap: [6, 2],
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  person: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
    ...ENTRANCE,
  },
  avatar: {
    position: 'relative',
    display: 'block',
    width: '100%',
    aspectRatio: '1 / 1',
    borderRadius: '50%',
    // The picture is clipped round, the bell sits outside it
    '& > span:first-of-type': {
      position: 'absolute',
      inset: '0px',
      borderRadius: '50%',
      overflow: 'hidden',
    },
  },
  picture: {
    minHeight: '0px',
  },
  bell: {
    position: 'absolute',
    right: '0px',
    bottom: '0px',
    fontSize: [7, 4],
  },
  name: {
    maxWidth: '100%',
    fontFamily: 'heading',
    fontWeight: 'strong',
    fontSize: [6, 4],
    color: 'textLightest',
    textAlign: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  // Runs past the right edge of the viewport, its last poster fading out there, for the months to go on
  calendar: {
    display: 'flex',
    gap: 2,
    overflowX: 'auto',
    overscrollBehaviorX: 'contain',
    scrollbarWidth: 'none',
    marginRight: 'calc((100% - 100vw) / 2)',
    paddingBottom: 8,
    maskImage: 'linear-gradient(to right, black 80%, transparent)',
    transitionDelay: '300ms',
    ...ENTRANCE,
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
  },
  monthLabel: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: [2, 1],
    lineHeight: 'heading',
    color: 'textLightest',
  },
  films: {
    display: 'flex',
    gap: [6, 4],
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  film: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: ['8em', '10em'],
  },
  day: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  title: {
    fontSize: [6, 5],
    fontWeight: 'semibold',
    color: 'textLightest',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
}
