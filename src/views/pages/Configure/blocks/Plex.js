import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { withToastManager } from 'react-toast-notifications'
import sensorr from 'store/sensorr'
import { styles } from '../index.js'
import theme from 'theme'

const placeholder = {
  plex: 'http://192.168.0.42:32400',
}

class Plex extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(key, value) {
    this.props.handleChange('plex', { ...this.props.values.plex, [key]: value })
  }

  handleSubmit(payload = {}) {
    const { toastManager } = this.props

    this.setState({ loading: true })

    fetch('/api/plex', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${new Buffer(`${sensorr.config.auth.username}:${sensorr.config.auth.password}`).toString('base64')}`,
      }),
      body: JSON.stringify(payload)
    })
    .then(res => {
      try {
        res.json().then(body => {
          if (res.ok) {
            toastManager.add(
              body.plex.pin.code ?
                <span>Sensorr registred on your Plex server, please fill PIN code <strong>{body.plex.pin.code}</strong> on <strong>Plex</strong> website that comes next</span> :
                <span>Sensorr is now <strong>unregistred</strong> on your <strong>Plex</strong> server</span>
            , { appearance: 'success', autoDismiss: true, })

            this.props.handleChange('plex', body.plex)

            if (body.plex.pin.code) {
              setTimeout(() => window.open(`https://plex.tv/pin?code=${body.plex.pin.code}`), 5000)
            }
          } else if (body.err) {
            toastManager.add((
              <span>Something went wrong during Sensorr registration on your Plex server : <strong>{body.err}</strong></span>
            ), { appearance: 'error', autoDismiss: true, })
          }
        })
      } catch(e) {
        toastManager.add((
          <span>Unexpected error during Sensorr registration on your Plex server : <strong>{res.statusText}</strong></span>
        ), { appearance: 'error', autoDismiss: true, })
      } finally {
        this.setState({ loading: false })
      }
    })
  }

  render() {
    const { loading, ...state } = this.state
    const { values, handleChange, ...props } = this.props

    const status = loading ? 'loading' : props.status
    const action = {
      loading: false,
      off: () => this.handleSubmit({ url: values.plex.url }),
      waiting: false,
      invalid: () => this.handleSubmit({ url: values.plex.url }),
      error: () => this.handleSubmit({ url: values.plex.url }),
      authorized: () => this.handleSubmit(),
    }[status]

    return (
      <div style={styles.section}>
        <h1 style={styles.title}>Plex</h1>
        <p style={{ ...styles.paragraph, flex: 1, }}>
          <a href="https://www.plex.tv/" target="_blank" style={styles.link}>Plex</a> user ? You can connect your <strong>Sensorr</strong> instance to your <strong>Plex</strong> server and never inadvertently download a movie you already own !
          <br/>
          All movies from your <strong>Plex</strong> server will be considered as <code style={styles.code}>📼 archived</code> on <strong>Sensorr</strong>.
        </p>
        <div style={styles.column}>
          <span
            title={`Status: ${status}`}
            style={{ fontSize: '1.5em', display: 'flex', alignItems: 'center', flexBasis: '2em', margin: '0 0.25em 0 0', }}
          >
            {{
              unknown: '⌛',
              loading: '⌛',
              off: '🚫',
              waiting: '📲',
              invalid: '⛔',
              error: '⛔',
              authorized: '✅',
            }[status]}
          </span>
          <input
            type="text"
            placeholder={placeholder.plex}
            style={styles.input}
            defaultValue={(values.plex || {}).url}
            onChange={e => this.handleChange('url', e.target.value)}
          />
        </div>
        <button
          type="button"
          style={{
            ...styles.button,
            cursor: ['unknown', 'loading', 'waiting'].includes(status) ? 'default' : 'pointer',
            ...(!['unknown', 'authorized', 'loading', 'waiting'].includes(status) ? {} : {
              backgroundColor: ({
                authorized: theme.colors.gray,
                loading: theme.colors.grey,
                unknown: theme.colors.grey,
                waiting: theme.colors.grey
              })[status],
            })
          }}
          disabled={!action}
          onClick={action || (() => {})}
        >
          {{
            unknown: 'Loading',
            loading: 'Loading',
            off: 'Connect',
            waiting: 'Enter PIN',
            invalid: 'Re-connect',
            error: 'Re-connect',
            authorized: 'Unregister',
          }[status]}
        </button>
        {['waiting'].includes(status) && (
          <p style={{ margin: '1em 0 0 0' }}>
            <em>Just go to </em>
            <a
              href={`https://plex.tv/pin?code=${((values.plex || {}).pin || {}).code}`}
              style={styles.link}
              target="_blank"
            >
              https://plex.tv/pin
            </a>
            <em> and enter PIN code </em>
            <code style={styles.code}>{((values.plex || {}).pin || {}).code}</code>.
          </p>
        )}
      </div>
    )
  }
}

export default connect(
  (state) => ({
    status: state.plex.status || 'loading',
  }),
  () => ({}),
)(
  withToastManager(Plex)
)
