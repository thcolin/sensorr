import React, { PureComponent, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import InfiniteScroll from 'react-infinite-scroller'
import Controls from 'components/Layout/Controls'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import database from 'store/database'
import tmdb from 'store/tmdb'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    padding: '0 2em',
    margin: 0,
    fontSize: '2em',
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 10em)',
    gridGap: '2rem',
    justifyContent: 'space-between',
    padding: '2em',
  },
  entity: {
    width: '10em',
    height: '16em',
  },
  spinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

export default class Grid extends PureComponent {
  static propTypes = {
    items: PropTypes.array,
    query: PropTypes.func,
    uri: PropTypes.array,
    params: PropTypes.object,
    transform: PropTypes.func,
    controls: PropTypes.shape({
      filters: PropTypes.object,
      sortings: PropTypes.object,
      defaults: PropTypes.shape({
        filtering: PropTypes.object,
        sorting: PropTypes.object,
        reverse: PropTypes.bool,
      }),
    }),
    label: PropTypes.string,
    child: PropTypes.func.isRequired,
    empty: PropTypes.object,
    spinner: PropTypes.object,
    limit: PropTypes.bool,
    strict: PropTypes.bool,
    subscribe: PropTypes.bool,
    placeholder: PropTypes.bool,
  }

  static defaultProps = {
    items: [],
    params: {},
    empty: {},
    spinner: {},
    limit: false,
    strict: true,
    subscribe: true,
    placeholder: true,
  }

  constructor(props) {
    super(props)

    this.state = {
      entities: [],
      loading: false,
      buffer: [],
      err: null,
      max: 25,
      filter: () => true,
      sort: () => 0,
      focus: null,
    }

    this.expand = this.expand.bind(this)
    this.validate = this.validate.bind(this)
  }

  async componentDidMount() {
    if (this.props.query) {
      this.setState({ loading: true })
      const db = await database.get()
      const query = this.props.query(db)
      const entities = await query.exec()
      this.setState({ loading: false, entities: (this.props.transform || ((entities) => entities.map(entity => entity.toJSON())))(entities) })

      if (this.props.subscribe) {
        this.subscription = query.$.subscribe(entities => this.setState({ buffer: entities.map(entity => entity.toJSON()) }))
      }
    } else if (this.props.uri) {
      this.setState({ loading: true })
      tmdb.fetch(this.props.uri, this.props.params).then(
        res => this.setState({ loading: false, entities: (this.props.transform || ((res) => res.results))(res) || [] }),
        err => {
          this.setState({
            loading: false,
            err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
          })
        }
      )
    }
  }

  componentDidUpdate(props, state) {
    if (this.props.query) {
      if (this.state.buffer.length && (props.filter !== this.props.filter)) {
        this.setState({
          entities: this.state.buffer,
          buffer: [],
          max: 25,
        })
      }
    } else if (this.props.uri) {
      if (this.props.uri.join('/') !== props.uri.join('/') || JSON.stringify(this.props.params) !== JSON.stringify(props.params)) {
        this.setState({ loading: true })
        tmdb.fetch(this.props.uri, this.props.params).then(
          res => this.setState({ loading: false, entities: this.props.transform(res) }),
          err => {
            this.setState({
              loading: false,
              err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
            })
          }
        )
      }
    }
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  validate(entity) {
    return (!this.props.strict || entity.poster_path || entity.profile_path) && (!entity.adult || tmdb.adult)
  }

  expand() {
    this.setState(state => ({ max: state.max + 25 }))
  }

  render() {
    const { entities, loading, err, max, filter, sort, focus, ...state } = this.state
    const {
      items,
      query,
      uri,
      params,
      transform,
      controls,
      label,
      child,
      empty,
      spinner,
      limit,
      strict,
      subscribe,
      placeholder,
      style,
      ...props
    } = this.props

    const approved = [...entities, ...items].filter(entity => this.validate(entity))
    const filtered = approved.sort(sort).filter(filter)
    const limited = filtered.filter((a, index) => !limit || index <= max)

    return (
      <>
        {controls && (
          <Controls
            key="controls"
            entities={approved}
            {...controls}
            filters={Object.keys(controls.filters).reduce((acc, key) => ({ ...acc, [key]: controls.filters[key](approved) }), {})}
            onChange={({ filter, sort, sorting }) => this.setState({
              filter,
              sort,
              max: 25,
              focus: sorting.value === 'time' ? null : sorting.value,
            })}
          />
        )}
        <div key="element" {...props} css={styles.element}>
          {!!label && (
            <h1 css={styles.label} style={style || {}}>{label}</h1>
          )}
          {(loading && !placeholder) ? (
            <div css={styles.placeholder}>
              <Spinner {...spinner} />
            </div>
          ) : (!limited.length && !placeholder) ? (
            <div css={styles.placeholder}>
              <Empty
                {...empty}
                title={err ? 'Oh ! You came across a bug...' : empty.title}
                emoji={err ? '🐛' : empty.emoji}
                subtitle={err ? err : empty.subtitle}
              />
            </div>
          ) : (
            <InfiniteScroll
              pageStart={0}
              hasMore={limit && (max < limited.length)}
              loadMore={this.expand}
              loader={(
                <div key="spinner" css={styles.spinner}>
                  <Spinner {...spinner} />
                </div>
              )}
              threshold={1000}
              css={styles.grid}
            >
              {(limited.length ? limited : Array(25).fill({ poster_path: false, profile_path: false })).map((entity, index) => (
                <div key={index} css={styles.entity}>
                  {React.createElement(child, { entity, focus, placeholder })}
                </div>
              ))}
            </InfiniteScroll>
          )}
        </div>
      </>
    )
  }
}
