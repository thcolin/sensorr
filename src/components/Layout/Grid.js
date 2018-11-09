import React, { PureComponent } from 'react'
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
  constructor(props) {
    super(props)

    this.state = {
      entities: [],
    }
  }

  async componentDidMount() {
    const db = await database.get()
    const entities = await db.movies.find().exec()
    this.setState({ entities })
  }

  render() {
    const { query, child, ...props } = this.props
    const { entities, ...state } = this.state

    const filtered = entities
      .map(entity => entity.toJSON())
      .sort((a, b) => (b.time || 0) - (a.time || 0))
      .filter(entity => entity.poster_path)
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
