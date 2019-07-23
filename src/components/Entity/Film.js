import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Badge from 'components/Badge'
import tmdb from 'store/tmdb'
import database from 'store/database'
import { Movie } from 'shared/Documents'
import uuidv4 from 'uuid/v4'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    overflow: 'hidden',
    height: '15em',
    width: '10em',
    background: `${theme.colors.grey} url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAwIDI0MDAiPiAgPHBhdGggZmlsbD0iI2NjYyIgZD0iTTg4IDIyMTljLTI0LjcgMC00NS41LTguNS02Mi41LTI1LjVTMCAyMTU2IDAgMjEzMlYzMDdjMC0yNC43IDguNS00NS41IDI1LjUtNjIuNVM2My4zIDIxOSA4OCAyMTloMjIyNGMyNC43IDAgNDUuNSA4LjUgNjIuNSAyNS41czI1LjUgMzcuOCAyNS41IDYyLjV2MTgyNWMwIDI0LTguNSA0NC41LTI1LjUgNjEuNXMtMzcuOCAyNS41LTYyLjUgMjUuNUg4OHptMTEyLTMwMGw2MDYtNDAwYzI0LjcgMTAgNTYuNyAyMy4yIDk2IDM5LjVzMTA0LjUgNDYuMiAxOTUuNSA4OS41IDE2NC4yIDgyLjMgMjE5LjUgMTE3YzIyLjcgMTQuNyAzOS43IDIyIDUxIDIyIDEwIDAgMTUtNiAxNS0xOCAwLTIyLjctMTUtNTguMy00NS0xMDdzLTY4LTk3LjMtMTE0LTE0Ni04Ny43LTgxLTEyNS05N2MyOS4zLTI5LjMgNzQuMy03Ny4zIDEzNS0xNDRzMTEzLjctMTI2IDE1OS0xNzhsNjktNzggNS41LTUuNSAxNS41LTE0IDI0LTIwIDMwLTIxIDM2LTIwIDM5LTE0IDQxLTUuNWMxOCAwIDM3IDMuNSA1NyAxMC41czM3LjggMTUuMyA1My41IDI1IDMwIDE5LjMgNDMgMjkgMjMuMiAxOC4yIDMwLjUgMjUuNWwxMCAxMCAzNTMgMzU4VjQxOUgyMDB2MTUwMHptNDAwLTg4MWMtNjAgMC0xMTEuNS0yMS41LTE1NC41LTY0LjVTMzgxIDg3OSAzODEgODE5czIxLjUtMTExLjUgNjQuNS0xNTQuNVM1NDAgNjAwIDYwMCA2MDBjMzkuMyAwIDc1LjggOS44IDEwOS41IDI5LjVzNjAuMyA0Ni4zIDgwIDgwUzgxOSA3NzkuNyA4MTkgODE5YzAgNjAtMjEuNSAxMTEuNS02NC41IDE1NC41UzY2MCAxMDM4IDYwMCAxMDM4eiIvPjwvc3ZnPg==) no-repeat center`,
    backgroundSize: '50%',
  },
  state: {
    position: 'absolute',
    right: '0.5em',
    top: '0.5em',
  },
  label: {
    position: 'relative',
    display: 'flex',
  },
  select: {
    position: 'absolute',
    opacity: 0,
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    appearance: 'none',
    border: 'none',
    cursor: 'pointer',
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
  static propTypes = {
    entity: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      ready: false,
    }
  }

  render() {
    const { entity, ...props } = this.props
    const { ready, ...state } = this.state

    return (
      <div
        title={`${entity.title}${(entity.year || entity.release_date) && ` (${entity.year || new Date(entity.release_date).getFullYear()})`}`}
        style={{ ...styles.element, background: (entity.poster_path && ready) ? 'none' : styles.element.background }}
      >
        <State entity={entity} style={styles.state} />
        <Link to={`/movie/${entity.id}`} style={styles.link}>
          {entity.poster_path && (
            <img src={`http://image.tmdb.org/t/p/w300${entity.poster_path}`} onLoad={() => this.setState({ ready: true })} style={styles.poster} />
          )}
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

export class State extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    compact: PropTypes.bool,
  }

  static defaultProps = {
    compact: true,
  }

  constructor(props) {
    super(props)

    this.state = {
      doc: false,
      id: uuidv4(),
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
  }

  componentDidMount() {
    this.bootstrap()
  }

  componentDidUpdate(props) {
    if (props.entity.id !== this.props.entity.id) {
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
      const query = db.movies.findOne().where('id').eq(this.props.entity.id.toString())
      const doc = await query.exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
      this.subscription = query.$.subscribe(doc => this.setState({ doc: doc ? doc.toJSON() : null }))
    } catch(e) {}
  }

  async handleStateChange(e) {
    const value = e.target.value
    const db = await database.get()
    let entity = this.props.entity

    if (!entity.alternative_titles || !entity.release_dates) {
      try {
        entity = await tmdb.fetch(
          ['movie', entity.id],
          { append_to_response: 'alternative_titles,release_dates' }
        )
      } catch (e) {
        console.warn(e)
        entity.alternative_titles = {}
        entity.release_dates = {}
      }
    }

    if (this.state.doc === false) {
      return
    }

    const movie = new Movie({ ...entity, state: value }, global.config.region || localStorage.getItem('region')).normalize()
    const doc = await db.movies.atomicUpsert(movie)
    this.setState({ doc: doc.toJSON(), entity })
  }

  render() {
    const { entity, compact, ...props } = this.props
    const { id, doc, ...state } = this.state

    const options = {
      loading: {
        emoji: '⌛',
        label: 'Loading',
      },
      ignored: {
        emoji: '🔕',
        label: 'Ignored',
      },
      pinned: {
        emoji: '📍',
        label: 'Pinned',
      },
      wished: {
        emoji: '🍿',
        label: 'Wished',
      },
      archived: {
        emoji: '📼',
        label: 'Archived',
      },
    }

    let current = 'loading'

    if (doc === null || (doc && doc.state === 'ignored')) {
      current = 'ignored'
    } else if (doc && doc.state === 'pinned') {
      current = 'pinned'
    } else if (doc && doc.state === 'wished') {
      current = 'wished'
    } else if (doc && doc.state === 'archived') {
      current = 'archived'
    } else {
      current = 'loading'
    }

    return (
      <div {...props}>
        <label htmlFor={id} style={styles.label}>
          {current !== 'loading' && (
            <select id={id} value={current} onChange={this.handleStateChange} style={styles.select}>
              {Object.keys(options).filter(key => !['loading'].includes(key)).map(key => (
                <option key={key} value={key}>{options[key].emoji} - {options[key].label}</option>
              ))}
            </select>
          )}
          <Badge
            emoji={options[current].emoji}
            title={options[current].label}
            {...(compact ? {} : { label: options[current].label })}
            {...(current === 'loading' ? { style: { cursor: 'default' } } : {})}
            {...(current !== 'loading' ? { onClick: this.handleStateChange } : {})}
          />
        </label>
      </div>
    )
  }
}
