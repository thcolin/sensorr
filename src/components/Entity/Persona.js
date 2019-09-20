import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Badge from 'components/Badge'
import { Star } from 'shared/Documents'
import database from 'store/database'
import tmdb from 'store/tmdb'
import theme from 'theme'

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  wrapper: {
    position: 'relative',
  },
  link: {
    textDecoration: 'none',
  },
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  poster: {
    height: '14em',
    width: '10em',
    overflow: 'hidden',
  },
  empty: {
    backgroundColor: theme.colors.grey,
    backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAwIDI0MDAiPiAgPHBhdGggZmlsbD0iI2NjYyIgZD0iTTg4IDIyMTljLTI0LjcgMC00NS41LTguNS02Mi41LTI1LjVTMCAyMTU2IDAgMjEzMlYzMDdjMC0yNC43IDguNS00NS41IDI1LjUtNjIuNVM2My4zIDIxOSA4OCAyMTloMjIyNGMyNC43IDAgNDUuNSA4LjUgNjIuNSAyNS41czI1LjUgMzcuOCAyNS41IDYyLjV2MTgyNWMwIDI0LTguNSA0NC41LTI1LjUgNjEuNXMtMzcuOCAyNS41LTYyLjUgMjUuNUg4OHptMTEyLTMwMGw2MDYtNDAwYzI0LjcgMTAgNTYuNyAyMy4yIDk2IDM5LjVzMTA0LjUgNDYuMiAxOTUuNSA4OS41IDE2NC4yIDgyLjMgMjE5LjUgMTE3YzIyLjcgMTQuNyAzOS43IDIyIDUxIDIyIDEwIDAgMTUtNiAxNS0xOCAwLTIyLjctMTUtNTguMy00NS0xMDdzLTY4LTk3LjMtMTE0LTE0Ni04Ny43LTgxLTEyNS05N2MyOS4zLTI5LjMgNzQuMy03Ny4zIDEzNS0xNDRzMTEzLjctMTI2IDE1OS0xNzhsNjktNzggNS41LTUuNSAxNS41LTE0IDI0LTIwIDMwLTIxIDM2LTIwIDM5LTE0IDQxLTUuNWMxOCAwIDM3IDMuNSA1NyAxMC41czM3LjggMTUuMyA1My41IDI1IDMwIDE5LjMgNDMgMjkgMjMuMiAxOC4yIDMwLjUgMjUuNWwxMCAxMCAzNTMgMzU4VjQxOUgyMDB2MTUwMHptNDAwLTg4MWMtNjAgMC0xMTEuNS0yMS41LTE1NC41LTY0LjVTMzgxIDg3OSAzODEgODE5czIxLjUtMTExLjUgNjQuNS0xNTQuNVM1NDAgNjAwIDYwMCA2MDBjMzkuMyAwIDc1LjggOS44IDEwOS41IDI5LjVzNjAuMyA0Ni4zIDgwIDgwUzgxOSA3NzkuNyA4MTkgODE5YzAgNjAtMjEuNSAxMTEuNS02NC41IDE1NC41UzY2MCAxMDM4IDYwMCAxMDM4eiIvPjwvc3ZnPg==)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '50%',
  },
  img: {
    width: '100%',
  },
  tooltip: {
    backgroundColor: theme.colors.shadows.black,
    borderRadius: '0.25em',
    color: theme.colors.white,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    padding: '0.25em 0.5em',
    margin: 0,
  },
}

const contexts = {
  portrait: {
    container: {
      flexDirection: 'column',
    },
    wrapper: {},
    element: {},
    poster: {},
    state: {
      position: 'absolute',
      right: '0.75em',
      top: '0.75em',
    },
    tooltip: {
      margin: '0.5em 0',
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  avatar: {
    container: {
      margin: '0 -2em 0 0',
      padding: '0 0 3.5em',
      alignItems: 'flex-end',
    },
    wrapper: {
      borderRadius: '50%',
      border: 'solid 0.375em white',
      overflow: 'hidden',
    },
    element: {
      width: '10em',
    },
    poster: {
      height: '10em',
    },
    state: {
      position: 'absolute',
      width: '50%',
      height: '100%',
      right: 0,
      borderRadius: 0,
      padding: '0 0.5em 0 0',
      fontSize: '2em',
    },
    tooltip: {
      position: 'absolute',
      bottom: 0,
      fontSize: '2em',
    },
  },
}

export default class Persona extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    context: PropTypes.oneOf(['portrait', 'avatar']),
    updatable: PropTypes.bool,
    prettify: PropTypes.bool,
  }

  static defaultProps = {
    context: 'avatar',
    updatable: true,
    prettify: false,
  }

  constructor(props) {
    super(props)

    this.state = {
      ready: false,
      tooltip: false,
    }
  }

  getSnapshotBeforeUpdate(props) {
    if (props.entity.profile_path !== this.props.entity.profile_path || !this.props.entity.profile_path) {
      this.setState({ ready: false })
    }

    return null
  }

  render() {
    const { entity, context, updatable, prettify, ...props } = this.props
    const { ready, tooltip, ...state } = this.state

    return (
      <div
        {...props}
        style={{ ...styles.container, ...contexts[context].container, ...(props.style ? props.style : {})}}
        onMouseEnter={() => this.setState({ tooltip: true })}
        onMouseLeave={() => this.setState({ tooltip: false })}
      >
        <div style={{ ...styles.wrapper, ...contexts[context].wrapper }}>
          {!(!updatable || (context !== 'portrait' && !tooltip)) && (
            <State
              entity={entity}
              updatable={updatable}
              style={contexts[context].state}
            />
          )}
          <Link to={`/star/${entity.id}`} style={styles.link}>
            <div style={{ ...styles.element, ...contexts[context].element }}>
              <div style={{ ...styles.poster, ...contexts[context].poster, ...(!entity.profile_path || !ready ? styles.empty : {}) }}>
                {entity.profile_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${entity.profile_path}`}
                    onLoad={() => this.setState({ ready: true })}
                    style={styles.img}
                  />
                )}
              </div>
            </div>
          </Link>
        </div>
        <h5 style={{ ...styles.tooltip, ...contexts[context].tooltip }} hidden={context !== 'portrait' && !tooltip}>
          <span>{entity.name}</span>
          {entity.job && (
            <span>{` (${entity.job})`}</span>
          )}
          {entity.character && (
            <span>{` (${entity.character})`}</span>
          )}
        </h5>
      </div>
    )
  }
}

export class State extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    updatable: PropTypes.bool,
    compact: PropTypes.bool,
  }

  static defaultProps = {
    updatable: true,
    compact: true,
  }

  constructor(props) {
    super(props)

    this.state = {
      doc: false,
      loading: false,
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
  }

  componentDidMount() {
    if (this.props.updatable) {
      this.bootstrap()
    }
  }

  componentDidUpdate(props) {
    if (!props.updatable && this.props.updatable) {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }

      this.bootstrap()
    }
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  async bootstrap() {
    try {
      this.setState({ doc: false })
      const db = await database.get()
      const query = db.stars.findOne().where('id').eq(this.props.entity.id.toString())
      const doc = await query.exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
      this.subscription = query.$.subscribe(doc => this.setState({ doc: doc ? doc.toJSON() : null }))
    } catch(e) {}
  }

  async handleStateChange() {
    const db = await database.get()
    let entity = this.props.entity

    if (this.state.doc === false) {
      return
    }

    if (!this.state.doc || this.state.doc.state === 'ignored') {
      this.setState({ loading: true })
      const credits = await tmdb.fetch(['person', entity.id, 'movie_credits'])
      const doc = await db.stars.atomicUpsert(new Star({ ...entity, credits, state: 'stalked' }).normalize())
      this.setState({ loading: false, doc: doc.toJSON(), entity })
    } else if (this.state.doc.state === 'stalked') {
      const doc = await db.stars.atomicUpsert(new Star({ ...entity, state: 'ignored' }).normalize())
      this.setState({ doc: doc.toJSON(), entity })
    }
  }

  render() {
    const { entity, updatable, compact, ...props } = this.props
    const { doc, loading, ...state } = this.state

    if (doc === null || (doc && doc.state === 'ignored')) {
      return <Badge {...props} onClick={this.handleStateChange} emoji="🔕" label={(!compact && 'Ignored') || ''} />
    } else if (doc && doc.state === 'stalked') {
      return <Badge {...props} onClick={this.handleStateChange} emoji="🔔" label={(!compact && 'Following') || ''} />
    } else {
      return <Badge {...props} emoji="⌛" label={(!compact && 'Loading') || ''} style={{ ...(props.style || {}), cursor: 'default' }} />
    }
  }
}
