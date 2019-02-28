import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
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
      entities: [],
      year: 0,
    }

    this.loadPrevious = this.loadPrevious.bind(this)
    this.loadNext = this.loadNext.bind(this)
  }

  async componentDidMount() {
    const db = await database.get()
    const stars = await db.stars.find().where('state').ne('ignored').exec()
    const entities = stars
      .map(entity => entity.toJSON())
      .reduce((acc, { credits, ...star }) => [...acc, ...(credits || []).map(credit => ({ ...credit, star: star }))], [])
      .filter(movie => movie.release_date && movie.poster_path)
      .map(({ release_date, ...movie }) => ({ ...movie, release_date: new Date(release_date) }))
      .reduce((acc, { star, ...movie }) => ({
        ...acc,
        [movie.release_date.getFullYear()]: {
          ...(acc[movie.release_date.getFullYear()] || {}),
          [movie.release_date.getMonth()]: {
            ...((acc[movie.release_date.getFullYear()] || {})[movie.release_date.getMonth()] || {}),
            [movie.id]: {
              ...(((acc[movie.release_date.getFullYear()] || {})[movie.release_date.getMonth()] || {})[movie.id] || {}),
              ...movie,
              stars: [
                ...((((acc[movie.release_date.getFullYear()] || {})[movie.release_date.getMonth()] || {})[movie.id] || {}).stars || []),
                star,
              ]
            },
          },
        }
      }), {})

    const years = Object.keys(entities)
    const goal = (new Date()).getFullYear()
    const year = years.reduce((prev, curr) => Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev, 0)

    this.setState({ loading: false, entities, year })
  }

  loadPrevious() {
    document.querySelector('#wrapper').scrollIntoView(true)
    const { entities, year } = this.state
    const years = Object.keys(entities)
    const index = years.indexOf(year)
    const next = years[Math.max(0, index - 1)]
    this.setState({ year: next })
  }

  loadNext() {
    document.querySelector('#wrapper').scrollIntoView(true)
    const { entities, year } = this.state
    const years = Object.keys(entities)
    const index = years.indexOf(year)
    const next = years[Math.min(years.length - 1, index + 1)]
    this.setState({ year: next })
  }

  render() {
    const { ...props } = this.props
    const { loading, entities, year, ...state } = this.state

    return (
      <Fragment>
        <Helmet key="helmet">
          <title>Sensorr - Upcoming</title>
        </Helmet>
        <div style={styles.wrapper} key="wrapper" id="wrapper">
          {loading ? (
            <Spinner />
          ) : !Object.keys(entities).length ? (
            <Empty
              emoji="👩‍🎤"
              title="Oh no, you are not following anyone"
              subtitle={(
                <span>
                  You should try to <Link to="/stars/search/" style={styles.link}>search</Link> for stars and start following them !
                </span>
              )}
            />
          ) : (
            <Fragment>
              <div style={styles.controls}>
                <a
                  onClick={this.loadPrevious}
                  style={{
                    ...styles.control,
                    visibility: Object.keys(entities).indexOf(year) !== 0 ? 'visible' : 'hidden',
                  }}
                >🔼</a>
                <a
                  onClick={this.loadNext}
                  style={{
                    ...styles.control,
                    visibility: Object.keys(entities).indexOf(year) !== (Object.keys(entities).length - 1) ? 'visible' : 'hidden',
                  }}
                >🔽</a>
              </div>
              <Fragment key={`${year}`}>
                <h1 style={{ ...styles.label, ...styles.year }} key={`${year}-title`}>{year}</h1>
                {Object.keys(entities[year]).map(month => (
                  <Fragment key={`${year}-${month}`}>
                    <h1 style={{ ...styles.label, ...styles.month }} key={`${year}-${month}-title`}>
                      {new Date(year, month).toLocaleString('en-US', { month: 'long' })}
                    </h1>
                    <div style={styles.grid} key={`${year}-${month}-grid`}>
                      <Grid
                        items={Object.values(entities[year][month])}
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
              </Fragment>
            </Fragment>
          )}
        </div>
      </Fragment>
    )
  }
}

export default Upcoming
