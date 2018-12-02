import React from 'react'
import { Link } from 'react-router-dom'
import Language from 'components/Language'
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
    paddingBottom: '0.25em'
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
    textDecoration: 'none',
  },
}

export default ({ ...props}) => (
  <div style={styles.element}>
    <div style={styles.menu}>
      <Link to="/" style={{...styles.link, ...window.location.pathname.match(/^\/$/) ? styles.active : {}}}>Trending</Link>
      <Link to="/collection" style={{...styles.link, ...window.location.pathname.match(/^\/collection$/) ? styles.active : {}}}>Collection</Link>
      <Link to="/search/movie" style={{...styles.link, ...window.location.pathname.match(/^\/search/) ? styles.active : {}}}>Search</Link>
    </div>
    <div style={styles.emojis}>
      <Language />
      <Link to="/configure" style={styles.configure} title="Configure">🎚</Link>
      <Link to="/logs" style={styles.logs} title="History">📖</Link>
    </div>
  </div>
)
