import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import StatusRecording from 'containers/StatusRecording'
import theme from 'theme'

const styles = {
  element: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    padding: '2em 0',
  },
  menu: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
  },
  link: {
    color: theme.colors.white,
    margin: '0 2em',
    fontWeight: 800,
    textTransform: 'uppercase',
    textDecoration: 'none',
    paddingBottom: '0.35em'
  },
  active: {
    borderBottom: `0.1em solid ${theme.colors.white}`,
    paddingBottom: '0.25em',
  },
  emojis: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifySelf: 'flex-end',
    padding: '0 1em',
    fontSize: '2em',
  },
  configure: {
    margin: '0 1em',
    textDecoration: 'none',
  },
  logs: {
    margin: '0 1em 0 0',
    textDecoration: 'none',
  },
}

class Navigation extends Component {
  render() {
    const { ...props } = this.props

    return (
      <div style={styles.element}>
        <div style={styles.menu}>
          <NavLink to="/" exact={true} style={styles.link} activeStyle={styles.active}>Trending</NavLink>
          <NavLink to="/collection" exact={true} style={styles.link} activeStyle={styles.active}>Collection</NavLink>
          <NavLink to="/search/movie" exact={true} style={styles.link} activeStyle={styles.active}>Search</NavLink>
        </div>
        <div style={styles.emojis}>
          <NavLink to="/configure" exact={true} style={styles.configure} title="Configure">🎚</NavLink>
          <NavLink to="/logs" exact={true} style={styles.logs} title="History" replace={location.pathname === '/logs'}>📖</NavLink>
          <StatusRecording />
        </div>
      </div>
    )
  }
}

export default Navigation
