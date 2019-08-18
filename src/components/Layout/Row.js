import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { useHover } from 'react-hooks-lib'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import tmdb from 'store/tmdb'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    padding: '2em 0',
  },
  label: {
    padding: '0 2em',
    margin: 0,
    fontSize: '2em',
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  row: {
    left: 0,
    display: 'flex',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  entity: {
    flex: '0 0 auto',
  },
}

export default class Row extends PureComponent {
  static propTypes = {
    items: PropTypes.array,
    child: PropTypes.func.isRequired,
    uri: PropTypes.array,
    params: PropTypes.object,
    transform: PropTypes.func,
    label: PropTypes.node,
    space: PropTypes.number,
    empty: PropTypes.object,
    strict: PropTypes.bool,
    hide: PropTypes.bool,
  }

  static defaultProps = {
    items: [],
    params: {},
    transform: (res) => res.results,
    space: 2,
    empty: {},
    strict: true,
    hide: false,
  }

  constructor(props) {
    super(props)

    this.state = {
      entities: [],
      loading: false,
      err: null,
    }

    this.validate = this.validate.bind(this)

    this.reference = React.createRef()
  }

  componentDidMount() {
    if (this.props.uri) {
      this.setState({ loading: true })
      tmdb.fetch(this.props.uri, this.props.params).then(
        res => this.setState({ loading: false, entities: this.props.transform(res) || [] }),
        err => {
          this.setState({
            loading: false,
            err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
          })
        }
      )
    }
  }

  componentDidUpdate(props) {
    if (this.props.uri) {
      if (this.props.uri.join('/') !== props.uri.join('/') || JSON.stringify(this.props.params) !== JSON.stringify(props.params)) {
        this.setState({ loading: true })
        tmdb.fetch(this.props.uri, this.props.params).then(
          res => {
            this.setState({ loading: false, entities: this.props.transform(res) })
            this.reference.current && this.reference.current.scroll(0, 0)
          },
          err => {
            this.setState({
              loading: false,
              err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
            })
          }
        )
      } else {
        this.reference.current && this.reference.current.scroll(0, 0)
      }
    }
  }

  validate(entity) {
    return (!this.props.strict || entity.poster_path || entity.profile_path) && (!entity.adult || tmdb.adult)
  }

  render() {
    const { items, uri, params, child, transform, label, space, empty, strict, hide, ...props } = this.props
    const { entities, loading, err, ...state } = this.state

    const filtered = [...items, ...entities]
      .filter(entity => this.validate(entity))

    return (!!filtered.length || !hide) && (
      <div style={styles.element}>
        <h1 {...props} style={{ ...styles.label, ...(props.style || {}) }}>{label}</h1>
        <div style={styles.row} ref={this.reference}>
          {loading && (
            <Spinner />
          )}
          {!loading && !filtered.length && (
            <Empty
              {...empty}
              title={err ? 'Oh ! You came across a bug...' : empty.title}
              emoji={err ? '🐛' : empty.emoji}
              subtitle={err ? err : empty.subtitle}
            />
          )}
          {filtered.map((entity, index) => (
            <div key={index} style={{ ...styles.entity, padding: `${space}em` }}>
              {React.createElement(child, { entity })}
            </div>
          ))}
        </div>
      </div>
    )
  }
}

export const Label = ({ id, title, compact, actions, value, onChange, options, children }) => {
  const { hovered, bind } = useHover()

  return (
    <span {...bind} style={{ position: 'relative', display: 'flex', justifyContent: { true: 'flex-start', false: 'space-between' }[compact], width: '100%' }}>
      <label htmlFor={id} {...(title ? { title } : {})} style={{ position: 'relative' }}>
        {children}
        {!!(options || []).length && (
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              appearance: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
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
  id: PropTypes.string.isRequired,
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
