import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import Items from 'components/Layout/Items'
import { NavLink } from 'react-router-dom'
import { Indicator } from 'views/layout/Header/blocks/Recording'
import Film from 'components/Entity/Film'
import { socketize } from 'store/socket'
import nanobounce from 'nanobounce'
import theme from 'theme'

class Records extends PureComponent {
  static Queries = {
    library: (db) => db.movies.find().where('state').eq('archived').sort({ time: -1 }).limit(20),
  }

  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      records : [],
      fetched: 0,
    }

    this.records = []
    this.debounce = nanobounce(500)
    this.socket = null
  }

  componentDidMount() {
    if (this.props.ongoing && (this.props.session || {}).uuid) {
      this.fetch(this.props.session.uuid)
    }
  }

  componentDidUpdate(props) {
    if (this.props.ongoing && ((props.session || {}).uuid !== (this.props.session || {}).uuid || !props.ongoing)) {
      this.fetch(this.props.session.uuid)
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.close()
    }
  }

  fetch(uuid) {
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
    const { records, loading, fetched, ...state } = this.state
    const { ongoing, session, ...props } = this.props

    return (
      <Items
        label={(
          <span title={ongoing ? 'Current recording movies' : 'Last recorded movies'}>
            <NavLink to={ongoing ? '/movies/records' : '/movies/library'} css={theme.resets.a}>
              <span style={{ position: 'relative', padding: '0.25em 0 0.25em 0.3125em', }}>
                <Indicator ongoing={ongoing} />
                <span>📼</span>
              </span>
              <span>&nbsp;&nbsp;</span>
              <span>{ongoing ? 'Recording' : 'Records'}</span>
              {ongoing && (
                <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}> ({fetched})</span>
              )}
            </NavLink>
          </span>
        )}
        child={Film}
        stack={ongoing}
        placeholder={true}
        {...(ongoing ? {
          source: records.map(record => record.movie).filter((movie, index) => index <= 20),
          hide: !loading && !records.length,
        } : {
          source: Records.Queries.library,
          hide: true,
        })}
      />
    )
  }
}

export default connect(
  (state) => ({
    ongoing: state.jobs['sensorr:record'],
    session: Object.values(state.sessions.entities).sort((a, b) => new Date(a.time) - new Date(b.time)).slice(-1).pop(),
  }),
  () => ({}),
)(Records)
