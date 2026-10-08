import { Badge, Bar, TransitionPill } from '@sensorr/ui'
import { Show } from '../../data'
import { Cover, EASE, STILL, useReveal } from './shared'

// The owned episodes over the aired ones, drawn as `ProgressPill` draws them for a series that no longer airs. Not
// `ProgressPill` itself: its label goes through `@sensorr/i18n`, which follows the browser to French and sets the
// page's `lang`, on a page that is English only
const Episodes = ({ owned, aired, label }: { owned: number, aired: number, label: string }) => (
  <TransitionPill
    role='img'
    aria-label={label}
    title={label}
    from={owned}
    to={aired}
    state={aired > 0 && owned >= aired ? 'held' : 'quiet'}
    neutral={{ from: owned < aired }}
    sx={{ gridArea: 'pill', justifySelf: 'end' }}
  />
)

const Progress = ({ owned, aired, shown, delay }: { owned: number, aired: number, shown: boolean, delay: number }) => (
  <span sx={Seasons.styles.track} aria-hidden='true'>
    <span
      sx={Seasons.styles.fill}
      style={{ transform: `scaleX(${shown ? owned / Math.max(aired, 1) : 0})`, transitionDelay: `${delay}ms` }}
    />
  </span>
)

const pad = (number: number) => `S${String(number).padStart(2, '0')}`

// How each season came in, in the order Sensorr searches: the first ones in one multi-season pack, the next one in its
// own season pack, the airing one episode by episode, half of it owned
const seasonsOf = (show: Show) => {
  const seasons = show.seasons.slice(0, 6)
  const last = seasons.length - 1
  const packed = last - 1

  return seasons.map((season, index) => {
    const owned = index === last ? Math.ceil(season.episodes / 2) : season.episodes

    return {
      ...season,
      owned,
      kind: index === last
        ? `${owned} episodes`
        : index < packed && packed > 1
          ? `${pad(seasons[0].number)}-${pad(seasons[packed - 1].number)} pack`
          : 'Season pack',
    }
  })
}

export const Seasons = ({ show }: { show?: Show }) => {
  const [ref, shown] = useReveal()
  const seasons = show && seasonsOf(show)
  const owned = seasons?.reduce((sum, { owned }) => sum + owned, 0) ?? 0
  const aired = seasons?.reduce((sum, { episodes }) => sum + episodes, 0) ?? 0

  return (
    <div ref={ref} sx={Seasons.styles.element}>
      <span sx={Seasons.styles.poster} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'scale(0.94)' }}>
        <Cover path={show?.poster} size='w500' />
      </span>
      <div sx={Seasons.styles.panel} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(4em)' }}>
        <div sx={Seasons.styles.head}>
          {show ? (
            <>
              <strong sx={Seasons.styles.title}>{show.title}</strong>
              <span sx={Seasons.styles.meta}>{show.year} · {show.seasons.length} seasons · {show.episodes} episodes</span>
            </>
          ) : (
            <>
              <Bar width='10em' height='1.5em' />
              <Bar width='6em' height='0.75em' />
            </>
          )}
        </div>
        <ul sx={Seasons.styles.list}>
          <li sx={{ ...Seasons.styles.row, ...Seasons.styles.all }}>
            <span sx={Seasons.styles.season}>All seasons</span>
            <span sx={Seasons.styles.count}>{aired} episodes</span>
            <Episodes owned={owned} aired={aired} label={`${owned} of ${aired} aired episodes owned`} />
            <Progress owned={owned} aired={aired} shown={shown} delay={300} />
          </li>
          {seasons ? seasons.map((season, index) => (
            <li key={season.number} sx={Seasons.styles.row}>
              <span sx={Seasons.styles.season}>Season {season.number}</span>
              <span sx={Seasons.styles.count}>{season.episodes} episodes</span>
              <span sx={Seasons.styles.kind}>
                <Badge emoji={null} label={season.kind} compact={true} size='small' />
              </span>
              <Episodes owned={season.owned} aired={season.episodes} label={`Season ${season.number}, ${season.owned} of ${season.episodes} aired episodes owned`} />
              <Progress owned={season.owned} aired={season.episodes} shown={shown} delay={400 + index * 90} />
            </li>
          )) : Array.from({ length: 5 }, (_, index) => (
            <li key={index} sx={Seasons.styles.row}>
              <Bar width='6em' height='1em' />
              <span sx={{ gridArea: 'pill' }}><Bar width='4em' height='1.5em' pill={true} /></span>
              <span sx={{ gridArea: 'track' }}><Bar height='0.375em' pill={true} /></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const ENTRANCE = {
  transitionProperty: 'opacity, transform',
  transitionDuration: '700ms',
  transitionTimingFunction: EASE,
  ...STILL,
}

Seasons.styles = {
  element: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', '16em minmax(0, 1fr)', '22em minmax(0, 1fr)'],
    alignItems: 'start',
  },
  poster: {
    display: 'block',
    transformOrigin: 'center top',
    ...ENTRANCE,
  },
  // Over the poster's bottom third on a phone, over its right edge on a wider screen, leaving its title to read
  panel: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: ['-6em', '4em'],
    marginLeft: ['1em', '-3em'],
    marginRight: ['1em', '0px'],
    padding: [5, 2],
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'grayDark',
    backgroundColor: 'grayLightest',
    transitionDelay: '150ms',
    ...ENTRANCE,
  },
  head: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  title: {
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: [2, 0],
    lineHeight: 'heading',
    color: 'textLightest',
    textWrap: 'balance',
  },
  meta: {
    fontFamily: 'monospace',
    fontSize: [6, 5],
    color: 'textLight',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
  },
  row: {
    display: 'grid',
    gridTemplateAreas: [
      '"season pill" "kind track"',
      null,
      '"season count kind pill track"',
    ],
    gridTemplateColumns: ['minmax(0, 1fr) 7em', 'minmax(0, 1fr) 9em', 'minmax(0, 1fr) 6.5em 8.5em 5.5em 8em'],
    alignItems: 'center',
    columnGap: [6, 4],
    rowGap: 8,
    paddingY: [7, 6],
    borderTop: '1px solid',
    borderColor: 'grayDark',
    fontSize: [5, 4],
  },
  all: {
    paddingTop: '0px',
    borderTop: 'none',
  },
  season: {
    gridArea: 'season',
    fontSize: ['1em', null, '1.25em'],
    fontFamily: 'heading',
    fontWeight: 'strong',
    color: 'textLightest',
  },
  count: {
    gridArea: 'count',
    display: ['none', null, 'block'],
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'textLight',
  },
  kind: {
    gridArea: 'kind',
    display: 'flex',
    fontSize: [5, 4, 3],
  },
  track: {
    gridArea: 'track',
    display: 'block',
    height: '0.375em',
    borderRadius: '1em',
    backgroundColor: 'gray',
    overflow: 'hidden',
  },
  fill: {
    display: 'block',
    height: '100%',
    borderRadius: '1em',
    backgroundColor: 'primary',
    transformOrigin: 'left center',
    transitionProperty: 'transform',
    transitionDuration: '900ms',
    transitionTimingFunction: EASE,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
}
