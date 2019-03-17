import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
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
  state: {
    position: 'absolute',
    backgroundColor: theme.colors.shadows.grey,
    userSelect: 'none',
    MozUserSelect: 'none',
  },
  poster: {
    height: '14em',
    width: '10em',
    overflow: 'hidden',
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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      right: '0.75em',
      top: '0.75em',
      borderRadius: '50%',
      padding: '0.5em',
      height: '2em',
      width: '2em',
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
      width: '50%',
      height: '100%',
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
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
  }

  static defaultProps = {
    context: 'avatar',
    updatable: true,
  }

  constructor(props) {
    super(props)

    this.state = {
      doc: false,
      loading: false,
      ready: false,
      tooltip: false,
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
    const { entity, context, updatable, ...props } = this.props
    const { doc, loading, ready, tooltip, ...state } = this.state

    return (
      <div
        {...props}
        style={{ ...styles.container, ...contexts[context].container, ...(props.style ? props.style : {})}}
        onMouseEnter={() => this.setState({ tooltip: true })}
        onMouseLeave={() => this.setState({ tooltip: false })}
      >
        <div style={{ ...styles.wrapper, ...contexts[context].wrapper }}>
          <div
            style={{
              ...styles.state,
              ...contexts[context].state,
              cursor: doc === false ? 'default' : 'pointer',
              ...(!updatable || (context !== 'portrait' && !tooltip) ? { display: 'none' } : {}),
            }}
            onClick={this.handleStateChange}
          >
            {(loading || doc === false) && ('⌛')}
            {(!loading && (doc === null || (doc && doc.state === 'ignored'))) && ('🔕')}
            {(!loading && (doc && doc.state === 'stalked')) && ('🔔')}
          </div>
          <Link to={`/star/${entity.id}`} style={styles.link}>
            <div style={{ ...styles.element, ...contexts[context].element }}>
              <div style={{ ...styles.poster, ...contexts[context].poster, backgroundColor: ready ? 'transparent' : theme.colors.grey }}>
                <img src={`http://image.tmdb.org/t/p/w300${entity.profile_path}`} onLoad={() => this.setState({ ready: true })} style={styles.img} />
              </div>
            </div>
          </Link>
        </div>
        <h5 style={{ ...styles.tooltip, ...contexts[context].tooltip }} hidden={context !== 'portrait' && !tooltip}>{entity.name}</h5>
      </div>
    )
  }
}
