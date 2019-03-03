import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import InfiniteScroll from 'react-infinite-scroller'
import { Link } from 'react-router-dom'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import database from 'store/database'
import theme from 'theme'

const styles = {
  wrapper: {
    padding: '0 0 2em 0',
  },
  controls: {
    position: 'sticky',
    top: '-1px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: '0.75em 2em',
    margin: '0 0 -4em 0',
    fontSize: '1em',
    zIndex: 3,
  },
  control: {
    display: 'flex',
    cursor: 'pointer',
    padding: '0.125em',
    userSelect: 'none',
    MozUserSelect: 'none',
  },
  label: {
    position: 'sticky',
    top: '-1px',
    backgroundColor: theme.colors.grey,
    padding: '0.5em 2em',
    fontSize: '2em',
    fontWeight: 'bold',
    color: theme.colors.secondary,
    textTransform: 'capitalize',
  },
  year: {
    textAlign: 'right',
    margin: '0 0 -2em 50%',
    padding: '0.5em 2.25em 0.5em 2em',
    zIndex: 2,
  },
  month: {
    zIndex: 1,
    padding: '0.5em 2em 0.5em 1em',
  },
  grid: {
    padding: '1em 0',
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
      year: (new Date()).getFullYear(),
      month: 0,
    }

    this.loadPrevious = this.loadPrevious.bind(this)
    this.loadNext = this.loadNext.bind(this)
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

  loadPrevious() {
    document.querySelector('#wrapper').scrollIntoView(true)
    setTimeout(() => this.setState(state => ({ year: state.year - 1, month: 0 })), 400)
  }

  loadNext() {
    document.querySelector('#wrapper').scrollIntoView(true)
    setTimeout(() => this.setState(state => ({ year: state.year + 1, month: 0 })), 400)
  }

  render() {
    const { ...props } = this.props
    const { loading, movies, year, month, ...state } = this.state

    const groups = {}

    groups.year = Object.values(movies)
      .filter(movie => movie.release_date.getFullYear() === year)

    groups.month = Array(month + 1).fill(true)
      .map((foo, month) => groups.year.filter(movie => movie.release_date.getMonth() === month))
      .filter(movies => movies.length)

    return (
      <Fragment>
        <Helmet key="helmet">
          <title>Sensorr - Upcoming</title>
        </Helmet>
        <div style={styles.wrapper} key="wrapper" id="wrapper">
          {loading ? (
            <Spinner />
          ) : (
            <Fragment>
              <div style={styles.controls}>
                <a
                  onClick={this.loadPrevious}
                  style={{
                    ...styles.control,
                    visibility: year >= 1900 ? 'visible' : 'hidden',
                  }}
                >🔼</a>
                <a
                  onClick={this.loadNext}
                  style={{
                    ...styles.control,
                    visibility: year <= ((new Date()).getFullYear() + 8) ? 'visible' : 'hidden',
                  }}
                >🔽</a>
              </div>
              <Fragment key={`${year}`}>
                <h1
                  style={{ ...styles.label, ...styles.year, ...(!groups.year.length ? { margin: 'unset' } : {}) }}
                  key={`${year}-title`}
                >{year}</h1>
                {!groups.year.length ? (
                  <Empty
                    emoji="👩‍🎤"
                    title="Sorry, no upcoming movies this year"
                    subtitle={(
                      <span>
                        Try to <Link to="/stars/search/" style={styles.link}>follow</Link> more stars !
                      </span>
                    )}
                  />
                ) : (
                  <InfiniteScroll
                    pageStart={0}
                    hasMore={month < 11}
                    loadMore={() => this.setState({ month: month + 1 })}
                    loader={<Spinner key="spinner" />}
                  >
                    {groups.month.map((movies, month) => (
                      <Fragment key={`${year}-${month}`}>
                        <h1 style={{ ...styles.label, ...styles.month }} key={`${year}-${month}-title`}>
                          {new Date(year, month).toLocaleString('en-US', { month: 'long' })}
                        </h1>
                        <div style={styles.grid} key={`${year}-${month}-grid`}>
                          <Grid
                            items={movies}
                            child={({ entity: { stars, ...entity }, ...props }) => (
                              <div style={styles.movie} key={entity.id}>
                                <Film entity={entity} {...props} />
                                {stars
                                  .filter((star, index, array) => array.map(obj => obj.id).indexOf(star.id) === index)
                                  .filter((star, index) => index < 4)
                                  .map((star, index) => (
                                    <Persona style={{ ...styles.star, right: `${index * 6}em` }} entity={star} context="avatar" key={star.id} />
                                  ))
                                }
                              </div>
                            )}
                          />
                        </div>
                      </Fragment>
                    ))}
                  </InfiniteScroll>
                )}
              </Fragment>
            </Fragment>
          )}
        </div>
      </Fragment>
    )
  }
}

export default Upcoming
