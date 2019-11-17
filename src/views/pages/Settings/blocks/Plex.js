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
      <div css={styles.section}>
        <h1 css={styles.title}>Plex</h1>
        <p css={styles.paragraph} style={{ flex: 1, }}>
          <a href="https://www.plex.tv/" target="_blank" css={styles.link}>Plex</a> user ? You can pairwise your <strong>Sensorr</strong> instance to your <strong>Plex</strong> server and never inadvertently download a movie you already own !
          <br/>
          <br/>
          <strong>Plex</strong> will be the single source of truth for your movies <strong>library</strong> :
          <br/>
          <ul css={styles.list} style={{ padding: '0 0 0 0.5em' }}>
            <li>All movies available on your <strong>Plex</strong> server will be considered as <code css={styles.code}>📼 archived</code></li>
            <li>Movies considered as <code css={styles.code}>📼 archived</code> unavailbe on your <strong>Plex</strong> server will be considerd as <code css={styles.code}>💊 missing</code></li>
          </ul>
          <br/>
        </p>
        <div css={styles.column}>
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
            css={styles.input}
            defaultValue={(values.plex || {}).url}
            onChange={e => this.handleChange('url', e.target.value)}
          />
        </div>
        <button
          type="button"
          css={styles.button}
          style={{
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
              css={styles.link}
              target="_blank"
            >
              https://plex.tv/pin
            </a>
            <em> and enter PIN code </em>
            <code css={styles.code}>{((values.plex || {}).pin || {}).code}</code>.
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
