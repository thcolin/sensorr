import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import * as Emotion from '@emotion/core'
import InfiniteScroll from 'react-infinite-scroller'
import Controls from 'components/Layout/Controls'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import tmdb from 'store/tmdb'
import database from 'store/database'
import nanobounce from 'nanobounce'
import theme from 'theme'

export default class Items extends PureComponent {
  static getOrigin = (source) => {
    if (Array.isArray(source)) {
      return 'items'
    } else if (typeof source === 'function') {
      return 'db'
    } else if (typeof source === 'object') {
      return 'tmdb'
    }
  }

  static propTypes = {
    source: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.func,
      PropTypes.shape({
        uri: PropTypes.array,
        params: PropTypes.object,
      }),
    ]).isRequired,

    debounce: PropTypes.bool,
    ready: PropTypes.bool,

    child: PropTypes.elementType.isRequired,
    props: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
    ]),
    placeholder: PropTypes.bool,

    transform: PropTypes.func,
    strict: PropTypes.bool,
    filter: PropTypes.func,
    limit: PropTypes.number,

    display: PropTypes.oneOf(['grid', 'row', 'column']),
    controls: PropTypes.shape({
      filters: PropTypes.object,
      sortings: PropTypes.object,
      defaults: PropTypes.shape({
        filtering: PropTypes.object,
        sorting: PropTypes.string,
        reverse: PropTypes.bool,
      }),
    }),
    label: PropTypes.node,
    subtitle: PropTypes.node,
    spinner: PropTypes.object,
    empty: PropTypes.object,

    stack: PropTypes.bool,
    hide: PropTypes.bool,
    space: PropTypes.number, // used in `Search`
  }

  static defaultProps = {
    source: [],

    debounce: true,
    ready: true,

    props: {},
    placeholder: false,

    strict: true,
    filter: () => true,
    limit: Infinity,

    display: 'row',
    spinner: {},
    empty: {},

    stack: false,
    hide: false,
    space: 2, // used in `Search`
  }

  static styles = {
    grid: {
      element: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      },
      label: {
        padding: '0 2em',
        margin: 0,
        fontSize: '2em',
        fontWeight: 'bold',
        color: theme.colors.black,
      },
      block: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '25vh',
      },
      container: {
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
    },
    row: {
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
        alignItems: 'center',
        flexDirection: 'row',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '2em 0',
      },
      entity: {
        flex: '0 0 auto',
      },
    },
    column: {
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
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
      },
      entity: {
        flex: '0 0 auto',
      },
    },
  }

  constructor(props) {
    super(props)

    const origin = Items.getOrigin(props.source)

    this.state = {
      entities: origin === 'items' ? props.source : [],

      params: {
        ...((props.controls?.initial?.sorting && typeof props.controls?.initial?.reverse !== 'undefined') ? {
          sort_by: `${props.controls.initial.sorting}.${props.controls.initial.reverse ? 'asc' : 'desc'}`,
        } : {}),
        ...(props.controls?.initial?.filtering ? Object.keys(props.controls.initial.filtering).reduce((acc, key) => ({
          ...acc,
          ...(props.controls.filters[key]().serialize ? props.controls.filters[key]().serialize(props.controls.initial.filtering[key]) : {}),
        }), {}) : {}),
      },
      loading: ['db', 'tmdb'].includes(origin),
      done: origin !== 'tmdb',
      total: origin === 'items' ? props.source.length : 0,
      err: null,

      operations: {
        filter: this.props.filter,
        sort: () => 0,
      },

      focus: null,
      max: 20,
    }

    this.list = React.createRef()

    this.debounce = {
      sync: nanobounce(0),
      async: nanobounce(400),
    }
  }

  async componentDidMount() {
    const origin = Items.getOrigin(this.props.source)

    switch (origin) {
      case 'db':
        const { entities } = await this.fetchDatabase()

        this.setState({
          entities,
          loading: false,
          done: true,
          total: entities.length,
        })
      break
      case 'tmdb':
        try {
          const { entities, done, total } = await this.fetchTMDB()

          this.setState({
            entities,
            loading: false,
            done,
            total,
          })
        } catch (err) {
          this.setState({
            loading: false,
            done: true,
            total: 0,
            err,
          })
        }
      break
    }
  }

  componentDidUpdate(props, state) {
    const origin = Items.getOrigin(this.props.source)
    const debounce = this.debounce[this.props.debounce ? 'async' : 'sync']
    const hasChanged = {
      db: origin !== Items.getOrigin(props.source) || (origin === 'db' && (
        this.props.source !== props.source
      )),
      tmdb: origin !== Items.getOrigin(props.source) || (origin === 'tmdb' && (
        this.props.source.uri.join('/') !== props.source.uri.join('/') ||
        JSON.stringify(this.props.source.params) !== JSON.stringify(props.source.params) ||
        JSON.stringify(this.state.params) !== JSON.stringify(state.params)
      )),
      items: origin !== Items.getOrigin(props.source) || (origin === 'items' && (
        this.props.source.map(item => item.id).join(',') !== props.source.map(item => item.id).join(',')
      )),
    }[origin]

    if (!hasChanged) {
      return
    }

    this.setState({
      loading: origin !== 'tmdb' || (this.state.params.page !== state.params.page),
      done: false,
      err: null,
      total: !this.props.placeholder ? 0 : this.state.entities
        .filter((entity, index) => (
          this.validate(entity) &&
          this.state.operations.filter(entity) &&
          (this.props.limit === Infinity || (index < this.props.limit && index <= 20))
        )).length,
      ...(!this.state.params.page && !this.props.stack ? { entities: [] } : {}),
      ...(origin !== 'tmdb' ? { params: {} } : {}),
      ...(!this.state.params.page ? { max: 20 } : {}),
    })

    switch (origin) {
      case 'db':
        debounce(async () => {
          const { entities } = await this.fetchDatabase()

          this.setState({
            entities,
            loading: false,
            done: true,
            total: entities.length,
          })

          this.resetScroll()
        })
      break
      case 'tmdb':
        debounce(async () => {
          try {
            const { entities, done, total } = await this.fetchTMDB()

            this.setState(state => ({
              entities: [
                ...(!!this.state.params.page ? state.entities : []),
                ...entities,
              ],
              loading: false,
              max: !this.state.params.page ? 20 : state.max + 20,
              done,
              total,
            }))
          } catch (err) {
            this.setState({
              loading: false,
              done: true,
              total: 0,
              err,
            })
          } finally {
            this.resetScroll()
          }
        })
      break
      case 'items':
        debounce(() => {
          this.setState({
            entities: this.props.source,
            loading: false,
            done: true,
            total: this.props.source.length,
          })

          this.resetScroll()
        })
      break
    }
  }

  fetchDatabase = async () => {
    const db = await database.get()
    const query = this.props.source(db)
    const entities = await query.exec()

    return {
      entities: (this.props.transform || ((entities) => entities.map(entity => entity.toJSON())))(entities),
    }
  }

  fetchTMDB = async () => {
    try {
      const res = await tmdb.fetch(this.props.source.uri, { ...this.props.source.params, ...this.state.params })

      return {
        entities: ((this.props.transform || ((res) => res.results))(res) || []),
        done: (this.state.params.page || 1) >= res.total_pages,
        total: res.total_results,
      }
    } catch(err) {
      throw new Error(err.status_code === 7 ? 'Invalid TMDB API key, check your configuration.' : err.status_message)
    }
  }

  resetScroll = () => {
    if (['row', 'column'].includes(this.props.display)) {
      this.list.current && this.list.current.scroll(0, 0)
    }
  }

  validate = (entity) => {
    return (
      (!this.props.strict || this.props.child.validate(entity)) &&
      (!entity.adult || tmdb.adult)
    )
  }

  expand = async () => {
    if (Items.getOrigin(this.props.source) === 'tmdb') {
      this.setState(state => state.done ? {} : { params: { ...state.params, page: (state.params.page || 1) + 1 } })
    } else {
      this.setState(state => ({ max: state.max + 20 }))
    }
  }

  render() {
    const {
      entities,

      params,
      loading,
      done,
      total,
      err,

      operations,

      focus,
      max,
      ...state
    } = this.state

    const {
      source,

      debounce,
      ready,

      child,
      props,
      placeholder,

      transform,
      strict,
      filter,
      limit,

      display,
      controls,
      label,
      subtitle,
      spinner,
      empty,

      stack,
      hide,
      space,
      ...crumbs
    } = this.props

    const origin = Items.getOrigin(source)
    const propsify = typeof props === 'function' ? props : () => props
    const approved = entities.filter(entity => this.validate(entity))
    const filtered = approved.sort(operations.sort).filter(operations.filter)
    const limited = filtered.filter((foo, index) => (limit === Infinity || index < limit) && (display !== 'grid' || index < max))
    const childs = (ready && (!loading || params.page > 1 || stack)) ? limited : (!placeholder ? [] : Array(Math.min(total, 20) || 20)
      .fill({})
      .map((foo, index) => child.placeholder(propsify({ index })))
    )

    const styles = Items.styles[display]

    const filters = controls && Object.keys(controls.filters).reduce((acc, key) => ({
      ...acc,
      [key]: controls.filters[key](approved),
    }), {})

    return (!!childs.length || (loading && ['db', 'tmdb'].includes(origin)) || !hide) && (
      <>
        {controls && (
          <Controls
            key="controls"
            entities={approved}
            total={total}
            {...controls}
            filters={filters}
            onChange={({ filtering, filter, sorting, reverse, sort }) => this.setState({
              params: {
                sort_by: `${sorting}.${reverse ? 'asc' : 'desc'}`,
                ...Object.keys(filtering).reduce((acc, key) => ({
                  ...acc,
                  ...(filters[key].serialize ? filters[key].serialize(filtering[key]) : {}),
                }), {}),
              },
              operations: { filter, sort },
              focus: (!sorting || sorting === 'time') ? null : sorting,
              max: 20,
            })}
          />
        )}
        <div css={styles.element}>
          {!!label && (
            <h1 {...crumbs} css={[styles.label, crumbs.css]}>
              {label}
            </h1>
          )}
          {display === 'grid' ? (
            ((loading || !ready) && !placeholder) ? (
              <div css={Items.styles.grid.block}>
                <Spinner {...spinner} />
              </div>
            ) : childs.length ? (
              <InfiniteScroll
                pageStart={0}
                hasMore={origin === 'tmdb' ? !done : max < filtered.length}
                loadMore={loading ? () => {} : this.expand}
                initialLoad={false}
                threshold={1000}
                css={styles.container}
              >
                {childs.map((entity, index) => (
                  <div key={index} css={styles.entity}>
                    {Emotion.jsx(child, {
                      entity: entity,
                      focus: focus,
                      placeholder: placeholder,
                      ...propsify({ entity, index }),
                    })}
                  </div>
                ))}
                {loading && !done && (
                  <div key="spinner" css={theme.styles.centered}>
                    <Spinner {...spinner} />
                  </div>
                )}
              </InfiniteScroll>
            ) : (
              <div css={Items.styles.grid.block}>
                <Empty
                  {...empty}
                  title={err ? 'Oh ! You came across a bug...' : empty.title}
                  emoji={err ? '🐛' : empty.emoji}
                  subtitle={err ? err : empty.subtitle}
                />
              </div>
            )
          ) : (
            <div ref={this.list} css={styles.container}>
              {((loading || !ready) && !placeholder) ? (
                <Spinner {...spinner} />
              ) : childs.length ? childs.map((entity, index) => (
                <div
                  key={stack ? (entity.id || index) : index}
                  css={styles.entity}
                  style={{
                    padding: { row: `0 ${space}em`, column: `${space}em 0` }[display],
                  }}
                >
                  {Emotion.jsx(child, {
                    entity: entity,
                    focus: focus,
                    placeholder: placeholder,
                    ...propsify({ entity, index }),
                  })}
                </div>
              )) : (
                <Empty
                  {...empty}
                  title={err ? 'Oh ! You came across a bug...' : empty.title}
                  emoji={err ? '🐛' : empty.emoji}
                  subtitle={err ? err : empty.subtitle}
                />
              )}
            </div>
          )}
          {subtitle}
        </div>
      </>
    )
  }
}
