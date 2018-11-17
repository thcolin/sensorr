import React, { PureComponent } from 'react'
import { withToastManager } from 'react-toast-notifications'
import InfiniteScroll from 'react-infinite-scroller'
import Film from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import markdown from 'utils/markdown'
import sensorr from 'store/sensorr'
import theme from 'theme'

const styles = {
  element: {
    padding: '1em',
  },
  group: {
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
  data: {
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
      lines: [],
      done: false,
      data: null,
    }

    this.handleLoadMore = this.handleLoadMore.bind(this)
  }

  handleLoadMore() {
    const { lines } = this.state

    fetch(`/api/history?start=${lines.length}&end=${lines.length + 200}`, {
      method: 'GET',
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${new Buffer(`${sensorr.config.auth.username}:${sensorr.config.auth.password}`).toString('base64')}`,
      }),
    })
    .then(res => {
      try {
        res.json().then(body => {
          if (res.ok) {
            this.setState({ lines: [...this.state.lines, ...body.history], done: body.history.length < 200 })
          }
        })
      } catch(e) {
        toastManager.add((
          <span>Unexpected error during history fetch : <strong>{res.statusText}</strong></span>
        ), { appearance: 'error', autoDismiss: true, })
      }
    })
  }

  render() {
    const { lines, done, data, ...state } = this.state
    const groups = lines.reduce((groups, line) => ({ ...groups, [line.data.uuid]: [line, ...(groups[line.data.uuid] || [])] }), {})

    return (
      <InfiniteScroll
        pageStart={0}
        loadMore={this.handleLoadMore}
        hasMore={!done}
        loader={<Spinner key="spinner" />}
        style={styles.element}
      >
        {done && !Object.keys(groups).length && (
          <Empty />
        )}
        {Object.keys(groups).map(uuid => {
          const group = groups[uuid]

          return (
            <div style={styles.group} key={uuid}>
              {group[0].data.movie && (
                <div style={styles.film}>
                  <Film entity={group[0].data.movie} />
                </div>
              )}
              <div style={styles.scroller}>
                <h4 style={styles.title}># {new Date(group[0].ts).toLocaleString()}</h4>
                {group.map((log, index) => (
                  <div style={styles.wrapper} key={`${uuid}-${index}`}>
                    <div style={styles.container}>
                      <p
                        style={styles.text}
                        onClick={() => this.setState({ data: data === `${uuid}-${index}` ? null : `${uuid}-${index}` })}
                      >
                        {markdown(log.msg).tree}
                      </p>
                      {data === `${uuid}-${index}` && (
                        <div style={styles.data}>{JSON.stringify(log, null, 2)}</div>
                      )}
                    </div>
                    <br/>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </InfiniteScroll>
    )
  }
}

export default withToastManager(Logs)
