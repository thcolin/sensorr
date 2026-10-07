import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRipple } from 'use-ripple-hook'
import { Link } from '@sensorr/ui'
import { scrollToTop } from '@sensorr/utils'
import { LoadingBar } from '../LoadingBar'
import { useDeviceContext } from '../../contexts/Device/Device'
import { useSearchContext } from '../../contexts/Search/Search'
import { Input as SearchInput, Results as SearchResults, History as SearchHistory } from './elements/Search'
import { Notifications } from './elements/Notifications'
import Navigation from './elements/Navigation'
import { pageLabelOf, sectionRootOf } from './elements/sections'

const PWD = ({ ...props }) => {
  const location = useLocation()

  return (
    <button sx={PWD.styles.element} onClick={() => scrollToTop()}>
      {(
        location.pathname === '/' ? 'Home' :
        location.pathname.startsWith('/movie') ? 'Movies' :
        location.pathname.startsWith('/tv') ? 'TV' :
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

const Logo = ({ ...props }) => {
  const [ref, onPointerDown] = useRipple()
  const { pwa, device } = useDeviceContext()
  const location = useLocation()
  const navigate = useNavigate()
  const root = sectionRootOf(location.pathname, device)
  const label = root && pageLabelOf(location.pathname)

  const back = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1)
      return
    }

    window.SENSORR_BODY_VIEW_TRANSITION_NAME = 'backward'
    navigate(root, { replace: true })
  }

  return pwa ? (
    <button
      ref={ref}
      onPointerDown={onPointerDown}
      onClick={back}
      disabled={!root}
      aria-label='Back'
      sx={{
        variant: 'button.reset',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        minWidth: '4em',
        paddingLeft: 8,
        paddingRight: 4,
        transition: 'all 400ms ease-in-out 200ms',
        ':disabled': {
          opacity: 0,
          minWidth: 0,
          width: 0,
          paddingX: 12,
        },
        '>svg': {
          flexShrink: 0,
          transform: 'rotate(180deg)'
        },
        '>span': {
          marginLeft: 6,
          fontWeight: 'semibold',
          fontFamily: 'heading',
          fontSize: 5,
          whiteSpace: 'nowrap',
        },
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" height='1em' width='1em' viewBox="0 0 320 512">
        <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
      </svg>
      {label && <span>{label}</span>}
    </button>
  ) : (
    <div
      sx={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingRight: 4,
        paddingLeft: [8, 4],
        '>*:not(:first-child)': {
          display: ['none', 'none', 'block'],
        },
      }}
    >
      <Link {...props} to='/' sx={{ variant: 'link.reset', fontSize: 2, paddingX: 8 }} title='Sensorr' onClick={() => scrollToTop()}>
        🍿
      </Link>
      <Seperator />
      <PWD />
    </div>
  )
}

const Toolbar = ({ ...props }) => (
  <div sx={Toolbar.styles.element}>
    <LoadingBar />
    <div sx={Toolbar.styles.wrapper}>
      <div sx={Toolbar.styles.left}>
        <Logo />
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
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
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
    paddingRight: 4,
    paddingLeft: 4,
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
  },
}

const Header = ({ ...props }) => {
  const location = useLocation()
  const { pwa, ios } = useDeviceContext()
  const { results, loading, clear, historyDisplay, history } = useSearchContext() as any
  const extanded = results !== null || loading
  const statusBar = pwa && ios

  useEffect(() => {
    if (extanded) {
      clear()
    }
  }, [location])

  return (
    <div sx={{ ...Header.styles.element, ...(statusBar ? { paddingTop: Header.styles.statusBar.height } : {}) }} style={{ zIndex: (extanded || (historyDisplay && !!history.length)) ? 6 : 5 }}>
      {statusBar && <div sx={Header.styles.statusBar} />}
      {/* `--banner-height`: what a banner above the app takes, the demo's */}
      <div sx={{ ...Header.styles.container, height: extanded ? `calc(100dvh - ${statusBar ? Header.styles.statusBar.height : '0px'} - var(--banner-height, 0px))` : 'initial' }}>
        <Toolbar />
        <div sx={Header.styles.history}>
          <SearchHistory />
        </div>
        <SearchResults />
      </div>
      <Navigation display='web' />
      <hr sx={{ variant: 'hr.default' }} {...props} />
    </div>
  )
}

Header.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    top: '0px',
    width: '100%',
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
  // iOS blurs the band under the status bar of an installed app unless a fixed element at least 6px tall covers the top edge
  statusBar: {
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: '100%',
    height: '6px',
    backgroundColor: 'white',
  },
}

export default Header
