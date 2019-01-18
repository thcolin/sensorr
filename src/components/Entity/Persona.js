import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import theme from 'theme'

const styles = {
  link: {
    textDecoration: 'none',
  },
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '0 0 3em 0',
  },
  poster: {
    height: '14em',
    width: '10em',
    border: 'solid 0.375em white',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
  },
  tooltip: {
    backgroundColor: theme.colors.shadows.black,
    borderRadius: '0.25em',
    color: theme.colors.white,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    padding: '0.25em 0.5em',
  },
}

const contexts = {
  portrait: {
    element: {

    },
    tooltip: {
      margin: '0.5em 0',
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  avatar: {
    element: {
      width: '10em',
      margin: '0 -2em 0 0',
    },
    poster: {
      height: '10em',
      borderRadius: '50%',
    },
    tooltip: {
      position: 'absolute',
      margin: '5.5em 0',
      fontSize: '2em',
    },
  },
}

export default class Persona extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    context: PropTypes.oneOf(['portrait', 'avatar']),
  }

  static defaultProps = {
    context: 'avatar',
  }

  constructor(props) {
    super(props)

    this.state = {
      ready: false,
      tooltip: false,
    }
  }

  render() {
    const { entity, context, ...props } = this.props
    const { ready, tooltip, ...state } = this.state

    return (
      <Link to={`/star/${entity.id}`} style={styles.link}>
        <div style={{ ...styles.element, ...contexts[context].element }}>
          <div
            style={{ ...styles.poster, ...contexts[context].poster, backgroundColor: ready ? 'transparent' : theme.colors.grey }}
            onMouseEnter={() => this.setState({ tooltip: true })}
            onMouseLeave={() => this.setState({ tooltip: false })}
          >
            <img src={`http://image.tmdb.org/t/p/w300${entity.profile_path}`} onLoad={() => this.setState({ ready: true })} style={styles.img} />
          </div>
          <h5 style={{ ...styles.tooltip, ...contexts[context].tooltip }} hidden={context !== 'portrait' && !tooltip}>{entity.name}</h5>
        </div>
      </Link>
    )
  }
}
