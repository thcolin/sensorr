import React, { PureComponent } from 'react'
import Row from 'components/Row'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import Releases from 'views/layout/Releases'
import TMDB from 'shared/services/TMDB'
import history from 'store/history'
import database from 'store/database'
import Doc from 'shared/Doc'
import theme from 'theme'

const styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payload: {
    position: 'relative',
    overflow: 'hidden',
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
    padding: '1em 0',
  },
  badges: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'end',
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
    display: 'flex',
    padding: '5em 13em 2em 3em',
  },
  poster: {
    maxWidth: '15em',
    margin: '0 3em'
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
  tagline: {
    color: theme.colors.white,
    fontWeight: 600,
    padding: '2em 0 0 0',
  },
  plot: {
    maxWidth: '50em',
    lineHeight: '1.5em',
    color: theme.colors.white,
    padding: '1em 1em 1em 0',
  },
  genres: {
    fontWeight: 600,
    color: theme.colors.white,
  },
  similar: {
    width: '100%',
    overflow: 'auto',
    fontSize: '0.75em',
  },
}

export default class Movie extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      payload: null,
      doc: null,
      unpinned: false,
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleLookClick = this.handleLookClick.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
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
      this.setState({ unpinned: false })
      const payload = await TMDB.fetch(['movie', this.props.match.params.id])
      this.setState({ payload })
      const db = await database.get()
      const doc = await db.movies.findOne().where('id').eq(payload.id.toString()).exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
      setTimeout(() => document.getElementById('movie').scrollIntoView(), 100)
    } catch(e) {
      history.push('/')
    }
  }

  async handleStateChange() {
    const db = await database.get()

    if (!this.state.doc) {
      const doc = await db.movies.atomicUpsert(new Doc({ ...this.state.payload, state: 'wished' }).normalize())
      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'wished') {
      const doc = await db.movies.atomicUpsert(new Doc({ ...this.state.payload, state: 'archived' }).normalize())
      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'archived') {
      await db.movies.findOne().where('id').eq(this.state.payload.id.toString()).remove()
      this.setState({ doc: null })
    }
  }

  handleLookClick() {
    this.setState({ unpinned: false })
    setTimeout(() => this.setState({ unpinned: true }), 100)
  }

  render() {
    const { doc, payload, loading, unpinned, ...state } = this.state

    return (
      <div id="movie" style={styles.element}>
        {payload ? [
          <div key="payload" style={{ ...styles.payload, backgroundImage: `url(http://image.tmdb.org/t/p/original${payload.backdrop_path})` }}>
            <div style={styles.metadata}>
              <h3 style={styles.popularity}>{payload.vote_average} {payload.vote_average < 5 ? '👎' : payload.vote_average < 8 ? '👍' : '🙏'}</h3>
              <h4 style={styles.runtime}>{payload.runtime} mins 🕙</h4>
              <div style={styles.badges}>
                {!doc && (
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
                <img src={`http://image.tmdb.org/t/p/original${payload.poster_path}`} style={styles.poster} />
              </div>
              <div>
                <h1 style={styles.title}>{payload.title}</h1>
                <h2 style={styles.subtitle}>
                  {payload.title !== payload.original_title && (
                    <span style={{ margin: '0 0.5em 0 0' }}>{payload.original_title}</span>
                  )}
                  <span>({new Date(payload.release_date).getFullYear()})</span>
                </h2>
                {!!payload.tagline && (
                  <h3 style={styles.tagline}>{payload.tagline}</h3>
                )}
                <p style={styles.plot}>{payload.overview}</p>
                <p style={styles.genres}>{payload.genres.map(genre => genre.name).join(', ')}</p>
              </div>
            </div>
            <div style={styles.similar}>
              <Row uri={['movie', this.props.match.params.id, 'similar']} />
            </div>
          </div>,
          (unpinned && (
            <Releases key="releases" movie={payload} />
          ))
        ] : (
          <div style={styles.loading}>
            <Spinner />
          </div>
        )}
      </div>
    )
  }
}
