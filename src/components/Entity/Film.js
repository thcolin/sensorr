import React, { PureComponent, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { from } from 'rxjs'
import { Link } from 'react-router-dom'
import Persona from 'components/Entity/Persona'
import Backdrop from 'components/UI/Backdrop'
import Badge from 'components/Badge'
import tmdb from 'store/tmdb'
import database from 'store/database'
import { Movie } from 'shared/Documents'
import { GENRES } from 'shared/services/TMDB'
import { truncate } from 'shared/utils/string'
import palette from 'utils/palette'
import { humanize } from 'shared/utils/string'
import uuidv4 from 'uuid/v4'
import theme from 'theme'

export default class Film extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    link: PropTypes.func,
    focus: PropTypes.oneOf(['vote_average', 'release_date', 'release_date_full', 'popularity', 'runtime']),
    display: PropTypes.oneOf(['default', 'pretty', 'card']),
    palette: PropTypes.object,
    placeholder: PropTypes.bool,
    withState: PropTypes.bool,
    withHover: PropTypes.bool,
    withCredits: PropTypes.bool,
  }

  static defaultProps = {
    link: (entity) => `/movie/${entity.id}`,
    focus: null,
    display: 'default',
    palette: {},
    placeholder: false,
    withState: true,
    withHover: true,
    withCredits: false,
  }

  static placeholder = ({ withCredits, ...props }) => ({
    poster_path: false,
    ...(withCredits ? {
      credits: [
        { profile_path: false },
        { profile_path: false },
      ]
    } : {}),
  })

  static validate = (entity) => !!(entity || {}).poster_path

  static styles = {
    pretty: {
      element: {
        position: 'relative',
        display: 'flex',
        height: '100%',
        width: '35em',
        padding: '3em 0 0 0',
      },
      backdrop: {
        position: 'absolute',
        height: 'calc(100% - 3em)',
        width: '100%',
        overflow: 'hidden',
      },
      poster: {
        position: 'relative',
        flexShrink: 0,
        margin: '-3em 0 0 0',
        padding: '0 0 2em 1.5em',
      },
      about: {
        position: 'relative',
        flex: 1,
        margin: '1.25em 1.5em',
        overflowY: 'auto',
        '>h1': {
          fontSize: '1.5em',
          fontWeight: 'bold',
          margin: '0 0 0.5em 0',
        },
        '>div': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 0.5em 0',
          fontFamily: theme.fonts.secondary,
        },
        '>p': {
          '&:not(:last-of-type)': {
            margin: '0 0 1em 0',
          },
        },
      },
      credit: {
        position: 'absolute',
        top: '2em',
        marginLeft: '-2em',
        fontSize: '0.375em',
      },
    },
    card: {
      element: {
        display: 'flex',
        alignItems: 'center',
        width: '25em',
      },
      poster: {
        fontSize: '0.4em',
      },
      container: {
        ...theme.resets.a,
        flex: 1,
        padding: '0 0 0 1em',
        fontSize: '0.75em',
        color: theme.colors.rangoon,
        '>h1': {
          fontSize: '1em',
          fontWeight: 'bold',
          margin: '0 0 0.5em 0',
        },
        '>span': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 0.5em 0',
          fontFamily: theme.fonts.secondary,
        },
        '>p': {
          '&:not(:last-of-type)': {
            margin: '0 0 0.5em 0',
          },
        },
      },
      state: {
        alignSelf: 'flex-start',
        fontSize: '0.8em',
        margin: '0 0 0 2em',
      },
    },
  }

  constructor(props) {
    super(props)

    this.state = {
      entity: props.entity,
      ready: {
        entity: true,
        poster: !props.entity.poster_path,
        background: !props.entity.backdrop_path || props.display !== 'pretty',
        palette: !props.entity.poster_path || props.display !== 'pretty',
      },
      palette: {
        backgroundColor: theme.colors.gray,
        color: theme.colors.rangoon,
        alternativeColor: theme.colors.rangoon,
        negativeColor: theme.colors.rangoon,
        ...(props.palette || {}),
      },
    }

    this.processing = null
  }

  componentDidMount() {
    const { entity, display } = this.props

    if (display === 'pretty' && entity.poster_path) {
      this.processing = from(
        this.fetchPalette(`https://image.tmdb.org/t/p/w92${entity.poster_path}`)
      ).subscribe(
        palette => this.setState(state => ({ palette, ready: { ...state.ready, palette: true } })),
      )
    }
  }

  componentDidUpdate(props) {
    const { entity, display, palette } = this.props
    const { ready, ...state } = this.state

    if (entity.id !== props.entity.id) {
      this.setState({
        ready: {
          entity: false,
          poster: state.entity.id === entity.id || !entity.poster_path,
          background: state.entity.id === entity.id || !entity.backdrop_path || display !== 'pretty',
          palette: !entity.poster_path || display !== 'pretty',
        },
        ...(!entity.poster_path && entity.id ? {
          palette: {
            backgroundColor: theme.colors.gray,
            color: theme.colors.rangoon,
            alternativeColor: theme.colors.rangoon,
            negativeColor: theme.colors.rangoon,
            // ...(palette || {}),
          },
        } : {})
      })

      if (display === 'pretty' && entity.poster_path) {
        if (this.processing) {
          this.processing.unsubscribe()
        }

        this.processing = from(
          this.fetchPalette(`https://image.tmdb.org/t/p/w92${entity.poster_path}`)
        ).subscribe(
          palette => this.setState(state => ({ palette, ready: { ...state.ready, palette: true } })),
        )
      }
    } else if (
      !ready.entity &&
      !!entity.id &&
      (
        entity.id !== this.state.entity.id ||
        Object.keys(ready).filter(key => !['entity'].includes(key)).every(key => ready[key])
      )
    ) {
      this.setState(state => ({
        entity: entity,
        ready: {
          ...state.ready,
          entity: true,
        }
      }))
    }
  }

  componentWillUnmount() {
    if (this.processing) {
      this.processing.unsubscribe()
    }
  }

  fetchPalette = async (src) => new Promise(resolve => {
    const cache = sessionStorage.getItem(src)

    if (cache) {
      resolve(JSON.parse(cache))
    } else {
      palette(src, (palette) => {
        try {
          sessionStorage.setItem(src, JSON.stringify(palette))
        } catch (e) {} finally {
          resolve(palette)
        }
      })
    }
  })

  render() {
    const { display, link, placeholder, withCredits, ...props } = this.props
    const { entity, palette, ...state } = this.state

    const title = entity.title || entity.original_title || entity.name || entity.original_name || ''
    const ready = !!entity.id && Object.values(state.ready).every(bool => bool)

    switch (display) {
      case 'default':
        return (
          <Poster
            {...this.props}
            entity={entity}
            onLoad={() => this.setState(state => ({ ready: { ...state.ready, poster: true } }))}
            ready={ready}
          />
        )
      case 'pretty':
        return (
          <div css={Film.styles.pretty.element}>
            <div css={Film.styles.pretty.backdrop}>
              <Backdrop
                src={entity.backdrop_path}
                ready={ready}
                palette={palette}
                width={780}
                fade={0.2}
                onReady={() => this.setState(state => ({ ready: { ...state.ready, background: true } }))}
              />
            </div>
            <div css={Film.styles.pretty.poster}>
              <Poster
                {...this.props}
                entity={entity}
                img={entity.poster_path && `https://image.tmdb.org/t/p/w300${entity.poster_path}`}
                onLoad={() => this.setState(state => ({ ready: { ...state.ready, poster: true } }))}
                palette={palette}
                ready={ready}
                withHover={false}
                withCredits={false}
              />
            </div>
            {entity.id && (
              <div
                css={Film.styles.pretty.about}
                style={{
                  opacity: ready ? 1 : 0,
                  transition: 'opacity 400ms ease-in-out',
                  transitionDelay: ready ? '400ms' : '0ms',
                }}
              >
                <h1 style={{ color: palette.color }} {...(title.length > 45 ? { title } : {})}>
                  <Link to={link(entity)} css={theme.resets.a}>
                    {title.length > 45 ? `${title.substring(0, 45)}...` : title}
                  </Link>
                </h1>
                {!!(entity.release_date || entity.vote_average) && (
                  <div style={{ color: palette.negativeColor }} >
                    {!!entity.release_date && (
                      <small>
                        <span>📆  </span>
                        <Link
                          to={{
                            pathname: '/movies/discover',
                            state: {
                              controls: {
                                filtering: {
                                  release_date: [
                                    new Date(entity.release_date).getFullYear(),
                                    new Date(entity.release_date).getFullYear(),
                                  ],
                                },
                              },
                            },
                          }}
                          css={theme.resets.a}
                        >
                          {new Date(entity.release_date).toLocaleString(global.config.region, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </Link>
                      </small>
                    )}
                    {typeof entity.vote_average !== 'undefined' && (
                      <small>
                        <span>{new Movie(entity).judge()}  </span>
                        <Link
                          to={{
                            pathname: '/movies/discover',
                            state: {
                              controls: {
                                filtering: {
                                  vote_average: [
                                    entity.vote_average.toFixed(0) - 1,
                                    entity.vote_average.toFixed(0),
                                  ],
                                },
                              },
                            },
                          }}
                          css={theme.resets.a}
                        >
                          <strong>{entity.vote_average.toFixed(1)}</strong>
                        </Link>
                      </small>
                    )}
                  </div>
                )}
                {Array.isArray(entity.genre_ids) && (
                  <p style={{ color: palette.alternativeColor }}>
                    {entity.genre_ids.map((id, index, arr) => (
                      <span key={id}>
                        <Link
                          to={{
                            pathname: '/movies/discover',
                            state: {
                              controls: {
                                filtering: {
                                  with_genres: [{ value: id, label: GENRES[id] }],
                                },
                              },
                            },
                          }}
                          css={theme.resets.a}
                        >
                          <small><strong>{GENRES[id]}</strong></small>
                        </Link>
                        {index === arr.length - 1 ? '' : ', '}
                      </span>
                    ))}
                  </p>
                )}
                {!!entity.overview && (
                  <p style={{ color: palette.negativeColor }}>
                    <small>{truncate(entity.overview, 200)}</small>
                  </p>
                )}
              </div>
            )}
            {withCredits && (
              <span
                style={{
                  opacity: ready ? 1 : 0,
                  transition: 'opacity 400ms ease-in-out',
                  transitionDelay: ready ? '800ms' : '0ms',
                }}
              >
                {(entity.credits || []).map((star, index) => (
                  <Persona
                    entity={star}
                    display="avatar"
                    withState={false}
                    key={index}
                    css={Film.styles.pretty.credit}
                    style={{ right: `${index * 6}em` }}
                  />
                ))}
              </span>
            )}
          </div>
        )
      case 'card':
        return (
          <div css={Film.styles.card.element}>
            <Poster
              {...this.props}
              entity={entity}
              withHover={false}
              withState={false}
              onLoad={() => this.setState(state => ({ ready: { ...state.ready, poster: true } }))}
              ready={ready}
              css={Film.styles.card.poster}
            />
            {entity.id && (
              <Link to={link(entity)} css={Film.styles.card.container}>
                <h1 {...(title.length > 45 ? { title } : {} )}>
                  {title.length > 45 ? `${title.substring(0, 45)}...` : title}
                </h1>
                {(entity.release_date || typeof entity.vote_average !== 'undefined') && (
                  <span>
                    {!!entity.release_date && (
                      <small>
                        <span>📆  </span>
                        <span>
                          {new Date(entity.release_date).toLocaleString(global.config.region, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                      </small>
                    )}
                    {typeof entity.vote_average !== 'undefined' && (
                      <small>
                        <span>{new Movie(entity).judge()}  </span>
                        <strong>{entity.vote_average.toFixed(1)}</strong>
                      </small>
                    )}
                  </span>
                )}
                {Array.isArray(entity.genre_ids) && (
                  <p>
                    <small><strong>{entity.genre_ids.map(id => GENRES[id]).join(', ')}</strong></small>
                  </p>
                )}
                {!!entity.overview && (
                  <p>
                    <small>{truncate(entity.overview, 200)}</small>
                  </p>
                )}
              </Link>
            )}
            {typeof entity.vote_average !== 'undefined' && (
              <State entity={entity} css={Film.styles.card.state} />
            )}
          </div>
        )
      default:
        return null
    }
  }
}

export const Poster = ({ entity, img, palette = {}, focus, link, display, placeholder, withState, withHover, withCredits, onLoad, onError, ready = true, ...props }) => {
  const [loaded, setLoaded] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (entity.id && !img && !entity.poster_path) {
      setLoaded(true)
    }

    else {
      setLoaded(false)
    }
  }, [(entity || {}).poster_path, img])

  return (
    <span onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span
        {...(withHover ? {} : {
          title: `${
            entity.title || entity.original_title || entity.name || entity.original_name || ''
          }${
            (entity.year || entity.release_date) ? ` (${entity.year || new Date(entity.release_date).getFullYear()})` : ''
          }`,
        })}
        {...props}
        css={[
          Poster.styles.element,
          placeholder && !entity.id && display !== 'pretty' && theme.styles.placeholder.animated,
          (!img && !entity.poster_path) && entity.id && ready && Poster.styles.empty,
          props.css
        ]}
        style={{
          backgroundColor: palette.backgroundColor || theme.colors.grey,
          transition: 'background-color 400ms ease-in-out, background-image 400ms ease-in-out',
        }}
      >
        <span css={Poster.styles.container}>
          {withState && (
            <State
              entity={entity}
              css={Poster.styles.state}
              style={{
                opacity: (loaded && ready) ? 1 : 0,
                transition: 'opacity 400ms ease-in-out',
                transitionDuration: (loaded && ready) ? '400ms' : '0ms',
                transitionDelay: (loaded && ready) ? '800ms' : '0ms',
              }}
            />
          )}
          <Link
            to={(link && entity.id) ? link(entity) : ''}
            css={[Poster.styles.link, (!link || !entity.id) && { pointerEvents: 'none' }]}
          >
            {(withHover || focus) && (
              <Focus
                entity={entity}
                property={(!hover && focus) || 'vote_average'}
                css={Poster.styles.focus}
                style={{
                  opacity: (loaded && ready && (hover || focus)) ? 1 : 0,
                  transition: 'opacity 250ms ease-in-out',
                  transitionDuration: (loaded && ready && focus) ? '400ms' : '250ms',
                  transitionDelay: (loaded && ready && focus) ? '800ms' : '0ms',
                }}
              />
            )}
            <img
              css={Poster.styles.img}
              style={{
                opacity: (loaded && ready && (img || entity.poster_path)) ? 1 : 0,
                transition: 'opacity 400ms ease-in-out',
                transitionDuration: ((loaded && ready) || display === 'pretty') ? '400ms' : '250ms',
                transitionDelay: (loaded && ready) ? '400ms' : '0ms',
              }}
              onLoad={() => {
                setLoaded(true)

                if (typeof onLoad === 'function') {
                  onLoad()
                }
              }}
              onError={() => {
                setLoaded(true)

                if (typeof onError === 'function') {
                  onError()
                }
              }}
              {...((img || entity.poster_path) ? {
                src: img || (entity.poster_path && `https://image.tmdb.org/t/p/w300${entity.poster_path}`),
              } : {})}
            />
            {withHover && (
              <span
                css={Poster.styles.hover}
                style={{
                  transform: `translateY(${(loaded && ready && hover) ? '0%' : 'calc(100% + 1px)'})`,
                  ...(withCredits ? { paddingBottom: '6em' } : {}),
                }}
              >
                <span>
                  <strong>{`${entity.title || entity.original_title || entity.name || entity.original_name || ''}`}</strong>
                  {(entity.year || entity.release_date) && (
                    <span> ({entity.year || new Date(entity.release_date).getFullYear()})</span>
                  )}
                </span>
                {(Array.isArray(entity.genre_ids) || Array.isArray(entity.genres)) && (
                  <span>
                    <small>{(entity.genre_ids || entity.genres).map(id => GENRES[id]).join(', ')}</small>
                  </span>
                )}
              </span>
            )}
          </Link>
        </span>
      </span>
      {withCredits && (
        <span
          css={Poster.styles.credits}
          style={{
            opacity: (loaded && ready) ? 1 : 0,
            transition: 'opacity 400ms ease-in-out',
            transitionDelay: (loaded && ready) ? '800ms' : '0ms',
          }}
        >
          {(entity.credits || []).map((star, index) => (
            <span key={star.id || index}>
              <Persona
                entity={star}
                display="avatar"
                withState={false}
                key={star.id}
                css={Poster.styles.credit}
              />
            </span>
          ))}
        </span>
      )}
    </span>
  )
}

Poster.styles = {
  element: {
    position: 'relative',
    display: 'block',
    height: '15em',
    width: '10em',
    zIndex: 0,
  },
  container: {
    position: 'relative',
    display: 'block',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  empty: {
    backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAwIDI0MDAiPiAgPHBhdGggZmlsbD0iI2NjYyIgZD0iTTg4IDIyMTljLTI0LjcgMC00NS41LTguNS02Mi41LTI1LjVTMCAyMTU2IDAgMjEzMlYzMDdjMC0yNC43IDguNS00NS41IDI1LjUtNjIuNVM2My4zIDIxOSA4OCAyMTloMjIyNGMyNC43IDAgNDUuNSA4LjUgNjIuNSAyNS41czI1LjUgMzcuOCAyNS41IDYyLjV2MTgyNWMwIDI0LTguNSA0NC41LTI1LjUgNjEuNXMtMzcuOCAyNS41LTYyLjUgMjUuNUg4OHptMTEyLTMwMGw2MDYtNDAwYzI0LjcgMTAgNTYuNyAyMy4yIDk2IDM5LjVzMTA0LjUgNDYuMiAxOTUuNSA4OS41IDE2NC4yIDgyLjMgMjE5LjUgMTE3YzIyLjcgMTQuNyAzOS43IDIyIDUxIDIyIDEwIDAgMTUtNiAxNS0xOCAwLTIyLjctMTUtNTguMy00NS0xMDdzLTY4LTk3LjMtMTE0LTE0Ni04Ny43LTgxLTEyNS05N2MyOS4zLTI5LjMgNzQuMy03Ny4zIDEzNS0xNDRzMTEzLjctMTI2IDE1OS0xNzhsNjktNzggNS41LTUuNSAxNS41LTE0IDI0LTIwIDMwLTIxIDM2LTIwIDM5LTE0IDQxLTUuNWMxOCAwIDM3IDMuNSA1NyAxMC41czM3LjggMTUuMyA1My41IDI1IDMwIDE5LjMgNDMgMjkgMjMuMiAxOC4yIDMwLjUgMjUuNWwxMCAxMCAzNTMgMzU4VjQxOUgyMDB2MTUwMHptNDAwLTg4MWMtNjAgMC0xMTEuNS0yMS41LTE1NC41LTY0LjVTMzgxIDg3OSAzODEgODE5czIxLjUtMTExLjUgNjQuNS0xNTQuNVM1NDAgNjAwIDYwMCA2MDBjMzkuMyAwIDc1LjggOS44IDEwOS41IDI5LjVzNjAuMyA0Ni4zIDgwIDgwUzgxOSA3NzkuNyA4MTkgODE5YzAgNjAtMjEuNSAxMTEuNS02NC41IDE1NC41UzY2MCAxMDM4IDYwMCAxMDM4eiIvPjwvc3ZnPg==)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '50%',
  },
  state: {
    position: 'absolute',
    right: '0.5em',
    top: '0.5em',
  },
  link: {
    display: 'block',
    height: '100%',
  },
  focus: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  img: {
    position: 'relative',
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
  },
  hover: {
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: theme.colors.shadows.black,
    color: 'white',
    padding: '1em',
    fontSize: '0.7em',
    transition: 'transform 250ms ease-in-out',
    '>span': {
      display: 'block',
      '&:first-of-type': {
        lineHeight: 1.25,
      },
      '&:not(:last-child)': {
        margin: '0 0 0.5em 0',
      },
    },
  },
  credits: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: '-3.5em 0 0 -0.5em',
  },
  credit: {
    marginLeft: '-2em',
    fontSize: '0.375em',
  },
}

export class State extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    compact: PropTypes.bool,
  }

  static defaultProps = {
    compact: true,
  }

  constructor(props) {
    super(props)

    this.state = {
      doc: false,
      id: uuidv4(),
    }

    this.bootstrap = this.bootstrap.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
  }

  componentDidMount() {
    this.bootstrap()
  }

  componentDidUpdate(props) {
    if (props.entity.id !== this.props.entity.id) {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }

      this.bootstrap()
    }
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  async bootstrap() {
    try {
      this.setState({ doc: false })
      const db = await database.get()
      const query = db.movies.findOne().where('id').eq(this.props.entity.id.toString())
      const doc = await query.exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
      this.subscription = query.$.subscribe(doc => this.setState({ doc: doc ? doc.toJSON() : null }))
    } catch(e) {}
  }

  async handleStateChange(e) {
    const value = e.target.value
    const db = await database.get()
    let entity = this.props.entity

    if (!entity.alternative_titles || !entity.release_dates) {
      try {
        entity = await tmdb.fetch(
          ['movie', entity.id],
          { append_to_response: 'alternative_titles,release_dates' }
        )
      } catch (e) {
        console.warn(e)
        entity.alternative_titles = {}
        entity.release_dates = {}
      }
    }

    if (this.state.doc === false) {
      return
    }

    const movie = new Movie({ ...entity, state: value }, global.config.region || localStorage.getItem('region')).normalize()
    const doc = await db.movies.atomicUpsert(movie)
    this.setState({ doc: doc.toJSON(), entity })
  }

  render() {
    const { entity, compact, ...props } = this.props
    const { id, doc, ...state } = this.state

    const options = {
      loading: {
        emoji: '⌛',
        label: 'Loading',
      },
      ignored: {
        emoji: '🔕',
        label: 'Ignored',
      },
      missing: {
        emoji: '💊',
        label: 'Missing',
      },
      pinned: {
        emoji: '📍',
        label: 'Pinned',
      },
      wished: {
        emoji: '🍿',
        label: 'Wished',
      },
      archived: {
        emoji: '📼',
        label: 'Archived',
      },
    }

    let current = 'loading'

    if (doc === null || (doc && doc.state === 'ignored')) {
      current = 'ignored'
    } else if (doc && doc.state === 'missing') {
      current = 'missing'
    } else if (doc && doc.state === 'pinned') {
      current = 'pinned'
    } else if (doc && doc.state === 'wished') {
      current = 'wished'
    } else if (doc && doc.state === 'archived') {
      current = 'archived'
    } else {
      current = 'loading'
    }

    return (
      <span {...props} css={[State.styles.element, props.css]}>
        <label htmlFor={id} css={State.styles.label}>
          {current !== 'loading' && (
            <select id={id} value={current} onChange={this.handleStateChange} css={State.styles.select}>
              {Object.keys(options).filter(key => !['loading', 'missing'].includes(key)).map(key => (
                <option key={key} value={key}>{options[key].emoji} - {options[key].label}</option>
              ))}
            </select>
          )}
          <Badge
            emoji={options[current].emoji}
            title={options[current].label}
            {...(compact ? {} : { label: options[current].label })}
            {...(current === 'loading' ? { style: { cursor: 'default' } } : {})}
            {...(current !== 'loading' ? { onClick: this.handleStateChange } : {})}
          />
        </label>
      </span>
    )
  }
}

State.styles = {
  element: {
    zIndex: 1,
  },
  label: {
    position: 'relative',
    display: 'flex',
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

export const Focus = ({ entity, property, ...props }) => {
  if (!entity.id) {
    return null
  }

  const badges = {
    vote_average: {
      emoji: new Movie(entity).judge(),
      label: `${(entity.vote_average || 0).toFixed(1)}`,
    },
    release_date_full: {
      emoji: '📅',
      label: entity.release_date ? new Date(entity.release_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }) : 'Unknown',
    },
    release_date: {
      emoji: '📅',
      label: entity.release_date ? new Date(entity.release_date).getFullYear() : 'Unknown',
    },
    popularity: {
      emoji: '📣',
      label: `${humanize.bigint(entity.popularity)}`,
    },
    runtime: {
      emoji: '🕙',
      label: <span style={{ textTransform: 'none' }}>{new Movie(entity).duration() || 'Unknown'}</span>,
    },
    vote_count: {
      emoji: '🗳',
      label: `${humanize.bigint(entity.vote_count)}`,
    },
  }

  if (!Object.keys(badges).includes(property)) {
    return null
  }

  return (
    <span {...props}>
      <Badge
        emoji={badges[property].emoji}
        label={badges[property].label}
        style={Focus.styles.element}
      />
    </span>
  )
}

Focus.styles = {
  element: {
    padding: '0.5em 0.75em',
    margin: '1em 0.5em',
    fontSize: '0.75em',
  },
}
