import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from '@sensorr/ui'
import { scrollToTop } from '@sensorr/utils'
import { LoadingBar } from '../LoadingBar'
import { useSearchContext } from '../../contexts/Search/Search'
import { Input as SearchInput, Results as SearchResults, History as SearchHistory } from './elements/Search'
import { Notifications } from './elements/Notifications'
import Navigation from './elements/Navigation'

const Logo = ({ ...props }) => (
  <Link {...props} to='/' sx={Logo.styles.element} title='Sensorr'>
    🍿
  </Link>
)

Logo.styles = {
  element: {
    fontSize: 2,
    variant: 'link.reset',
    marginX: 8,
  },
}

const PWD = ({ ...props }) => {
  const location = useLocation()

  return (
    <button sx={PWD.styles.element} onClick={() => scrollToTop()}>
      {(
        location.pathname === '/' ? 'Home' :
        location.pathname.startsWith('/movie') ? 'Movies' :
        location.pathname.startsWith('/collection') ? 'Collections' :
        location.pathname.startsWith('/person') ? 'Stars' :
        location.pathname.startsWith('/search') ? 'Search' :
        location.pathname.startsWith('/jobs') ? 'Jobs' :
        location.pathname.startsWith('/settings') ? 'Settings' :
        'Navigation'
      )}
    </button>
  )
}

PWD.styles = {
  element: {
    position: 'absolute',
    left: '100%',
    variant: 'button.reset',
    fontWeight: 'semibold',
    fontFamily: 'heading',
    fontSize: 5,
    marginLeft: 4,
    marginRight: 4,
  },
}

const Seperator = ({ ...props }) => <div sx={Seperator.styles.element}></div>

Seperator.styles = {
  element: {
    borderLeft: '1px solid',
    borderColor: 'gray',
    height: '1em',
  },
}

const Toolbar = ({ ...props }) => (
  <div sx={Toolbar.styles.element}>
    <LoadingBar />
    <div sx={Toolbar.styles.wrapper}>
      <div sx={Toolbar.styles.left}>
        <Logo />
        <Seperator />
        <PWD />
      </div>
      <div sx={Toolbar.styles.center}>
        <SearchInput />
      </div>
      <div sx={Toolbar.styles.right}>
        <Notifications />
      </div>
    </div>
  </div>
)

Toolbar.styles = {
  element: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '4em',
    overflow: 'hidden',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    '>*': {
      paddingRight: 4,
      paddingLeft: 4,
    },
  },
  left: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    '>*:not(:first-child)': {
      display: ['none', 'block'],
    },
  },
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    maxWidth: '40rem',
    marginBottom: '-1px',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    marginX: [12, '10em'],
  },
  right: {

  },
}

const Header = ({ ...props }) => {
  const location = useLocation()
  const { results, loading, clear, historyDisplay, history } = useSearchContext() as any
  const extanded = results !== null || loading

  useEffect(() => {
    if (extanded) {
      clear()
    }
  }, [location])

  useEffect(() => {
    if (extanded) {
      document.body.style['max-height'] = '100vh'
      document.body.style['overflow'] = 'hidden'
    } else {
      document.body.style['max-height'] = 'initial'
      document.body.style['overflow'] = 'initial'
    }
  }, [extanded])

  return (
    <div sx={Header.styles.element} style={{ zIndex: (historyDisplay && !!history.length) ? 6 : 5 }}>
      <div sx={{ ...Header.styles.container, height: extanded ? '100vh' : 'initial' }}>
        <Toolbar />
        <div sx={Header.styles.history}>
          <SearchHistory />
        </div>
        <SearchResults />
      </div>
      <Navigation />
      <hr sx={{ variant: 'hr.default' }} {...props} />
    </div>
  )
}

Header.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: '0px',
    backgroundColor: 'white',
  },
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  history: {
    position: 'absolute',
    top: '100%',
    zIndex: 1
  },
}

export default Header
