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
    margin: '0 -2em 0 0',
    padding: '0 0 3em 0',
  },
  poster: {
    height: '10em',
    width: '10em',
    border: 'solid 0.375em white',
    borderRadius: '50%',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
  },
  tooltip: {
    backgroundColor: theme.colors.shadows.black,
    borderRadius: '0.25em',
    fontSize: '2em',
    color: theme.colors.white,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    padding: '0.25em',
  },
}

const brands = {
  flat: {
    element: {

    },
    tooltip: {
      margin: '0.5em 0',
    },
  },
  hover: {
    element: {
      width: '10em',
    },
    tooltip: {
      position: 'absolute',
      margin: '5.5em 0',
    },
  },
}

export default class Persona extends PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    brand: PropTypes.oneOf(['flat', 'hover']),
  }

  static defaultProps = {
    brand: 'hover',
  }

  constructor(props) {
    super(props)

    this.state = {
      ready: false,
      tooltip: false,
    }
  }

  render() {
    const { entity, brand, ...props } = this.props
    const { ready, tooltip, ...state } = this.state

    return (
      <Link to={`/star/${entity.id}`} style={styles.link}>
        <div style={{ ...styles.element, ...brands[brand].element }}>
          <div
            style={{ ...styles.poster, backgroundColor: ready ? 'transparent' : theme.colors.grey }}
            onMouseEnter={() => this.setState({ tooltip: true })}
            onMouseLeave={() => this.setState({ tooltip: false })}
          >
            <img src={`http://image.tmdb.org/t/p/w300${entity.profile_path}`} onLoad={() => this.setState({ ready: true })} style={styles.img} />
          </div>
          <h5 style={{ ...styles.tooltip, ...brands[brand].tooltip }} hidden={brand !== 'flat' && !tooltip}>{entity.name}</h5>
        </div>
      </Link>
    )
  }
}
