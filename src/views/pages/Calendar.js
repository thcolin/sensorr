import React, { PureComponent, Fragment } from 'react'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import { withRouter } from 'react-router'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import Left from 'icons/Left'
import Right from 'icons/Right'
import { Movie } from 'shared/Documents'
import database from 'store/database'
import capitalize from 'utils/capitalize'
import theme from 'theme'

const LIMITS = [
  ((new Date()).getFullYear() - 8),
  ((new Date()).getFullYear() + 8),
]

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  grid: {
    padding: '2em 0',
  },
  controls: {
    width: '120%',
    margin: '0 -10%',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontFamily: theme.fonts.monospace,
    fontSize: '1em',
    textAlign: 'center',
    color: 'white',
    '>div': {
      display: 'flex',
      alignItems: 'center',
      '&:first-of-type,&:last-of-type': {
        fontSize: '1.25em',
        '>a': {
          display: 'flex',
          alignItems: 'center',
          padding: '1.5em 0.75em',
        },
      },
      '&:nth-of-type(2)': {
        '>a': {
          fontSize: '0.75em',
          padding: '1.5em',
          margin: '0 0.5em',
        },
        '>div,>button': {
          width: '10em',
        },
      },
      '>a': {
        opacity: 0.9,
        cursor: 'pointer',
        '&:hover': {
          opacity: 1,
        },
        '>svg': {
          height: '1em',
          width: '1em',
        },
      },
    },
  },
  select: {
    position: 'absolute',
    opacity: 0,
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    appearance: 'none',
    border: 'none',
    cursor: 'pointer',
    zIndex: 1,
  },
  navigator: {
    cursor: 'pointer',
    margin: '0 0.125em',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
  },
  hidden: {
    visibility: 'hidden',
  },
}

export const Navigation = withRouter(({ onClick, edges = true, location, history, match, staticContext, ...props }) => {
  const year = Math.min(LIMITS[1], Math.max(LIMITS[0], parseInt(match.params.year)))
  const month = Math.min(12, Math.max(1, parseInt(match.params.month)))

  const previous = [
    () => history.push(`/movies/calendar/${month === 1 ? year - 1 : year}/${month === 1 ? 12 : month - 1}`),
    () => history.push(`/movies/calendar/${year - 1}/1`),
  ]

  const next = [
    () => history.push(`/movies/calendar/${month === 12 ? year + 1 : year}/${month === 12 ? 1 : month + 1}`),
    () => history.push(`/movies/calendar/${year + 1}/1`),
  ]

  return (
    <div css={styles.navigation}>
      <div style={!edges || (year <= LIMITS[0]) ? { visibility: 'hidden' } : {}}>
        <a onClick={previous[1]}>
          <Left end={true} />
        </a>
      </div>
      <div>
        <a onClick={previous[0]} style={!edges || (month === 1 && year <= LIMITS[0]) ? { visibility: 'hidden' } : {}}>
          <Left />
        </a>
        {onClick ? (
          <button css={theme.resets.button} onClick={onClick}>
            <code>{capitalize(new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' }))}</code>
            <span>&nbsp;</span>
            <code><small style={theme.styles.semitransparent}>{year}</small></code>
          </button>
        ) : (
          <div>
            <label htmlFor="calendar-month" style={{ position: 'relative' }}>
              <select
                id="calendar-month"
                value={month}
                onChange={e => history.push(`/movies/calendar/${year}/${e.target.value}`)}
                css={styles.select}
              >
                {Array(12).fill(true).map((foo, i) => (
                  <option key={i} value={i + 1}>
                    {capitalize(new Date(year, i).toLocaleString(global.config.region, { month: 'long' }))}
                  </option>
                ))}
              </select>
              <code>{capitalize(new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' }))}</code>
            </label>
            <span>&nbsp;</span>
            <label htmlFor="calendar-year" style={{ position: 'relative' }}>
              <select
                id="calendar-year"
                value={year}
                onChange={e => history.push(`/movies/calendar/${e.target.value}/${month}`)}
                css={styles.select}
              >
                {Array((LIMITS[1] - LIMITS[0]) + 1).fill(true).map((foo, i) => (
                  <option key={i} value={LIMITS[0] + i}>{LIMITS[0] + i}</option>
                ))}
              </select>
              <code><small style={theme.styles.semitransparent}>{year}</small></code>
            </label>
          </div>
        )}
        <a onClick={next[0]} style={!edges || (month === 12 && year >= LIMITS[1]) ? { visibility: 'hidden' } : {}}>
          <Right />
        </a>
      </div>
      <div style={!edges || (year >= LIMITS[1]) ? { visibility: 'hidden' } : {}}>
        <a onClick={next[1]}>
          <Right end={true} />
        </a>
      </div>
    </div>
  )
})

const Pane = (blocks) => (
  <>
    {Emotion.jsx(blocks.genre.element, blocks.genre.props)}
    <div css={[theme.styles.row, theme.styles.spacings.row]}>
      {Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
      {Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
    </div>
    {Emotion.jsx(blocks.display.element, blocks.display.props)}
    {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
  </>
)

class Calendar extends PureComponent {
  static Filters = {
    display: () => ({
      label: 'Display',
      type: 'radio',
      inputs: [
        {
          value: 'strict',
          label: 'Strict',
        },
        {
          value: 'permissive',
          label: 'Permissive',
        },
      ],
      default: 'strict',
      apply: (entity, values) => !values.includes('strict') || (entity.poster_path && (!entity.adult || tmdb.adult)),
    }),
  }

  static Childs = {
    Film: (props) => <Film {...props} withCredits={true} />
  }

  constructor(props) {
    super(props)

    this.state = {
      ready: false,
      stars: [],
    }
  }

  async componentDidMount() {
    const db = await database.get()
    const stars = await db.stars.find().where('state').ne('ignored').exec()
    this.setState({ ready: true, stars: stars.map(star => star.id) })
  }

  render() {
    const { match, ...props } = this.props
    const { ready, stars, ...state } = this.state
    const year = Math.min(LIMITS[1], Math.max(LIMITS[0], parseInt(match.params.year)))
    const month = Math.min(12, Math.max(1, parseInt(match.params.month)))

    return (
      <Fragment>
        <Helmet key="helmet">
          <title>{`Sensorr - Calendar (${capitalize(new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' }))} ${year})`}</title>
        </Helmet>
        <div style={styles.wrapper}>
          <Grid
            query={(db) => db.calendar.find({
              release_date: {
                $gte: new Date(`${year}-${month}-01`).toISOString(),
                $lt: new Date(`${month === 12 ? year + 1 : year}-${month === 12 ? 1 : month + 1}-01`).toISOString()
              },
            })}
            transform={(entities) => entities.map(raw => {
              const entity = raw.toJSON()
              return {
                ...entity,
                credits: entity.credits
                  .filter(star => stars.includes(star.id.toString()))
                  .filter((star, index, array) => array.map(obj => obj.id).indexOf(star.id) === index)
                  .filter((star, index) => index < 4)
              }
            })}
            css={styles.grid}
            child={Calendar.Childs.Film}
            placeholder={false}
            debounce={true}
            strict={false}
            ready={ready}
            empty={{
              emoji: '👩‍🎤',
              title: 'Sorry, no published movies',
              subtitle: (
                <span>
                  Try to follow more stars !
                </span>
              ),
            }}
            controls={{
              label: ({ total, reset }) => (
                <span style={{ display: 'flex', flex: 1 }}>
                  <button css={theme.resets.button} onClick={() => reset()}>
                    <span><strong>{total}</strong> Published movies</span>
                  </button>
                  <span style={{ flex: 1, justifyContent: 'center' }}>
                    <Navigation edges={false} />
                  </span>
                </span>
              ),
              filters: {
                query: Movie.Filters.query,
                genre: Movie.Filters.genre,
                popularity: Movie.Filters.popularity,
                vote_average: Movie.Filters.vote_average,
                display: Calendar.Filters.display,
              },
              sortings: {
                release_date_full: {
                  ...Movie.Sortings.release_date,
                  value: 'release_date_full',
                },
                popularity: Movie.Sortings.popularity,
                vote_average: Movie.Sortings.vote_average,
              },
              defaults: {
                filtering: {
                  display: 'strict',
                },
                sorting: {
                  ...Movie.Sortings.release_date,
                  value: 'release_date_full',
                },
                reverse: true,
              },
              render: {
                menu: ({ setOpen }) => (
                  <div css={styles.controls}>
                    <Navigation onClick={() => setOpen(true)} />
                  </div>
                ),
                pane: Pane,
              },
            }}
          />
        </div>
      </Fragment>
    )
  }
}

export default Calendar
