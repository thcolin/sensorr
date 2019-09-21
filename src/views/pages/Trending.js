import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import List, { Label } from 'components/Layout/List'
import Film from 'components/Entity/Film'
import PersonaDefault from 'components/Entity/Persona'
import { GENRES, STUDIOS } from 'shared/services/TMDB'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    fontSize: '1.125em',
    padding: '2em 0 0',
  },
}

const Persona = (props) => <PersonaDefault {...props} context="portrait" />

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

    this.handleListClick = this.handleListClick.bind(this)
  }

  handleListClick(key, value) {
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
          <List
            label="📣&nbsp; Trending"
            title="Trending movies"
            uri={['trending', 'movie', 'week']}
            params={{ sort_by: 'popularity.desc' }}
            child={Film}
            prettify={5}
            spinner={{ css: { margin: '10.563rem auto' } }}
          />
          <List
            label="👀&nbsp; Discover"
            title="Discover movies"
            uri={['discover', 'movie']}
            child={Film}
            prettify={5}
            spinner={{ css: { margin: '10.563rem auto' } }}
          />
          <List
            label={(
              <Label
                id="discover-year"
                title="Discover movies by random year"
                actions={(
                  <>
                    <span style={{ cursor: 'pointer', fontSize: '0.75em' }} onClick={() => this.handleListClick('year', year - 1)}>
                      ⬅️
                    </span>
                    <span style={{ cursor: 'pointer' }} title="Randomize" onClick={() => this.handleListClick('year')}>
                      &nbsp;&nbsp;🎰&nbsp;&nbsp;
                    </span>
                    <span style={{ cursor: 'pointer', fontSize: '0.75em' }} onClick={() => this.handleListClick('year', year + 1)}>
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
            prettify={5}
            spinner={{ css: { margin: '10.563rem auto' } }}
          />
          <List
            label={(
              <Label
                id="discover-genre"
                title="Discover movies by genre"
                value={genre}
                onChange={(value) => this.handleListClick('genre', value)}
                options={Object.keys(GENRES).map(id => ({ value: id, label: GENRES[id] }))}
                actions={(
                  <span style={{ cursor: 'pointer' }} title="Randomize" onClick={() => this.handleListClick('genre')}>
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
            prettify={5}
            spinner={{ css: { margin: '10.563rem auto' } }}
          />
          <List
            label={(
              <Label
                id="discover-studio"
                title="Discover movies by famous studio"
                value={studio}
                onChange={(value) => this.handleListClick('studio', value)}
                options={Object.keys(STUDIOS).map(studio => ({ value: studio, label: studio }))}
                actions={(
                  <span style={{ cursor: 'pointer' }} title="Randomize" onClick={() => this.handleListClick('studio')}>
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
            prettify={5}
            spinner={{ css: { margin: '10.563rem auto' } }}
          />
          <List
            label="👩‍🎤&nbsp; Trending"
            title="Trending stars"
            uri={['trending', 'person', 'week']}
            params={{ sort_by: 'popularity.desc' }}
            child={Persona}
          />
        </div>
      </Fragment>
    )
  }
}
