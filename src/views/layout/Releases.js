import React, { PureComponent } from 'react'
import { StyleSheet, css } from 'aphrodite'
import PropTypes from 'prop-types'
import { Movie } from 'shared/Documents'
import { withToastManager } from 'react-toast-notifications'
import Clear from 'icons/Clear'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import filesize from 'filesize'
import sensorr from 'store/sensorr'
import database from 'store/database'
import theme from 'theme'

const suits = StyleSheet.create({
  striped: {
    backgroundColor: 'hsl(0, 0%, 100%)',
    ':nth-child(2n)': {
      backgroundColor: 'hsl(0, 0%, 98%)',
    }
  }
})

const styles = {
  element: {

  },
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  search: {
    position: 'sticky',
    top: '-1px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    fontWeight: 800,
    textTransform: 'uppercase',
    zIndex: 1,
  },
  column: {
    padding: '1em',
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.grey,
    border: 'none',
    padding: 0,
    margin: 0,
    fontSize: '1.25em',
    padding: '0.75em 1em',
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
  },
  filter: {
    position: 'relative',
    backgroundColor: theme.colors.grey,
    color: theme.colors.secondary,
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '1em',
  },
  clear: {
    position: 'absolute',
    right: '1.25em',
    alignSelf: 'center',
    width: '1.25em',
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 0,
    flexWrap: 'wrap',
    width: '100%',
  },
  rows: {
    title: {
      width: '60%',
    },
    site: {
      width: '12%',
    },
    peers: {
      width: '6%',
    },
    seeders: {
      width: '8%',
    },
    size: {
      width: '8%',
    },
    grab: {
      width: '6%',
    },
  },
  cell: {
    fontSize: '0.9em',
    textAlign: 'center',
    fontFamily: theme.fonts.secondary,
    padding: '0.8em',
    borderBottom: `1px solid ${theme.colors.grey}`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  link: {
    color: theme.colors.primary
  },
  grab: {
    cursor: 'pointer',
    fontSize: '2em',
    textDecoration: 'none',
  },
}

class Releases extends PureComponent {
  static propTypes = {
    movie: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      releases: [],
      loading: true,
      sort: sensorr.config.sort,
      descending: sensorr.config.descending,
      filter: sensorr.config.filter,
    }

    this.handleSortChange = this.handleSortChange.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleGrabClick = this.handleGrabClick.bind(this)
  }

  componentDidMount() {
    setTimeout(() => document.getElementById('releases').scrollIntoView(), 100)

    sensorr.look(new Movie(this.props.movie, global.config.region || localStorage.getItem('region')).normalize()).subscribe(
      (releases) => this.setState({ releases }),
      (err) => {
        this.setState({ loading: false })
        console.warn(err)
      },
      () => {
        this.setState({ loading: false })
        setTimeout(() => document.getElementById('releases').scrollIntoView(), 100)
      }
    )
  }

  handleQueryChange(e) {
    this.setState({ filter: e.target.value, })
  }

  handleSortChange(sort) {
    this.setState({
      sort,
      descending: sort === this.state.sort ? !this.state.descending : this.state.descending,
    })
  }

  handleGrabClick(release) {
    const { toastManager } = this.props

    toastManager.add((
      <span>Trying to grab release <strong>{release.title}</strong>...</span>
    ), { appearance: 'info', autoDismiss: true, })

    fetch('/api/grab', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${new Buffer(`${sensorr.config.auth.username}:${sensorr.config.auth.password}`).toString('base64')}`,
      }),
      body: JSON.stringify({ release }),
    })
    .then(res => {
      try {
        res.json().then(body => {
          if (res.ok) {
            toastManager.add((
              <span>Release <strong>{release.title}</strong> grabbed to <strong>{sensorr.config.blackhole}</strong></span>
            ), { appearance: 'success', autoDismiss: true, })

            database.get().then(db => db.movies.atomicUpsert(new Movie({
              ...this.props.movie,
              state: 'archived'
            }, global.config.region || localStorage.getItem('region')).normalize()))
          } else {
            toastManager.add((
              <span>Something went wrong during <strong>{release.title}</strong> grabing : <strong>{body.reason}</strong></span>
            ), { appearance: 'error', autoDismiss: true, })
          }
        })
      } catch(e) {
        toastManager.add((
          <span>Unexpected error during <strong>{release.title}</strong> grabing : <strong>{res.statusText}</strong></span>
        ), { appearance: 'error', autoDismiss: true, })
      }
    })
  }

  render() {
    const { loading, sort, descending, releases, filter, ...state } = this.state

    return (
      <div key="releases" id="releases" style={styles.element}>
        <div style={styles.container}>
          <div style={styles.search}>
            <div style={styles.row}>
              <div
                style={{ ...styles.column, ...styles.rows.title, cursor: 'pointer', }}
                onClick={() => this.handleSortChange('title')}
              >
                Title
              </div>
              <div
                style={{ ...styles.column, ...styles.rows.site, cursor: 'pointer', textAlign: 'center', }}
                onClick={() => this.handleSortChange('site')}
              >
                Source
              </div>
              <div
                style={{ ...styles.column, ...styles.rows.peers, cursor: 'pointer', textAlign: 'center', }}
                onClick={() => this.handleSortChange('peers')}
              >
                Peers
              </div>
              <div
                style={{ ...styles.column, ...styles.rows.seeders, cursor: 'pointer', textAlign: 'center', }}
                onClick={() => this.handleSortChange('seeders')}
              >
                Seeders
              </div>
              <div
                style={{ ...styles.column, ...styles.rows.size, cursor: 'pointer', textAlign: 'center', }}
                onClick={() => this.handleSortChange('size')}
              >
                Size
              </div>
              <div style={{ ...styles.column, ...styles.rows.grab, textAlign: 'center', }}>
                Grab
              </div>
            </div>
            <div style={styles.row}>
              <input
                type="text"
                value={filter}
                onChange={this.handleQueryChange}
                style={styles.input}
                placeholder="Filter..."
              />
              <span style={styles.clear} onClick={() => this.handleQueryChange({ target: { value: !!filter ? '' : sensorr.config.filter } })}>
                {!!filter ? (
                  <Clear />
                ) : (
                  <span style={{ fontSize: '1.5em' }}>🔙</span>
                )}
              </span>
            </div>
          </div>
          {!loading && !releases.filter(sensorr.filter(filter)).length ? (
            <div style={styles.row}>
              <Empty />
            </div>
          ) : (
            releases.filter(sensorr.filter(filter)).sort(sensorr.sort(sort, descending)).map((release, index) => (
              <div key={index} className={css(suits.striped)} style={styles.row}>
                <div
                  title={release.valid ? `Score : ${release.score}` : release.reason}
                  style={{
                    ...styles.cell,
                    ...styles.rows.title,
                    flexGrow: 1,
                    textAlign: 'left',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span style={{ opacity: [1, 0.5, 0.25][release.warning] }}>{release.title}</span>
                </div>
                <div style={{ ...styles.cell, ...styles.rows.site, }}><a href={release.guid} style={styles.link}>{release.site}</a></div>
                <div style={{ ...styles.cell, ...styles.rows.peers, }}>{release.peers}</div>
                <div style={{ ...styles.cell, ...styles.rows.seeders, }}>{release.seeders}</div>
                <div style={{ ...styles.cell, ...styles.rows.size, textAlign: 'right', }}>{filesize(release.size)}</div>
                <div style={{ ...styles.cell, ...styles.rows.grab, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, }}>
                  <a
                    href={`/proxy?url=${window.btoa(release.link)}`}
                    style={styles.grab}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault()
                      this.handleGrabClick(release)
                    }}
                  >
                    🎟
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
        {loading && (
          <div style={styles.loading}>
            <Spinner />
          </div>
        )}
      </div>
    )
  }
}

export default withToastManager(Releases)
