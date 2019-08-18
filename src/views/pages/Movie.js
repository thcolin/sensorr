import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { Link, Route } from 'react-router-dom'
import Row from 'components/Layout/Row'
import Persona from 'components/Entity/Persona'
import Film, { State } from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Badge from 'components/Badge'
import Releases from 'views/layout/Releases'
import tmdb from 'store/tmdb'
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
  runtime: {
    fontFamily: theme.fonts.secondary,
    fontSize: '1em',
    fontWeight: 600,
    color: theme.colors.white,
    padding: '1em 0 0',
  },
  preview: {
    fontFamily: theme.fonts.secondary,
    fontSize: '1em',
    fontWeight: 600,
    color: theme.colors.white,
    padding: '1em 0 0',
  },
  badges: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: '1em 0 0',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
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
    padding: '1em 0 0 0',
  },
  directors: {
    fontWeight: 600,
    color: theme.colors.white,
    padding: '1em 0 0 0',
  },
  tagline: {
    color: theme.colors.white,
    fontWeight: 600,
    margin: '0 0 1em',
  },
  plot: {
    maxWidth: '50em',
    lineHeight: '1.5em',
    color: theme.colors.white,
    whiteSpace: 'pre-line',
    padding: '0 1em 1em 0',
  },
  crew: {
    margin: '1em 0 -2em',
    overflow: 'visible',
    fontSize: '0.5em',
  },
  cast: {
    margin: '3em 0 0',
    overflow: 'visible',
    fontSize: '0.5em',
  },
  more: {
    width: '100%',
    fontSize: '0.75em',
  },
  row: {
    color: theme.colors.white,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  empty: {
    color: theme.colors.white,
  },
  link: {
    textDecoration: 'none',
  }
}

export default class Movie extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      details: null,
      more: 'recommendations',
      err: null,
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleMoreChange = this.handleMoreChange.bind(this)
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
        ['movie', this.props.match.params.id],
        { append_to_response: 'videos,credits,similar,recommendations,alternative_titles,release_dates' }
      )

      if (details.adult && !tmdb.adult) {
        throw { status_code: -1, status_message: 'Adult content disabled' }
      }

      this.setState({ loading: false, details })
      setTimeout(() => document.getElementById('movie').scrollIntoView(), 100)
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

  handleMoreChange() {
    this.setState({ more: { similar: 'recommendations', recommendations: 'similar' }[this.state.more] })
  }

  render() {
    const { match, ...props } = this.props
    const { details, loading, err, more, ...state } = this.state

    console.log(details)

    const trailer = !details ? null : details.videos.results
      .filter(video => video.site === 'YouTube' && ['Trailer', 'Teaser'].includes(video.type))
      .pop()

    return (
      <Fragment>
        <Helmet>
          {details ? (
            <title>Sensorr - {details.title}{(details.release_date && ` (${new Date(details.release_date).getFullYear()})`) || ''}{(!!match.params.releases && ` - 🔍`) || ''}</title>
          ) : (
            <title>Sensorr - Movie ({match.params.id})</title>
          )}
        </Helmet>
        <div id="movie" style={styles.element}>
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
                  <h4 style={styles.runtime}>{details.runtime} mins 🕙</h4>
                  {trailer && (
                    <a href={`https://youtu.be/${trailer.key}`} target="_blank" style={{ textDecoration: 'none' }}>
                      <h4 style={styles.preview}>Preview 🎬</h4>
                    </a>
                  )}
                  <div style={styles.badges}>
                    <State entity={details} compact={false} />
                    <Link to={`/movie/${details.id}/releases`} replace style={styles.link}>
                      <Badge emoji="🔍" label="Look" />
                    </Link>
                  </div>
                </div>
                <div style={styles.informations}>
                  <div>
                    <img src={`https://image.tmdb.org/t/p/original${details.poster_path}`} style={styles.poster} />
                  </div>
                  <div style={styles.wrapper}>
                    <h1 style={styles.title}>{details.title}</h1>
                    <h2 style={styles.subtitle}>
                      {details.title !== details.original_title && (
                        <span style={{ margin: '0 0.5em 0 0' }}>{details.original_title}</span>
                      )}
                      {details.release_date && (
                        <span title={new Date(details.release_date).toLocaleDateString()}>
                          ({new Date(details.release_date).getFullYear()})
                        </span>
                      )}
                    </h2>
                    <p style={styles.genres}>{details.genres.map(genre => genre.name).join(', ')}</p>
                    {!!details.credits.crew.filter(credit => ['Director'].includes(credit.job)).length && (
                      <div style={styles.crew}>
                        <Row
                          items={details.credits.crew.filter(credit => ['Director'].includes(credit.job))}
                          child={Persona}
                          space={0}
                          strict={false}
                          style={styles.row}
                          empty={{ style: styles.empty }}
                        />
                      </div>
                    )}
                    {!!details.tagline && (
                      <h3 style={styles.tagline}>{details.tagline}</h3>
                    )}
                    <p style={styles.plot}>{details.overview}</p>
                    <div style={styles.cast}>
                      <Row
                        items={details.credits.cast.slice(0, 10)}
                        child={Persona}
                        space={0}
                        strict={false}
                        style={styles.row}
                        empty={{ style: styles.empty }}
                      />
                    </div>
                  </div>
                </div>
                <div style={styles.more}>
                  {details.belongs_to_collection && (
                    <Row
                      label={(
                        <Link to={`/collection/${details.belongs_to_collection.id}`} style={styles.row}>
                          {`${details.belongs_to_collection.name} - 📀`}
                        </Link>
                      )}
                      uri={['collection', details.belongs_to_collection.id]}
                      transform={(res) => res.parts.sort((a, b) => new Date(a.release_date) - new Date(b.release_date))}
                      style={styles.row}
                      child={Film}
                    />
                  )}
                  <Row
                    label={`${more.charAt(0).toUpperCase()}${more.slice(1)} - ${{ 'similar': '👯', 'recommendations': '💬' }[more]}`}
                    onClick={() => this.handleMoreChange()}
                    items={details[more].results}
                    style={styles.row}
                    child={Film}
                    empty={{ style: styles.empty }}
                  />
                </div>
              </div>
              <Route
                path={`/movie/${details.id}/releases`}
                exact={true}
                component={() => (
                  <Releases key="releases" movie={details} />
                )}
              />
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
