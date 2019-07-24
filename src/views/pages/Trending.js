import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Row, { Label } from 'components/Layout/Row'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import { GENRES, STUDIOS } from 'shared/services/TMDB'

const styles = {
  element: {
    padding: '2em 0',
    fontSize: '1.125em',
  },
}

export default class Trending extends PureComponent {
  constructor(props) {
    super(props)

    this.randomize = {
      year: () => Math.min(Math.round(Math.random() * (new Date().getFullYear() - 1925) + 1925 + (Math.random() * 20)), new Date().getFullYear() - 2),
      genre: () => Object.keys(GENRES)[Math.floor(Math.random() * Object.keys(GENRES).length)],
      studio: () => Object.keys(STUDIOS)[Math.floor(Math.random() * Object.keys(STUDIOS).length)],
    }

    this.state = {
      year: this.randomize.year(),
      genre: this.randomize.genre(),
      studio: this.randomize.studio(),
    }

    this.handleRowClick = this.handleRowClick.bind(this)
  }

  handleRowClick(key, value) {
    this.setState({
      [key]: value || this.randomize[key](),
    })
  }

  render() {
    const { year, genre, studio, ...props } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Trending</title>
        </Helmet>
        <div style={styles.element}>
          <Row
            label="📣&nbsp; Trending"
            title="Trending movies"
            uri={['trending', 'movie', 'week']}
            params={{ sort_by: 'popularity.desc' }}
            child={Film}
          />
          <Row
            label="👀&nbsp; Discover"
            title="Discover movies"
            uri={['discover', 'movie']}
            child={Film}
          />
          <Row
            label={(
              <Label
                id="discover-year"
                title="Discover movies by random year"
                actions={(
                  <>
                    <span style={{ cursor: 'pointer', fontSize: '0.75em' }} onClick={() => this.handleRowClick('year', year - 1)}>
                      ⬅️
                    </span>
                    <span style={{ cursor: 'pointer' }} title="Randomize" onClick={() => this.handleRowClick('year')}>
                      &nbsp;&nbsp;🎰&nbsp;&nbsp;
                    </span>
                    <span style={{ cursor: 'pointer', fontSize: '0.75em' }} onClick={() => this.handleRowClick('year', year + 1)}>
                      ➡️
                    </span>
                  </>
                )}
              >
                📅&nbsp; Discover <span style={{ fontSize: 'smaller' }}>({year})</span>
              </Label>
            )}
            uri={['discover', 'movie']}
            params={{
              primary_release_year: year,
              sort_by: 'popularity.desc'
            }}
            child={Film}
          />
          <Row
            label={(
              <Label
                id="discover-genre"
                title="Discover movies by genre"
                value={genre}
                onChange={(value) => this.handleRowClick('genre', value)}
                options={Object.keys(GENRES).map(id => ({ value: id, label: GENRES[id] }))}
                actions={(
                  <span style={{ cursor: 'pointer' }} title="Randomize" onClick={() => this.handleRowClick('genre')}>
                    🎰
                  </span>
                )}
              >
                🎞️&nbsp; Discover <span style={{ fontSize: 'smaller' }}>({GENRES[genre]})</span>
              </Label>
            )}
            uri={['discover', 'movie']}
            params={{
              with_genres: genre,
            }}
            child={Film}
          />
          <Row
            label={(
              <Label
                id="discover-studio"
                title="Discover movies by famous studio"
                value={studio}
                onChange={(value) => this.handleRowClick('studio', value)}
                options={Object.keys(STUDIOS).map(studio => ({ value: studio, label: studio }))}
                actions={(
                  <span style={{ cursor: 'pointer' }} title="Randomize" onClick={() => this.handleRowClick('studio')}>
                    🎰
                  </span>
                )}
              >
                🏛️&nbsp; Discover <span style={{ fontSize: 'smaller' }}>({studio})</span>
              </Label>
            )}
            uri={['discover', 'movie']}
            params={{
              with_companies: STUDIOS[studio].map(company => company.id).join('|'),
              sort_by: 'popularity.desc'
            }}
            child={Film}
          />
          <Row
            label="👩‍🎤&nbsp; Trending"
            title="Trending stars"
            uri={['trending', 'person', 'week']}
            params={{ sort_by: 'popularity.desc' }}
            child={(props) => <Persona context="portrait" {...props} />}
          />
        </div>
      </Fragment>
    )
  }
}
