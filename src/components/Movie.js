import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import database from 'store/database'
import Doc from 'shared/Doc'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  state: {
    cursor: 'pointer',
    position: 'absolute',
    right: '0.5em',
    top: '0.5em',
    backgroundColor: theme.colors.shadows.grey,
    borderRadius: '50%',
    padding: '0.5em',
  },
  poster: {
    cursor: 'pointer',
    maxHeight: '100%',
    maxWidth: '100%',
  },
}

export default class Movie extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      doc: null,
      ready: false,
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
  }

  componentDidMount() {
    this.bootstrap()
  }

  componentDidUpdate(props) {
    if (props.entity.id !== this.props.entity.id) {
      this.bootstrap()
    }
  }

  async bootstrap() {
    try {
      const db = await database.get()
      const doc = await db.movies.findOne().where('id').eq(this.props.entity.id.toString()).exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
    } catch(e) {}
  }

  async handleStateChange() {
    const db = await database.get()

    if (!this.state.doc) {
      const doc = await db.movies.atomicUpsert(new Doc({ ...this.props.entity, state: 'wished' }).normalize())
      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'wished') {
      const doc = await db.movies.atomicUpsert(new Doc({ ...this.props.entity, state: 'archived' }).normalize())
      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'archived') {
      await db.movies.findOne().where('id').eq(this.props.entity.id.toString()).remove()
      this.setState({ doc: null })
    }
  }

  render() {
    const { entity, ...props } = this.props
    const { doc, ready, ...state } = this.state

    return (
      <div style={{ ...styles.element, backgroundColor: ready ? 'transparent' : theme.colors.grey }}>
        <span style={styles.state} onClick={this.handleStateChange}>
          {!doc && ('🔕')}
          {doc && doc.state === 'wished' && ('🍿')}
          {doc && doc.state === 'archived' && ('📼')}
        </span>
        <Link to={`/movie/${entity.id}`}>
          <img src={`http://image.tmdb.org/t/p/w300${entity.poster_path}`} onLoad={() => this.setState({ ready: true })} style={styles.poster} />
        </Link>
      </div>
    )
  }
}
