import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Empty from 'components/Empty'
import database from 'store/database'
import tmdb from 'store/tmdb'
import theme from 'theme'

const styles = {
  empty: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    padding: '0 2em',
    fontSize: '2em',
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 10em)',
    gridGap: '2rem',
    justifyContent: 'space-between',
    padding: '2em',
  },
  entity: {
    width: '10em',
    height: '15em',
  }
}

export default class Grid extends PureComponent {
  static propTypes = {
    items: PropTypes.array,
    query: PropTypes.func,
    uri: PropTypes.array,
    params: PropTypes.object,
    transform: PropTypes.func,
    filter: PropTypes.func,
    label: PropTypes.string,
    child: PropTypes.func.isRequired,
    empty: PropTypes.object,
  }

  static defaultProps = {
    items: [],
    params: {},
    transform: (res) => res.results,
    filter: () => true,
    empty: {},
  }

  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      entities: [],
      buffer: [],
    }
  }

  async componentDidMount() {
    if (this.props.query) {
      this.setState({ loading: true })
      const db = await database.get()
      const query = this.props.query(db)
      const entities = await query.exec()
      this.subscription = query.$.subscribe(entities => this.setState({ buffer: entities.map(entity => entity.toJSON()) }))
      this.setState({ loading: false, entities: entities.map(entity => entity.toJSON()) })
    } else if (this.props.uri) {
      this.setState({ loading: true })
      tmdb.fetch(this.props.uri, this.props.params).then(res => this.setState({ loading: false, entities: this.props.transform(res) || [] }))
    }
  }

  componentDidUpdate(props, state) {
    if (this.props.query) {
      if (this.state.buffer.length && (props.filter !== this.props.filter)) {
        this.setState({
          entities: this.state.buffer,
          buffer: [],
        })
      }
    } else if (this.props.uri) {
      if (this.props.uri.join('/') !== props.uri.join('/') || JSON.stringify(this.props.params) !== JSON.stringify(props.params)) {
        this.setState({ loading: true })
        tmdb.fetch(this.props.uri, this.props.params).then(res => this.setState({ loading: false, entities: this.props.transform(res) }))
      }
    }
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  valid(entity) {
    return entity.poster_path || entity.profile_path
  }

  render() {
    const { items, filter, child, label, empty, ...props } = this.props
    const { loading, entities, ...state } = this.state

    const filtered = [...entities, ...items]
      .sort((a, b) => (b.time || 0) - (a.time || 0))
      .filter(entity => this.valid(entity))
      .filter(filter)

    return (
      <div style={styles.element}>
        <h1 style={{ ...styles.label, ...(props.style || {}) }}>{label}</h1>
        {!filtered.length ? (
          <div style={styles.empty}>
            <Empty {...empty} />
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((entity, index) => (
              <div key={index} style={styles.entity}>
                {React.createElement(child, { entity })}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}
