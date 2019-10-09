import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import List, { Label } from 'components/Layout/List'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import { GENRES, STUDIOS } from 'shared/services/TMDB'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    fontSize: '1.125em',
    padding: '2em 0 0',
  },
  subtitle: {
    textAlign: 'right',
    color: theme.colors.rangoon,
    padding: '1em 3em',
    fontSize: '0.5em',
    opacity: 0.5,
  },
}

export default class Trending extends PureComponent {
  static Childs = {
    Persona: (props) => <Persona {...props} context="portrait" />
  }

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
        <div css={styles.element}>
          <List
            label="📣&nbsp; Trending"
            title="Trending movies"
            uri={['trending', 'movie', 'week']}
            params={{ sort_by: 'popularity.desc' }}
            child={Film}
            prettify={5}
            placeholder={true}
          />
          <List
            label="👀&nbsp; Discover"
            title="Discover movies"
            uri={['discover', 'movie']}
            child={Film}
            prettify={5}
            placeholder={true}
          />
          <List
            label={(
              <Label
                id="discover-year"
                title="Discover movies by random year"
              >
                📅&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({year})</span>
              </Label>
            )}
            uri={['discover', 'movie']}
            params={{
              primary_release_year: year,
              sort_by: 'popularity.desc'
            }}
            child={Film}
            prettify={5}
            placeholder={true}
            subtitle={(
              <div css={styles.subtitle}>
                <span>Travel through </span>
                <button onClick={() => this.handleListClick('year', year - 1)} css={theme.resets.button}>years ⬅️</button>
                <span> </span>
                <button onClick={() => this.handleListClick('year', year + 1)} css={theme.resets.button}>➡️, or</button>
                <span> just let </span>
                <button onClick={() => this.handleListClick('year')} css={theme.resets.button}> chance 🎰 play for you</button>
              </div>
            )}
          />
          <List
            label={(
              <Label
                id="discover-genre"
                title="Discover movies by genre"
                value={genre}
                onChange={(value) => this.handleListClick('genre', value)}
                options={Object.keys(GENRES).map(id => ({ value: id, label: GENRES[id] }))}
              >
                🎞️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({GENRES[genre]})</span>
              </Label>
            )}
            uri={['discover', 'movie']}
            params={{
              with_genres: genre,
            }}
            child={Film}
            prettify={5}
            placeholder={true}
            subtitle={(
              <div css={styles.subtitle}>
                <button onClick={() => this.handleListClick('genre')} css={theme.resets.button}>
                  Let yourself be tempted by a random 🎰 genre
                </button>
              </div>
            )}
          />
          <List
            label={(
              <Label
                id="discover-studio"
                title="Discover movies by famous studio"
                value={studio}
                onChange={(value) => this.handleListClick('studio', value)}
                options={Object.keys(STUDIOS).map(studio => ({ value: studio, label: studio }))}
              >
                🏛️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({studio})</span>
              </Label>
            )}
            uri={['discover', 'movie']}
            params={{
              with_companies: STUDIOS[studio].map(company => company.id).join('|'),
              sort_by: 'popularity.desc'
            }}
            child={Film}
            prettify={5}
            placeholder={true}
            subtitle={(
              <div css={styles.subtitle}>
                <button onClick={() => this.handleListClick('studio')} css={theme.resets.button}>
                  Let yourself be tempted by a random 🎰 studio
                </button>
              </div>
            )}
          />
          <List
            label="👩‍🎤&nbsp; Trending"
            title="Trending stars"
            uri={['trending', 'person', 'week']}
            params={{ sort_by: 'popularity.desc' }}
            child={Trending.Childs.Persona}
          />
        </div>
      </Fragment>
    )
  }
}
