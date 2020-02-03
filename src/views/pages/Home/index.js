import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import Items from 'components/Layout/Items'
import Records from './containers/Records'
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
  static Queries = {
    upcoming: (db) => db.calendar
      .find()
      .sort({ release_date: 1 })
      .where('release_date')
      .gte(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString())
      .limit(20),
    birthday: (db) => {
      const today = new Date()

      return db.stars
        .find({
          birthday: {
            $regex: `\\d{4}-${`${(today.getMonth() + 1)}`.padStart(2, '0')}-${`${(today.getDate())}`.padStart(2, '0')}`,
          },
        })
    },
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

  handleListClick = (key, value) => {
    this.setState({
      [key]: value || this.randomize[key](),
    })
  }

  handleRowClick = (key, value) => {
    this.setState(state => ({
      rows: {
        ...state.rows,
        [key]: value,
      }
    }))
  }

  render() {
    const { ready, stars, rows, year, genre, studio, ...props } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Home</title>
        </Helmet>
        <div css={styles.element}>
          <Items
            label="📣&nbsp; Trending"
            title="Trending movies"
            display="row"
            source={{
              uri: ['trending', 'movie', 'day'],
              params: { sort_by: 'popularity.desc' },
            }}
            child={Film}
            props={({ index }) => ({ display: index < 5 ? 'pretty' : 'default' })}
            placeholder={true}
          />
          <Records />
          <Items
            label={(
              <Link to={{ pathname: '/movies/calendar' }} css={theme.resets.a}>
                📆&nbsp; Upcoming
              </Link>
            )}
            title="Upcoming movies"
            child={Film}
            props={{ withCredits: true }}
            strict={true}
            placeholder={true}
            {...(ready ? {
              hide: true,
              source: Home.Queries.upcoming,
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
              source: Array(20).fill({ poster_path: false }),
            })}
          />
          <Items
            label={(
              <Link to={{ pathname: '/movies/discover' }} css={theme.resets.a}>
                👀&nbsp; Discover
              </Link>
            )}
            title="Discover movies"
            source={{
              uri: ['discover', 'movie'],
            }}
            child={Film}
            props={({ index }) => ({ display: index < 5 ? 'pretty' : 'default' })}
            placeholder={true}
          />
          <Items
            label={(
              <span>
                <Link
                  css={[theme.resets.a, styles.label]}
                  {...(rows.random === 'year' ? {
                    style: { opacity: 1 },
                    to: {
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
                    },
                  } : {
                    title: "Discover movies by random year",
                    onClick: () => this.handleRowClick('random', 'year'),
                  })}
                >
                  📅&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({year})</span>
                </Link>
                <Link
                  css={[theme.resets.a, styles.label]}
                  {...(rows.random === 'genre' ? {
                    style: { opacity: 1 },
                    to: {
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
                    },
                  } : {
                    title: "Discover movies by genre",
                    onClick: () => this.handleRowClick('random', 'genre'),
                  })}
                >
                  🎞️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({GENRES[genre]})</span>
                </Link>
                <Link
                  css={[theme.resets.a, styles.label]}
                  {...(rows.random === 'studio' ? {
                    style: { opacity: 1 },
                    to: {
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
                    },
                  } : {
                    title: "Discover movies by famous studio",
                    onClick: () => this.handleRowClick('random', 'studio'),
                  })}
                >
                  🏛️&nbsp; Discover <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}>({studio})</span>
                </Link>
              </span>
            )}
            display="row"
            child={Film}
            props={({ index }) => ({ display: index < 5 ? 'pretty' : 'default' })}
            placeholder={true}
            {...({
              year: {
                source: {
                  uri: ['discover', 'movie'],
                  params: {
                    primary_release_year: year,
                    sort_by: 'popularity.desc'
                  },
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
                source: {
                  uri: ['discover', 'movie'],
                  params: {
                    with_genres: genre,
                    sort_by: 'popularity.desc'
                  },
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
                source: {
                  uri: ['discover', 'movie'],
                  params: {
                    with_companies: STUDIOS[studio].map(company => company.id).join('|'),
                    sort_by: 'popularity.desc'
                  },
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
          <Items
            child={Persona}
            props={{ display: 'portrait' }}
            placeholder={true}
            limit={20}
            label={(
              <span
                title={{
                  trending: 'Trending stars',
                  birthday: 'Birthday stars',
                }[rows.stars]}
              >
                <button
                  css={[theme.resets.button, styles.label]}
                  onClick={() => this.handleRowClick('stars', 'trending')}
                  style={rows.stars === 'trending' ? { opacity: 1 } : {}}
                >
                  👩‍🎤️&nbsp; Trending
                </button>
                <button
                  css={[theme.resets.button, styles.label]}
                  onClick={() => this.handleRowClick('stars', 'birthday')}
                  style={rows.stars === 'birthday' ? { opacity: 1 } : {}}
                >
                  🎂️&nbsp; Birthday
                </button>
              </span>
            )}
            {...({
              trending: {
                source: {
                  uri: ['trending', 'person', 'day'],
                  params: { sort_by: 'popularity.desc' },
                },
              },
              birthday: {
                source: Home.Queries.birthday,
              }
            }[rows.stars])}
          />
        </div>
      </Fragment>
    )
  }
}
