import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Doc from 'shared/Doc'
import { withToastManager } from 'react-toast-notifications'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import filesize from 'filesize'
import sensorr from 'store/sensorr'
import theme from 'theme'

const styles = {
  element: {

  },
  table: {
    width: '100%',
  },
  thead: {
    zIndex: 1,
    position: 'sticky',
    top: '-1px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  th: {
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
    backgroundColor: theme.colors.grey,
    color: theme.colors.secondary,
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '1em',
  },
  td: {
    verticalAlign: 'middle',
    fontFamily: theme.fonts.secondary,
    padding: '1em',
    textAlign: 'center',
    borderBottom: `1px solid ${theme.colors.grey}`
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
      descending: false,
      filter: sensorr.config.filter,
    }

    this.handleSortChange = this.handleSortChange.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleGrabClick = this.handleGrabClick.bind(this)
  }

  componentDidMount() {
    setTimeout(() => document.getElementById('releases').scrollIntoView(), 100)

    sensorr.look(new Doc(this.props.movie).normalize()).subscribe(
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
    let loading = null

    toastManager.add((
      <span>Trying to grab release <strong>{release.title}</strong>...</span>
    ), {
      appearance: 'info',
      autoDismiss: true,
    }, id => loading = id)

    fetch(`/grab`, {
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
              <span>Release <strong>{release.title}</strong> grabbed to <strong>{body.filename}</strong></span>
            ), { appearance: 'success', autoDismiss: true, })
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
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('title')}>Title</th>
              <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('site')}>Source</th>
              <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('peers')}>Peers</th>
              <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('seeders')}>Seeders</th>
              <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('size')}>Size</th>
              <th style={styles.th}>Grab</th>
            </tr>
            <tr>
              <td colSpan={6}>
                <input
                  type="text"
                  defaultValue={filter}
                  onKeyUp={this.handleQueryChange}
                  style={styles.input}
                  placeholder="Filter..."
                />
              </td>
            </tr>
          </thead>
          <tbody>
            {!loading && !releases.filter(sensorr.filter(filter)).length ? (
              <tr>
                <td colSpan={6}>
                  <Empty />
                </td>
              </tr>
            ) : (
              releases.filter(sensorr.filter(filter)).sort(sensorr.sort(sort, descending)).map((release, index) => (
                <tr key={index} style={styles.tr}>
                  <td
                    title={release.valid ? `Score : ${release.score}` : release.reason}
                    style={{ ...styles.td, textAlign: 'left', opacity: [1, 0.5, 0.25][release.warning] }}
                  >
                    {release.title}
                  </td>
                  <td style={styles.td}>{release.site}</td>
                  <td style={styles.td}>{release.peers}</td>
                  <td style={styles.td}>{release.seeders}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{filesize(release.size)}</td>
                  <td style={{ ...styles.td, padding: 0 }}>
                    <a
                      href={release.link}
                      style={styles.grab}
                      target="_blank"
                      onClick={(e) => {
                        e.preventDefault()
                        this.handleGrabClick(release)
                      }}
                    >
                      🎟
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
