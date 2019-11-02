import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { withToastManager } from 'react-toast-notifications'
import { NavLink } from 'react-router-dom'
import { keyframes } from '@emotion/core'
import sensorr from 'store/sensorr'
import nanobounce from 'nanobounce'
import theme from 'theme'

const blink = keyframes`
  0% {
    visibility: visible;
  }
  50% {
    visibility: hidden;
  }
  75% {
    visibility: hidden;
  }
  100% {
    visibility: visible;
  }
`

export const Indicator = ({ ongoing, loading, ...props }) => (
  <span
    css={[
      Indicator.styles.element,
      ongoing ? Indicator.styles.ongoing : loading ? Indicator.styles.loading : Indicator.styles.hidden,
    ]}
  />
)

Indicator.styles = {
  element: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '0.25em',
    width: '0.25em',
    borderRadius: '50%',
    animation: `1.5s linear infinite ${blink}`,
  },
  ongoing: {
    backgroundColor: theme.colors.wrong,
  },
  loading: {
    backgroundColor: theme.colors.gray,
  },
  hidden: {
    display: 'none',
  }
}

class Recording extends PureComponent {
  static styles = {
    element: {
      position: 'relative',
      padding: '0.25em 0 0.25em 0.3125em',
    },
    link: {
      ...theme.resets.a,
      color: 'black',
      opacity: 0.5,
    },
    button: {
      ...theme.resets.button,
      color: 'black',
      '&:disabled': {
        opacity: 0.5,
      }
    },
  }

  constructor(props) {
    super(props)

    this.state = {
      loading: false,
    }

    this.triggerJob = this.triggerJob.bind(this)
    this.debounce = nanobounce(1000)
  }

  triggerJob(type) {
    const { toastManager } = this.props

    this.setState({ loading: true })

    fetch('/api/trigger', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${new Buffer(`${sensorr.config.auth.username}:${sensorr.config.auth.password}`).toString('base64')}`,
      }),
      body: JSON.stringify({ type })
    })
    .then(res => {
      try {
        res.json().then(body => {
          if (res.ok) {
            toastManager.add({
              record: <span><strong>Record</strong> job triggered ! See <strong>Logs</strong> page to follow progress !</span>,
            }[type], { appearance: 'success', autoDismiss: true, })
          } else {
            toastManager.add({
              record: <span><strong>Record</strong> job already in progress</span>,
            }[type], { appearance: 'error', autoDismiss: true, })
          }
        })
      } catch(e) {
        toastManager.add((
          <span>Unexpected error during job trigger : <strong>{res.statusText}</strong></span>
        ), { appearance: 'error', autoDismiss: true, })
      } finally {
        this.debounce(() => this.setState({ loading: false }))
      }
    })
  }

  render() {
    const { ongoing, toastManager, ...props } = this.props
    const { loading, ...state } = this.state

    return (
      <div css={Recording.styles.element}>
        <Indicator ongoing={ongoing} loading={loading} />
        {ongoing ? (
          <NavLink
            css={Recording.styles.link}
            title={`📹 Recording wished movies from collection`}
            to="/movies/records"
          >
            📼
          </NavLink>
        ) : (
          <button
            css={Recording.styles.button}
            title={`📹 Record${loading ? 'ing' : ''} wished movies from collection`}
            onClick={() => this.triggerJob('record')}
            disabled={loading}
          >
            📼
          </button>
        )}
      </div>
    )
  }
}

export default connect(
  (state) => ({
    ongoing: state.jobs['sensorr:record'],
  }),
  () => ({}),
)(
  withToastManager(Recording)
)
