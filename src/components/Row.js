import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import Movie from 'components/Movie'
import TMDB from 'store/services/tmdb'
import theme from 'theme'

const styles = {
  element: {
    margin: '2em 0',
  },
  title: {
    margin: '0 2em',
    fontSize: '2em',
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  row: {
    left: 0,
    display: 'flex',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    height: '20em',
  },
  entity: {
    flex: '0 0 auto',
    height: '100%',
    padding: '2em',
  },
}

export default class Row extends PureComponent {
  static propTypes = {
    uri: PropTypes.array.isRequired,
    params: PropTypes.object,
  }

  static defaultProps = {
    params: {},
  }

  constructor(props) {
    super(props)

    this.state = {
      entities: [],
      loading: true,
    }
  }

  componentDidMount() {
    TMDB.fetch(this.props.uri, this.props.params)
      .then(res => this.setState({
        entities: res.results,
        loading: false,
      }))
  }

  componentDidUpdate(props) {
    if (
      (this.props.uri.join('/') !== props.uri.join('/')) ||
      (JSON.stringify(this.props.params) !== JSON.stringify(props.params))
    ) {
      this.setState({ loading: true, })

      TMDB.fetch(this.props.uri, this.props.params)
        .then(res => this.setState({
          entities: res.results,
          loading: false,
        }))
    }
  }

  render() {
    const { title, ...props } = this.props
    const { entities, loading, ...state } = this.state

    return (
      <div style={styles.element}>
        <h1 {...props} style={{ ...styles.title, ...(props.style || {}) }}>{title}</h1>
        <div style={styles.row}>
          {loading && !entities.length && (
            <Spinner />
          )}
          {!loading && !entities.length && (
            <Empty />
          )}
          {entities.filter(entity => entity.poster_path).map((entity, index) => (
            <div key={index} style={styles.entity}>
              <Movie entity={entity} />
            </div>
          ))}
        </div>
      </div>
    )
  }
}
