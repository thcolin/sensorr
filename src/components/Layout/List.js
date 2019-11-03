import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import * as Emotion from '@emotion/core'
import { useHover } from 'react-hooks-lib'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import tmdb from 'store/tmdb'
import database from 'store/database'
import nanobounce from 'nanobounce'
import theme from 'theme'

const styles = {
  list: {
    element: {
      position: 'relative',
      padding: '2em 0',
    },
    label: {
      padding: '0 1.5em',
      margin: 0,
      fontSize: '1em',
      fontWeight: '800',
      lineHeight: '1.25',
      color: theme.colors.rangoon,
    },
    container: {
      left: 0,
      display: 'flex',
      flexWrap: 'nowrap',
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: '2em 0',
    },
    column: {
      flexDirection: 'column',
      overflowX: 'hidden',
      overflowY: 'auto',
    },
    entity: {
      flex: '0 0 auto',
    },
  },
  label: {
    element: {
      position: 'relative',
      display: 'flex',
      width: '100%',
      'label': {
        position: 'relative',
      },
      'select': {
        position: 'absolute',
        opacity: 0,
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        appearance: 'none',
        border: 'none',
        cursor: 'pointer',
        zIndex: 1,
      },
    },
  },
}

export default class List extends PureComponent {
  static propTypes = {
    items: PropTypes.array,
    query: PropTypes.func,
    uri: PropTypes.array,
    params: PropTypes.object,
    child: PropTypes.elementType.isRequired,
    childProps: PropTypes.object,
    transform: PropTypes.func,
    filter: PropTypes.func,
    label: PropTypes.node,
    display: PropTypes.oneOf(['row', 'column']),
    space: PropTypes.number,
    empty: PropTypes.object,
    spinner: PropTypes.object,
    strict: PropTypes.bool,
    hide: PropTypes.bool,
    prettify: PropTypes.number,
    placeholder: PropTypes.bool,
    subtitle: PropTypes.node,
  }

  static defaultProps = {
    items: [],
    childProps: {},
    uri: [],
    params: {},
    filter: () => true,
    display: 'row',
    space: 2,
    empty: {},
    spinner: {},
    strict: true,
    hide: false,
    prettify: 0,
    placeholder: false,
  }

  constructor(props) {
    super(props)

    this.state = {
      entities: [],
      loading: props.query || props.uri.length,
      err: null,
    }

    this.validate = this.validate.bind(this)

    this.reference = React.createRef()
    this.debounce = nanobounce(700)
  }

  componentDidMount() {
    if (this.props.query) {
      this.debounce(async () => {
        await this.fetchDatabase()
        this.reference.current && this.reference.current.scroll(0, 0)
      })
    } else if (this.props.uri.length) {
      this.debounce(async () => {
        await this.fetchTMDB()
        this.reference.current && this.reference.current.scroll(0, 0)
      })
    } else if (this.props.items.length) {
      this.setState({ entities: [] })
      this.reference.current && this.reference.current.scroll(0, 0)
    }
  }

  componentDidUpdate(props) {
    if (this.props.query) {
      if (!props.query) {
        this.debounce(async () => {
          await this.fetchDatabase()
          this.reference.current && this.reference.current.scroll(0, 0)
        })
      }
    } else if (this.props.uri.length) {
      if (
        this.props.uri.join('/') !== props.uri.join('/') ||
        JSON.stringify(this.props.params) !== JSON.stringify(props.params)
      ) {
        this.debounce(async () => {
          await this.fetchTMDB()
          this.reference.current && this.reference.current.scroll(0, 0)
        })
      }
    } else if (this.props.items.length) {
      if ((this.props.items[0] || {}).id !== (props.items[0] || {}).id) {
        this.setState({ entities: [] })
        this.reference.current && this.reference.current.scroll(0, 0)
      }
    }
  }

  async fetchDatabase() {
    if (!this.props.query) {
      return
    }

    this.setState({ loading: true })

    const db = await database.get()
    const query = this.props.query(db)
    const entities = await query.exec()

    this.setState({
      loading: false,
      entities: (this.props.transform || ((entities) => entities.map(entity => entity.toJSON())))(entities),
    })
  }

  async fetchTMDB() {
    if (!this.props.uri.length) {
      return
    }

    this.setState({ loading: true })

    try {
      const res = await tmdb.fetch(this.props.uri, this.props.params)
      this.setState({ loading: false, entities: (this.props.transform || ((res) => res.results))(res) || [] })
    } catch(err) {
      this.setState({
        loading: false,
        err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
      })
    }
  }

  validate(entity) {
    return (
      (!this.props.strict || typeof entity.poster_path !== 'undefined' || typeof entity.profile_path !== 'undefined') &&
      (!entity.adult || tmdb.adult)
    )
  }

  render() {
    const { entities, loading, err, ...state } = this.state
    const {
      items,
      query,
      uri,
      params,
      child,
      childProps,
      transform,
      filter,
      label,
      display,
      space,
      empty,
      spinner,
      strict,
      hide,
      prettify,
      placeholder,
      subtitle,
      ...props
    } = this.props

    const filtered = (uri.length || query) ? entities : items
      .filter(entity => this.validate(entity))
      .filter(filter)

    return (!!filtered.length || (loading && (uri.length || query)) || !hide) && (
      <div css={styles.list.element}>
        {!!label && (
          <h1 {...props} css={[styles.list.label, props.css]}>{label}</h1>
        )}
        <div ref={this.reference} css={[styles.list.container, styles.list[display]]}>
          {(loading && !placeholder) ? (
            <Spinner {...spinner} />
          ) : (filtered.length || placeholder) ? (
            (filtered.length ? filtered : Array(15).fill({ poster_path: false, profile_path: false })).map((entity, index) => (
              <div
                key={index}
                css={styles.list.entity}
                style={{
                  padding: { row: `0 ${space}em`, column: `${space}em 0` }[display],
                }}
              >
                {Emotion.jsx(child, {
                  entity: entity,
                  placeholder: placeholder,
                  ...(index < prettify ? { display: 'pretty' } : {}),
                  ...(childProps),
                })}
              </div>
            ))
          ) : (
            <Empty
              {...empty}
              title={err ? 'Oh ! You came across a bug...' : empty.title}
              emoji={err ? '🐛' : empty.emoji}
              subtitle={err ? err : empty.subtitle}
            />
          )}
        </div>
        {subtitle}
      </div>
    )
  }
}

export const Label = ({ id, title, compact, actions, value, onChange, options, children }) => {
  const { hovered, bind } = useHover()

  return (
    <span {...bind} css={styles.label.element} style={{ justifyContent: { true: 'flex-start', false: 'space-between' }[compact] }}>
      <label {...(!!options ? { htmlFor: id } : {})} {...(title ? { title } : {})}>
        {children}
        {!!(options || []).length && (
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {options.map(option => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
      </label>
      {actions && (
        <>
          {compact && <span>&nbsp;&nbsp;-&nbsp;&nbsp;</span>}
          <span hidden={!compact && !hovered}>{actions}</span>
        </>
      )}
    </span>
  )
}

Label.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  compact: PropTypes.bool,
  actions: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })),
  children: PropTypes.node.isRequired,
}

Label.defaultProps = {
  compact: false,
}
