import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Color from 'color'
import List from 'components/Layout/List'
import Film, { Poster } from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Documents from 'shared/Documents'
import database from 'store/database'
import palette from 'utils/palette'
import { GENRES } from 'shared/services/TMDB'
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
    margin: '0 0 7em',
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
    margin: '0 0 0.25em',
  },
  caption: {
    fontSize: '1.25em',
    margin: '0 0 0.75em',
    color: theme.colors.rangoon,
    '>span': {
      '&:not(:last-child)': {
        fontWeight: 600,
      }
    }
  },
  metadata: {
    display: 'flex',
    flexWrap: 'wrap',
    fontWeight: 600,
    color: theme.colors.rangoon,
    margin: '0 0 2em',
    '>span': {
      margin: '0 0 1em',
      ':not(:last-child)': {
        marginRight: '2em',
      },
    }
  },
  plot: {
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
        '>small': {
          fontWeight: 'normal',
        }
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

export default class Collection extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      details: null,
      poster: null,
      palette: {
        backgroundColor: theme.colors.rangoon,
        color: '#ffffff',
        alternativeColor: '#ffffff',
        negativeColor: '#ffffff',
      },
      count: 0,
      strict: true,
      err: null,
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
      poster: null,
      count: 0,
    })

    try {
      const details = await tmdb.fetch(
        ['collection', this.props.match.params.id]
      )

      details.popularity = details.parts.reduce((popularity, part) => popularity + part.popularity, 0) / details.parts.length
      details.vote_average = details.parts.reduce((vote_average, part) => vote_average + part.vote_average, 0) / details.parts.filter(part => part.vote_average).length
      details.release_dates = details.parts.map(part => part.release_date).sort((a, b) => new Date(a || null) - new Date(b || null))
        .reduce((acc, release_date, index, releases_dates) => [releases_dates[0], releases_dates[releases_dates.length - 1]])

      if (details.adult && !tmdb.adult) {
        throw { status_code: -1, status_message: 'Adult content disabled' }
      }

      this.setState({
        loading: false,
        err: null,
        details: details,
        strict: true,
      })

      this.fetchCount(details)

      if (details.poster_path) {
        this.fetchImg(
          `https://image.tmdb.org/t/p/w500${details.poster_path}`,
          (poster) => this.setState({ poster }),
          { palette: true }
        )
      }
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
    const count = await db.movies.find().where('id').in(details.parts.map(r => r.id.toString())).exec()
    this.setState({ count: count.length })
  }

  fetchImg = (src, cb, options = {}) => {
    fetch(src, { cache: 'force-cache' })
      .then(res => res.arrayBuffer())
      .then(buffer => `data:image/jpeg;base64,${window.btoa([]
        .slice
        .call(new Uint8Array(buffer))
        .reduce((binary, b) => `${binary}${String.fromCharCode(b)}`, '')
      )}`)
      .then(img => {
        if (options.palette) {
          const cache = sessionStorage.getItem(src)

          if (cache) {
            this.setState({ palette: JSON.parse(cache) })
          } else {
            palette(img, (palette) => {
              try { sessionStorage.setItem(src, JSON.stringify(palette)) } catch (e) {}
              this.setState({ palette })
            })
          }
        }

        cb(img)
      })
  }

  render() {
    const { match, ...props } = this.props
    const { details, poster, palette, count, strict, loading, err, ...state } = this.state

    return (
      <Fragment>
        <Helmet>
          {details ? (
            <title>Sensorr - {details.name}{(details.release_date && ` (${new Date(details.release_date).getFullYear()})`) || ''}</title>
          ) : (
            <title>Sensorr - Collection ({match.params.id})</title>
          )}
        </Helmet>
        <div css={styles.element}>
          {details ? (
            <div css={styles.container}>
              <div
                css={styles.background}
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/w300${details.backdrop_path})`,
                  filter: 'blur(5em)',
                  opacity: poster ? 1 : 0,
                }}
              ></div>
              <div
                css={styles.shadow}
                style={{
                  boxShadow: `inset 0 0 0 100em ${Color(palette.backgroundColor).fade(0.3).rgb().string()}`,
                }}
              ></div>
              <div css={styles.head} style={{ height: '50vh' }}>
              </div>
              <div css={styles.about}>
                <div>
                  <div css={styles.poster}>
                    <Poster
                      entity={details}
                      title={null}
                      img={poster}
                      style={{
                        backgroundColor: Color(palette.backgroundColor).rgb().string(),
                      }}
                    />
                  </div>
                  <div css={styles.info}>
                    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h1 css={styles.title}>
                        {details.name}
                      </h1>
                    </div>
                    <h2 css={styles.caption}>
                      <span>
                        ({new Date(details.release_dates[0]).getFullYear()} - {new Date(details.release_dates[1]).getFullYear()})
                      </span>
                    </h2>
                    <div css={styles.metadata}>
                      <span>
                        🎟️ &nbsp;{[
                          ...new Set(details.parts.map(part => part.genre_ids).reduce((acc, genres) => [...acc, ...genres], []))
                        ].map(id => GENRES[id]).join(', ')}
                      </span>
                      <span>
                        {new Documents.Movie(details).judge()} &nbsp;<strong>{details.vote_average.toFixed(1)}</strong>
                      </span>
                    </div>
                    <p css={styles.plot}>{details.overview}</p>
                  </div>
                </div>
                <div css={styles.list}>
                  <div css={styles.tabs}>
                    <div>
                      <span>
                        📀 &nbsp;Parts
                      </span>
                    </div>
                  </div>
                  <List
                    items={[...details.parts].sort((a, b) => new Date(a.release_date || 1e15) - new Date(b.release_date || 1e15))}
                    prettify={Infinity}
                    placeholder={true}
                    child={Film}
                    subtitle={(
                      <div css={styles.subtitle} style={{ color: palette.color }}>
                        {count ? (
                          <span style={{ flex: 1 }}>🎉&nbsp; Nice ! <strong>{count}/{details.parts.length}</strong> movies from this collection in your library</span>
                        ) : (
                          <span>&nbsp;</span>
                        )}
                      </div>
                    )}
                    empty={{ style: styles.empty }}
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
