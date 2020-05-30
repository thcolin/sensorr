import React, { PureComponent, Fragment, useEffect, useMemo, useState } from 'react'
import { compose } from 'redux'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import { withRouter } from 'react-router'
import Items from 'components/Layout/Items'
import withDatabaseQuery from 'components/Layout/Items/withDatabaseQuery'
import withControls from 'components/Layout/Items/withControls'
import Film from 'components/Entity/Film'
import Left from 'icons/Left'
import Right from 'icons/Right'
import { Movie } from 'shared/Documents'
import database from 'store/database'
import { capitalize } from 'shared/utils/string'
import { setHistoryState } from 'utils/history'
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

export const Navigation = withRouter(({ onClick, onChange, edges = true, location, history, match, staticContext, ...props }) => {
  const year = Math.min(LIMITS[1], Math.max(LIMITS[0], parseInt(match.params.year)))
  const month = Math.min(12, Math.max(1, parseInt(match.params.month)))

  const handleChange = (year, month) => {
    history.push(`/movies/calendar/${year}/${month}`)
    onChange({ year, month })
  }

  const previous = [
    () => handleChange(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1),
    () => handleChange(year - 1, 1),
  ]

  const next = [
    () => handleChange(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1),
    () => handleChange(year + 1, 1),
  ]

  useEffect(() => {
    onChange({ year, month })
  }, [year, month])

  return (
    <div css={styles.navigation}>
      <div style={!edges || (year <= LIMITS[0]) ? { visibility: 'hidden' } : {}}>
        <a onClick={previous[1]}>
          <Left end={true} />
        </a>
      </div>
      <div>
        <a onClick={previous[0]} style={(month === 1 && year <= LIMITS[0]) ? { visibility: 'hidden' } : {}}>
          <Left />
        </a>
        {onClick ? (
          <button css={theme.resets.button} onClick={onClick} data-test="controls-all">
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
                onChange={e => handleChange(year, e.target.value)}
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
                onChange={e => handleChange(e.target.value, month)}
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
        <a onClick={next[0]} style={(month === 12 && year >= LIMITS[1]) ? { visibility: 'hidden' } : {}}>
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

const Filters = {
  display: () => ({
    label: 'Display',
    type: 'radio',
    options: [
      {
        value: 'permissive',
        label: 'All',
      },
      {
        value: 'strict',
        label: 'Strict',
      },
    ],
    default: 'strict',
    apply: (entity, values) => !values.includes('strict') || (entity.poster_path && (!entity.adult || tmdb.adult)),
  }),
}

const CalendarItems = compose(
  withDatabaseQuery((db, controls) => {
    if (!controls?.state?.year) {
      return
    }

    const year = parseInt(controls.state.year)
    const month = parseInt(controls.state.month)

    return db.calendar.find({
      release_date: {
        $gte: new Date(`${year}-${month}-01`).toISOString(),
        $lt: new Date(`${month === 12 ? year + 1 : year}-${month === 12 ? 1 : month + 1}-01`).toISOString()
      },
    })
  }, true),
  withControls({
    label: ({ total, reset, setState }) => (
      <span style={{ display: 'flex', flex: 1 }}>
        <button css={theme.resets.button} onClick={() => reset()}>
          <span><strong>{total}</strong> Published movies</span>
        </button>
        <span style={{ flex: 1, justifyContent: 'center' }}>
          <Navigation
            edges={false}
            onChange={({ year, month }) => setState({ year, month })}
          />
        </span>
      </span>
    ),
    filters: {
      query: Movie.Filters.query,
      genre: Movie.Filters.genre,
      popularity: Movie.Filters.popularity,
      vote_average: Movie.Filters.vote_average,
      display: Filters.display,
    },
    sortings: {
      release_date_full: {
        ...Movie.Sortings.release_date,
        value: 'release_date_full',
      },
      popularity: Movie.Sortings.popularity,
      vote_average: Movie.Sortings.vote_average,
    },
    initial: () => ({
      filtering: window?.history?.state?.state?.controls?.filtering || { display: 'strict' },
      sorting: window?.history?.state?.state?.controls?.sorting || 'release_date_full',
      reverse: window?.history?.state?.state?.controls?.reverse || true,
      state: window?.history?.state?.state?.controls?.state || {},
    }),
    render: {
      menu: ({ setOpen, setState }) => (
        <div css={styles.controls}>
          <Navigation
            onClick={() => setOpen(true)}
            onChange={({ year, month }) => setState({ year, month })}
          />
        </div>
      ),
      pane: (blocks) => (
        <>
          {Emotion.jsx(blocks.genre.element, blocks.genre.props)}
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
            {Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
          </div>
          {Emotion.jsx(blocks.display.element, blocks.display.props)}
          {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
        </>
      ),
    },
  })
)(Items)

const Calendar = ({ match, history, ...props }) => {
  const [ready, setReady] = useState(false)
  const [stars, setStars] = useState([])
  const year = Math.min(LIMITS[1], Math.max(LIMITS[0], parseInt(match.params.year)))
  const month = Math.min(12, Math.max(1, parseInt(match.params.month)))

  useEffect(() => {
    (async () => {
      const db = await database.get()
      const stars = await db.stars.find().where('state').ne('ignored').exec()
      setStars(stars.map(star => star.id))
      setReady(true)
    })()
  }, [])

  return (
    <Fragment>
      <Helmet key="helmet">
        <title>{`Sensorr - Calendar (${capitalize(new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' }))} ${year})`}</title>
      </Helmet>
      <div style={styles.wrapper}>
        <CalendarItems
          display="virtual-grid"
          transform={(entities) => entities
            .map(raw => {
              const entity = raw.toJSON()
              const credits = entity.credits
                .filter(star => stars.includes(star.id.toString()))
                .filter((star, index, array) => array.map(obj => obj.id).indexOf(star.id) === index)
                .filter((star, index) => index < 4)

              return { ...entity, credits }
            })
            .filter(entity => entity.credits.length)
          }
          child={Film}
          props={{ withCredits: true }}
          placeholders={history.location.state?.items?.total || null}
          onFetched={({ total }) => setHistoryState({ items: { total } })}
          ready={ready}
          debounce={true}
          empty={{
            emoji: '👩‍🎤',
            title: 'Sorry, no published movies',
            subtitle: (
              <span>
                Try to follow more stars !
              </span>
            ),
          }}
        />
      </div>
    </Fragment>
  )
}

export default Calendar
