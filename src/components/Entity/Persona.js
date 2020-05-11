import React, { PureComponent, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Badge from 'components/Badge'
import { Star } from 'shared/Documents'
import database from 'store/database'
import tmdb from 'store/tmdb'
import theme from 'theme'

export default class Persona extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    display: PropTypes.oneOf(['portrait', 'avatar', 'card']),
    link: PropTypes.func,
    withState: PropTypes.bool,
    placeholder: PropTypes.bool,
    title: PropTypes.string,
  }

  static defaultProps = {
    display: 'avatar',
    link: (entity) => `/star/${entity.id}`,
    withState: true,
    placeholder: true,
  }

  static placeholder = ({ ...props }) => ({
    profile_path: false,
  })

  static validate = (entity) => !!(entity || {}).profile_path

  static styles = {
    card: {
      element: {
        display: 'flex',
        alignItems: 'center',
        width: '20em',
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
          fontSize: '1.5em',
          fontWeight: 'bold',
          margin: '0 0 0.5em 0',
        },
      },
      state: {
        alignSelf: 'flex-start',
        fontSize: '0.8em',
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
      },
    }
  }

  componentDidUpdate(props) {
    const { entity } = this.props
    const { ready, ...state } = this.state

    if (entity.id !== props.entity.id) {
      this.setState({
        ready: {
          entity: false,
          poster: state.entity.id === entity.id || !entity.profile_path,
        },
      })
    } else if (
      (
        !ready.entity ||
        entity.character !== this.state.entity.character ||
        entity.job !== this.state.entity.job
      ) &&
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

  render() {
    const { display, link, ...props } = this.props
    const { entity, ...state } = this.state

    const name = entity.name || entity.original_name || ''
    const ready = !!entity.id && Object.values(state.ready).every(bool => bool)

    switch (display) {
      case 'portrait':
      case 'avatar':
        return (
          <Poster
            {...this.props}
            entity={entity}
            onLoad={() => this.setState(state => ({ ready: { ...state.ready, poster: true } }))}
            ready={ready}
          />
        )
      case 'card':
        return (
          <div css={Persona.styles.card.element}>
            <Poster
              {...this.props}
              entity={entity}
              onLoad={() => this.setState(state => ({ ready: { ...state.ready, poster: true } }))}
              display="portrait"
              title={null}
              withState={false}
              ready={ready}
              css={Persona.styles.card.poster}
            />
            {entity.id && (
              <Link to={link(entity)} css={Persona.styles.card.container}>
                <h1 {...(name.length > 45 ? { name } : {} )}>
                  {name.length > 45 ? `${name.substring(0, 45)}...` : name}
                </h1>
                <span>
                  💼 &nbsp; {entity.known_for_department}
                </span>
              </Link>
            )}
            <State entity={entity} css={Persona.styles.card.state} />
          </div>
        )
    }
  }
}

export const Poster = ({ entity, img, palette = {}, link, display, withState, placeholder, title, onLoad, onError, ready = true, ...props }) => {
  const [loaded, setLoaded] = useState(false)
  const [tooltip, setTooltip] = useState(false)

  useEffect(() => {
    if (entity.id && !img && !entity.profile_path) {
      setLoaded(true)
    }

    else {
      setLoaded(false)
    }
  }, [(entity || {}).profile_path, img])

  return (
    <span
      {...props}
      css={[Poster.styles.container, Poster.styles[display].container, props.css]}
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
    >
      <span css={[Poster.styles.wrapper,Poster.styles[display].wrapper]}>
        {!(!withState || (display !== 'portrait' && !tooltip)) && (
          <State
            entity={entity}
            css={Poster.styles[display].state}
            style={{
              opacity: (loaded && ready && entity.id) ? 1 : 0,
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
          <span css={[Poster.styles.element, Poster.styles[display].element]}>
            <span
              css={[
                Poster.styles.poster,
                Poster.styles[display].poster,
              ]}
              style={{
                backgroundColor: palette.backgroundColor || theme.colors.grey,
                transition: 'background 400ms ease-in-out',
              }}
            >
              <span
                css={Poster.styles.empty}
                style={{
                  backgroundColor: palette.color,
                  opacity: (loaded && ready && entity.id && !(img || entity.profile_path)) ? 1 : 0,
                  transition: 'opacity 400ms ease-in-out',
                  transitionDuration: (loaded && ready) ? '400ms' : '250ms',
                  transitionDelay: (loaded && ready) ? '400ms' : '0ms',
                }}
              />
              <img
                css={[Poster.styles.img, Poster.styles[display].img]}
                style={{
                  opacity: (loaded && ready && (img || entity.profile_path)) ? 1 : 0,
                  transition: 'opacity 400ms ease-in-out',
                  transitionDuration: (loaded && ready) ? '400ms' : '250ms',
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
                {...((img || entity.profile_path) ? {
                  src: img || `https://image.tmdb.org/t/p/w300${entity.profile_path}`,
                } : {})}
              />
            </span>
          </span>
        </Link>
      </span>
      {title !== null && (
        <h5
          css={[Poster.styles.tooltip, Poster.styles[display].tooltip]}
          title={title || `${entity.name}${entity.job ? ` (${entity.job})` : ''}${entity.character ? ` (${entity.character})` : ''}`}
          hidden={display !== 'portrait' && !tooltip}
          style={{
            opacity: (loaded && ready) ? 1 : 0,
            transition: 'opacity 400ms ease-in-out',
            transitionDelay: (loaded && ready) ? '800ms' : '0ms',
          }}
        >
          {title || (
            <>
              <strong css={Poster.styles.ellipsis}>{entity.name || ' '}</strong>
              {entity.job && (
                <span css={Poster.styles.ellipsis}>{entity.job}</span>
              )}
              {entity.character && (
                <span css={Poster.styles.ellipsis}>{entity.character}</span>
              )}
            </>
          )}
        </h5>
      )}
    </span>
  )
}

Poster.styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    width: '10em',
  },
  wrapper: {
    position: 'relative',
  },
  link: {
    textDecoration: 'none',
  },
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.colors.grey,
  },
  poster: {
    height: '14em',
    width: '10em',
    overflow: 'hidden',
    transition: 'opacity 400ms ease-in-out',
  },
  empty: {
    position: 'absolute',
    display: 'block',
    height: '100%',
    width: '100%',
    backgroundColor: theme.colors.gray,
    maskImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAwIDI0MDAiPiAgPHBhdGggZmlsbD0iI2NjYyIgZD0iTTg4IDIyMTljLTI0LjcgMC00NS41LTguNS02Mi41LTI1LjVTMCAyMTU2IDAgMjEzMlYzMDdjMC0yNC43IDguNS00NS41IDI1LjUtNjIuNVM2My4zIDIxOSA4OCAyMTloMjIyNGMyNC43IDAgNDUuNSA4LjUgNjIuNSAyNS41czI1LjUgMzcuOCAyNS41IDYyLjV2MTgyNWMwIDI0LTguNSA0NC41LTI1LjUgNjEuNXMtMzcuOCAyNS41LTYyLjUgMjUuNUg4OHptMTEyLTMwMGw2MDYtNDAwYzI0LjcgMTAgNTYuNyAyMy4yIDk2IDM5LjVzMTA0LjUgNDYuMiAxOTUuNSA4OS41IDE2NC4yIDgyLjMgMjE5LjUgMTE3YzIyLjcgMTQuNyAzOS43IDIyIDUxIDIyIDEwIDAgMTUtNiAxNS0xOCAwLTIyLjctMTUtNTguMy00NS0xMDdzLTY4LTk3LjMtMTE0LTE0Ni04Ny43LTgxLTEyNS05N2MyOS4zLTI5LjMgNzQuMy03Ny4zIDEzNS0xNDRzMTEzLjctMTI2IDE1OS0xNzhsNjktNzggNS41LTUuNSAxNS41LTE0IDI0LTIwIDMwLTIxIDM2LTIwIDM5LTE0IDQxLTUuNWMxOCAwIDM3IDMuNSA1NyAxMC41czM3LjggMTUuMyA1My41IDI1IDMwIDE5LjMgNDMgMjkgMjMuMiAxOC4yIDMwLjUgMjUuNWwxMCAxMCAzNTMgMzU4VjQxOUgyMDB2MTUwMHptNDAwLTg4MWMtNjAgMC0xMTEuNS0yMS41LTE1NC41LTY0LjVTMzgxIDg3OSAzODEgODE5czIxLjUtMTExLjUgNjQuNS0xNTQuNVM1NDAgNjAwIDYwMCA2MDBjMzkuMyAwIDc1LjggOS44IDEwOS41IDI5LjVzNjAuMyA0Ni4zIDgwIDgwUzgxOSA3NzkuNyA4MTkgODE5YzAgNjAtMjEuNSAxMTEuNS02NC41IDE1NC41UzY2MCAxMDM4IDYwMCAxMDM4eiIvPjwvc3ZnPg==)',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: '50%',
  },
  img: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
  },
  tooltip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    minHeight: '3.5em',
    backgroundColor: theme.colors.shadows.black,
    borderRadius: '0.25em',
    color: theme.colors.white,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    padding: '0.25em 0.5em',
    fontSize: '0.75em',
    lineHeight: 1.25,
    margin: 0,
    transition: 'opacity 400ms ease-in-out',
    '>span': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  ellipsis: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    width: '100%',
  },
  portrait: {
    container: {
      flexDirection: 'column',
    },
    wrapper: {},
    element: {},
    poster: {
      height: '13.5em',
    },
    state: {
      position: 'absolute',
      right: '0.75em',
      top: '0.75em',
      transition: 'opacity 400ms ease-in-out 400ms',
      zIndex: 1,
    },
    img: {},
    tooltip: {
      margin: '1.1667em 0 0 0',
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  avatar: {
    container: {
      position: 'relative',
      flexShrink: 0,
      margin: '0 -2em 0 0',
      padding: '0 0 1.5em',
      alignItems: 'flex-end',
    },
    wrapper: {
      borderRadius: '50%',
      border: 'solid 0.375em white',
      overflow: 'hidden',
    },
    element: {
      width: '10em',
    },
    poster: {
      height: '10em',
    },
    state: {
      position: 'absolute',
      width: '50%',
      height: '100%',
      right: 0,
      borderRadius: 0,
      padding: '0 0.5em 0 0',
      fontSize: '2em',
      transition: 'opacity 400ms ease-in-out 400ms',
      zIndex: 1,
    },
    img: {
      objectPosition: 'center 0%',
    },
    tooltip: {
      position: 'absolute',
      top: 'calc(100% - 0.5em)',
      fontSize: '2em',
      zIndex: 1,
    },
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
      loading: false,
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
      const query = db.stars.findOne().where('id').eq(this.props.entity.id.toString())
      const doc = await query.exec()
      this.setState({ doc: doc ? doc.toJSON() : null })
      this.subscription = query.$.subscribe(doc => this.setState({ doc: doc ? doc.toJSON() : null }))
    } catch(e) {}
  }

  async handleStateChange() {
    const db = await database.get()
    let entity = this.props.entity

    if (this.state.doc === false) {
      return
    }

    if (!this.state.doc || this.state.doc.state === 'ignored') {
      this.setState({ loading: true })
      const credits = await tmdb.fetch(['person', entity.id, 'movie_credits'])
      const doc = await db.stars.atomicUpsert(new Star({ ...entity, credits, state: 'stalked' }).normalize())
      this.setState({ loading: false, doc: doc.toJSON(), entity })
    } else if (this.state.doc.state === 'stalked') {
      const doc = await db.stars.atomicUpsert(new Star({ ...entity, state: 'ignored' }).normalize())
      this.setState({ doc: doc.toJSON(), entity })
    }
  }

  render() {
    const { entity, compact, ...props } = this.props
    const { doc, loading, ...state } = this.state

    if (doc === null || (doc && doc.state === 'ignored')) {
      return <Badge {...props} onClick={this.handleStateChange} emoji="🔕" label={(!compact && 'Ignored') || ''} />
    } else if (doc && doc.state === 'stalked') {
      return <Badge {...props} onClick={this.handleStateChange} emoji="🔔" label={(!compact && 'Following') || ''} />
    } else {
      return <Badge {...props} emoji="⌛" label={(!compact && 'Loading') || ''} style={{ ...(props.style || {}), cursor: 'default' }} />
    }
  }
}
