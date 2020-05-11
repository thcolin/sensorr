import React, { Component } from 'react'
import PropTypes from 'prop-types'
import nanobounce from 'nanobounce'
import database from 'store/database'

const withDatabaseQuery = (queryGetter, controlsLinkedQuery = false) => (WrappedComponent) => {
  class WithDatabaseQuery extends Component {
    static propTypes = {
      debounce: PropTypes.bool,
      transform: PropTypes.func,
      onFetched: PropTypes.func,
    }

    static defaultProps = {
      debounce: false,
      transform: (entities) => entities.map(entity => entity.toJSON()),
    }

    constructor(props) {
      super(props)

      this.state = {
        query: null,
        entities: [],
        loading: true,
        controls: {},
        error: null,
      }

      this.debounce = {
        sync: nanobounce(0),
        async: nanobounce(400),
      }
    }

    async componentDidMount() {
      if (controlsLinkedQuery) {
        return
      }

      try {
        const { entities } = await this.fetchDatabase()
        this.setState({ entities, loading: false })
      } catch (error) {
        this.setState({ loading: false, error })
      }
    }

    componentDidUpdate(props, state) {
      if (this.state.query === state.query) {
        return
      }

      try {
        this.setState({ loading: true })
        const debounce = this.debounce[this.props.debounce ? 'async' : 'sync']
        debounce(async () => {
          const { entities } = await this.fetchDatabase()
          this.setState({ entities, loading: false })
        })
      } catch (error) {
        this.setState({ loading: false, error })
      }
    }

    fetchDatabase = async () => {
      const query = await this.getQuery()
      const raw = await query.exec()
      const entities = this.props.transform(raw)
      
      if (typeof this.props.onFetched === 'function') {
        this.props.onFetched({ entities, total: entities.length })
      }

      return {
        entities,
      }
    }

    updateQuery = async (controls = null) => {
      const db = await database.get()
      const query = queryGetter(db, controls)

      if (!query) {
        return
      }

      this.setState({ query })
      return query
    }

    getQuery = async () => {
      if (!!this.state.query) {
        return this.state.query
      }

      const query = await this.updateQuery(this.state.controls)

      if (!query) {
        throw new Error('Empty query')
      }

      return query
    }

    handleControls = (controls) => {
      if (!!controlsLinkedQuery) {
        this.updateQuery(controls)
        this.setState({ controls })
      }
    }
  
    render() {
      const { debounce, transform, onFetched, ...props } = this.props

      return (
        <WrappedComponent
          {...props}
          entities={this.state.entities}
          loading={this.state.loading}
          error={this.state.error}
          onControls={this.handleControls}
        />
      )
    }
  }

  WithDatabaseQuery.displayName = `WithDatabaseQuery(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
  return WithDatabaseQuery
}

export default withDatabaseQuery
