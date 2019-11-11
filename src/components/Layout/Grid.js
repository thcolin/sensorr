import React, { PureComponent, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import * as Emotion from '@emotion/core'
import InfiniteScroll from 'react-infinite-scroller'
import Controls from 'components/Layout/Controls'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import database from 'store/database'
import tmdb from 'store/tmdb'
import theme from 'theme'
import nanobounce from 'nanobounce'

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
    minHeight: '25vh',
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
    height: '17em',
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
        sorting: PropTypes.string,
        reverse: PropTypes.bool,
      }),
    }),
    label: PropTypes.string,
    child: PropTypes.func.isRequired,
    empty: PropTypes.object,
    spinner: PropTypes.object,
    limit: PropTypes.bool,
    strict: PropTypes.bool,
    debounce: PropTypes.bool,
    placeholder: PropTypes.bool,
    ready: PropTypes.bool,
  }

  static defaultProps = {
    items: [],
    uri: [],
    params: {},
    empty: {},
    spinner: {},
    limit: false,
    strict: true,
    debounce: false,
    placeholder: true,
    ready: true,
  }

  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      done: false,
      total: 0,
      params: {},
      entities: [],
      err: null,
      max: 20,
      filter: () => true,
      sort: () => 0,
      focus: null,
    }

    this.expand = this.expand.bind(this)
    this.validate = this.validate.bind(this)
    this.debounce = nanobounce(500)
  }

  componentDidMount() {
    // controls will update state and so component
    if (this.props.controls) {
      return
    }

    if (this.props.query) {
      this.setState({ loading: true })
      this.fetchDatabase()
    } else if (this.props.uri.length) {
      this.setState({ loading: true })
      this.fetchTMDB()
    }
  }

  componentDidUpdate(props, state) {
    if (this.props.query) {
      if (this.props.query !== props.query) {
        this.setState({ loading: true })
        if (this.props.debounce) {
          this.debounce(() => this.fetchDatabase())
        } else {
          this.fetchDatabase()
        }
      }
    } else if (this.props.uri.length) {
      if (
        this.props.uri.join('/') !== props.uri.join('/') ||
        JSON.stringify(this.props.params) !== JSON.stringify(props.params) ||
        JSON.stringify(this.state.params) !== JSON.stringify(state.params)
      ) {
        this.setState({ loading: true })

        if (this.props.debounce) {
          this.debounce(() => this.fetchTMDB(!!this.state.params.page))
        } else {
          this.fetchTMDB(!!this.state.params.page)
        }
      }
    }
  }

  async fetchDatabase() {
    const db = await database.get()
    const query = this.props.query(db)
    const entities = await query.exec()

    this.setState({
      loading: false,
      entities: (this.props.transform || ((entities) => entities.map(entity => entity.toJSON())))(entities),
    })
  }

  async fetchTMDB(merge = false) {
    try {
      const res = await tmdb.fetch(this.props.uri, { ...this.props.params, ...this.state.params })
      this.setState(state => ({
        loading: false,
        total: res.total_results,
        done: (this.state.params.page || 1) >= res.total_pages,
        entities: [
          ...(merge ? state.entities : []),
          ...((this.props.transform || ((res) => res.results))(res) || [])
        ],
      }))
    } catch(err) {
      this.setState({
        loading: false,
        err: (err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message),
      })
    }
  }

  validate(entity) {
    return (!this.props.strict || (entity || {}).poster_path || (entity || {}).profile_path) && (!(entity || {}).adult || tmdb.adult)
  }

  async expand() {
    if (this.props.uri.length) {
      this.setState(state => ({ loading: true, params: { ...state.params, page: (state.params.page || 1) + 1 } }))
    } else {
      this.setState(state => ({ max: state.max + 20 }))
    }
  }

  render() {
    const { loading, done, total, entities, err, max, filter, sort, focus, ...state } = this.state
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
      debounce,
      placeholder,
      ready,
      style,
      ...props
    } = this.props

    const approved = [...entities, ...items].filter(entity => this.validate(entity))
    const filtered = approved.sort(sort).filter(filter)
    const limited = filtered.filter((a, index) => !limit || index <= max)

    const filters = controls && Object.keys(controls.filters).reduce((acc, key) => ({
      ...acc,
      [key]: controls.filters[key](approved),
    }), {})

    return (
      <>
        {controls && (
          <Controls
            key="controls"
            entities={approved}
            total={total}
            {...controls}
            filters={filters}
            onChange={({ filtering, filter, sorting, reverse, sort }) => this.setState({
              filter,
              sort,
              max: 20,
              focus: (!sorting || sorting === 'time') ? null : sorting,
              params: {
                sort_by: `${sorting}.${reverse ? 'asc' : 'desc'}`,
                ...Object.keys(filtering).reduce((acc, key) => ({
                  ...acc,
                  ...(filters[key].serialize ? filters[key].serialize(filtering[key]) : {}),
                }), {})
              },
            })}
          />
        )}
        <div key="element" {...props} css={styles.element}>
          {!!label && (
            <h1 css={styles.label} style={style || {}}>{label}</h1>
          )}
          {((loading || !ready) && !placeholder) ? (
            <div css={styles.placeholder}>
              <Spinner {...spinner} />
            </div>
          ) : (!limited.length && !loading) ? (
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
              hasMore={uri.length ? (!loading && !done) : (limit && (max < limited.length))}
              loadMore={this.expand}
              initialLoad={false}
              loader={(
                <div key="spinner" css={styles.spinner}>
                  <Spinner {...spinner} />
                </div>
              )}
              threshold={1000}
              css={styles.grid}
            >
              {(limited.length ? limited : Array(max).fill({ poster_path: false, profile_path: false })).map((entity, index) => (
                <div key={index} css={styles.entity}>
                  {Emotion.jsx(child, { entity, focus, placeholder })}
                </div>
              ))}
              {loading && (
                <div key="spinner" css={styles.spinner}>
                  <Spinner {...spinner} />
                </div>
              )}
            </InfiniteScroll>
          )}
        </div>
      </>
    )
  }
}
