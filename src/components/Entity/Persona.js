import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Star } from 'shared/Documents'
import database from 'store/database'
import tmdb from 'store/tmdb'
import theme from 'theme'

const styles = {
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
    padding: '0 0 3em 0',
  },
  state: {
    position: 'absolute',
    right: '0.75em',
    top: '0.75em',
    backgroundColor: theme.colors.shadows.grey,
    borderRadius: '50%',
    padding: '0.5em',
    height: '2em',
    width: '2em',
    userSelect: 'none',
    MozUserSelect: 'none',
  },
  poster: {
    height: '14em',
    width: '10em',
    border: 'solid 0.375em white',
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
  },
}

const contexts = {
  portrait: {
    element: {

    },
    tooltip: {
      margin: '0.5em 0',
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  avatar: {
    element: {
      width: '10em',
      margin: '0 -2em 0 0',
    },
    poster: {
      height: '10em',
      borderRadius: '50%',
    },
    tooltip: {
      position: 'absolute',
      margin: '5.5em 0',
      fontSize: '2em',
    },
  },
}

export default class Persona extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    context: PropTypes.oneOf(['portrait', 'avatar']),
  }

  static defaultProps = {
    context: 'avatar',
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
    if (this.props.context === 'portrait') {
      this.bootstrap()
    }
  }

  componentDidUpdate(props) {
    if ((props.entity.id !== this.props.entity.id || props.context !== this.props.context) && this.props.context === 'portrait') {
      this.bootstrap()
    }
  }

  async bootstrap() {
    try {
      this.setState({ doc: false })
      const db = await database.get()
      const doc = await db.stars.findOne().where('id').eq(this.props.entity.id.toString()).exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
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
    const { entity, context, ...props } = this.props
    const { doc, loading, ready, tooltip, ...state } = this.state

    return (
      <div style={context === 'portrait' ? styles.wrapper : {}}>
        {context === 'portrait' && (
          <span style={{ ...styles.state, cursor: doc === false ? 'default' : 'pointer' }} onClick={this.handleStateChange}>
            {(loading || doc === false) && ('⌛')}
            {(!loading && (doc === null || (doc && doc.state === 'ignored'))) && ('🔕')}
            {(!loading && (doc && doc.state === 'stalked')) && ('🔔')}
          </span>
        )}
        <Link to={`/star/${entity.id}`} style={styles.link}>
          <div style={{ ...styles.element, ...contexts[context].element }}>
            <div
              style={{ ...styles.poster, ...contexts[context].poster, backgroundColor: ready ? 'transparent' : theme.colors.grey }}
              onMouseEnter={() => this.setState({ tooltip: true })}
              onMouseLeave={() => this.setState({ tooltip: false })}
            >
              <img src={`http://image.tmdb.org/t/p/w300${entity.profile_path}`} onLoad={() => this.setState({ ready: true })} style={styles.img} />
            </div>
            <h5 style={{ ...styles.tooltip, ...contexts[context].tooltip }} hidden={context !== 'portrait' && !tooltip}>{entity.name}</h5>
          </div>
        </Link>
      </div>
    )
  }
}
