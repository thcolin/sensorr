import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Row from 'components/Layout/Row'
import Film from 'components/Entity/Film'
import { GENRES, MAJORS } from 'shared/services/TMDB'

const styles = {
  element: {
    padding: '2em 0',
    fontSize: '1.125em',
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
      genre: () => Object.keys(GENRES)[Math.floor(Math.random() * Object.keys(GENRES).length)],
      major: () => Object.keys(MAJORS)[Math.floor(Math.random() * Object.keys(MAJORS).length)],
    }

    this.state = {
      year: this.randomize.year(),
      genre: this.randomize.genre(),
      major: this.randomize.major(),
    }

    this.handleRowClick = this.handleRowClick.bind(this)
  }

  handleRowClick(key) {
    this.setState({
      [key]: this.randomize[key](),
    })
  }

  render() {
    const { year, genre, major, ...props } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Trending</title>
        </Helmet>
        <div style={styles.element}>
          <Row
            label="Trending"
            uri={['trending', 'movie', 'week']}
            params={{ sort_by: 'popularity.desc' }}
            child={Film}
          />
          <Row
            label="Discover"
            uri={['discover', 'movie']}
            child={Film}
          />
          <Row
            label={`Discover (${year})`}
            title="Randomize year"
            uri={['discover', 'movie']}
            params={{
              primary_release_year: year,
              sort_by: 'popularity.desc'
            }}
            child={Film}
            onClick={() => this.handleRowClick('year')}
            style={styles.row}
          />
          <Row
            label={`Discover (${GENRES[genre]})`}
            title="Randomize genre"
            uri={['discover', 'movie']}
            params={{
              with_genres: genre,
            }}
            child={Film}
            onClick={() => this.handleRowClick('genre')}
            style={styles.row}
          />
          <Row
            label={`Discover (${major})`}
            title="Randomize major"
            uri={['discover', 'movie']}
            params={{
              with_companies: MAJORS[major].map(company => company.id).join('|'),
              sort_by: 'popularity.desc'
            }}
            child={Film}
            onClick={() => this.handleRowClick('major')}
            style={styles.row}
          />
        </div>
      </Fragment>
    )
  }
}
