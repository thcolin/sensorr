import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { withRouter } from 'react-router'
import { withToastManager } from 'react-toast-notifications'
import nanobounce from 'nanobounce'
import InfiniteScroll from 'react-infinite-scroller'
import Left from 'icons/Left'
import Right from 'icons/Right'
import Controls from 'components/Layout/Controls'
import Film from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import markdown from 'utils/markdown'
import { socketize } from 'store/socket'
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
  controls: {
    width: '120%',
    margin: '0 -10%',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '1em',
    textAlign: 'center',
    color: 'white',
    '>div': {
      display: 'flex',
      alignItems: 'center',
      '&:first-of-type,&:last-of-type': {
        fontSize: '1.25em',
        '>a': {
          display: 'flex',
          alignItems: 'center',
          padding: '1.5em 0.75em',
        },
      },
      '&:nth-of-type(2)': {
        '>a': {
          fontSize: '0.75em',
          padding: '1.5em',
          margin: '0 0.5em',
        },
      },
      '>a': {
        opacity: 0.9,
        cursor: 'pointer',
        '&:hover': {
          opacity: 1,
        },
        '>svg': {
          height: '1em',
          width: '1em',
        },
      },
      '>button': {
        ...theme.resets.button,
        color: 'white',
      }
    },
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
  },
}

const Navigation = withRouter(({ sessions, session, onClick, edges = true, location, history, match, staticContext, ...props }) => {
  const uuids = Object.values(sessions).sort((a, b) => new Date(a.time) - new Date(b.time)).map(session => session.uuid)
  const index = uuids.indexOf(match.params.uuid)

  return (
    <div css={styles.navigation}>
      <div style={!edges || !(index > 0) ? { visibility: 'hidden' } : {}}>
        <a onClick={() => index > 0 && history.push(`/movies/records/${uuids[0]}`)}>
          <Left end={true} />
        </a>
      </div>
      <div>
        <a onClick={() => index > 0 && history.push(`/movies/records/${uuids[index - 1]}`)} style={!(index > 0) ? { visibility: 'hidden' } : {}}>
          <Left />
        </a>
        {onClick ? (
          <button onClick={onClick}>
            <code>{session.datetime}</code>
            <code>&nbsp;</code>
            <code css={theme.styles.semitransparent}><small>#{session.uuid.split('-').pop()}</small></code>
          </button>
        ) : (
          <div>
            <code>{session.datetime}</code>
            <code>&nbsp;</code>
            <code css={theme.styles.semitransparent}><small>#{session.uuid.split('-').pop()}</small></code>
          </div>
        )}
        <a onClick={() => index < (uuids.length - 1) && history.push(`/movies/records/${uuids[index + 1]}`)} style={!(index < (uuids.length - 1)) ? { visibility: 'hidden' } : {}}>
          <Right />
        </a>
      </div>
      <div style={!edges || !(index < (uuids.length - 1)) ? { visibility: 'hidden' } : {}}>
        <a onClick={() => index < (uuids.length - 1) && history.push(`/movies/records/${uuids[uuids.length - 1]}`)}>
          <Right end={true} />
        </a>
      </div>
    </div>
  )
})

const Controler = ({ sessions, session, records, fetched, onChange, ...props }) => {
  const filters = {
    source: (entities) => {
      const compute = (entity) => entity.success && entity.logs
        .map(log => ((log.data || {}).release || {}).site)
        .filter(site => site)
        .pop()

      const histogram = (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity)]: (histogram[compute(entity)] || 0) + 1,
      }), { false: 0 })

      return {
        label: 'Source',
        type: 'checkbox',
        inputs: Object.keys(histogram(entities)).map(key => ({
          label: key === 'false' ? 'none' : key,
          value: key,
        })),
        default: [],
        apply: (entity, values) => !values.length || values.some(value => !value || compute(entity) === value),
        histogram,
      }
    },
    state: (entities) => {
      const compute = (entity) => {
        if (!entity.done && !entity.logs.some(log => (log.data || {}).err)) {
          return 'ongoing'
        } else if (entity.done && entity.success) {
          return 'success'
        } else if (entity.done && !entity.success && entity.logs.some(log => ((log.data || {}).release || {}).warning === 1)) {
          return 'filtered'
        } else if (entity.done && !entity.success && entity.logs.every(log => ((log.data || {}).release || {}).warning !== 1)) {
          return 'missing'
        } else if (entity.logs.some(log => (log.data || {}).err)) {
          return 'error'
        }
      }

      return {
        label: 'State',
        type: 'checkbox',
        inputs: [
          {
            label: '⌛  Ongoing',
            value: 'ongoing',
          },
          {
            label: '📼  Success',
            value: 'success',
          },
          {
            label: '👮  Filtered',
            value: 'filtered',
          },
          {
            label: '📭  Missing',
            value: 'missing',
          },
          {
            label: '❌  Error',
            value: 'error',
          },
        ],
        default: [],
        apply: (entity, values) => !values.length || values.some(value => compute(entity) === value),
        histogram: (entities) => entities.reduce((histogram, entity) => ({
          ...histogram,
          [compute(entity)]: histogram[compute(entity)] + 1,
        }), { ongoing: 0, success: 0, filtered: 0, missing: 0, error: 0 }),
      }
    },
  }

  return !!session && (
    <Controls
      entities={records}
      label={({ reset }) => (
        <span style={{ display: 'flex', flex: 1 }}>
          <button css={theme.resets.button} style={{ width: '8em', textAlign: 'left' }} onClick={() => reset()}>
            <span><strong>{fetched}</strong> Records</span>
          </button>
          <span style={{ flex: 1, justifyContent: 'center' }}>
            <Navigation sessions={sessions} session={session} edges={false} />
          </span>
        </span>
      )}
      filters={Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: filters[key](records) }), {})}
      onChange={({ filter }) => onChange(filter)}
      defaults={{
        filtering: {},
        reverse: false,
      }}
      render={{
        filters: (Blocks) => (
          <>
            <Blocks.source />
            <Blocks.state />
          </>
        ),
      }}
    >
      {({ setOpen }) => (
        <div css={styles.controls}>
          <Navigation sessions={sessions} session={session} onClick={() => setOpen(true)} />
        </div>
      )}
    </Controls>
  )
}

class Records extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      socket: null,
      loading: false,
      records: [],
      fetched: 0,
      filter: () => true,
      focus: null,
      max: 1,
    }

    this.fetch = this.fetch.bind(this)
    this.expand = this.expand.bind(this)

    this.debounce = nanobounce(500)
    this.records = {}
  }

  componentDidMount() {
    if (Object.keys(this.props.sessions).length && !this.props.match.params.uuid) {
      this.props.history.replace(
        `/movies/records/${Object.values(this.props.sessions).sort((a, b) => new Date(a.time) - new Date(b.time)).slice(-1).pop().uuid}`
      )
    } else if (Object.keys(this.props.sessions).includes(this.props.match.params.uuid)) {
      this.fetch(this.props.match.params.uuid)
    }
  }

  componentDidUpdate(props) {
    if (Object.keys(this.props.sessions).length && !this.props.match.params.uuid) {
      this.props.history.replace(
        `/movies/records/${Object.values(this.props.sessions).sort((a, b) => new Date(a.time) - new Date(b.time)).slice(-1).pop().uuid}`
      )
    }

    if (
      this.props.match.params.uuid &&
      Object.keys(this.props.sessions).includes(this.props.match.params.uuid) &&
      (
        props.match.params.uuid !== this.props.match.params.uuid ||
        (!Object.keys(props.sessions).length && Object.keys(this.props.sessions).length)
      )
    ) {
      this.fetch(this.props.match.params.uuid)
    }
  }

  componentWillUnmount() {
    if (this.state.socket) {
      this.state.socket.close()
    }
  }

  fetch(uuid) {
    if (this.state.socket) {
      this.state.socket.close()
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
            logs: Object.values({
              ...((this.records || {})[record] || { logs: [] }).logs.reduce((acc, log) => ({ ...acc, [log.uuid]: log }), {}),
              [log.uuid]: log,
            })
            .sort((a, b) => a.time - b.time),
          }
        }

        if (this.state.fetched !== Object.keys(this.records).length) {
          this.setState({ fetched: Object.keys(this.records).length })
        }

        this.debounce(() => this.setState({ records: Object.values(this.records).sort((a, b) => b.time - a.time), loading: false }))
      } else if (session === uuid) {
        this.setState({ records: Object.values(this.records).sort((a, b) => b.time - a.time), loading: false })
      }
    })

    this.records = {}
    this.setState({ socket, records: [], fetched: 0, loading: true, max: 1 }) // TODO: fix: setState({ filter: this.filters.all })
    socket.emit('session', { session: uuid })
  }

  expand() {
    this.setState(state => ({ max: state.max + 2 }))
  }

  render() {
    const { history, match, sessions, ...props } = this.props
    const { records, fetched, filter, focus, max, ...state } = this.state

    const session = !Object.keys(sessions).includes(match.params.uuid) ? null : {
      ...sessions[match.params.uuid],
      datetime: new Date(sessions[match.params.uuid].time).toLocaleString(),
    }

    const loading = props.loading || state.loading
    const filtered = records.filter(filter).filter((record, index) => index <= max)

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Records{!!session ? ` (${session.datetime} - #${session.uuid.split('-').pop()})` : ''}</title>
        </Helmet>
        <Controler
          session={session}
          sessions={sessions}
          records={records}
          fetched={fetched}
          onChange={(filter) => this.setState({ filter })}
        />
        <div style={styles.element}>
          {loading ? (
            <div style={styles.loading}>
              <Spinner />
            </div>
          ) : !Object.keys(sessions).length ? (
            <Empty
              emoji="📖"
              title="No session available yet"
              subtitle="Try to launch the rocket !"
            />
          ) : !filtered.length ? (
            <Empty
              emoji="📖"
              title="No records available for this session"
              subtitle="Try to launch the rocket for a new ride !"
            />
          ) : (
            <InfiniteScroll
              pageStart={0}
              hasMore={max < filtered.length}
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
                    {record.logs.filter(log => log.message).map((log, index) => (
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
          )}
        </div>
      </Fragment>
    )
  }
}

export default withToastManager(connect(
  (state) => ({
    sessions: state.sessions.entities,
    loading: state.sessions.loading,
  }),
  () => ({})
)(Records))
