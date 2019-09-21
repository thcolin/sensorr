import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import List from 'components/Layout/List'
import Film, { State } from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import tmdb from 'store/tmdb'
import { GENRES } from 'shared/services/TMDB'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  link: {
    color: theme.colors.white,
  },
  loading: {
    flex: 1,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    boxShadow: `inset 0 0 0 100em ${theme.colors.shadows.black}`,
  },
  metadata: {
    position: 'absolute',
    right: '2em',
    top: '6em',
    textAlign: 'right',
  },
  popularity: {
    fontFamily: theme.fonts.secondary,
    fontSize: '2em',
    fontWeight: 800,
    color: theme.colors.white,
  },
  preview: {
    fontFamily: theme.fonts.secondary,
    fontSize: '1em',
    fontWeight: 600,
    color: theme.colors.white,
    padding: '1em 0 0',
  },
  informations: {
    width: '100%',
    display: 'flex',
    padding: '8em 13em 2em 3em',
  },
  poster: {
    maxWidth: '15em',
    margin: '0 3em'
  },
  wrapper: {
    flex: 1,
  },
  title: {
    fontSize: '4em',
    fontWeight: 800,
    color: theme.colors.white,
    padding: '0 0 0.25em',
  },
  subtitle: {
    fontSize: '1.5em',
    fontWeight: 600,
    color: theme.colors.white,
  },
  genres: {
    fontWeight: 600,
    color: theme.colors.white,
    padding: '1em 0 2em 0',
  },
  plot: {
    maxWidth: '50em',
    lineHeight: '1.5em',
    color: theme.colors.white,
    whiteSpace: 'pre-line',
    padding: '0 1em 1em 0',
  },
  more: {
    width: '100%',
    fontSize: '0.75em',
  },
  row: {
    color: theme.colors.white,
  },
  empty: {
    color: theme.colors.white,
  },
  link: {
    textDecoration: 'none',
  }
}

export default class Collection extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      details: null,
      err: null,
    }

    this.bootstrap = this.bootstrap.bind(this)
  }

  componentDidMount() {
    this.bootstrap()
  }

  componentDidUpdate(props) {
    if (this.props.match.params.id !== props.match.params.id) {
      this.bootstrap()
    }
  }

  async bootstrap() {
    try {
      const details = await tmdb.fetch(
        ['collection', this.props.match.params.id]
      )

      details.popularity = details.parts.reduce((popularity, part) => popularity + part.popularity, 0) / details.parts.length
      details.vote_average = details.parts.reduce((vote_average, part) => vote_average + part.vote_average, 0) / details.parts.length
      details.release_dates = details.parts.map(part => part.release_date).sort((a, b) => new Date(a) - new Date(b))
        .reduce((acc, release_date, index, releases_dates) => [releases_dates[0], releases_dates[releases_dates.length - 1]])

      if (details.adult && !tmdb.adult) {
        throw { status_code: -1, status_message: 'Adult content disabled' }
      }

      this.setState({ loading: false, details })
      // setTimeout(() => document.getElementById('collection').scrollIntoView(), 100)
    } catch(err) {
      if (err.status_code) {
        this.setState({
          loading: false,
          err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
        })
      } else {
        console.warn(err)
        this.props.history.push('/')
      }
    }
  }

  render() {
    const { match, ...props } = this.props
    const { details, loading, err, ...state } = this.state

    return (
      <Fragment>
        <Helmet>
          {details ? (
            <title>Sensorr - {details.name}{(details.release_date && ` (${new Date(details.release_date).getFullYear()})`) || ''}</title>
          ) : (
            <title>Sensorr - Collection ({match.params.id})</title>
          )}
        </Helmet>
        <div id="collection" style={styles.element}>
          {details ? (
            <>
              <div
                key="details"
                style={{ ...styles.details, backgroundImage: `url(https://image.tmdb.org/t/p/original${details.backdrop_path})` }}
              >
                <div style={styles.metadata}>
                  <h3 style={styles.popularity}>
                    <span>{details.vote_average.toFixed(1)}</span>
                    <span> </span>
                    <span>{details.vote_average === 0 ? '🤷' : details.vote_average < 5 ? '👎' : details.vote_average < 8 ? '👍' : '🙏'}</span>
                  </h3>
                </div>
                <div style={styles.informations}>
                  <div>
                    <img src={`https://image.tmdb.org/t/p/original${details.poster_path}`} style={styles.poster} />
                  </div>
                  <div style={styles.wrapper}>
                    <h1 style={styles.title}>{details.name}</h1>
                    <h2 style={styles.subtitle}>
                      <span>
                        ({new Date(details.release_dates[0]).getFullYear()} - {new Date(details.release_dates[1]).getFullYear()})
                      </span>
                    </h2>
                    <p style={styles.genres}>
                      {[...new Set(
                        details.parts.map(part => part.genre_ids).reduce((acc, genres) => [...acc, ...genres], []))
                      ].map(id => GENRES[id]).join(', ')}
                    </p>
                    <p style={styles.plot}>{details.overview}</p>
                  </div>
                </div>
                <div style={styles.more}>
                  <List
                    label="Parts - 📀"
                    items={details.parts}
                    style={styles.row}
                    child={Film}
                    empty={{ style: styles.empty }}
                  />
                </div>
              </div>
            </>
          ) : loading ? (
            <div style={styles.loading}>
              <Spinner />
            </div>
          ) : (
            <Empty
              title={err ? 'Oh ! You came across a bug...' : null}
              emoji={err ? '🐛' : null}
              subtitle={err ? err : null}
            />
          )}
        </div>
      </Fragment>
    )
  }
}
