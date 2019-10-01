import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Color from 'color'
import ReactPlayer from 'react-player'
import List, { Label } from 'components/Layout/List'
import Button from 'components/Button'
import PersonaDefault from 'components/Entity/Persona'
import Film, { State, Poster } from 'components/Entity/Film'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Play from 'icons/Play'
import Badge from 'components/Badge'
import Releases from './blocks/Releases'
import Documents from 'shared/Documents'
import palette from 'utils/palette'
import tmdb from 'store/tmdb'
import theme from 'theme'
import uuidv4 from 'uuid/v4'

const styles = {
  element: {
    flex: 1,
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 2em 0',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    transition: 'box-shadow 400ms ease-in-out',
  },
  trailer: {
    position: 'relative',
    minHeight: '25em',
    transition: 'height 400ms ease-in-out',
  },
  trailers: {
    position: 'absolute',
    top: '1em',
    right: '1em',
    cursor: 'pointer',
    zIndex: 2,
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
  play: {
    ...theme.resets.button,
    position: 'absolute',
    height: '100%',
    width: '100%',
    transition: 'color 400ms ease-in-out, opacity 400ms ease-in-out',
    '>svg': {
      height: '3em',
      width: '3em',
    },
  },
  about: {
    background: 'white',
    transition: 'transform 400ms ease-in-out',
    margin: '0 0 5em',
    '>div:first-of-type': {
      display: 'flex',
      padding: '2em 10%',
    },
  },
  poster: {
    fontSize: '1.5em',
    margin: '-8em 0 0 0',
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
  subtitle: {
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
    fontWeight: 600,
    color: theme.colors.rangoon,
    margin: '0 0 2em',
    '>span': {
      ':not(:last-child)': {
        margin: '0 2em 0 0',
      },
    }
  },
  tagline: {
    color: theme.colors.rangoon,
    margin: '0 0 1em',
    fontWeight: 600,
  },
  plot: {
    lineHeight: '1.5em',
    color: theme.colors.rangoon,
    whiteSpace: 'pre-line',
  },
  list: {
    margin: '0 0 -5em 0',
    '>div': {
      padding: 0,
    }
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

const Persona = (props) => <PersonaDefault {...props} context="portrait" />

export default class Movie extends PureComponent {
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
      trailer: '',
      more: null,
      releases: false,
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
    try {
      const details = await tmdb.fetch(
        ['movie', this.props.match.params.id],
        { append_to_response: 'videos,credits,similar,recommendations,alternative_titles,release_dates' }
      )

      if (details.adult && !tmdb.adult) {
        throw { status_code: -1, status_message: 'Adult content disabled' }
      }

      this.setState({ loading: false, details, releases: false, more: null })

      if (details.poster_path) {
        this.fetchImg(
          `https://image.tmdb.org/t/p/original${details.poster_path}`,
          (poster) => this.setState({ poster }),
          { palette: true }
        )
      }
    } catch(err) {
      if (err.status_code) {
        this.setState({
          loading: false,
          err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
          releases: false,
          more: null,
        })
      } else {
        console.warn(err)
        this.props.history.push('/')
      }
    }
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
    const { details, poster, palette, trailer, releases, loading, err, ...state } = this.state

    const trailers = (details || { videos: { results: [] } }).videos.results
      .filter(video => video.site === 'YouTube' && ['Trailer', 'Teaser'].includes(video.type))
      .sort((a, b) => a.type === 'Trailer' ? -1 : 1)

    const more = state.more || ((details || {}).belongs_to_collection ? 'collection' : 'recommendations')

    return (
      <Fragment>
        <Helmet>
          {details ? (
            <title>Sensorr - {details.title}{(details.release_date && ` (${new Date(details.release_date).getFullYear()})`) || ''}{(!!match.params.releases && ` - 🔍`) || ''}</title>
          ) : (
            <title>Sensorr - Movie ({match.params.id})</title>
          )}
        </Helmet>
        <div css={styles.element}>
          {details ? (
            <div
              css={styles.container}
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/original${details.backdrop_path})`,
                boxShadow: `inset 0 0 0 100em ${Color(palette.backgroundColor).fade(0.3).rgb().string()}`,
              }}
            >
              <div
                css={styles.trailer}
                style={{ height: trailer ? '80vh' : '50vh' }}
              >
                {!!trailers.length && (
                  <>
                    {trailer ? (
                      <button css={[theme.resets.button, styles.trailers]} onClick={() => this.setState({ trailer: null })}>
                        <Badge emoji="❌" />
                      </button>
                    ) : (
                      <label htmlFor="trailer" css={styles.trailers}>
                        <select id="trailer" value={trailer} onChange={(e) => this.setState({ trailer: e.target.value })}>
                          {trailers.filter((video) => video.type === 'Trailer').length && (
                            <optgroup label="Trailer">
                              {trailers.filter((video) => video.type === 'Trailer').map(video => (
                                <option key={video.key} value={video.key}>{video.name}</option>
                              ))}
                            </optgroup>
                          )}
                          {trailers.filter((video) => video.type === 'Teaser').length && (
                            <optgroup label="Teaser">
                              {trailers.filter((video) => video.type === 'Teaser').map(video => (
                                <option key={video.key} value={video.key}>{video.name}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        <Badge emoji="🎞️" />
                      </label>
                    )}
                    {!!trailer && (
                      <div css={[styles.loading, { position: 'absolute', width: '100%', height: '100%' }]}>
                        <Spinner color="white" />
                      </div>
                    )}
                    <button
                      css={styles.play}
                      onClick={() => this.setState({ trailer: trailers[0].key })}
                      style={{ color: palette.color, opacity: trailer ? 0 : 1, zIndex: trailer ? 0 : 1 }}
                    >
                      <Play />
                    </button>
                    <ReactPlayer
                      url={`https://www.youtube.com/watch?v=${trailer}`}
                      controls={true}
                      playing={true}
                      height="100%"
                      width="100%"
                      style={{
                        position: 'absolute',
                        opacity: trailer ? 1 : 0,
                        transition: `opacity 400ms ease-in-out ${trailer ? '500ms' : '0ms'}`,
                        zIndex: trailer ? 1 : 0,
                      }}
                    />
                  </>
                )}
              </div>
              <div css={styles.about}>
                <div>
                  <div css={styles.poster} style={trailer ? { margin: 0 } : {}}>
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
                    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h1 css={styles.title}>
                        {details.title}
                      </h1>
                      <State entity={details} compact={false} />
                    </div>
                    <h2 css={styles.subtitle}>
                      {details.title !== details.original_title && (
                        <span>{details.original_title}</span>
                      )}
                      {details.title !== details.original_title && details.release_date && (
                        <span> </span>
                      )}
                      {details.release_date && (
                        <span title={new Date(details.release_date).toLocaleDateString()}>
                          ({new Date(details.release_date).getFullYear()})
                        </span>
                      )}
                    </h2>
                    <p css={styles.metadata}>
                      {!!details.runtime && (
                        <span>
                          🕙 &nbsp;<strong>{details.runtime}</strong> mins
                        </span>
                      )}
                      {!!details.genres.length && (
                        <span>
                          🎟️ &nbsp;{details.genres.map(genre => genre.name).join(', ')}
                        </span>
                      )}
                      {typeof details.vote_average !== 'undefined' && (
                        <span>
                          {new Documents.Movie(details).judge()} &nbsp;<strong>{details.vote_average.toFixed(1)}</strong>
                        </span>
                      )}
                    </p>
                    {!!details.tagline && (
                      <h3 style={styles.tagline}>{details.tagline}</h3>
                    )}
                    <p style={styles.plot}>{details.overview}</p>
                  </div>
                </div>
                <div css={styles.list}>
                  <List
                    label={(
                      <Label
                        id="more"
                        value={more}
                        onChange={(value) => this.setState({ more: value })}
                        options={[
                          ...(details.belongs_to_collection ? [
                            { value: 'collection', label: `📀 ${(details.belongs_to_collection || {}).name}` }
                          ] : []),
                          { value: 'recommendations', label: '💬 Recommendations' },
                          { value: 'similar', label: '👯 Similar' },
                          { value: 'casting', label: '👩‍🎤️ Casting' },
                          { value: 'crew', label: '🎬 Crew' },
                        ]}
                      >
                        {{
                          collection: `📀 ${(details.belongs_to_collection || {}).name}`,
                          recommendations: '💬 Recommendations',
                          similar: '👯 Similar',
                          casting: '👩‍🎤️ Casting',
                          crew: '🎬 Crew',
                        }[more]}
                      </Label>
                    )}
                    {...(more === 'collection' ? {
                      uri: ['collection', details.belongs_to_collection.id],
                      transform: (res) => [...res.parts].sort((a, b) => new Date(a.release_date || null) - new Date(b.release_date || null)),
                    } : {
                      items: {
                        recommendations: details.recommendations.results,
                        similar: details.similar.results,
                        casting: details.credits.cast,
                        crew: details.credits.crew,
                      }[more]
                    })}
                    prettify={more === 'collection' ? Infinity : 5}
                    placeholder={true}
                    child={{
                      collection: Film,
                      recommendations: Film,
                      similar: Film,
                      casting: Persona,
                      crew: Persona,
                    }[more]}
                    empty={{ style: styles.empty }}
                  />
                </div>
              </div>
              <Button
                look={1}
                onClick={() => this.setState({ releases: uuidv4() })}
                style={{
                  color: palette.color,
                  borderColor: palette.color,
                  textTransform: 'uppercase',
                  borderWidth: '0.3em',
                  margin: '1em',
                  fontWeight: 800,
                }}
              >
                {releases ? 'Retry' : 'Find Releases'}
              </Button>
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
          {releases && (
            <Releases key={releases} movie={details} />
          )}
        </div>
      </Fragment>
    )
  }
}
