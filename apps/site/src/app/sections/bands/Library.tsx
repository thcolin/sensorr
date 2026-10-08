import { Bar } from '@sensorr/ui'
import { Films } from '../../data'
import { Cover, EASE, STILL, useReveal } from './shared'

const COLUMNS = 7
const ROWS = 2
// On a phone, only the first two columns show, the wall no longer bleeding past the screen
const PHONE_COLUMNS = 2

type Badge = { emoji: string, label: string }
type Entry = { id: string, kind: string, title: string, year: number, poster?: string, badge: Badge }

// The states of libs/i18n common.js, as the app's grid badges them
const ARCHIVED = { emoji: '📼', label: 'Archived' }
const WISHED = { emoji: '🍿', label: 'Wished' }
const REQUESTED = { emoji: '🍻', label: 'Requested' }
const FOLLOWED = { emoji: '📺', label: 'Followed' }

// Which tile is a show and what state each movie is in, read row by row: archived movies mostly, a wished one and a
// friend's request among them, a show every few tiles, so each row and the phone's two columns mix all four states
const LAYOUT: (Badge | 'show')[] = [
  ARCHIVED, WISHED, 'show', ARCHIVED, ARCHIVED, 'show', ARCHIVED,
  REQUESTED, 'show', ARCHIVED, ARCHIVED, 'show', WISHED, ARCHIVED,
]

const entriesOf = (data: Films | null): (Entry | null)[] => {
  if (!data) {
    return Array.from({ length: COLUMNS * ROWS }, () => null)
  }

  let film = 0
  let show = 0

  return LAYOUT.map((slot) => {
    if (slot === 'show') {
      const { id, title, year, poster } = data.shows[show++ % data.shows.length]
      return { id: `show-${id}`, kind: 'Show', title, year, poster, badge: FOLLOWED }
    }

    const { id, title, year, poster } = data.films[film++ % data.films.length]
    return { id: `movie-${id}`, kind: 'Movie', title, year, poster, badge: slot }
  })
}

// The library as columns of posters running from the page's column past the right edge of the viewport, every other
// column hanging lower so it reads as a wall rather than a table
export const Library = ({ data }: { data: Films | null }) => {
  const [ref, shown] = useReveal<HTMLUListElement>()
  const entries = entriesOf(data)

  return (
    <ul ref={ref} sx={Library.styles.element} aria-label='Movies and shows of the library'>
      {Array.from({ length: COLUMNS }, (_, column) => (
        <li
          key={column}
          sx={{
            ...Library.styles.column,
            display: column < PHONE_COLUMNS ? 'block' : ['none', 'block'],
            paddingTop: column % 2 ? ['3em', '5em'] : '0px',
          }}
          style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(5em)', transitionDelay: `${column * 80}ms` }}
        >
          <ul sx={Library.styles.entries}>
            {entries.filter((_, index) => index % COLUMNS === column).map((entry, row) => (
              <li key={entry?.id ?? row} sx={Library.styles.entry}>
                <Cover path={entry?.poster} badge={entry?.badge} />
                {entry ? (
                  <span sx={Library.styles.caption}>
                    <strong sx={Library.styles.title} title={entry.title}>{entry.title}</strong>
                    <span sx={Library.styles.year}>{entry.year} · {entry.kind}</span>
                  </span>
                ) : (
                  <span sx={Library.styles.caption}>
                    <Bar width='70%' height='0.875em' />
                    <Bar width='40%' height='0.625em' />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

Library.styles = {
  element: {
    display: 'grid',
    gridTemplateColumns: [`repeat(${PHONE_COLUMNS}, minmax(0, 1fr))`, `repeat(${COLUMNS}, 11em)`],
    columnGap: [4, 2],
    // Runs to the viewport's right edge and fades out there, as the calendar does, for the last column's cut to read
    // as a bleed rather than an accident
    overflowX: ['visible', 'clip'],
    marginTop: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    marginRight: ['0px', 'calc((100% - 100vw) / 2)'],
    maskImage: ['none', 'linear-gradient(to left, transparent 1em, black 14em)'],
    padding: '0px',
    listStyle: 'none',
  },
  column: {
    minWidth: 0,
    transitionProperty: 'opacity, transform',
    transitionDuration: '700ms',
    transitionTimingFunction: EASE,
    ...STILL,
  },
  entries: {
    display: 'flex',
    flexDirection: 'column',
    gap: [4, 2],
    margin: '0px',
    padding: '0px',
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
    fontWeight: 'strong',
    fontSize: [5, 4],
    color: 'textLightest',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  year: {
    fontFamily: 'monospace',
    fontSize: [7, 6],
    color: 'textLight',
  },
}
