import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { withToastManager } from 'react-toast-notifications'
import { StyleSheet, css } from 'aphrodite'
import sensorr from 'store/sensorr'

const animations = {
  bounce: {
    '0%': {
      transform: 'translateY(-0.0625em)'
    },
    '50%': {
      transform: 'translateY(0.25em)'
    },
    '100%': {
      transform: 'translateY(-0.0625em)'
    },
  },
  rotate: {
    '0%': {
      transform: 'rotateY(0deg)',
    },
    '10%': {
      transform: 'rotateY(0deg)',
    },
    '45%': {
      transform: 'rotateY(180deg)',
    },
    '55%': {
      transform: 'rotateY(180deg)',
    },
    '90%': {
      transform: 'rotateY(360deg)',
    },
    '100%': {
      transform: 'rotateY(360deg)',
    },
  }
}

const suits = StyleSheet.create({
  bounce: {
    animationName: animations.bounce,
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  rotate: {
    perspective: '2em',
    textAlign: 'center',
    animationName: animations.rotate,
    animationDuration: '3s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
    animationDirection: 'alternate',
    transformStyle: 'preserve-3d',
  }
})

const styles = {
  element: {

  },
}

class Status extends PureComponent {
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
        this.setState({ loading: false })
      }
    })
  }

  render() {
    const { ongoing, toastManager, ...props } = this.props
    const { loading, ...state } = this.state

    return (
      <div
        className={loading ? css(suits.rotate) : ongoing ? css(suits.bounce) : ''}
        style={{ ...styles.element, ...(ongoing ? {} : { cursor: 'pointer '}) }}
        title={'Trigger "Record" job'}
        onClick={() => !ongoing && this.triggerJob('record')}
      >
        {loading ? '🏗' : '🚀'}
      </div>
    )
  }
}

export default connect(
  (state) => ({
    ongoing: state.status.record,
  }),
  () => ({}),
)(
  withToastManager(Status)
)
