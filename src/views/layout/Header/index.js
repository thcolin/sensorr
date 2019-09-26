import React from 'react'
import { Switch, NavLink, Route } from 'react-router-dom'
import Navbar from './blocks/Navbar'
import Recording from './blocks/Recording'
import Search from './blocks/Search'
import theme from 'theme'

const styles = {
  sticky: {
    position: 'sticky',
  },
  element: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1em',
    fontSize: '1.5em',
    '>div': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: '0.5em',
      paddingLeft: '0.5em',
    },
    '>div:first-of-type': {
      padding: '0 0.5em 0 0',
    },
    '>div:last-of-type': {
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
  input: {
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
    '>*:first-of-type': {
      margin: '0 0.5em 0 0',
    },
    '>*:last-of-type': {
      margin: '0 0 0 0.5em',
    },
  },
  settings: {
    ...theme.resets.a,
  },
  navbar: {
    width: '100%',
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
  results: {
    active: {
      borderBottom: `1px solid ${theme.colors.grey}`,
      marginBottom: '-1px',
    },
  },
}

const Header = ({ ...props }) => (
  <>
    <Search.Provider css={[styles.sticky, styles.element]} style={{ top: 0, zIndex: 10 }}>
      <div css={styles.toolbar}>
        <div css={styles.home}>
          <NavLink to="/" exact={true} title="Sensorr">🍿</NavLink>
        </div>
        <div css={styles.navigator}>
          <button onClick={() => { /* triggerScrollTop() */ }}>
            <Switch>
              <Route path="/" exact={true} render={() => "Trending"} />
              <Route path="/movies" render={() => "Movies"} />
              <Route path="/stars" render={() => "Stars"} />
              <Route path="/settings" render={() => "Settings"} />
              <Route render={() => "Navigation"} />
            </Switch>
          </button>
        </div>
        <div css={styles.input}>
          <Search.Input />
        </div>
        <div css={styles.more}>
          <Recording />
        </div>
      </div>
      <Search.Results styles={{ active: styles.results.active }} />
    </Search.Provider>
    <div css={styles.navbar} style={{ zIndex: 8 }}>
      <hr css={styles.separator} />
      <Navbar />
    </div>
    <hr css={[styles.hr, styles.sticky]} style={{ top: 'calc(4em - 1px)', zIndex: 9 }} />
  </>
)

export default Header
