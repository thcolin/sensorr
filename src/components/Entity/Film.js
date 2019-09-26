import React, { PureComponent, useState } from 'react'
import PropTypes from 'prop-types'
import { usePrevious } from 'hooks'
import { Link } from 'react-router-dom'
import Color from 'color'
import Badge from 'components/Badge'
import tmdb from 'store/tmdb'
import database from 'store/database'
import { Movie } from 'shared/Documents'
import { GENRES } from 'shared/services/TMDB'
import { truncate } from 'shared/utils/string'
import palette from 'utils/palette'
import uuidv4 from 'uuid/v4'
import theme from 'theme'

const styles = {
  pretty: {
    element: {
      position: 'relative',
      display: 'flex',
      width: '35em',
      margin: '3em 0 0 0',
    },
    backdrop: {
      position: 'absolute',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      '>*': {
        position: 'absolute',
        height: '100%',
        width: '100%',
      },
      '>div': {
        transition: 'box-shadow 400ms ease-in-out',
      },
      '>img': {
        objectFit: 'cover',
        objectPosition: 'center center',
        transition: 'opacity 400ms ease-in-out, filter 400ms ease-in-out 400ms',
      },
    },
    poster: {
      flexShrink: 0,
      margin: '-3em 0 0 0',
      padding: '0 0 2em 1.5em',
    },
    about: {
      position: 'relative',
      flex: 1,
      padding: '1.5em',
      transition: 'opacity 400ms ease-in-out',
      '>h1': {
        fontSize: '1.5em',
        fontWeight: 'bold',
        margin: '0 0 0.5em 0',
        transition: 'color 400ms ease-in-out',
      },
      '>div': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0 0 0.5em 0',
        fontFamily: theme.fonts.secondary,
        transition: 'color 400ms ease-in-out',
      },
      '>p': {
        transition: 'color 400ms ease-in-out',
        '&:not(:last-of-type)': {
          margin: '0 0 1em 0',
        },
      },
    },
  },
  card: {
    element: {
      display: 'flex',
      alignItems: 'center',
      width: '30em',
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
      transition: 'opacity 400ms ease-in-out',
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
  },
  poster: {
    element: {
      position: 'relative',
      display: 'block',
      overflow: 'hidden',
      height: '15em',
      width: '10em',
      backgroundColor: theme.colors.grey,
      transition: 'background-color 400ms ease-in-out',
      zIndex: 0,
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
      transition: 'opacity 400ms ease-in-out 400ms',
    },
    link: {
      display: 'block',
      height: '100%',
      cursor: 'pointer',
    },
    img: {
      height: '100%',
      width: '100%',
      objectFit: 'cover',
      objectPosition: 'center center',
      transition: 'opacity 400ms ease-in-out, filter 400ms ease-in-out 400ms',
    },
  },
  state: {
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
}

export default class Film extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    link: PropTypes.func,
    subtitle: PropTypes.node,
    display: PropTypes.oneOf(['default', 'pretty', 'card']),
    withState: PropTypes.bool,
  }

  static defaultProps = {
    link: (entity) => `/movie/${entity.id}`,
    subtitle: '',
    display: 'default',
    withState: true,
  }

  constructor(props) {
    super(props)

    this.state = {
      poster: null,
      backdrop: null,
      palette: {
        backgroundColor: theme.colors[{ default: 'gray', pretty: 'rangoon', card: 'gray'}[props.display]],
        color: '#ffffff',
        alternativeColor: '#ffffff',
        negativeColor: '#ffffff',
      },
    }
  }

  componentDidMount() {
    if (this.props.display === 'pretty') {
      const { poster_path, backdrop_path } = this.props.entity

      if (poster_path) {
        this.fetchImg(`https://image.tmdb.org/t/p/w342${poster_path}`, (value) => this.setState({ poster: value }), { palette: true })
      }

      if (backdrop_path) {
        this.fetchImg(`https://image.tmdb.org/t/p/w780${backdrop_path}`, (value) => this.setState({ backdrop: value }))
      }
    }
  }

  componentDidUpdate(props) {
    if (this.props.display === 'pretty' && props.entity.id !== this.props.entity.id) {
      const { poster_path, backdrop_path } = this.props.entity

      this.setState(state => ({
        poster: null,
        backdrop: null,
        palette: {
          backgroundColor: state.palette.backgroundColor,
          color: Color(state.palette.backgroundColor).isDark() ? '#ffffff' : '#000000',
          alternativeColor: Color(state.palette.backgroundColor).isDark() ? '#ffffff' : '#000000',
          negativeColor: Color(state.palette.backgroundColor).isDark() ? '#ffffff' : '#000000'
        },
      }))

      if (poster_path) {
        this.fetchImg(`https://image.tmdb.org/t/p/w342${poster_path}`, (value) => this.setState({ poster: value }), { palette: true })
      }

      if (backdrop_path) {
        this.fetchImg(`https://image.tmdb.org/t/p/w780${backdrop_path}`, (value) => this.setState({ backdrop: value }))
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
    const { entity, display, link, ...props } = this.props
    const { poster, backdrop, palette, ...state } = this.state

    const title = entity.title || entity.original_title || entity.name || entity.original_name || ''

    switch (display) {
      case 'default':
        return (
          <Poster {...this.props} />
        )
      case 'pretty':
        return (
          <div css={styles.pretty.element}>
            <div css={styles.pretty.backdrop}>
              <img
                src={backdrop}
                style={{
                  opacity: backdrop ? 1 : 0,
                  // filter: `blur(${backdrop ? '0.125rem' : '3rem'})`,
                  ...(!backdrop ? { transition: 'none' } : {}),
                }}
              />
              <div style={{ boxShadow: `inset 0 0 0 100em ${Color(palette.backgroundColor).fade(0.3).rgb().string()}` }} />
            </div>
            <div css={styles.pretty.poster}>
              <Poster {...this.props} img={poster} style={{ backgroundColor: Color(palette.backgroundColor).rgb().string() }} />
            </div>
            {entity.id && (
              <div
                css={styles.pretty.about}
                style={{
                  opacity: (backdrop || entity.backdrop_path === null) ? 1 : 0,
                  ...((!backdrop && entity.backdrop_path !== null) ? { transition: 'none' } : {}),
                }}
              >
                <h1 style={{ color: palette.color }} {...(title.length > 45 ? { title } : {})}>
                  {title.length > 45 ? `${title.substring(0, 45)}...` : title}
                </h1>
                {(entity.release_date || entity.vote_average) && (
                  <div style={{ color: palette.negativeColor }} >
                    {!!entity.release_date && (
                      <small>
                        <span>📆  </span>
                        <span>
                          {new Date(entity.release_date).toLocaleString(global.config.region, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </span>
                      </small>
                    )}
                    {typeof entity.vote_average !== 'undefined' && (
                      <small>
                        <span>{new Movie(entity).judge()}  </span>
                        <strong>{entity.vote_average.toFixed(1)}</strong>
                      </small>
                    )}
                  </div>
                )}
                {Array.isArray(entity.genre_ids) && (
                  <p style={{ color: palette.alternativeColor }}>
                    <small><strong>{entity.genre_ids.map(id => GENRES[id]).join(', ')}</strong></small>
                  </p>
                )}
                {!!entity.overview && (
                  <p style={{ color: palette.negativeColor }}>
                    <small>{truncate(entity.overview, 200)}</small>
                  </p>
                )}
              </div>
            )}
          </div>
        )
      case 'card':
        return (
          <div css={styles.card.element}>
            <Poster {...this.props} css={styles.card.poster} />
            {entity.id && (
              <Link to={link(entity)} css={styles.card.container}>
                <h1 {...(title.length > 45 ? { title } : {} )}>
                  {title.length > 45 ? `${title.substring(0, 45)}...` : title}
                </h1>
                {(entity.release_date || typeof entity.vote_average !== 'undefined') && (
                  <span>
                    {!!entity.release_date && (
                      <small>
                        <span>📆  </span>
                        <span>
                          {new Date(entity.release_date).toLocaleString(global.config.region, { year: 'numeric', month: '2-digit', day: '2-digit' })}
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
          </div>
        )
      default:
        return null
    }
  }
}

export const Poster = ({ entity, img, subtitle, link, display, withState, ...props }) => {
  const [ready, setReady] = useState(false)
  const previous = usePrevious(entity)

  if (previous && ready && previous.poster_path !== entity.poster_path) {
    setReady(false)
  }

  return (
    <span
      {...props}
      title={`${entity.title || entity.name}${(entity.year || entity.release_date) ? ` (${entity.year || new Date(entity.release_date).getFullYear()})` : ''}${subtitle ? ` - ${subtitle}` : ''}`}
      css={[styles.poster.element, !entity.poster_path && entity.poster_path !== false && styles.poster.empty, props.css]}
    >
      {withState && (
        <State entity={entity} css={styles.poster.state} style={{ opacity: ready ? 1 : 0, ...(!ready ? { transition: 'none' } : {}) }} />
      )}
      <Link to={link(entity)} css={styles.poster.link}>
        <img
          src={{
            default: `https://image.tmdb.org/t/p/w300${entity.poster_path}`,
            pretty: img,
            card: `https://image.tmdb.org/t/p/w300${entity.poster_path}`,
          }[display]}
          css={styles.poster.img}
          style={{
            opacity: ready ? 1 : 0,
            // ...(display === 'pretty' ? { filter: `blur(${ready ? 0 : '3rem'})` } : {}),
            ...(!ready ? { transition: 'none' } : {}),
          }}
          onLoad={() => setReady(true)}
        />
      </Link>
    </span>
  )
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
      <div {...props} css={[styles.state.element, props.css]}>
        <label htmlFor={id} css={styles.state.label}>
          {current !== 'loading' && (
            <select id={id} value={current} onChange={this.handleStateChange} css={styles.state.select}>
              {Object.keys(options).filter(key => !['loading'].includes(key)).map(key => (
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
      </div>
    )
  }
}
