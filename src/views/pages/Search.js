import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import Empty from 'components/Empty'
import nanobounce from 'nanobounce'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
  },
  input: {
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
  state: {
    position: 'absolute',
    cursor: 'pointer',
    right: '1em',
    top: '0.375em',
    fontSize: '2em',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
  },
  container: {
    margin: '2em 0'
  },
}

export default class Search extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.match.params.query || '',
    }

    this.input = React.createRef()
    this.debounce = nanobounce(500)
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount() {
    this.input.current.focus()
  }

  handleChange(e) {
    const previous = this.props.match.params.query
    const next = e.target.value

    if (previous !== next) {
      this.setState({ value: next })
      this.debounce(() => this.props.history.push(this.props.match.path.replace(':query?', next)))
    }
  }

  render() {
    const { state, match: { params }, ...props } = this.props
    const { value } = this.state
    const query = params.query || ''

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Search{query && `: "${query}" (${{ movie: 'Movies', person: 'Stars' }[state]})`}</title>
        </Helmet>
        <div style={styles.element}>
          <input
            ref={this.input}
            type="text"
            value={value}
            onChange={this.handleChange}
            style={styles.input}
            placeholder="Search..."
          />
          <div style={styles.container}>
            {query ? (
              <Grid
                label={query}
                child={{ movie: Film, person: (props) => <Persona context="portrait" {...props} /> }[state]}
                uri={['search', state]}
                params={{ query, sort_by: 'popularity.desc' }}
              />
            ) : (
              <Empty
                emoji={{ movie: '🎞️', person: '⭐' }[state]}
                title={`Are you looking for a ${{ movie: 'movie', person: 'star' }[state]} ?`}
                subtitle={`Search ${{ movie: 'anything, like "Inception"', person: 'anyone, like "Audrey Hepburn"' }[state]}`}
              />
            )}
          </div>
        </div>
      </Fragment>
    )
  }
}
