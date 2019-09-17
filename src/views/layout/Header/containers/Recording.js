import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { withToastManager } from 'react-toast-notifications'
import { keyframes } from '@emotion/core'
import sensorr from 'store/sensorr'
import nanobounce from 'nanobounce'
import theme from 'theme'

const debounce = nanobounce(1000)

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

const styles = {
  element: {
    position: 'relative',
    padding: '0.25em 0 0.25em 0.3125em',
  },
  button: {
    ...theme.resets.button,
    color: 'black',
    '&:disabled': {
      opacity: 0.5,
    }
  },
  indicator: {
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
}

class Recording extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
    }

    this.triggerJob = this.triggerJob.bind(this)
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
        debounce(() => this.setState({ loading: false }))
      }
    })
  }

  render() {
    const { ongoing, toastManager, ...props } = this.props
    const { loading, ...state } = this.state

    return (
      <div css={styles.element}>
        <span
          css={[
            styles.indicator.element,
            ongoing ? styles.indicator.ongoing : loading ? styles.indicator.loading : styles.indicator.hidden,
          ]}
        ></span>
        <button
          css={styles.button}
          title={`📹 Record${(ongoing || loading) ? 'ing' : ''} wished movies from collection`}
          onClick={() => !ongoing && this.triggerJob('record')}
          disabled={ongoing || loading}
        >
          📼
        </button>
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
