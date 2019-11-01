import React from 'react'
import { NavLink, Route } from 'react-router-dom'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: '0 10%',
    '>a': {
      ...theme.resets.a,
      padding: '1.5em 1.75em',
      fontWeight: 600,
      fontSize: '0.875em',
      color: theme.colors.rangoon,
      opacity: 0.33,
      transition: 'opacity ease 300ms',
      '&:hover': {
        opacity: 0.66,
      },
    },
  },
  secondary: {
    display: 'flex',
    alignItems: 'center',
    '>a': {
      ...theme.resets.a,
      padding: '1em',
      fontWeight: 600,
      fontSize: '0.75em',
      color: theme.colors.rangoon,
      opacity: 0.33,
      transition: 'opacity ease 300ms',
      '&:hover': {
        opacity: 0.66,
      },
    },
  },
  chevron: {
    height: '0.5em',
  },
  active: {
    opacity: 1,
  },
}

const Navbar = ({ ...props }) => (
  <>
    <div css={styles.element}>
      <div css={styles.container}>
        <NavLink to="/" exact={true} activeStyle={styles.active}>Home</NavLink>
        <NavLink to="/movies" activeStyle={styles.active}>Movies</NavLink>
        <Route
          path="/movies"
          render={() => (
            <div css={styles.secondary}>
              <svg xmlns="http://www.w3.org/2000/svg" css={styles.chevron} viewBox="0 0 320 512">
                <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
              </svg>
              <NavLink to="/movies/library" exact={true} activeStyle={styles.active}>Library</NavLink>
              <NavLink to="/movies/calendar" activeStyle={styles.active}>Calendar</NavLink>
              <NavLink to="/movies/records" activeStyle={styles.active}>Records</NavLink>
            </div>
          )}
        />
        <NavLink to="/stars/following" activeStyle={styles.active}>Stars</NavLink>
        <Route
          path="/stars"
          render={() => (
            <div css={styles.secondary}>
              <svg xmlns="http://www.w3.org/2000/svg" css={styles.chevron} viewBox="0 0 320 512">
                <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
              </svg>
              <NavLink to="/stars/following" exact={true} activeStyle={styles.active}>Following</NavLink>
            </div>
          )}
        />
        <NavLink to="/settings" activeStyle={styles.active}>Settings</NavLink>
        <Route
          path="/settings"
          render={() => (
            <div css={styles.secondary}>
              <svg xmlns="http://www.w3.org/2000/svg" css={styles.chevron} viewBox="0 0 320 512">
                <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
              </svg>
              <NavLink to="/settings" exact={true} activeStyle={styles.active}>General</NavLink>
              <NavLink to="/settings/downloads" exact={true} activeStyle={styles.active}>Downloads</NavLink>
              <NavLink to="/settings/plex" exact={true} activeStyle={styles.active}>Plex</NavLink>
              <NavLink to="/settings/database" exact={true} activeStyle={styles.active}>Database</NavLink>
            </div>
          )}
        />
      </div>
    </div>
  </>
)

export default Navbar
