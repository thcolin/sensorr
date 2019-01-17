import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import theme from 'theme'

const styles = {
  filter: {
    zIndex: 1,
    position: 'sticky',
    top: '-1px',
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.grey,
    border: 'none',
    fontSize: '1.25em',
    padding: '0.75em 1em',
    margin: 0,
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
  },
  state: {
    position: 'absolute',
    cursor: 'pointer',
    right: '1em',
    top: '0.375em',
    fontSize: '2em',
    userSelect: 'none',
    MozUserSelect: 'none',
  },
}

export default class Collection extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      query: '',
      state: 'all',
    }

    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
  }

  handleQueryChange(e) {
    this.setState({ query: e.target.value })
  }

  handleStateChange(state) {
    this.setState({ state: { all: 'wished', wished: 'archived', archived: 'all' }[state] })
  }

  render() {
    const { query, state } = this.state
    const { ...props } = this.props

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Collection</title>
        </Helmet>
        <div>
          <div style={styles.filter}>
            <input
              type="text"
              onKeyUp={this.handleQueryChange}
              style={styles.input}
              placeholder="Filter..."
            />
            <i
              onClick={() => this.handleStateChange(state)}
              title={{ all: 'All', wished: 'Wished', archived: 'Archived' }[state]}
              style={styles.state}
            >
              {{ all: '📚', wished: '🍿', archived: '📼' }[state]}
            </i>
          </div>
          <Grid query={query} filter={entity => state === 'all' || entity.state === state} child={Film} />
        </div>
      </Fragment>
    )
  }
}
