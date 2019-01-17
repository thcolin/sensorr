import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { withToastManager } from 'react-toast-notifications'
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
  },
  digest: {
    margin: '1em',
    display: 'flex',
  },
  catch: {
    flex: 1,
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

    this.state = {
      subscription: {},
      sessions: [],
      session: null,
      records: [],
      buffer: [],
      focus: null,
    }

    this.bufferize = this.bufferize.bind(this)
  }

  async componentDidMount() {
    const days = (nb) => nb * 86400 * 1000

    const db = await database.get()
    const query = db.records.find().where('time').gt(Date.now() - days(7))
    const subscription = query.$
      .subscribe(records => this.setState(state => {
        const sessions = Object.values(
            records.reduce((acc, record) => ({ ...acc, [record.get('session')]: {
              uuid: record.get('session'),
              time: when(record.get('session')),
            } }), {})
          )
          .filter(session => session.time >= (Date.now() - days(6)))
          .sort((a, b) => a.time - b.time)

        const session = state.session === null ? (sessions.length - 1) : state.session

        return {
          sessions,
          session,
          records,
        }
      }, () => {
        const buffer = this.state.records.filter(record => record.get('session') === this.state.sessions[this.state.session].uuid)

        if (buffer.length !== this.state.buffer.length) {
          this.bufferize(this.state.session)
        }
      }))

    this.setState({ subscription })
  }

  componentWillUnmount() {
    if (this.state.subscription) {
      this.state.subscription.unsubscribe()
    }
  }

  bufferize(session) {
    this.setState({
      session,
      buffer: Object.values(this.state.records
        .filter(record => record.get('session') === this.state.sessions[session].uuid)
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
        }), {}))
        .sort((a, b) => b.time - a.time)
    })
  }

  render() {
    const { ...props } = this.props
    const { sessions, session, buffer, focus, ...state } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - History</title>
        </Helmet>
        {sessions.length > 0 && (
          <div style={styles.bar}>
            <span style={(session > 0 ? {} : { visibility: 'hidden' })}>
              <a onClick={() => session > 0 && this.bufferize(0)} style={styles.navigator}>⏪</a>
              <a onClick={() => session > 0 && this.bufferize(session - 1)} style={styles.navigator}>⬅️</a>
            </span>
            <div>
              <span>{sessions[session].time.toLocaleString()}</span>
              <span style={styles.small}>#{sessions[session].uuid.split('-').pop()}</span>
            </div>
            <span style={(session < (sessions.length - 1) ? {} : { visibility: 'hidden' })}>
              <a onClick={() => session < (sessions.length - 1) && this.bufferize(session + 1)} style={styles.navigator}>➡️</a>
              <a onClick={() => session < (sessions.length - 1) && this.bufferize(sessions.length - 1)} style={styles.navigator}>⏩</a>
            </span>
          </div>
        )}
        <div style={styles.element}>
          {!buffer.length && (
            <Empty />
          )}
          {buffer.length > 0 && (
            <div style={styles.summary}>
              <div style={{ ...styles.focus, ...styles.digest }}>
                <span>🍿</span>
                <span style={styles.catch}>
                  {markdown(`Searching for **${buffer.length}** movies`).tree}
                </span>
              </div>
              <div style={{ ...styles.focus, ...styles.digest }}>
                <span>📼</span>
                <span style={styles.catch}>
                  {buffer.filter(record => record.success > 0).length > 0 ?
                    markdown(`Amazing ! **${buffer.filter(record => record.success).length}** movies were archived !`).tree :
                    markdown('Oops... No movies were archived').tree
                  }
                </span>
              </div>
              {buffer.filter(record => !record.success).length > 0 && (
                <div style={{ ...styles.focus, ...styles.digest }}>
                  <span>📭</span>
                  <span style={styles.catch}>
                    {markdown(`Sorry, **${buffer.filter(record => !record.success).length}** movies still missing`).tree}
                  </span>
                </div>
              )}
            </div>
          )}
          {buffer.map(record => (
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
        </div>
      </Fragment>
    )
  }
}

export default withToastManager(Logs)
