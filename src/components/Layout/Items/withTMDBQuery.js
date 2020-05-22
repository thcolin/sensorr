import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createPool } from 'swimmer'
import nanobounce from 'nanobounce'
import tmdb from 'store/tmdb'

const withTMDBQuery = ({ uri, params }, initialPage, controlsLinkedQuery = false) => (WrappedComponent) => {
  class WithTMDBQuery extends Component {
    static propTypes = {
      debounce: PropTypes.bool,
      params: PropTypes.object,
      transform: PropTypes.func,
      onFetched: PropTypes.func,
    }

    static defaultProps = {
      debounce: false,
      params: {},
      transform: (res) => res.results,
    }

    constructor(props) {
      super(props)

      this.state = {
        pages: {},
        params: {},
        loading: true,
        total: null,
        error: null,
      }

      this.processed = []
      this.pool = createPool({ concurrency: 8 })
      this.debounce = {
        sync: nanobounce(0),
        async: nanobounce(400),
      }
    }

    async componentDidMount() {
      if (typeof initialPage === 'number') {
        try {
          const { entities, total } = await this.fetchTMDB(initialPage)
          this.setState(state => ({ ...state, loading: false, total, pages: { ...state.pages, [initialPage]: entities } }))
        } catch (error) {
          console.warn(error)
          this.setState({ error, loading: false })
        }
      }
    }

    componentDidUpdate(props, state) {
      const debounce = this.debounce[this.props.debounce ? 'async' : 'sync']

      if ((
        JSON.stringify(this.props.params) !== JSON.stringify(props.params) ||
        JSON.stringify(this.state.params) !== JSON.stringify(state.params)
      )) {
        this.setState({
          loading: true,
          total: null,
          error: null,
          ...(!this.props.stack ? { pages: {} } : {}),
        })

        if (!this.props.stack) {
          this.processed = []
          this.pool.clear()
        }

        debounce(async () => {
          try {
            const { entities, total } = await this.fetchTMDB(1)
            this.setState(state => ({ ...state, loading: false, total, pages: { ...state.pages, [1]: entities } }))
          } catch (error) {
            console.warn(error)
            this.setState({ error, loading: false })
          }
        })
      }
    }

    fetchTMDB = async (page) => {
      try {
        this.processed.push(page)
        const { page: _page, ..._params } = { ...params, ...this.props.params, ...this.state.params }
        const res = await this.pool.add(() => tmdb.fetch(uri, { ..._params, page }))
        const entities = this.props.transform(res)

        if (typeof this.props.onFetched === 'function') {
          this.props.onFetched({ entities, total: res.total_results })
        }

        return {
          entities,
          total: res.total_results,
        }
      } catch(err) {
        this.processed = this.processed.filter(p => p !== page)

        if (err.status_code === 7) {
          throw new Error('Invalid TMDB API key, check your configuration.')
        }

        if ((err.errors || []).length) {
          throw new Error(err.errors.join(', '))
        }

        throw new Error(err.status_message)
      }
    }

    fetchEntities = (entities) => {
      // Wait for controls callback
      if (controlsLinkedQuery && !this.state.params.sort_by) {
        return
      }

      Object.keys(entities.reduce((acc, { index }) => ({ ...acc, [Math.ceil(index / 20)]: true }), {}))
        .map(page => parseInt(page) + 1)
        .filter(page => !this.processed.includes(page))
        .forEach(async page => {
          try {
            const { entities, total } = await this.fetchTMDB(page)
            this.setState(state => ({ ...state, loading: false, total, pages: { ...state.pages, [page]: entities } }))
          } catch (err) {
            console.warn(err)
          }
        })
    }

    findEntity = (index) => {
      const page = Math.floor(index / 20) + 1
      const i = index % 20
      return (this.state.pages[page] || [])[i] || null
    }

    handleControls = (controls) => {
      const { filtering, filters, sorting, reverse } = controls

      if (typeof this.props.onControls === 'function') {
        this.props.onControls(controls)
      }

      this.setState({
        params: {
          sort_by: `${sorting}.${reverse ? 'asc' : 'desc'}`,
          ...Object.keys(filtering).reduce((acc, key) => ({
            ...acc,
            ...(filters[key].serialize ? filters[key].serialize(filtering[key]) : {}),
          }), {}),
        },
      })
    }
    
    render() {
      const { debounce, params, transform, onFetched, onControls, ...props } = this.props
      const entities = Object.values(this.state.pages).reduce((acc, cur) => [...acc, ...cur], [])

      return (
        <WrappedComponent
          {...props}
          total={this.state.total}
          entities={entities}
          findEntity={this.findEntity}
          loading={this.state.loading}
          error={this.state.error}
          onMore={this.fetchEntities}
          onControls={this.handleControls}
        />
      )
    }
  }

  WithTMDBQuery.displayName = `WithTMDBQuery(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
  return WithTMDBQuery
}

export default withTMDBQuery
