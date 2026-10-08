import { Bar } from '@sensorr/ui'
import { Films } from '../../data'
import { Cover, EASE, STILL, useReveal } from './shared'

const COLUMNS = 7
const ROWS = 3

type Entry = { id: string, kind: string, title: string, year: number, poster?: string, badge?: { emoji: string, label: string } }

// Two movies for a show, a wished one among the archived, as a library mixes them
const entriesOf = (data: Films | null): (Entry | null)[] => {
  if (!data) {
    return Array.from({ length: COLUMNS * ROWS }, () => null)
  }

  const films = data.films.slice(0, (COLUMNS * ROWS * 2) / 3)
  const shows = data.shows.slice(0, (COLUMNS * ROWS) / 3)

  return films.flatMap((film, index) => {
    const movie: Entry = {
      id: `movie-${film.id}`,
      kind: 'Movie',
      title: film.title,
      year: film.year,
      poster: film.poster,
      badge: index % 5 === 3 ? { emoji: '🍿', label: 'Wished' } : { emoji: '📼', label: 'Archived' },
    }
    const show = index % 2 ? shows[(index - 1) / 2] : null

    return show
      ? [movie, { id: `show-${show.id}`, kind: 'Show', title: show.title, year: show.year, poster: show.poster, badge: { emoji: '📺', label: 'Followed' } }]
      : [movie]
  }).slice(0, COLUMNS * ROWS)
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
          sx={{ ...Library.styles.column, paddingTop: column % 2 ? ['3em', '5em'] : '0px' }}
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
    gridTemplateColumns: [`repeat(${COLUMNS}, 9.5em)`, `repeat(${COLUMNS}, 11em)`],
    columnGap: [6, 2],
    width: 'max-content',
    // The wall goes on below the band: its last row fades out
    maxHeight: ['36em', '46em'],
    overflow: 'hidden',
    maskImage: 'linear-gradient(to bottom, black 75%, transparent)',
    margin: '0px',
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
