import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { withToastManager } from 'react-toast-notifications'
import nanobounce from 'nanobounce'
import InfiniteScroll from 'react-infinite-scroller'
import Film from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import markdown from 'utils/markdown'
import io from 'store/io'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '1em',
  },
  summary: {
    display: 'flex',
    overflowX: 'auto',
    padding: '1em 0 1em 1em',
  },
  digest: {
    display: 'flex',
    margin: '1em',
    border: 'none',
    fontSize: '1em',
    lineHeight: '1em',
    cursor: 'pointer',
  },
  catch: {
    flex: 1,
    padding: '0 0 0 2em',
    textAlign: 'center',
    lineHeight: '1.4em',
    fontSize: '0.75em',
    fontFamily: theme.fonts.monospace,
  },
  bar: {
    zIndex: 1,
    position: 'sticky',
    display: 'flex',
    justifyContent: 'space-between',
    top: '-1px',
    width: '100%',
    backgroundColor: theme.colors.grey,
    fontFamily: theme.fonts.monospace,
    fontSize: '1.25em',
    padding: '0.75em 1em',
    textAlign: 'center',
    color: theme.colors.secondary,
  },
  small: {
    opacity: 0.5,
    fontSize: '0.75em',
    margin: '0 0.75em',
  },
  navigator: {
    cursor: 'pointer',
    margin: '0 0.125em',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  record: {
    display: 'flex',
    padding: '1em',
  },
  film: {
    flexShrink: 0,
  },
  scroller: {
    flexGrow: 1,
    overflowX: 'auto',
    padding: '0.5em 0 1em',
    margin: '0 1em',
    fontFamily: theme.fonts.monospace,
    fontSize: '0.75em',
    lineHeight: '1.75em',
  },
  title: {
    fontWeight: 'bold',
    margin: '0 0 0.5em 0.25em',
  },
  wrapper: {
    display: 'flex',
  },
  container: {
    flex: 1,
    display: 'inline-flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
  },
  text: {
    cursor: 'pointer',
    padding: '0 2em 0 1em',
  },
  focus: {
    flex: 1,
    whiteSpace: 'pre',
    backgroundColor: theme.colors.grey,
    borderRadius: '0.5em',
    margin: '1em',
    padding: '1em 2em',
  }
}

class Logs extends PureComponent {
  constructor(props) {
    super(props)

    this.filters = {
      all: () => true,
      ongoing: record => !record.done && !record.logs.some(log => (log.data || {}).err),
      success: record => record.done && record.success,
      filtered: record => record.done && !record.success && record.logs.some(log => ((log.data || {}).release || {}).warning === 1),
      missing: record => record.done && !record.success && record.logs.every(log => ((log.data || {}).release || {}).warning !== 1),
      error: record => record.logs.some(log => (log.data || {}).err),
    }

    this.state = {
      loading: true,
      index: null,
      records: [],
      filter: this.filters.all,
      focus: null,
      max: 5,
    }

    this.move = this.move.bind(this)
    this.expand = this.expand.bind(this)

    this.debounce = nanobounce(500)
    this.logs = []
    this.records = {}
  }

  componentDidMount() {
    io.on('session', ({ session, record, ...log }) => {
      if (!record && session === this.props.sessions[this.state.index].uuid) {
        this.setState({ loading: false })
        return
      }

      this.logs.push({ session, record, ...log })

      this.records = {
        ...this.records,
        [record]: {
          ...(this.records[record] || {}),
          session: session,
          record: record,
          time: Math.min((this.records[record] || {}).time || log.time, log.time),
          done: (this.records[record] || {}).done || !!(log.data || {}).done,
          success: (this.records[record] || {}).success || !!(log.data || {}).success,
          ...(typeof (log.data || {}).movie !== 'undefined' ? { movie: log.data.movie } : {}),
          logs: Object.values({
            ...(this.records[record] || { logs: [] }).logs.reduce((acc, log) => ({ ...acc, [log.uuid]: log }), {}),
            [log.uuid]: log,
          })
          .sort((a, b) => a.time - b.time),
        }
      }

      this.debounce(() => this.setState({ loading: false, records: this.records }))
    })

    if (this.props.sessions.length) {
      this.setState({ loading: true, index: this.props.sessions.length - 1 })
    }
  }

  async componentDidUpdate(props, state) {
    if (this.state.index === null && this.props.sessions.length) {
      this.setState({ loading: true, index: this.props.sessions.length - 1 })
    }

    if (this.state.index !== null && state.index !== this.state.index) {
      this.setState({ loading: true, max: 5 })

      if (state.index !== null) {
        io.emit('session', { session: props.sessions[state.index].uuid, stop: true })
      }

      io.emit('session', { session: this.props.sessions[this.state.index].uuid })
    }
  }

  componentWillUnmount() {
    if (this.state.index !== null) {
      io.emit('session', { session: this.props.sessions[this.state.index].uuid, stop: true })
    }
  }

  move(index) {
    this.setState({ loading: true, filter: this.filters.all, index })
  }

  expand() {
    this.setState(state => ({ max: state.max + 5 }))
  }

  render() {
    const { sessions, ...props } = this.props
    const { index, filter, focus, max, ...state } = this.state

    const loading = !(!props.loading && !sessions.length) && state.loading

    const records = Object.values(state.records)
      .filter(record => record.session === sessions[index].uuid)
      .sort((a, b) => b.time - a.time)

    const filtered = records
      .filter(filter)
      .filter((record, index) => index <= max)

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - History</title>
        </Helmet>
        {(sessions.length > 0 && index !== null) && (
          <div style={styles.bar}>
            <span style={(index > 0 ? {} : { visibility: 'hidden' })}>
              <a onClick={() => index > 0 && this.move(0)} style={styles.navigator}>⏪</a>
              <a onClick={() => index > 0 && this.move(index - 1)} style={styles.navigator}>⬅️</a>
            </span>
            <div>
              <span>{new Date(sessions[index].time).toLocaleString()}</span>
              <span style={styles.small}>#{sessions[index].uuid.split('-').pop()}</span>
            </div>
            <span style={(index < (sessions.length - 1) ? {} : { visibility: 'hidden' })}>
              <a onClick={() => index < (sessions.length - 1) && this.move(index + 1)} style={styles.navigator}>➡️</a>
              <a onClick={() => index < (sessions.length - 1) && this.move(sessions.length - 1)} style={styles.navigator}>⏩</a>
            </span>
          </div>
        )}
        {records.length > 0 && (
          <div style={styles.summary}>
            <button
              style={{ ...styles.focus, ...styles.digest }}
              onClick={() => this.setState({ filter: this.filters.all, max: 5 })}
            >
              <span>🍿</span>
              <span style={styles.catch}>
                {markdown(`${records.length} __Wished__ movies`).tree}
              </span>
            </button>
            {records.some(this.filters.ongoing) && (
              <button
                style={{ ...styles.focus, ...styles.digest }}
                onClick={() => this.setState({ filter: this.filters.ongoing, max: 5 })}
              >
                <span>⌛</span>
                <span style={styles.catch}>
                  {markdown(`${records.filter(this.filters.ongoing).length} __Ongoing__ records`).tree}
                </span>
              </button>
            )}
            <button
              style={{ ...styles.focus, ...styles.digest }}
              onClick={() => this.setState({ filter: this.filters.success, max: 5 })}
            >
              <span>📼</span>
              <span style={styles.catch}>
                {markdown(`${records.filter(this.filters.success).length} __Archived__ movies`).tree}
              </span>
            </button>
            {!!records.filter(this.filters.filtered).length && (
              <button
                style={{ ...styles.focus, ...styles.digest }}
                onClick={() => this.setState({ filter: this.filters.filtered, max: 5 })}
              >
                <span>👮</span>
                <span style={styles.catch}>
                  {markdown(`${records.filter(this.filters.filtered).length} __Filtered__ records`).tree}
                </span>
              </button>
            )}
            {!!records.filter(this.filters.missing).length && (
              <button
                style={{ ...styles.focus, ...styles.digest }}
                onClick={() => this.setState({ filter: this.filters.missing, max: 5 })}
              >
                <span>📭</span>
                <span style={styles.catch}>
                  {markdown(`${records.filter(this.filters.missing).length} __Missing__ movies`).tree}
                </span>
              </button>
            )}
            {!!records.filter(this.filters.error).length && (
              <button
                style={{ ...styles.focus, ...styles.digest }}
                onClick={() => this.setState({ filter: this.filters.error, max: 5 })}
              >
                <span>❌</span>
                <span style={styles.catch}>
                  {markdown(`${records.filter(this.filters.error).length} __Error__ records`).tree}
                </span>
              </button>
            )}
            <div style={{ flex: '0 0 1em' }}></div>
          </div>
        )}
        <div style={styles.element}>
          <InfiniteScroll
            pageStart={0}
            hasMore={max < records.length}
            loadMore={this.expand}
            loader={<Spinner key="spinner" />}
          >
            {filtered.map(record => (
              <div style={styles.record} key={record.record}>
                {record.movie && (
                  <div style={styles.film}>
                    <Film entity={record.movie} />
                  </div>
                )}
                <div style={styles.scroller}>
                  <h4 style={styles.title}># {new Date(record.time).toLocaleString()}</h4>
                  {record.logs.map((log, index) => (
                    <div style={styles.wrapper} key={log.uuid}>
                      <div style={styles.container}>
                        <p
                          style={styles.text}
                          onClick={() => this.setState({ focus: focus === `${record.time}-${index}` ? null : `${record.time}-${index}` })}
                        >
                          {markdown(log.message).tree}
                        </p>
                        {focus === `${record.time}-${index}` && (
                          <div style={styles.focus}>{JSON.stringify(log, null, 2)}</div>
                        )}
                      </div>
                      <br/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </InfiniteScroll>
          {loading ? (
            <div style={styles.loading}>
              <Spinner />
            </div>
          ) : !sessions.length ? (
            <Empty
              emoji="📖"
              title="No session available yet"
              subtitle="Try to launch the rocket !"
            />
          ) : !filtered.length && (
            <Empty
              emoji="📖"
              title="No records available for this session"
              subtitle="Try to launch the rocket for a new ride !"
            />
          )}
        </div>
      </Fragment>
    )
  }
}

const connected = connect(
  (state) => ({
    sessions: Object.values(state.sessions.entities).sort((a, b) => new Date(a.time) - new Date(b.time)),
    loading: state.sessions.loading,
  }),
  () => ({

  })
)(Logs)

export default withToastManager(connected)
