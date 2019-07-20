import React, { PureComponent, Fragment, useState } from 'react'
import { useHover } from 'react-hooks-lib'
import { Helmet } from 'react-helmet'
import Row from 'components/Layout/Row'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import { GENRES, STUDIOS } from 'shared/services/TMDB'

const styles = {
  element: {
    padding: '2em 0',
    fontSize: '1.125em',
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
}

const Label = ({ id, title, randomize, value, onChange, options, children }) => {
  const { hovered, bind } = useHover()

  return (
    <span {...bind} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <label htmlFor={id} title={title} style={{ position: 'relative' }}>
        {children}
        {!!options && (
          <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={styles.select}>
            {options.map(option => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
      </label>
      <span style={{ cursor: 'pointer' }} title="Randomize" hidden={!randomize || !hovered} onClick={randomize}>&nbsp;&nbsp;🎰</span>
    </span>
  )
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
              <Label title="Discover movies by random year" id="discover-year" randomize={() => this.handleRowClick('year')}>
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
                randomize={() => this.handleRowClick('genre')}
                value={genre}
                onChange={(value) => this.handleRowClick('genre', value)}
                options={Object.keys(GENRES).map(id => ({ value: id, label: GENRES[id] }))}
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
                randomize={() => this.handleRowClick('studio')}
                value={studio}
                onChange={(value) => this.handleRowClick('studio', value)}
                options={Object.keys(STUDIOS).map(studio => ({ value: studio, label: studio }))}
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
