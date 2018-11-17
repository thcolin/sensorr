import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import database from 'store/database'
import Doc from 'shared/Doc'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    height: '15em',
    width: '10em',
    background: `${theme.colors.grey} url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAwIDI0MDAiPiAgPHBhdGggZmlsbD0iI2NjYyIgZD0iTTg4IDIyMTljLTI0LjcgMC00NS41LTguNS02Mi41LTI1LjVTMCAyMTU2IDAgMjEzMlYzMDdjMC0yNC43IDguNS00NS41IDI1LjUtNjIuNVM2My4zIDIxOSA4OCAyMTloMjIyNGMyNC43IDAgNDUuNSA4LjUgNjIuNSAyNS41czI1LjUgMzcuOCAyNS41IDYyLjV2MTgyNWMwIDI0LTguNSA0NC41LTI1LjUgNjEuNXMtMzcuOCAyNS41LTYyLjUgMjUuNUg4OHptMTEyLTMwMGw2MDYtNDAwYzI0LjcgMTAgNTYuNyAyMy4yIDk2IDM5LjVzMTA0LjUgNDYuMiAxOTUuNSA4OS41IDE2NC4yIDgyLjMgMjE5LjUgMTE3YzIyLjcgMTQuNyAzOS43IDIyIDUxIDIyIDEwIDAgMTUtNiAxNS0xOCAwLTIyLjctMTUtNTguMy00NS0xMDdzLTY4LTk3LjMtMTE0LTE0Ni04Ny43LTgxLTEyNS05N2MyOS4zLTI5LjMgNzQuMy03Ny4zIDEzNS0xNDRzMTEzLjctMTI2IDE1OS0xNzhsNjktNzggNS41LTUuNSAxNS41LTE0IDI0LTIwIDMwLTIxIDM2LTIwIDM5LTE0IDQxLTUuNWMxOCAwIDM3IDMuNSA1NyAxMC41czM3LjggMTUuMyA1My41IDI1IDMwIDE5LjMgNDMgMjkgMjMuMiAxOC4yIDMwLjUgMjUuNWwxMCAxMCAzNTMgMzU4VjQxOUgyMDB2MTUwMHptNDAwLTg4MWMtNjAgMC0xMTEuNS0yMS41LTE1NC41LTY0LjVTMzgxIDg3OSAzODEgODE5czIxLjUtMTExLjUgNjQuNS0xNTQuNVM1NDAgNjAwIDYwMCA2MDBjMzkuMyAwIDc1LjggOS44IDEwOS41IDI5LjVzNjAuMyA0Ni4zIDgwIDgwUzgxOSA3NzkuNyA4MTkgODE5YzAgNjAtMjEuNSAxMTEuNS02NC41IDE1NC41UzY2MCAxMDM4IDYwMCAxMDM4eiIvPjwvc3ZnPg==) no-repeat center`,
    backgroundSize: '50%',
  },
  state: {
    cursor: 'pointer',
    position: 'absolute',
    right: '0.5em',
    top: '0.5em',
    backgroundColor: theme.colors.shadows.grey,
    borderRadius: '50%',
    padding: '0.5em',
    height: '2em',
    width: '2em',
  },
  link: {
    display: 'block',
  },
  poster: {
    cursor: 'pointer',
    maxHeight: '100%',
    maxWidth: '100%',
  },
}

export default class Film extends PureComponent {
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
      <div
        title={`${entity.title} (${entity.year || new Date(entity.release_date).getFullYear()})`}
        style={{ ...styles.element, background: ready ? 'none' : styles.element.background }}
      >
        <span style={styles.state} onClick={this.handleStateChange}>
          {!doc && ('🔕')}
          {doc && doc.state === 'wished' && ('🍿')}
          {doc && doc.state === 'archived' && ('📼')}
        </span>
        <Link to={`/movie/${entity.id}`} style={styles.link}>
          <img src={`http://image.tmdb.org/t/p/w300${entity.poster_path}`} onLoad={() => this.setState({ ready: true })} style={styles.poster} />
        </Link>
        {/* // Debug
          <span style={{ color: 'white' }}><br/>📆 {entity.release_date}</span>
          <span style={{ color: 'white' }}><br/>💯 {entity.vote_average}</span>
          <span style={{ color: 'white' }}><br/>🔢 {entity.vote_count}</span>
          <span style={{ color: 'white' }}><br/>📣 {entity.popularity}</span>
        */}
      </div>
    )
  }
}
