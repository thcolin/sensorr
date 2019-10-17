import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Color from 'color'
import List from 'components/Layout/List'
import { Poster, State } from 'components/Entity/Persona'
import Film from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import database from 'store/database'
import tmdb from 'store/tmdb'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    flex: 1,
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 2em 0',
  },
  background: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    transition: 'opacity 400ms ease-in-out',
  },
  shadow: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    transition: 'box-shadow 400ms ease-in-out',
  },
  head: {
    position: 'relative',
    minHeight: '25em',
    transition: 'height 400ms ease-in-out',
  },
  about: {
    position: 'relative',
    background: 'white',
    transition: 'transform 400ms ease-in-out',
    margin: '0 0 6.75em',
    '>div:first-of-type': {
      display: 'flex',
      padding: '2em 10%',
    },
  },
  poster: {
    fontSize: '1.5em',
    margin: '-8em 0 1em 0',
    transition: 'margin 400ms ease-in-out',
  },
  info: {
    flex: 1,
    padding: '0 0 0 2em',
  },
  title: {
    fontSize: '2.5em',
    lineHeight: '1.2em',
    fontWeight: 800,
    color: theme.colors.rangoon,
    margin: '0 0 0.5em',
  },
  metadata: {
    fontWeight: 600,
    color: theme.colors.rangoon,
    margin: '0 0 2em',
    '>span': {
      ':not(:last-child)': {
        margin: '0 2em 0 0',
      },
    }
  },
  biography: {
    lineHeight: '1.5em',
    color: theme.colors.rangoon,
    whiteSpace: 'pre-line',
  },
  list: {
    margin: '0 0 -6.75em 0',
    '>div': {
      padding: 0,
    }
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '1em 3em',
    fontSize: '0.6em',
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
  tabs: {
    display: 'flex',
    flexDirection: 'row',
    'alignItems': 'center',
    justifyContent: 'space-between',
    padding: '2em 1em 1em 1em',
    '>div': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      '>span': {
        margin: '0 1em',
        fontSize: '1.125em',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 300ms ease-in-out',
      },
    },
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: theme.colors.white,
  },
}

export default class Star extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      details: null,
      palette: {
        backgroundColor: theme.colors.rangoon,
        color: '#ffffff',
        alternativeColor: '#ffffff',
        negativeColor: '#ffffff',
      },
      more: null,
      count: {
        cast: 0,
        crew: 0,
      },
      err: null,
      order: 'vote_average',
      sort: {
        vote_average: {
          name: 'Vote Average',
          emoji: '💯',
          apply: (a, b) => (b.vote_average - (500 / b.vote_count)) - (a.vote_average - (500 / a.vote_count)),
        },
        release_date: {
          name: 'Release Date',
          emoji: '📆',
          apply: (a, b) => new Date(b.release_date || null) - new Date(a.release_date || null),
        },
        popularity: {
          name: 'Popularity',
          emoji: '📣',
          apply: (a, b) => b.popularity - a.popularity,
        },
      },
      strict: true,
    }
  }

  componentDidMount() {
    this.bootstrap()
  }

  componentDidUpdate(props) {
    if (this.props.match.params.id !== props.match.params.id) {
      this.bootstrap()
    }
  }

  bootstrap = async () => {
    this.setState({
      loading: true,
      count: {
        cast: 0,
        crew: 0,
      }
    })

    try {
      const details = await tmdb.fetch(['person', this.props.match.params.id], { append_to_response: 'images,movie_credits' })

      if (details.adult && !tmdb.adult) {
        throw { status_code: -1, status_message: 'Adult content disabled' }
      }

      this.fetchCount(details)

      this.setState({ loading: false, err: null, details, more: null, order: 'vote_average' })
    } catch(err) {
      if (err.status_code) {
        this.setState({
          loading: false,
          err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
        })
      } else {
        console.warn(err)
        this.props.history.push('/')
      }
    }
  }

  fetchCount = async (details) => {
    const db = await database.get()

    const cast = await db.movies.find().where('id').in(details.movie_credits.cast.map(r => r.id.toString())).exec()
    const crew = await db.movies.find().where('id').in(details.movie_credits.crew.map(r => r.id.toString())).exec()

    this.setState({
      count: {
        cast: cast.length,
        crew: crew.length,
      }
    })
  }

  render() {
    const { match, ...props } = this.props
    const { details, palette, count, loading, err, order, sort, strict, ...state } = this.state

    const more = state.more || (
      (details || { movie_credits: { crew: [] } }).movie_credits.crew.length && details.known_for_department !== 'Acting' ?
      'crew' :
      (details || { movie_credits: { cast: [] } }).movie_credits.cast.length ?
      'cast' :
      (details || { movie_credits: { crew: [] } }).movie_credits.crew.length ?
      'crew' :
      null
    )

    return (
      <Fragment>
        <Helmet>
          {details ? (
            <title>Sensorr - {details.name}</title>
          ) : (
            <title>Sensorr - Star ({match.params.id})</title>
          )}
        </Helmet>
        <div css={styles.element}>
          {details ? (
            <div css={styles.container}>
              <div
                css={styles.background}
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/original${
                    (details.images.profiles.sort((a, b) => a.width - b.width).slice(-1).pop() || {}).file_path
                  })`,
                  opacity: !loading ? 1 : 0,
                }}
              ></div>
              <div
                css={styles.shadow}
                style={{
                  boxShadow: `inset 0 0 0 100em ${Color(palette.backgroundColor).fade(0.3).rgb().string()}`,
                }}
              ></div>
              <div css={styles.head} style={{ height: '50vh' }}></div>
              <div css={styles.about}>
                <div>
                  <div css={styles.poster}>
                    <Poster
                      entity={details}
                      title={null}
                      display="portrait"
                      updatable={false}
                      link={null}
                      style={{
                        backgroundColor: Color(palette.backgroundColor).rgb().string(),
                      }}
                    />
                  </div>
                  <div css={styles.info}>
                    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h1 css={styles.title}>
                        {details.name}
                      </h1>
                      <State entity={details} compact={false} css={{ alignSelf: 'flex-start', margin: 0 }} />
                    </div>
                    <p css={styles.metadata}>
                      {!!details.known_for_department && (
                        <span>
                          💼 &nbsp;<strong>{details.known_for_department}</strong>
                        </span>
                      )}
                      {!!details.place_of_birth && (
                        <span>
                          🏡 &nbsp;<strong>{details.place_of_birth}</strong>
                        </span>
                      )}
                      {!!details.birthday && (
                        <span>
                          🎂 &nbsp;<strong>{new Date(details.birthday).toLocaleDateString()}</strong>
                          <span> &nbsp; </span>
                          <small>{(details.deathday ? new Date(details.deathday) : new Date()).getFullYear() - new Date(details.birthday).getFullYear()} years old</small>
                        </span>
                      )}
                      {!!details.deathday && (
                        <span>
                          🥀 &nbsp;<strong>{new Date(details.deathday).toLocaleDateString()}</strong>
                        </span>
                      )}
                    </p>
                    {!!details.biography && (
                      <p css={styles.biography}>{details.biography}</p>
                    )}
                  </div>
                </div>
                <div css={styles.list}>
                  <div css={styles.tabs}>
                    {!!details.movie_credits.cast.length && (
                      <div>
                        <span
                          style={{ opacity: more === 'cast' ? 1 : 0.25 }}
                          onClick={() => this.setState({ more: 'cast', order: 'vote_average' })}
                        >
                          👩‍🎤️ &nbsp;{`Casting`}
                        </span>
                      </div>
                    )}
                    {!!details.movie_credits.crew.length && (
                      <div>
                        <span
                          style={{ opacity: more === 'crew' ? 1 : 0.25 }}
                          onClick={() => this.setState({ more: 'crew', order: 'vote_average' })}
                        >
                          🎬 &nbsp;{`Crew`}
                        </span>
                      </div>
                    )}
                  </div>
                  <List
                    items={details.movie_credits[more]
                      .map((credit, index, self) => ({
                        ...credit,
                        ...(!credit.job ? {} : {
                          job: self.filter(c => c.id === credit.id).map(c => c.job).join(', '),
                        }),
                      }))
                      .filter(credit => more !== 'crew' || (
                        !strict ||
                        credit.department === details.known_for_department ||
                        details.known_for_department === 'Acting'
                      ))
                      .filter((a, index, self) => index === self.findIndex(b => a.id === b.id))
                      .map(credit => ({ ...credit, credits: [{ ...credit, ...details }] }))
                      .sort(sort[order].apply)
                    }
                    prettify={5}
                    placeholder={true}
                    child={Film}
                    childProps={{ withCredits: true }}
                    empty={{ style: styles.empty }}
                    subtitle={(
                      <div css={styles.subtitle} style={{ color: palette.color }}>
                        {!!count[more] && ({
                          cast: (
                            <span style={{ flex: 1 }}>🎉&nbsp; Nice ! <strong>{count.cast}/{details.movie_credits.cast.length}</strong> movies in your library &nbsp;</span>
                          ),
                          crew: (
                            <span style={{ flex: 1 }}>🎉&nbsp; Nice ! <strong>{count.crew}/{details.movie_credits.crew.length}</strong> movies in your library &nbsp;</span>
                          ),
                        }[more])}
                        <label htmlFor="star-order">
                          <span>{sort[order].emoji}&nbsp; Currently sorted by <strong>{sort[order].name}</strong></span>
                          <select id="star-order" value={order} onChange={e => this.setState({ order: e.target.value })}>
                            {Object.keys(sort).map(key => (
                              <option value={key} key={key}>{sort[key].emoji}&nbsp; Sort by {sort[key].name}</option>
                            ))}
                          </select>
                          &nbsp;
                        </label>
                        {more === 'crew' && details.known_for_department !== 'Acting' && (
                          <>
                            <span> and </span>
                            <button css={theme.resets.button} onClick={() => this.setState({ strict: !strict })}>
                              showing 💼 <strong>{strict ? details.known_for_department : 'All'}</strong> departement(s) credits
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          ) : loading ? (
            <div css={styles.loading}>
              <Spinner />
            </div>
          ) : (
            <Empty
              title={err ? 'Oh ! You came across a bug...' : null}
              emoji={err ? '🐛' : null}
              subtitle={err ? err : null}
            />
          )}
        </div>
      </Fragment>
    )
  }
}
