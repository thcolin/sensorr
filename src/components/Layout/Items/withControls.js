import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Controls from 'components/Layout/Controls'
import tmdb from 'store/tmdb'

const withControls = (controls) => (WrappedComponent) => {
  class WithControls extends Component {
    static propTypes = {
      strict: PropTypes.bool,
      onControls: PropTypes.func,
    }

    static defaultProps = {
      strict: false,
    }

    constructor(props) {
      super(props)

      this.state = {
        focus: null,
        operations: {
          filter: this.props.filter || (() => true),
          sort: () => 0,
        },
      }
    }

    handleChange = (values) => {
      if (typeof this.props.onControls === 'function') {
        this.props.onControls(values)
      }

      this.setState({
        operations: { filter: values.filter, sort: values.sort },
        focus: (!values.sorting || values.sorting === 'time') ? null : values.sorting,
      })
    }

    validate = (entity) => {
      return (
        (!this.props.strict || this.props.child.validate(entity)) &&
        (!entity?.adult || tmdb.adult)
      )
    }

    render() {
      const { strict, onControls, props: _props, ...props } = this.props

      const approved = this.props.entities.filter(entity => this.validate(entity))
      const filtered = approved.sort(this.state.operations.sort).filter(this.state.operations.filter)

      const filters = !!controls ? Object.keys(controls.filters).reduce((acc, key) => ({
        ...acc,
        [key]: controls.filters[key](approved),
      }), {}) : {}

      const entityProps = typeof _props === 'function' ?
        (args) => ({ ..._props(args), focus: this.state.focus }) :
        { ..._props, focus: this.state.focus }

      return (
        <>
          {!!controls && (
            <Controls
              key="controls"
              entities={approved}
              total={props.total || filtered.length}
              {...controls}
              filters={filters}
              onChange={args => this.handleChange({ ...args, filters })}
            />
          )}
          <WrappedComponent
            key="items"
            {...props}
            props={entityProps}
            entities={filtered}
          />
        </>
      )
    }
  }

  WithControls.displayName = `WithControls(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
  return WithControls
}

export default withControls
