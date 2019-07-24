import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Row, { Label } from 'components/Layout/Row'
import { State } from 'components/Entity/Persona'
import Film from 'components/Entity/Film'
import tmdb from 'store/tmdb'
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
  },
  empty: {
    color: theme.colors.white,
  },
}

export default class Star extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      details: null,
      loading: false,
      err: null,
      job: '',
      order: {
        cast: 'vote_average',
        crew: 'vote_average',
      },
      sort: {
        release_date: {
          emoji: '📆',
          title: 'currently sorted by release date',
          apply: (a, b) => new Date(b.release_date) - new Date(a.release_date),
        },
        vote_average: {
          emoji: '💯',
          title: 'currently sorted by vote average',
          apply: (a, b) => (b.vote_average - (500 / b.vote_count)) - (a.vote_average - (500 / a.vote_count)),
        },
        popularity: {
          emoji: '📣',
          title: 'currently sorted by popularity',
          apply: (a, b) => b.popularity - a.popularity,
        },
      },
    }

    this.bootstrap = this.bootstrap.bind(this)
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

      if (details.adult && !tmdb.adult) {
        throw { status_code: -1, status_message: 'Adult content disabled' }
      }

      this.setState({ loading: false, details })
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
    const { details, loading, err, job, order, sort, ...state } = this.state

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
                  <State entity={details} compact={false} />
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
                    strict={false}
                    label={(
                      <Label
                        id="star-cast"
                        compact={true}
                        actions={(
                          <span
                            style={{ cursor: 'pointer' }}
                            title={`Sort (${sort[order.cast].title})`}
                            onClick={() => this.handleSortChange('cast')}
                          >
                            {sort[order.cast].emoji}
                          </span>
                        )}
                      >
                        Casting
                      </Label>
                    )}
                    items={details.movie_credits.cast
                      .filter((a, index, self) => index === self.findIndex(b => a.id === b.id))
                      .sort(sort[order.cast].apply)
                    }
                    child={Film}
                    style={styles.row}
                    empty={{ style: styles.empty }}
                  />
                </div>
              )}
              {!!details.movie_credits.crew.length && (
                <div style={styles.credits}>
                  <Row
                    strict={false}
                    label={(
                      <Label
                        id="star-crew"
                        title={`Filter movies by job`}
                        compact={true}
                        value={job}
                        onChange={(value) => this.setState({ job: value })}
                        options={[{ value: '', label: 'All' }]
                          .concat(details.movie_credits.crew.map(credit => ({ value: credit.job, label: credit.job })))
                          .filter((a, index, self) => index === self.findIndex(b => a.value === b.value))
                        }
                        actions={(
                          <span
                            style={{ cursor: 'pointer' }}
                            title={`Sort (${sort[order.crew].title})`}
                            onClick={() => this.handleSortChange('crew')}
                          >
                            {sort[order.crew].emoji}
                          </span>
                        )}
                      >
                        <span>Crew</span>
                        <span> </span>
                        <span style={{ fontSize: 'smaller' }}>({job || 'All'})</span>
                      </Label>
                    )}
                    items={details.movie_credits.crew
                      .filter(credit => !job || credit.job === job)
                      .filter((a, index, self) => index === self.findIndex(b => a.id === b.id))
                      .sort(sort[order.crew].apply)
                    }
                    child={Film}
                    style={styles.row}
                    empty={{ style: styles.empty }}
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
