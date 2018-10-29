import React, { PureComponent } from 'react'
import Movie from 'components/Movie'
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
    const { query, ...props } = this.props
    const { entities, ...state } = this.state

    const filtered = entities
      .reverse()
      .map(entity => entity.toJSON())
      .filter(entity => entity.poster_path)
      .filter(entity => (
        new RegExp(query, 'i').test(entity.title) ||
        new RegExp(query, 'i').test(entity.original_title) ||
        query.substring(1) === entity.state // :wished|:archived
      ))

    return (!filtered.length ? (
      <div style={styles.empty}>
        <Empty />
      </div>
    ) : (
      <div style={styles.grid}>
        {filtered.map((entity, index) => (
          <div key={index} style={styles.entity}>
            <Movie entity={entity} />
          </div>
        ))}
      </div>
    ))
  }
}
