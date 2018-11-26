import React, { PureComponent } from 'react'
import Row from 'components/Layout/Row'
import Film from 'components/Entity/Film'
import { fromEvent } from 'rxjs'
import nanobounce from 'nanobounce'
import history from 'store/history'
import theme from 'theme'

const styles = {
  element: {

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
  }
}

export default class Search extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      query: props.match.params.query || '',
    }

    this.input = React.createRef()
    this.debounce = nanobounce()
    this.handleKeyUp = this.handleKeyUp.bind(this)

    this.subscription = fromEvent(window, 'popstate').subscribe(
      () => {
        const matches = window.location.pathname.match(/^\/search\/(.*?)$/)

        if (matches) {
          this.setState({ query: decodeURI(matches[1]) })
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
      history.push(`/search/${query}`)
    })
  }

  render() {
    const { query, ...state } = this.state

    return (
      <div style={styles.element}>
        <input
          ref={this.input}
          type="text"
          defaultValue={this.state.query}
          onKeyUp={this.handleKeyUp}
          style={styles.input}
          placeholder="Search..."
        />
        {query && (
          <Row
            label={query}
            child={Film}
            uri={['search', 'movie']}
            params={{ query, sort_by: 'popularity.desc' }}
          />
        )}
      </div>
    )
  }
}
