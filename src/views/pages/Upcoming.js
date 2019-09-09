import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { withRouter } from 'react-router'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import Left from 'icons/Left'
import Right from 'icons/Right'
import { Movie } from 'shared/Documents'
import database from 'store/database'
import capitalize from 'utils/capitalize'
import theme from 'theme'

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
  placeholder: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
      '&:first-child,&:last-child': {
        fontSize: '1.25em',
        '>a': {
          display: 'flex',
          alignItems: 'center',
          padding: '1.5em 0.75em',
        },
      },
      '&:nth-child(2)': {
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
  semitransparent: {
    opacity: 0.5,
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
  movie: {
    position: 'relative',
  },
  star: {
    position: 'absolute',
    bottom: '-5em',
    fontSize: '0.375em',
  },
}

export const Navigation = withRouter(({ onClick, edges = true, location, history, match, staticContext, ...props }) => {
  const year = Math.min(((new Date()).getFullYear() + 8), Math.max(1900, parseInt(match.params.year)))
  const month = Math.min(12, Math.max(1, parseInt(match.params.month)))

  return (
    <div css={styles.navigation}>
      <div style={!edges || (year <= 1900) ? { visibility: 'hidden' } : {}}>
        <a onClick={() => history.push(`/movies/upcoming/${year - 1}/1`)}>
          <Left end={true} />
        </a>
      </div>
      <div>
        <a onClick={() => history.push(`/movies/upcoming/${month === 1 ? year - 1 : year}/${month === 1 ? 12 : month - 1}`)} style={(month === 1 && year <= 1900) ? { visibility: 'hidden' } : {}}>
          <Left />
        </a>
        {onClick ? (
          <button css={theme.resets.button} onClick={onClick}>
            <code>{capitalize(new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' }))}</code>
            <span>&nbsp;</span>
            <code><small style={styles.semitransparent}>{year}</small></code>
          </button>
        ) : (
          <div>
            <code>{capitalize(new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' }))}</code>
            <span>&nbsp;</span>
            <code><small style={styles.semitransparent}>{year}</small></code>
          </div>
        )}
        <a onClick={() => history.push(`/movies/upcoming/${month === 12 ? year + 1 : year}/${month === 12 ? 1 : month + 1}`)} style={(month === 12 && year >= (new Date()).getFullYear() + 8) ? { visibility: 'hidden' } : {}}>
          <Right />
        </a>
      </div>
      <div style={!edges || (year >= ((new Date()).getFullYear() + 8)) ? { visibility: 'hidden' } : {}}>
        <a onClick={() => history.push(`/movies/upcoming/${year + 1}/1`)}>
          <Right end={true} />
        </a>
      </div>
    </div>
  )
})

class Upcoming extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      movies: [],
    }
  }

  async componentDidMount() {
    const db = await database.get()
    const entities = await db.stars.find().where('state').ne('ignored').exec()
    const movies = {}

    for (let entity of entities) {
      let { credits, ...star } = entity.toJSON()

      for (let movie of credits) {
        if (movie.release_date && movie.poster_path) {
          movies[movie.id] = {
            ...(movies[movie.id] || {}),
            ...movie,
            release_date: new Date(movie.release_date),
            stars: [
              ...((movies[movie.id] || {}).stars || []),
              star,
            ],
          }
        }
      }
    }

    this.setState({ loading: false, movies })
  }

  render() {
    const { match, ...props } = this.props
    const { loading, movies, ...state } = this.state
    const year = Math.min(((new Date()).getFullYear() + 8), Math.max(1900, parseInt(match.params.year)))
    const month = Math.min(12, Math.max(1, parseInt(match.params.month)))

    const entities = Object.values(movies)
      .filter(movie => movie.release_date.getFullYear() === year && movie.release_date.getMonth() === month - 1)

    return (
      <Fragment>
        <Helmet key="helmet">
          <title>{`Sensorr - Upcoming (${capitalize(new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' }))} ${year})`}</title>
        </Helmet>
        <div style={styles.wrapper}>
          {loading ? (
            <div style={styles.placeholder}>
              <Spinner />
            </div>
          ) : !entities.length ? (
            <div style={styles.placeholder}>
              <Empty
                emoji="👩‍🎤"
                title="Sorry, no upcoming movies this month"
                subtitle={(
                  <span>
                    Try to follow more stars !
                  </span>
                )}
              />
            </div>
          ) : (
            <Grid
              strict={false}
              items={entities}
              css={styles.grid}
              child={({ entity: { stars, ...entity }, ...props }) => (
                <div style={styles.movie} key={entity.id}>
                  <Film entity={entity} {...props} />
                  {stars
                    .filter((star, index, array) => array.map(obj => obj.id).indexOf(star.id) === index)
                    .filter((star, index) => index < 4)
                    .map((star, index) => (
                      <Persona
                        entity={star}
                        context="avatar"
                        updatable={false}
                        key={star.id}
                        style={{ ...styles.star, right: `${index * 6}em` }}
                      />
                    ))
                  }
                </div>
              )}
              controls={{
                label: ({ total, reset }) => (
                  <span style={{ display: 'flex', flex: 1 }}>
                    <button css={theme.resets.button} onClick={() => reset()}>
                      <span><strong>{total}</strong> Upcoming movies</span>
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
                },
                sortings: {
                  release_date: Movie.Sortings.release_date,
                  popularity: Movie.Sortings.popularity,
                  vote_average: Movie.Sortings.vote_average,
                },
                defaults: {
                  filtering: {},
                  sorting: Movie.Sortings.release_date,
                  reverse: true,
                },
                children: ({ setOpen }) => (
                  <div css={styles.controls}>
                    <Navigation onClick={() => setOpen(true)} />
                  </div>
                )
              }}
            />
          )}
        </div>
      </Fragment>
    )
  }
}

export default Upcoming
