import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import List, { Label } from 'components/Layout/List'
import ListRecords from './containers/ListRecords'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import { GENRES, STUDIOS } from 'shared/services/TMDB'
import database from 'store/database'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    fontSize: '1.125em',
    padding: '2em 0 0',
  },
  label: {
    fontWeight: 'bold',
    opacity: 0.6,
    margin: '0 2em 0 0',
  },
  subtitle: {
    textAlign: 'right',
    color: theme.colors.rangoon,
    padding: '1em 3em',
    fontSize: '0.6em',
    opacity: 0.5,
    '>label': {
      position: 'relative',
      '>select': {
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
    },
  },
}

export default class Home extends PureComponent {
  static Childs = {
    Persona: (props) => <Persona {...props} display="portrait" />
  }

  static Queries = {
    upcoming: (db) => db.calendar
      .find()
      .sort({ release_date: 1 })
      .where('release_date')
      .gte(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString())
      .limit(20),
    birthday: (db) => db.stars.find(),
  }

  constructor(props) {
    super(props)

    this.randomize = {
      year: () => Math.min(Math.round(Math.random() * (new Date().getFullYear() - 1925) + 1925 + (Math.random() * 20)), new Date().getFullYear() - 2),
      genre: () => Object.keys(GENRES)[Math.floor(Math.random() * Object.keys(GENRES).length)],
      studio: () => Object.keys(STUDIOS)[Math.floor(Math.random() * Object.keys(STUDIOS).length)],
    }

    this.state = {
      ready: false,
      stars: [],
      rows: {
        random: 'year',
        stars: 'trending',
      },
      year: this.randomize.year(),
      genre: this.randomize.genre(),
      studio: this.randomize.studio(),
    }

    this.handleListClick = this.handleListClick.bind(this)
  }

  async componentDidMount() {
    const db = await database.get()
    const stars = await db.stars.find().where('state').ne('ignored').exec()
    this.setState({ ready: true, stars: stars.map(star => star.id) })
  }

  handleListClick(key, value) {
    this.setState({
      [key]: value || this.randomize[key](),
    })
  }

  render() {
    const { ready, stars, rows, year, genre, studio, ...props } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Home</title>
        </Helmet>
        <div css={styles.element}>
          <List
            label="📣&nbsp; Trending"
            title="Trending movies"
            uri={['trending', 'movie', 'day']}
            params={{ sort_by: 'popularity.desc' }}
            child={Film}
            prettify={5}
            placeholder={true}
          />
          <ListRecords />
          <List
            label={(
              <Label>
                <Link to={{ pathname: '/movies/calendar' }} css={theme.resets.a}>
                  📆&nbsp; Upcoming
                </Link>
              </Label>
            )}
            title="Upcoming movies"
            strict={true}
            {...(ready ? {
              hide: true,
              query: Home.Queries.upcoming,
              transform: (entities) => entities
                .map(raw => {
                  const entity = raw.toJSON()
                  const credits = entity.credits
                    .filter(star => stars.includes(star.id.toString()))
                    .filter((star, index, array) => array.map(obj => obj.id).indexOf(star.id) === index)
                    .filter((star, index) => index < 4)

                  return { ...entity, credits }
                })
                .filter(entity => entity.credits.length),
            } : {
              items: Array(15).fill({ poster_path: false }),
            })}
            child={Film}
            childProps={{ withCredits: true }}
            placeholder={true}
          />
          <List
            label={(
              <Label>
                <Link to={{ pathname: '/movies/discover' }} css={theme.resets.a}>
                  👀&nbsp; Discover
                </Link>
              </Label>
            )}
            title="Discover movies"
            uri={['discover', 'movie']}
            child={Film}
            prettify={5}
            placeholder={true}
          />
          <List
            child={Film}
            prettify={5}
            placeholder={true}
            label={(
              <Label>
                {rows.random === 'year' ? (
                  <Link
                    css={[theme.resets.a, styles.label]}
                    style={rows.random === 'year' ? { opacity: 1 } : {}}
                    to={{
                      pathname: '/movies/discover',
                      state: {
                        controls: {
                          filtering: {
                            release_date: [year, year],
                          },
                          sorting: 'popularity',
                          reverse: false,
                        },
                      },
                    }}
                  >
                    📅&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({year})</span>
                  </Link>
                ) : (
                  <button
                    title="Discover movies by random year"
                    css={[theme.resets.button, styles.label]}
                    onClick={() => this.setState({ rows: { ...rows, random: 'year' } })}
                  >
                    📅&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({year})</span>
                  </button>
                )}
                {rows.random === 'genre' ? (
                  <Link
                    css={[theme.resets.a, styles.label]}
                    style={rows.random === 'genre' ? { opacity: 1 } : {}}
                    to={{
                      pathname: '/movies/discover',
                      state: {
                        controls: {
                          filtering: {
                            with_genres: [{ value: genre, label: GENRES[genre] }],
                          },
                          sorting: 'popularity',
                          reverse: false,
                        },
                      },
                    }}
                  >
                    🎞️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({GENRES[genre]})</span>
                  </Link>
                ) : (
                  <button
                    title="Discover movies by genre"
                    css={[theme.resets.button, styles.label]}
                    onClick={() => this.setState({ rows: { ...rows, random: 'genre' } })}
                  >
                    🎞️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({GENRES[genre]})</span>
                  </button>
                )}
                {rows.random === 'studio' ? (
                  <Link
                    css={[theme.resets.a, styles.label]}
                    style={rows.random === 'studio' ? { opacity: 1 } : {}}
                    to={{
                      pathname: '/movies/discover',
                      state: {
                        controls: {
                          filtering: {
                            with_companies: STUDIOS[studio].map(studio => ({ value: studio.id, label: studio.name })),
                          },
                          sorting: 'popularity',
                          reverse: false,
                        },
                      },
                    }}
                  >
                    🏛️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({studio})</span>
                  </Link>
                ) : (
                  <button
                    title="Discover movies by famous studio"
                    css={[theme.resets.button, styles.label]}
                    onClick={() => this.setState({ rows: { ...rows, random: 'studio' } })}
                  >
                    🏛️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({studio})</span>
                  </button>
                )}
              </Label>
            )}
            {...({
              year: {
                uri: ['discover', 'movie'],
                params: {
                  primary_release_year: year,
                  sort_by: 'popularity.desc'
                },
                subtitle: (
                  <div css={styles.subtitle}>
                    <span>Travel through </span>
                    <button onClick={() => this.handleListClick('year', year - 1)} css={theme.resets.button}>years ⬅️</button>
                    <span> </span>
                    <button onClick={() => this.handleListClick('year', year + 1)} css={theme.resets.button}>➡️, or</button>
                    <span> just let </span>
                    <button onClick={() => this.handleListClick('year')} css={theme.resets.button}> chance 🎰 play for you</button>
                  </div>
                ),
              },
              genre: {
                uri: ['discover', 'movie'],
                params: {
                  with_genres: genre,
                  sort_by: 'popularity.desc'
                },
                subtitle: (
                  <div css={styles.subtitle}>
                    <button onClick={() => this.handleListClick('genre')} css={theme.resets.button}>
                      Let yourself be tempted by a random 🎰 genre
                    </button>
                    <span>, or</span>
                    <label htmlFor="home-genre">
                      <span> choose directly 👌</span>
                      <select id="home-genre" value={genre} onChange={e => this.handleListClick('genre', e.target.value)}>
                        {Object.keys(GENRES).map(key => (
                          <option value={key} key={key}>{GENRES[key]}</option>
                        ))}
                      </select>
                      &nbsp;
                    </label>
                  </div>
                ),
              },
              studio: {
                uri: ['discover', 'movie'],
                params: {
                  with_companies: STUDIOS[studio].map(company => company.id).join('|'),
                  sort_by: 'popularity.desc'
                },
                subtitle: (
                  <div css={styles.subtitle}>
                    <button onClick={() => this.handleListClick('studio')} css={theme.resets.button}>
                      Let yourself be tempted by a random 🎰 studio
                    </button>
                    <span>, or</span>
                    <label htmlFor="home-studio">
                      <span> choose directly 👌</span>
                      <select id="home-studio" value={studio} onChange={e => this.handleListClick('studio', e.target.value)}>
                        {Object.keys(STUDIOS).map(studio => (
                          <option value={studio} key={studio}>{studio}</option>
                        ))}
                      </select>
                      &nbsp;
                    </label>
                  </div>
                ),
              },
            }[rows.random])}
          />
          <List
            child={Home.Childs.Persona}
            placeholder={true}
            limit={20}
            label={(
              <Label
                title={{
                  trending: 'Trending stars',
                  birthday: 'Birthday stars',
                }[rows.stars]}
              >
                <button
                  css={[theme.resets.button, styles.label]}
                  onClick={() => this.setState({ rows: { ...rows, stars: 'trending' } })}
                  style={rows.stars === 'trending' ? { opacity: 1 } : {}}
                >
                  👩‍🎤️&nbsp; Trending
                </button>
                <button
                  css={[theme.resets.button, styles.label]}
                  onClick={() => this.setState({ rows: { ...rows, stars: 'birthday' } })}
                  style={rows.stars === 'birthday' ? { opacity: 1 } : {}}
                >
                  🎂️&nbsp; Birthday
                </button>
              </Label>
            )}
            {...({
              trending: {
                uri: ['trending', 'person', 'day'],
                params: { sort_by: 'popularity.desc' },
              },
              birthday: {
                query: Home.Queries.birthday,
                filter: (entity) => {
                  if (!entity.birthday) {
                    return false
                  }

                  const today = new Date()
                  const birthday = new Date(entity.birthday)

                  return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()
                },
              }
            }[rows.stars])}
          />
        </div>
      </Fragment>
    )
  }
}
