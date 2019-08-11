import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { withRouter } from 'react-router'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import database from 'store/database'
import theme from 'theme'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '2em 0',
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
    backgroundColor: theme.colors.grey,
    fontFamily: theme.fonts.monospace,
    fontSize: '1.25em',
    padding: '0.75em 1em',
    textAlign: 'center',
    color: theme.colors.secondary,
  },
  small: {
    opacity: 0.5,
    fontSize: '0.75em',
    margin: '0 0.75em',
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
      .filter(movie => movie.release_date.getFullYear() === year && movie.release_date.getMonth() === month)

    return (
      <Fragment>
        <Helmet key="helmet">
          <title>{`Sensorr - Upcoming (${year})`}</title>
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
            />
          )}
        </div>
      </Fragment>
    )
  }
}

export default Upcoming

export const Navigation = withRouter(({ location, history, match, staticContext, ...props }) => {
  const year = Math.min(((new Date()).getFullYear() + 8), Math.max(1900, parseInt(match.params.year)))
  const month = Math.min(12, Math.max(1, parseInt(match.params.month)))

  return (
    <div style={styles.navigation}>
      <span style={{ ...(year <= 1900 ? styles.hidden : {}) }}>
        <a onClick={() => history.push(`/movies/upcoming/${year - 1}/1`)} style={styles.navigator}>⏪</a>
        <a onClick={() => history.push(`/movies/upcoming/${month === 1 ? year - 1 : year}/${month === 1 ? 12 : month - 1}`)} style={styles.navigator}>⬅️</a>
      </span>
      <div>
        <span style={{ textTransform: 'capitalize' }}>{new Date(year, month - 1).toLocaleString(global.config.region, { month: 'long' })}</span>
        <span style={styles.small}>{year}</span>
      </div>
      <span style={{ ...(year >= ((new Date()).getFullYear() + 8) ? styles.hidden : {}) }}>
        <a onClick={() => history.push(`/movies/upcoming/${month === 12 ? year + 1 : year}/${month === 12 ? 1 : month + 1}`)} style={styles.navigator}>➡️</a>
        <a onClick={() => history.push(`/movies/upcoming/${year + 1}/1`)} style={styles.navigator}>⏩</a>
      </span>
    </div>
  )
})
