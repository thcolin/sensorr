import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Empty from 'components/Empty'
import database from 'store/database'

const styles = {
  empty: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    query: PropTypes.string,
    filter: PropTypes.func,
    child: PropTypes.func.isRequired,
  }

  static defaultProps = {
    query: '',
    filter: () => true,
  }

  constructor(props) {
    super(props)

    this.state = {
      entities: [],
      buffer: [],
      subscription: null,
    }
  }

  async componentDidMount() {
    const db = await database.get()
    const query = db.movies.find()
    const entities = await query.exec()
    const subscription = query.$.subscribe(entities => this.setState({ buffer: entities.map(entity => entity.toJSON()) }))
    this.setState({ subscription, entities: entities.map(entity => entity.toJSON()) })
  }

  componentDidUpdate(props, state) {
    if (this.state.buffer.length && (props.query !== this.props.query || props.filter !== this.props.filter)) {
      this.setState({
        entities: this.state.buffer,
        buffer: [],
      })
    }
  }

  async componentWillUnmount() {
    if (this.state.subscription) {
      this.state.subscription.unsubscribe()
    }
  }

  render() {
    const { query, filter, child, ...props } = this.props
    const { entities, ...state } = this.state

    const filtered = entities
      .sort((a, b) => (b.time || 0) - (a.time || 0))
      .filter(entity => entity.poster_path)
      .filter(filter)
      .filter(entity => (
        new RegExp(query, 'i').test(entity.title) ||
        new RegExp(query, 'i').test(entity.original_title) ||
        (query.substring(0, 1) === ':' && query.substring(1) === entity.state) // :wished|:archived
      ))

    return (!filtered.length ? (
      <div style={styles.empty}>
        <Empty />
      </div>
    ) : (
      <div style={styles.grid}>
        {filtered.map((entity, index) => (
          <div key={index} style={styles.entity}>
            {React.createElement(child, { entity })}
          </div>
        ))}
      </div>
    ))
  }
}
