import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import Empty from 'components/Empty'
import { fromEvent } from 'rxjs'
import nanobounce from 'nanobounce'
import history from 'store/history'
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
  },
}

export default class Search extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      state: props.match.params.state || 'movie',
      query: props.match.params.query || '',
    }

    this.input = React.createRef()
    this.debounce = nanobounce()
    this.handleKeyUp = this.handleKeyUp.bind(this)

    this.subscription = fromEvent(window, 'popstate').subscribe(
      () => {
        const matches = window.location.pathname.match(/^\/search\/(.*?)\/(.*?)$/)

        if (matches) {
          this.setState({ state: ['movie', 'person'].includes(matches[1]) ? matches[1] : 'movie', query: decodeURI(matches[2]), })
        }
      }
    )
  }

  componentDidMount() {
    this.input.current.focus()
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  handleKeyUp(e) {
    const query = e.target.value
    this.debounce(() => {
      this.setState({ query })
      history.push(`/search/${this.state.state}/${query}`)
    })
  }

  handleStateChange(state) {
    const next = { movie: 'person', person: 'movie' }[state]
    this.setState({ state: next })
    history.push(`/search/${next}/${this.state.query}`)
  }

  render() {
    const { query, state } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Search{query && `: "${query}" (${{ movie: 'Movies', person: 'Stars' }[state]})`}</title>
        </Helmet>
        <div style={styles.element}>
          <input
            ref={this.input}
            type="text"
            defaultValue={query}
            onKeyUp={this.handleKeyUp}
            style={styles.input}
            placeholder="Search..."
          />
          <i
            onClick={() => this.handleStateChange(state)}
            title={{ movie: 'Movies', person: 'Stars' }[state]}
            style={styles.state}
          >
            {{ movie: '🎞️', person: '⭐' }[state]}
          </i>
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
      </Fragment>
    )
  }
}
