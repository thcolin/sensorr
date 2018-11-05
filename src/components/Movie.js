import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import database from 'store/database'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    height: '100%',
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
    }

    this.handleStateChange = this.handleStateChange.bind(this)
  }

  async componentDidMount() {
    try {
      const db = await database.get()
      const doc = await db.movies.findOne().where('id').eq(this.props.entity.id.toString()).exec()
      this.setState({ doc: doc.toJSON() })
    } catch(e) {}
  }

  async componentDidUpdate(props) {
    if (props.entity.id !== this.props.entity.id) {
      try {
        const db = await database.get()
        const doc = await db.movies.findOne().where('id').eq(this.props.entity.id.toString()).exec()
        this.setState({ doc: doc.toJSON() })
      } catch(e) {}
    }
  }

  async handleStateChange() {
    const db = await database.get()

    if (!this.state.doc) {
      const doc = await db.movies.atomicUpsert({
        id: this.props.entity.id.toString(),
        title: this.props.entity.title,
        original_title: this.props.entity.original_title,
        year: this.props.entity.year || new Date(this.props.entity.release_date).getFullYear(),
        poster_path: this.props.entity.poster_path,
        state: 'wished',
      })

      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'wished') {
      const doc = await db.movies.atomicUpsert({
        id: this.props.entity.id.toString(),
        title: this.props.entity.title,
        original_title: this.props.entity.original_title,
        year: this.props.entity.year || new Date(this.props.entity.release_date).getFullYear(),
        poster_path: this.props.entity.poster_path,
        state: 'archived',
      })

      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'archived') {
      await db.movies.findOne().where('id').eq(this.props.entity.id.toString()).remove()
      this.setState({ doc: null })
    }
  }

  render() {
    const { entity, ...props } = this.props
    const { doc, ...state } = this.state

    return (
      <div style={styles.element}>
        <span style={styles.state} onClick={this.handleStateChange}>
          {!doc && ('🔕')}
          {doc && doc.state === 'wished' && ('🍿')}
          {doc && doc.state === 'archived' && ('📼')}
        </span>
        <Link to={`/movie/${entity.id}`}>
          <img src={`http://image.tmdb.org/t/p/w300${entity.poster_path}`} style={styles.poster} />
        </Link>
      </div>
    )
  }
}
