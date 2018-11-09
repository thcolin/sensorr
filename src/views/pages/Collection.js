import React, { PureComponent } from 'react'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import theme from 'theme'

const styles = {
  input: {
    zIndex: 1,
    position: 'sticky',
    top: '-1px',
    width: '100%',
    backgroundColor: theme.colors.grey,
    border: 'none',
    padding: 0,
    margin: 0,
    fontSize: '1.25em',
    padding: '0.75em 1em',
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
  },
}

export default class Collection extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      query: '',
    }

    this.handleQueryChange = this.handleQueryChange.bind(this)
  }

  handleQueryChange(e) {
    this.setState({ query: e.target.value })
  }

  render() {
    const { query, ...state } = this.state
    const { ...props } = this.props

    return (
      <div>
        <input
          type="text"
          onKeyUp={this.handleQueryChange}
          style={styles.input}
          placeholder="Filter..."
        />
        <Grid query={query} child={Film} />
      </div>
    )
  }
}
