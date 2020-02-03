import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import Backdrop from 'components/UI/Backdrop'
import Empty from 'components/Empty'
import Trailer from './blocks/Trailer'
import Poster from './blocks/Poster'
import palette from 'utils/palette'
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
    padding: '0 0 1em 0',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 1em 0',
  },
  about: {
    position: 'relative',
    minHeight: '15em',
    background: 'white',
    transition: 'transform 400ms ease-in-out',
    margin: '0 0 7em',
    '>div:first-of-type': {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '2em 10%',
    },
  },
  info: {
    flex: 1,
    padding: '0 0 0 2em',
    '>div': {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
  },
  title: {
    fontSize: '2.5em',
    lineHeight: '1.25em',
    fontWeight: 800,
    color: theme.colors.rangoon,
    margin: '0 0 0.25em',
  },
  caption: {
    fontSize: '1.25em',
    lineHeight: '1.25em',
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
    '>span,>button': {
      lineHeight: '1.25em',
      margin: '0 0 1em',
      ':not(:last-child)': {
        marginRight: '2em',
      },
    }
  },
  subdata: {
    margin: '0 0 1em',
    '>div': {
      margin: '0 0 1em',
      '>span>a': {
        lineHeight: '1.25em',
        padding: '0 0.125em',
        fontWeight: 'normal',
        opacity: 0.6,
        ':hover': {
          opacity: 1,
        },
      },
    },
  },
  tagline: {
    color: theme.colors.rangoon,
    margin: '1em 0 0',
    fontWeight: 600,
  },
  state: {
    width: '15em',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  description: {
    margin: '1em 0 1em',
    lineHeight: '1.5em',
    color: theme.colors.rangoon,
    whiteSpace: 'pre-line',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

export default class Details extends PureComponent {
  static propTypes = {
    uri: PropTypes.array.isRequired,
    params: PropTypes.object,
    placeholder: PropTypes.object.isRequired,
    components: PropTypes.shape({
      Title: PropTypes.func.isRequired,
      Caption: PropTypes.func,
      Metadata: PropTypes.func.isRequired,
      Subdata: PropTypes.func,
      Tagline: PropTypes.func,
      State: PropTypes.func,
      Description: PropTypes.func.isRequired,
      Tabs: PropTypes.func.isRequired,
      Button: PropTypes.func,
      Children: PropTypes.func,
    }).isRequired,
    generators: PropTypes.shape({
      title: PropTypes.func,
      poster: PropTypes.func,
      background: PropTypes.func,
      subdata: PropTypes.func,
    }).isRequired,
    palette: PropTypes.object,
    usePalette: PropTypes.bool,
  }

  static defaultProps = {
    params: {},
    palette: {
      backgroundColor: theme.colors.rangoon,
      color: '#ffffff',
      alternativeColor: '#ffffff',
      negativeColor: '#ffffff',
    },
    usePalette: false,
  }

  constructor(props) {
    super(props)

    this.state = {
      details: props.placeholder,
      loading: true,
      err: null,
      playing: false,
      subdata: false,
      children: {},
      ready: {
        data: false,
        poster: false,
        trailer: false,
        background: false,
        palette: false,
      },
      palette: props.palette,
    }
  }

  componentDidMount() {
    this.bootstrap()
  }

  componentDidUpdate(props) {
    if (
      this.props.uri.join('/') !== props.uri.join('/') ||
      JSON.stringify(this.props.params) !== JSON.stringify(props.params)
    ) {
      this.bootstrap()
    }
  }

  bootstrap = async () => {
    this.setState({
      loading: true,
      err: null,
      playing: false,
      subdata: false,
      children: {},
      ready: {
        data: false,
        poster: false,
        trailer: false,
        background: false,
        palette: !this.props.usePalette,
      },
    })

    try {
      const details = await tmdb.fetch(this.props.uri, this.props.params)

      if (details.adult && !tmdb.adult) {
        throw { status_code: -1, status_message: 'Adult content disabled' }
      }

      details.belongs_to_collection = !details.belongs_to_collection ? null : await tmdb.fetch(['collection', details.belongs_to_collection.id])
        .then(res => ({
          ...res,
          parts: [...res.parts].sort((a, b) => new Date(a.release_date || 1e15) - new Date(b.release_date || 1e15)),
        }))

      this.setState({
        details: details,
        loading: false,
        ready: {
          data: true,
          poster: !this.props.generators.poster(details),
          trailer: !this.props.generators.background(details, 'trailer'),
          background: !this.props.generators.background(details, 'background'),
          palette: !this.props.usePalette || !this.props.generators.poster(details),
        },
      })

      if (this.props.usePalette && this.props.generators.poster(details)) {
        this.fetchPalette(this.props.generators.poster(details, 'palette'))
      }
    } catch(err) {
      if (err.status_code) {
        this.setState({
          loading: false,
          err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
        })
      } else {
        console.warn(err)
      }
    }
  }

  fetchPalette = async (src) => {
    const cache = sessionStorage.getItem(src)

    if (cache) {
      this.setState(state => ({ palette: JSON.parse(cache), ready: { ...state.ready, palette: true } }))
    } else {
      palette(src, (palette) => {
        try {
          sessionStorage.setItem(src, JSON.stringify(palette))
        } catch (e) {} finally {
          this.setState(state => ({ palette, ready: { ...state.ready, palette: true } }))
        }
      })
    }
  }

  render() {
    const { components, generators, ...props } = this.props
    const { details, palette, playing, subdata, children, loading, err, ...state } = this.state
    const ready = Object.values(state.ready).every(bool => bool)

    const placeholder = [
      theme.styles.placeholder.element,
      !ready && theme.styles.placeholder.on,
      {
        ':after': {
          background: palette.backgroundColor,
          transition: `
            background 400ms ease-in-out,
            opacity 400ms ease-in-out ${ready ? '400ms' : '0ms'},
            z-index 0ms linear ${ready ? '800ms' : '0ms'}
          `,
        },
      },
    ]

    return (
      <Fragment>
        <Helmet>
          {ready ? (
            <title>{generators.title(details, this.state)}</title>
          ) : (
            <title>Sensorr - Details</title>
          )}
        </Helmet>
        <div css={styles.element}>
          <div css={styles.container}>
            <Backdrop
              src={generators.background(details, 'background')}
              ready={ready}
              palette={palette}
              onReady={() => this.setState(state => ({ ready: { ...state.ready, background: true } }))}
            />
            <Trailer
              details={details}
              backdrop={generators.background(details, 'trailer')}
              ready={ready}
              palette={palette}
              onReady={() => this.setState(state => ({ ready: { ...state.ready, trailer: true } }))}
              onPlay={playing => this.setState({ playing })}
            />
            <div css={styles.about}>
              <div>
                <Poster playing={playing}>
                  <components.Poster
                    details={details}
                    onLoad={() => this.setState(state => ({ ready: { ...state.ready, poster: true } }))}
                    onError={() => this.setState(state => ({ ready: { ...state.ready, poster: true } }))}
                    ready={ready}
                    palette={palette}
                  />
                </Poster>
                {!err ? (
                  <div css={styles.info}>
                    <div>
                      <div>
                        <h1 css={[styles.title, ...placeholder]}>
                          <components.Title details={details} />
                        </h1>
                        {components.Caption && (
                          <h2 css={[styles.caption, ...placeholder]}>
                            <components.Caption details={details} />
                          </h2>
                        )}
                        <div css={[styles.metadata, ...placeholder]}>
                          <components.Metadata details={details} />
                          {components.Subdata && generators.subdata(details) && state.ready.data && (
                            <button
                              css={theme.resets.button}
                              style={{ padding: '0 0.25em' }}
                              onClick={() => this.setState(state => ({ subdata: !state.subdata }))}
                            >
                              <small>{subdata ? "▲" : "▼"}</small>
                            </button>
                          )}
                        </div>
                        {components.Subdata && (
                          <div css={styles.subdata} hidden={!state.ready.data || !subdata}>
                            <components.Subdata details={details} />
                          </div>
                        )}
                        {components.Tagline && (
                          <components.Tagline details={details} />
                        )}
                      </div>
                      {components.State && (
                        <div css={styles.state}>
                          <components.State details={details} />
                        </div>
                      )}
                    </div>
                    <p css={[styles.description, ...placeholder]}>
                      <components.Description details={details} />
                    </p>
                  </div>
                ) : (
                  <Empty
                    title={err ? 'Oh ! You came across a bug...' : null}
                    emoji={err ? '🐛' : null}
                    subtitle={err ? err : null}
                  />
                )}
              </div>
              {!err && components.Tabs && (
                <components.Tabs
                  details={details}
                  placeholder={placeholder}
                  palette={palette}
                  ready={ready}
                />
              )}
            </div>
          </div>
          {!err && components.Button && (
            <components.Button
              details={details}
              state={this.state}
              setState={(children) => this.setState({ children })}
              palette={palette}
              ready={ready}
            />
          )}
        </div>
        {!err && components.Children && (
          <components.Children
            details={details}
            state={children}
            palette={palette}
            ready={ready}
          />
        )}
      </Fragment>
    )
  }
}

export { default as Trailer } from './blocks/Trailer'
export { default as Poster } from './blocks/Poster'
export { default as Tabs } from './blocks/Tabs'
export { default as withCount } from './blocks/withCount'
