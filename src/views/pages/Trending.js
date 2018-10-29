import React, { PureComponent } from 'react'
import Row from 'components/Row'
import TMDB, { GENRES } from 'store/services/tmdb'

const styles = {
  element: {
    padding: '2em 0',
  },
  row: {
    cursor: 'pointer',
  }
}

export default class Trending extends PureComponent {
  constructor(props) {
    super(props)

    this.randomize = {
      year: () => Math.min(Math.round(Math.random() * (new Date().getFullYear() - 1925) + 1925 + (Math.random() * 20)), new Date().getFullYear() - 2),
      genre: () => Object.keys(GENRES)[Math.floor(Math.random() * Object.values(GENRES).length)],
    }

    this.state = {
      year: this.randomize.year(),
      genre: this.randomize.genre(),
    }

    this.handleRowClick = this.handleRowClick.bind(this)
  }

  handleRowClick(key) {
    this.setState({
      [key]: this.randomize[key](),
    })
  }

  render() {
    const { year, genre, ...props } = this.state

    return (
      <div style={styles.element}>
        <Row
          title="Trending"
          uri={['trending', 'movie', 'week']}
          params={{ sort_by: 'popularity.desc' }}
        />
        <Row
          title="Discover"
          uri={['discover', 'movie']}
        />
        <Row
          title={`Discover (${year})`}
          uri={['discover', 'movie']}
          params={{
            primary_release_year: year,
            sort_by: 'popularity.desc'
          }}
          onClick={() => this.handleRowClick('year')}
          style={styles.row}
        />
        <Row
          title={`Discover (${GENRES[genre]})`}
          uri={['discover', 'movie']}
          params={{
            with_genres: genre,
          }}
          onClick={() => this.handleRowClick('genre')}
          style={styles.row}
        />
      </div>
    )
  }
}
