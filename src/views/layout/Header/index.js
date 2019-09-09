import React, { useState, useRef } from 'react'
import { Switch, NavLink, Route } from 'react-router-dom'
import AnimateHeight from 'react-animate-height'
import Recording from './containers/Recording'
import Search from 'views/layout/Search'
import theme from 'theme'

const styles = {
  header: {
    topbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '2.66em',
      backgroundColor: 'white',
      padding: '0 1em',
      fontSize: '1.5em',
      position: 'sticky',
      top: '-1px',
      zIndex: 10,
      '>div': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: '0.5em',
        paddingLeft: '0.5em',
      },
      '>div:first-child': {
        padding: '0 0.5em 0 0',
      },
      '>div:last-child': {
        padding: '0 0 0 0.5em',
      },
    },
    home: {
      borderRight: `1px solid ${theme.colors.mercury}`,
      '>a': {
        ...theme.resets.a,
      },
    },
    navigator: {
      '>button': {
        ...theme.resets.button,
        width: '7em',
        padding: '0 0 0 0.25em',
        fontSize: '0.6125em',
        fontWeight: 600,
        color: theme.colors.rangoon,
        textAlign: 'left',
        lineHeight: 1.5,
      },
    },
    search: {
      flex: 1,
      marginRight: '10%',
      marginLeft: '10%',
    },
    more: {
      display: 'flex',
      margin: '0 0.5em 0 0',
      '>*': {
        margin: '0 0.5em',
      },
      '>*:first-child': {
        margin: '0 0.5em 0 0',
      },
      '>*:last-child': {
        margin: '0 0 0 0.5em',
      },
    },
    settings: {
      ...theme.resets.a,
    },
    navbar: {
      overflow: 'hidden',
      backgroundColor: 'white',
    },
    hr: {
      border: 'none',
      margin: 0,
      borderBottom: `1px solid ${theme.colors.grey}`,
    },
    separator: {
      border: 'none',
      margin: '0 calc(15% + 5em) 0 calc(15% + 10em)',
      borderBottom: `1px solid ${theme.colors.mercury}`,
    },
    sticky: {
      position: 'sticky',
      top: 'calc(4em - 1px)',
      zIndex: 10,
    },
  },
  navbar: {
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
  },
}

const Navbar = ({ ...props }) => (
  <>
    <div css={styles.navbar.element}>
      <div css={styles.navbar.container}>
        <NavLink to="/" exact={true} activeStyle={styles.navbar.active}>Trending</NavLink>
        <NavLink to="/movies" activeStyle={styles.navbar.active}>Movies</NavLink>
        <Route
          path="/movies"
          render={() => (
            <div css={styles.navbar.secondary}>
              <svg xmlns="http://www.w3.org/2000/svg" css={styles.navbar.chevron} viewBox="0 0 320 512">
                <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
              </svg>
              <NavLink to="/movies/library" exact={true} activeStyle={styles.navbar.active}>Library</NavLink>
              <NavLink to="/movies/upcoming" activeStyle={styles.navbar.active}>Upcoming</NavLink>
              <NavLink to="/movies/records" activeStyle={styles.navbar.active}>Records</NavLink>
            </div>
          )}
        />
        <NavLink to="/stars" activeStyle={styles.navbar.active}>Stars</NavLink>
        <Route
          path="/stars"
          render={() => (
            <div css={styles.navbar.secondary}>
              <svg xmlns="http://www.w3.org/2000/svg" css={styles.navbar.chevron} viewBox="0 0 320 512">
                <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
              </svg>
              <NavLink to="/stars/following" exact={true} activeStyle={styles.navbar.active}>Following</NavLink>
            </div>
          )}
        />
        <NavLink to="/settings" activeStyle={styles.navbar.active}>Settings</NavLink>
        <Route
          path="/settings"
          render={() => (
            <div css={styles.navbar.secondary}>
              <svg xmlns="http://www.w3.org/2000/svg" css={styles.navbar.chevron} viewBox="0 0 320 512">
                <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
              </svg>
              <NavLink to="/settings" exact={true} activeStyle={styles.navbar.active}>General</NavLink>
              <NavLink to="/settings/downloads" exact={true} activeStyle={styles.navbar.active}>Downloads</NavLink>
              <NavLink to="/settings/plex" exact={true} activeStyle={styles.navbar.active}>Plex</NavLink>
              <NavLink to="/settings/database" exact={true} activeStyle={styles.navbar.active}>Database</NavLink>
            </div>
          )}
        />
      </div>
    </div>
  </>
)

const Header = ({ ...props }) => {
  const [navbar, setNavbar] = useState(false)

  return (
    <>
      <div css={styles.header.topbar}>
        <div css={styles.header.home}>
          <NavLink to="/" exact={true} title="Sensorr">🍿</NavLink>
        </div>
        <div css={styles.header.navigator}>
          <button
            onClick={() => {
              setNavbar(!!window.scrollY ? true : !navbar)
              // triggerScrollTop()
            }}
          >
            <Switch>
              <Route path="/" exact={true} render={() => "Trending"} />
              <Route path="/movies" render={() => "Movies"} />
              <Route path="/stars" render={() => "Stars"} />
              <Route path="/settings" render={() => "Settings"} />
              <Route render={() => "Navigation"} />
            </Switch>
          </button>
        </div>
        <div css={styles.header.search}>
          <Search.Input />
        </div>
        <div css={styles.header.more}>
          <Recording />
        </div>
      </div>
      <AnimateHeight css={styles.header.navbar} height={navbar ? 'auto' : 0}>
        <hr css={styles.header.separator} />
        <Navbar />
      </AnimateHeight>
      <hr css={[styles.header.hr, styles.header.sticky]} />
    </>
  )
}

export default Header
