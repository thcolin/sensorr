import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Row from 'components/Layout/Row'
import Film from 'components/Entity/Film'
import tmdb from 'store/tmdb'
import database from 'store/database'
import Documents from 'shared/Documents'
import theme from 'theme'

const styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    flex: 1,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
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
    alignItems: 'start',
    padding: '5em 3em 2em 3em',
  },
  poster: {
    width: '15em',
    height: '23em',
    overflow: 'hidden',
    margin: '0 3em',
    background: `${theme.colors.grey} url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAwIDI0MDAiPiAgPHBhdGggZmlsbD0iI2NjYyIgZD0iTTg4IDIyMTljLTI0LjcgMC00NS41LTguNS02Mi41LTI1LjVTMCAyMTU2IDAgMjEzMlYzMDdjMC0yNC43IDguNS00NS41IDI1LjUtNjIuNVM2My4zIDIxOSA4OCAyMTloMjIyNGMyNC43IDAgNDUuNSA4LjUgNjIuNSAyNS41czI1LjUgMzcuOCAyNS41IDYyLjV2MTgyNWMwIDI0LTguNSA0NC41LTI1LjUgNjEuNXMtMzcuOCAyNS41LTYyLjUgMjUuNUg4OHptMTEyLTMwMGw2MDYtNDAwYzI0LjcgMTAgNTYuNyAyMy4yIDk2IDM5LjVzMTA0LjUgNDYuMiAxOTUuNSA4OS41IDE2NC4yIDgyLjMgMjE5LjUgMTE3YzIyLjcgMTQuNyAzOS43IDIyIDUxIDIyIDEwIDAgMTUtNiAxNS0xOCAwLTIyLjctMTUtNTguMy00NS0xMDdzLTY4LTk3LjMtMTE0LTE0Ni04Ny43LTgxLTEyNS05N2MyOS4zLTI5LjMgNzQuMy03Ny4zIDEzNS0xNDRzMTEzLjctMTI2IDE1OS0xNzhsNjktNzggNS41LTUuNSAxNS41LTE0IDI0LTIwIDMwLTIxIDM2LTIwIDM5LTE0IDQxLTUuNWMxOCAwIDM3IDMuNSA1NyAxMC41czM3LjggMTUuMyA1My41IDI1IDMwIDE5LjMgNDMgMjkgMjMuMiAxOC4yIDMwLjUgMjUuNWwxMCAxMCAzNTMgMzU4VjQxOUgyMDB2MTUwMHptNDAwLTg4MWMtNjAgMC0xMTEuNS0yMS41LTE1NC41LTY0LjVTMzgxIDg3OSAzODEgODE5czIxLjUtMTExLjUgNjQuNS0xNTQuNVM1NDAgNjAwIDYwMCA2MDBjMzkuMyAwIDc1LjggOS44IDEwOS41IDI5LjVzNjAuMyA0Ni4zIDgwIDgwUzgxOSA3NzkuNyA4MTkgODE5YzAgNjAtMjEuNSAxMTEuNS02NC41IDE1NC41UzY2MCAxMDM4IDYwMCAxMDM4eiIvPjwvc3ZnPg==) no-repeat center`,
    backgroundSize: '50%',
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
  tagline: {
    color: theme.colors.white,
    fontWeight: 600,
    padding: '2em 0 0 0',
  },
  biography: {
    maxWidth: '50em',
    lineHeight: '1.5em',
    color: theme.colors.white,
    whiteSpace: 'pre-line',
    padding: '1em 1em 1em 0',
  },
  credits: {
    width: '100%',
    fontSize: '0.85em',
  },
  row: {
    color: theme.colors.white,
    cursor: 'pointer',
  }
}

export default class Star extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      doc: false,
      details: null,
      loading: false,
      err: null,
      order: {
        cast: 'vote_average',
        crew: 'vote_average',
      },
      sort: {
        release_date: {
          emoji: '📆',
          title: 'Ordered by release date',
          apply: (a, b) => new Date(b.release_date) - new Date(a.release_date),
        },
        vote_average: {
          emoji: '💯',
          title: 'Ordered by vote average',
          apply: (a, b) => (b.vote_average - (500 / b.vote_count)) - (a.vote_average - (500 / a.vote_count)),
        },
        popularity: {
          emoji: '📣',
          title: 'Ordered by popularity',
          apply: (a, b) => b.popularity - a.popularity,
        },
      }
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
    this.handleSortChange = this.handleSortChange.bind(this)
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
      const details = await tmdb.fetch(['person', this.props.match.params.id], { append_to_response: 'images,movie_credits' })
      this.setState({ loading: false, details })
      const db = await database.get()
      const doc = await db.stars.findOne().where('id').eq(details.id.toString()).exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
      setTimeout(() => document.getElementById('star').scrollIntoView(), 100)
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

  async handleStateChange() {
    const db = await database.get()
    let entity = this.state.details

    if (this.state.doc === false) {
      return
    }

    if (!this.state.doc || this.state.doc.state === 'ignored') {
      const doc = await db.stars.atomicUpsert(new Documents.Star({ ...entity, state: 'stalked' }).normalize())
      this.setState({ doc: doc.toJSON(), entity })
    } else if (this.state.doc.state === 'stalked') {
      const doc = await db.stars.atomicUpsert(new Documents.Star({ ...entity, state: 'ignored' }).normalize())
      this.setState({ doc: doc.toJSON(), entity })
    }
  }

  handleSortChange(key) {
    const keys = Object.keys(this.state.sort)

    this.setState({
      order: {
        ...this.state.order,
        [key]: keys[(keys.indexOf(this.state.order[key]) + 1) % keys.length],
      }
    })
  }

  render() {
    const { match, ...props } = this.props
    const { doc, details, loading, err, order, sort, ...state } = this.state

    return (
      <Fragment>
        <Helmet>
          {details ? (
            <title>Sensorr - {details.name}</title>
          ) : (
            <title>Sensorr - Star ({match.params.id})</title>
          )}
        </Helmet>
        <div id="star" style={styles.element}>
          {details ? (
            <div style={{
              ...styles.container,
              ...(details.images.profiles.length ? {
                backgroundImage: `url(http://image.tmdb.org/t/p/original${
                  (details.images.profiles.sort((a, b) => a.width - b.width).slice(-1).pop() || {}).file_path
                })`,
              } : {}),
            }}>
              <div style={styles.metadata}>
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
                  {doc && doc.state === 'stalked' && (
                    <div style={styles.badge} onClick={this.handleStateChange}>
                      <span style={styles.emoji}>🔔</span>
                      Following
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.informations}>
                <div style={styles.poster}>
                  {details.profile_path && (
                    <img src={`http://image.tmdb.org/t/p/original${details.profile_path}`} height="100%" />
                  )}
                </div>
                <div style={styles.wrapper}>
                  <h1 style={styles.title}>{details.name}</h1>
                  <h2 style={styles.subtitle}>{details.place_of_birthday} ({new Date(details.birthday).getFullYear()})</h2>
                  <p style={styles.biography}>{details.biography}</p>
                </div>
              </div>
              {!!details.movie_credits.cast.length && (
                <div style={styles.credits}>
                  <Row
                    label={`Casting - ${sort[order.cast].emoji}`}
                    title={sort[order.cast].title}
                    onClick={() => this.handleSortChange('cast')}
                    items={details.movie_credits.cast.filter((a, index, self) => index === self.findIndex(b => a.id === b.id)).sort(sort[order.cast].apply)}
                    child={Film}
                    style={styles.row}
                  />
                </div>
              )}
              {!!details.movie_credits.crew.length && (
                <div style={styles.credits}>
                  <Row
                    label={`Crew - ${sort[order.crew].emoji}`}
                    title={sort[order.crew].title}
                    onClick={() => this.handleSortChange('crew')}
                    items={details.movie_credits.crew.filter((a, index, self) => index === self.findIndex(b => a.id === b.id)).sort(sort[order.crew].apply)}
                    child={Film}
                    style={styles.row}
                  />
                </div>
              )}
            </div>
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
