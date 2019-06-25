import React, { Component, Fragment } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import StatusRecording from './containers/StatusRecording'
import theme from 'theme'

const styles = {
  primary: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    padding: '2em 0',
  },
  secondary: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: '1em 0',
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
  light: {
    fontSize: '0.95em',
    fontWeight: 600,
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
    const { location, ...props } = this.props
    const section = location.pathname.split('/').slice(1, 2).pop()

    return (
      <Fragment>
        <div style={styles.primary}>
          <div style={styles.menu}>
            <NavLink to="/" exact={true} style={styles.link} activeStyle={styles.active}>Trending</NavLink>
            <NavLink to="/movies/collection" exact={true} style={{ ...styles.link, ...(section === 'movies' ? styles.active : {}) }}>Movies</NavLink>
            <NavLink to="/stars/upcoming" exact={true} style={{ ...styles.link, ...(section === 'stars' ? styles.active : {}) }}>Stars</NavLink>
          </div>
          <div style={styles.emojis}>
            <NavLink to="/configure" exact={true} style={styles.configure} title="Configure">🎚</NavLink>
            <NavLink to="/logs" exact={true} style={styles.logs} title="History">📖</NavLink>
            <StatusRecording />
          </div>
        </div>
        {{
          movies: (
            <div style={styles.secondary}>
              <NavLink to="/movies/collection" exact={true} style={{ ...styles.link, ...styles.light }} activeStyle={styles.active}>Collection</NavLink>
              <NavLink to="/movies/search" style={{ ...styles.link, ...styles.light }} activeStyle={styles.active}>Search</NavLink>
            </div>
          ),
          stars: (
            <div style={styles.secondary}>
              <NavLink to="/stars/upcoming" style={{ ...styles.link, ...styles.light }} activeStyle={styles.active}>Upcoming</NavLink>
              <NavLink to="/stars/following" exact={true} style={{ ...styles.link, ...styles.light }} activeStyle={styles.active}>Following</NavLink>
              <NavLink to="/stars/search" style={{ ...styles.link, ...styles.light }} activeStyle={styles.active}>Search</NavLink>
            </div>
          ),
        }[section]}
      </Fragment>
    )
  }
}

export default withRouter(Navigation)
