import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import Row from 'components/Layout/Row'
import Persona from 'components/Entity/Persona'
import Film from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Releases from 'views/layout/Releases'
import tmdb from 'store/tmdb'
import database from 'store/database'
import Documents from 'shared/Documents'
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
    top: '2em',
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
  badge: {
    cursor: 'pointer',
    backgroundColor: theme.colors.shadows.grey,
    borderRadius: '5em',
    padding: '1em',
    margin: '0.5em 0',
    fontWeight: 800,
    color: theme.colors.white,
    textTransform: 'uppercase'
  },
  emoji: {
    margin: '0 0.75em 0 0',
  },
  informations: {
    width: '100%',
    display: 'flex',
    padding: '5em 13em 2em 3em',
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
    padding: '2em 0 0 0',
  },
  plot: {
    maxWidth: '50em',
    lineHeight: '1.5em',
    color: theme.colors.white,
    whiteSpace: 'pre-line',
    padding: '1em 1em 1em 0',
  },
  credits: {
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
    cursor: 'pointer',
  },
  empty: {
    color: theme.colors.white,
  }
}

export default class Movie extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      details: null,
      doc: false,
      unpinned: false,
      more: 'recommendations'
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
    this.handleMoreChange = this.handleMoreChange.bind(this)
    this.handleLookClick = this.handleLookClick.bind(this)
  }

  componentDidMount() {
    this.bootstrap()
  }

  componentDidUpdate(props) {
    if (this.props.match.params.id !== props.match.params.id) {
      this.bootstrap()
    }
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  async bootstrap() {
    try {
      this.setState({ doc: false, unpinned: false })
      const details = await tmdb.fetch(
        ['movie', this.props.match.params.id],
        { append_to_response: 'videos,credits,similar,recommendations,alternative_titles,release_dates' }
      )
      this.setState({ details })
      const db = await database.get()
      const query = db.movies.findOne().where('id').eq(details.id.toString())
      const doc = await query.exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
      this.subscription = query.$.subscribe(doc => this.setState({ doc: doc ? doc.toJSON() : null }))
      setTimeout(() => document.getElementById('movie').scrollIntoView(), 100)
    } catch(e) {
      this.props.history.push('/')
    }
  }

  async handleStateChange() {
    const db = await database.get()

    if (this.state.doc === false) {
      return
    }

    if (!this.state.doc || this.state.doc.state === 'ignored') {
      const doc = await db.movies.atomicUpsert(new Documents.Movie({ ...this.state.details, state: 'wished' }, global.config.region || localStorage.getItem('region')).normalize())
      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'wished') {
      const doc = await db.movies.atomicUpsert(new Documents.Movie({ ...this.state.details, state: 'archived' }, global.config.region || localStorage.getItem('region')).normalize())
      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'archived') {
      const doc = await db.movies.atomicUpsert(new Documents.Movie({ ...this.state.details, state: 'ignored' }, global.config.region || localStorage.getItem('region')).normalize())
      this.setState({ doc: doc.toJSON() })
    }
  }

  handleMoreChange() {
    this.setState({ more: { similar: 'recommendations', recommendations: 'similar' }[this.state.more] })
  }

  handleLookClick() {
    this.setState({ unpinned: false })
    setTimeout(() => this.setState({ unpinned: true }), 100)
  }

  render() {
    const { match, ...props } = this.props
    const { doc, details, loading, unpinned, more, ...state } = this.state

    const trailer = !details ? null : details.videos.results
      .filter(video => video.site === 'YouTube' && ['Trailer', 'Teaser'].includes(video.type))
      .pop()

    return (
      <Fragment>
        <Helmet>
          {details ? (
            <title>Sensorr - {details.title}{details.release_date && ` (${new Date(details.release_date).getFullYear()})`}</title>
          ) : (
            <title>Sensorr - Movie ({match.params.id})</title>
          )}
        </Helmet>
        <div id="movie" style={styles.element}>
          {details ? [
            <div
              key="details"
              style={{ ...styles.details, backgroundImage: `url(http://image.tmdb.org/t/p/original${details.backdrop_path})` }}
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
                  {doc === false && (
                    <div style={{ ...styles.badge, cursor: 'default' }}>
                      <span style={styles.emoji}>⌛</span>
                      Loading
                    </div>
                  )}
                  {(doc === null || (doc && doc.state === 'ignored')) && (
                    <div style={styles.badge} onClick={this.handleStateChange}>
                      <span style={styles.emoji}>🔕</span>
                      Ignored
                    </div>
                  )}
                  {doc && doc.state === 'wished' && (
                    <div style={styles.badge} onClick={this.handleStateChange}>
                      <span style={styles.emoji}>🍿</span>
                      Wished
                    </div>
                  )}
                  {doc && doc.state === 'archived' && (
                    <div style={styles.badge} onClick={this.handleStateChange}>
                      <span style={styles.emoji}>📼</span>
                      Archived
                    </div>
                  )}
                  <div style={styles.badge} onClick={this.handleLookClick}>
                    <span style={styles.emoji}>🔍</span>
                    Look
                  </div>
                </div>
              </div>
              <div style={styles.informations}>
                <div>
                  <img src={`http://image.tmdb.org/t/p/original${details.poster_path}`} style={styles.poster} />
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
                    <p style={styles.directors}>
                      🎥 &nbsp; {
                        details.credits.crew
                          .filter(credit => ['Director'].includes(credit.job))
                          .map(credit => <Link to={`/star/${credit.id}`} style={styles.link} key={credit.id}>{credit.name}</Link>)
                          .reduce((prev, curr) => [prev, ', ', curr])
                      }
                    </p>
                  )}
                  {!!details.tagline && (
                    <h3 style={styles.tagline}>{details.tagline}</h3>
                  )}
                  <p style={styles.plot}>{details.overview}</p>
                  <div style={styles.credits}>
                    <Row
                      items={details.credits.cast.slice(0, 10)}
                      child={Persona}
                      space={0}
                    />
                  </div>
                </div>
              </div>
              <div style={styles.more}>
                <Row
                  label={`${more.charAt(0).toUpperCase()}${more.slice(1)}`}
                  onClick={() => this.handleMoreChange()}
                  items={details[more].results}
                  style={styles.row}
                  child={Film}
                  empty={{ style: styles.empty }}
                />
              </div>
            </div>,
            (unpinned && (
              <Releases key="releases" movie={details} />
            ))
          ] : (
            <div style={styles.loading}>
              <Spinner />
            </div>
          )}
        </div>
      </Fragment>
    )
  }
}
