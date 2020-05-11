import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { socketize } from 'store/socket'
import nanobounce from 'nanobounce'

const withSessionListener = () => (WrappedComponent) => {
  class WithSessionListener extends Component {
    static propTypes = {
      label: PropTypes.func,
    }

    constructor(props) {
      super(props)

      this.state = {
        records : [],
        loading: true,
        fetched: 0,
      }
  
      this.records = []
      this.debounce = nanobounce(500)
      this.socket = null
    }

    componentDidMount() {
      if (this.props.ongoing && (this.props.session || {}).uuid) {
        this.fetchSession(this.props.session.uuid)
      }
    }

    componentDidUpdate(props, state) {
      if (this.props.ongoing && ((props.session || {}).uuid !== (this.props.session || {}).uuid || !props.ongoing)) {
        this.fetchSession(this.props.session.uuid)
      }
    }

    componentWillUnmount() {
      if (this.socket) {
        this.socket.close()
      }
    }

    fetchSession(uuid) {
      if (this.socket) {
        this.socket.close()
      }

      const socket = socketize('', { forceNew: true })

      socket.on('session', ({ session, record, ...log }) => {
        if (record) {
          this.records = {
            ...(this.records || {}),
            [record]: {
              ...((this.records || {})[record] || {}),
              session: session,
              record: record,
              time: Math.min(((this.records || {})[record] || {}).time || log.time, log.time),
              done: ((this.records || {})[record] || {}).done || !!(log.data || {}).done,
              success: ((this.records || {})[record] || {}).success || !!(log.data || {}).success,
              ...(typeof (log.data || {}).movie !== 'undefined' ? { movie: log.data.movie } : {}),
            }
          }
        }

        if (this.state.fetched !== Object.keys(this.records).length) {
          this.setState({ fetched: Object.keys(this.records).length })
        }

        this.debounce(() => this.setState({ records: Object.values(this.records).sort((a, b) => b.time - a.time), loading: false }))
      })

      this.records = {}
      this.setState({ records: [], fetched: 0, loading: true })
      socket.emit('session', { session: uuid })
      this.socket = socket
    }
    
    render() {
      const { ongoing, ...props } = this.props
      const { records, fetched, loading, ...state } = this.state

      return (
        <WrappedComponent
          {...props}
          {...(!!props.label ? { label: props.label({ fetched }) } : {})}
          entities={records.map(record => record.movie).filter((movie, index) => index <= 20)}
          loading={loading || !records.length}
          stack={true}
        />
      )
    }
  }

  WithSessionListener.displayName = `WithSessionListener(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return connect(
    (state) => ({
      ongoing: state.jobs['sensorr:record'],
      session: Object.values(state.sessions.entities).sort((a, b) => new Date(a.time) - new Date(b.time)).slice(-1).pop(),
    }),
    () => ({}),
  )(WithSessionListener)
}

export default withSessionListener
