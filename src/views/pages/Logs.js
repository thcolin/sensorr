import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { withToastManager } from 'react-toast-notifications'
import InfiniteScroll from 'react-infinite-scroller'
import Film from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import markdown from 'utils/markdown'
import database from 'store/database'
import when from 'utils/when'
import theme from 'theme'

const styles = {
  element: {
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
    height: '90vh',
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

    this.subscriptions = {}
    this.filters = {
      all: () => true,
      success: record => record.success,
      filtered: record => !record.success && record.logs.some(log => log.message.match(/Release doesn't pass configured filtering/)),
      missing: record => !record.success && !record.logs.some(log => log.message.match(/Release doesn't pass configured filtering/)),
    }

    this.state = {
      loading: true,
      sessions: [],
      session: null,
      records: [],
      filter: this.filters.all,
      focus: null,
      max: 5,
    }

    this.move = this.move.bind(this)
    this.expand = this.expand.bind(this)
  }

  async componentDidMount() {
    const db = await database.get()
    const query = db.sessions.find()
    const subscription = query.$.subscribe(sessions => this.setState(state => ({
      loading: false,
      sessions,
      ...({ session: !sessions.length ? null : state.session === null ? sessions.length - 1 : state.session }),
    })))

    this.subscriptions.sessions = subscription
  }

  async componentDidUpdate(props, state) {
    if (this.state.session !== null && state.session !== this.state.session) {
      this.setState({ loading: true, records: [], max: 5 })
      const db = await database.get()
      const query = db.records.find().where('session').eq(this.state.sessions.sort((a, b) => a.time - b.time)[this.state.session].uuid)
      const subscription = query.$.subscribe(records => this.setState({
        loading: false,
        records: Object.values(records
            .map(record => record.toJSON())
            .reduce((acc, record) => ({
              ...acc,
              [record.record]: {
                ...(acc[record.record] || {}),
                time: record.time,
                ...(typeof (record.data || {}).success !== 'undefined' ? { success: record.data.success } : {}),
                ...(typeof (record.data || {}).movie !== 'undefined' ? { movie: record.data.movie } : {}),
                logs: [...(acc[record.record] || { logs: [] }).logs, record].sort((a, b) => a.time - b.time),
              }
            }), {})
          )
          .sort((a, b) => b.time - a.time),
      }))

      if (this.subscriptions.records) {
        this.subscriptions.records.unsubscribe()
      }

      this.subscriptions.records = subscription
    }
  }

  componentWillUnmount() {
    if (this.subscriptions.sessions) {
      this.subscriptions.sessions.unsubscribe()
    }

    if (this.subscriptions.records) {
      this.subscriptions.records.unsubscribe()
    }
  }

  move(session) {
    this.setState({ session })
  }

  expand() {
    this.setState(state => ({ max: state.max + 5 }))
  }

  render() {
    const { ...props } = this.props
    const { loading, sessions, session, records, filter, focus, max, ...state } = this.state

    const filtered = records
      .filter(filter)
      .filter((a, index) => index <= max)

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - History</title>
        </Helmet>
        {sessions.length > 0 && (
          <div style={styles.bar}>
            <span style={(session > 0 ? {} : { visibility: 'hidden' })}>
              <a onClick={() => session > 0 && this.move(0)} style={styles.navigator}>⏪</a>
              <a onClick={() => session > 0 && this.move(session - 1)} style={styles.navigator}>⬅️</a>
            </span>
            <div>
              <span>{new Date(sessions[session].time).toLocaleString()}</span>
              <span style={styles.small}>#{sessions[session].uuid.split('-').pop()}</span>
            </div>
            <span style={(session < (sessions.length - 1) ? {} : { visibility: 'hidden' })}>
              <a onClick={() => session < (sessions.length - 1) && this.move(session + 1)} style={styles.navigator}>➡️</a>
              <a onClick={() => session < (sessions.length - 1) && this.move(sessions.length - 1)} style={styles.navigator}>⏩</a>
            </span>
          </div>
        )}
        {records.length > 0 && (
          <div style={styles.summary}>
            <button
              style={{ ...styles.focus, ...styles.digest }}
              onClick={() => this.setState({ filter: this.filters.all })}
            >
              <span>🍿</span>
              <span style={styles.catch}>
                {markdown(`Searching for **${records.length}** movies`).tree}
              </span>
            </button>
            <button
              style={{ ...styles.focus, ...styles.digest }}
              onClick={() => this.setState({ filter: this.filters.success })}
            >
              <span>📼</span>
              <span style={styles.catch}>
                {records.filter(record => record.success > 0).length > 0 ?
                  markdown(`Amazing ! **${records.filter(record => record.success).length}** movies were archived !`).tree :
                  markdown('Oops... No movies were archived').tree
                }
              </span>
            </button>
            {!!records.filter(this.filters.missing).length && (
              <button
                style={{ ...styles.focus, ...styles.digest }}
                onClick={() => this.setState({ filter: this.filters.missing })}
              >
                <span>📭</span>
                <span style={styles.catch}>
                  {markdown(`Sorry, **${records.filter(this.filters.missing).length}** movies still missing`).tree}
                </span>
              </button>
            )}
            {!!records.filter(this.filters.filtered).length && (
              <button
                style={{ ...styles.focus, ...styles.digest }}
                onClick={() => this.setState({ filter: this.filters.filtered })}
              >
                <span>💎</span>
                <span style={styles.catch}>
                  {markdown(`But if you lower your filter you could get **${records.filter(this.filters.filtered).length}** more movies !`).tree}
                </span>
              </button>
            )}
            <div style={{ flex: '0 0 1em' }}></div>
          </div>
        )}
        <div style={styles.element}>
          {loading ? (
            <div style={styles.loading}>
              <Spinner />
            </div>
          ) : !filtered.length && (
            <Empty />
          )}
          <InfiniteScroll
            pageStart={0}
            hasMore={max < filtered.length}
            loadMore={this.expand}
            loader={<Spinner key="spinner" />}
          >
            {filtered.map(record => (
              <div style={styles.record} key={record.time}>
                {record.movie && (
                  <div style={styles.film}>
                    <Film entity={record.movie} />
                  </div>
                )}
                <div style={styles.scroller}>
                  <h4 style={styles.title}># {new Date(record.time).toLocaleString()}</h4>
                  {record.logs.map((log, index) => (
                    <div style={styles.wrapper} key={`${record.time}-${index}`}>
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
        </div>
      </Fragment>
    )
  }
}

export default withToastManager(Logs)
