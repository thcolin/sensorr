import { useCallback, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import useRipple from 'use-ripple-hook'
import { useDeviceContext } from '../../../contexts/Device/Device'

const Chevron = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="0.5em" width="0.5em" viewBox="0 0 320 512">
    <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
  </svg>
)

const RippleNavLink = ({ ...props }) => {
  const [ref, onPointerDown] = useRipple()

  return (
    <NavLink ref={ref} onPointerDown={onPointerDown} {...props as any} />
  )
}

const Navigation = ({ display = 'web', ...props }) => {
  const { device, pwa, setHistoryIndex } = useDeviceContext()

  const location = useLocation()
  const container = useRef() as any

  const handleAppNavigation = useCallback(() => {
    window.SENSORR_BODY_VIEW_TRANSITION_NAME = 'top'
    setHistoryIndex(-1)
  }, [])

  const handleWebNavigation = useCallback((e) => {
    window.SENSORR_BODY_VIEW_TRANSITION_NAME = 'fade'
    container?.current?.scrollTo({
      top: 0,
      left: e.target.offsetLeft - (window.innerWidth / 2) + (e.target.offsetWidth / 2),
      behavior: 'smooth',
    })
  }, [])

  if (pwa && display === 'app') {
    return (
      <div sx={Navigation.styles.app.element}>
        <RippleNavLink to='/' viewTransition onClick={location.pathname === '/' ? () => {} : handleAppNavigation} style={(location.pathname === '/' || location.pathname.startsWith('/movie') || location.pathname.startsWith('/collection')) ? Navigation.styles.app.active : {}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="currentColor" d="M5.6 15.1c.3 3.3 1.4 13.1 1.9 17.4.1 1.1 1.1 2 2.3 2h3.7l-1.1-19.4H5.6zM15.7 34.4v.1h4.6v-.1l1.1-19.3h-6.8zM23.6 15.1l-1.1 19.4h3.7c1.1 0 2.1-.9 2.3-2 .5-4.3 1.6-14.1 2-17.4h-6.9zM27.1 10v-.6c0-2.5-2-4.6-4.6-4.6h-.6c-1.2-2.2-4-3-6.2-1.8-.7.4-1.4 1-1.8 1.8h-.6c-2.5 0-4.5 2.1-4.5 4.6v.6c-1.1.6-1.9 1.6-2.2 2.8h22.6c-.2-1.2-1-2.2-2.1-2.8z"/></svg>
        </RippleNavLink>
        <RippleNavLink to='/person/followed' viewTransition onClick={location.pathname === '/person/followed' ? () => {} : handleAppNavigation} style={location.pathname.startsWith('/person') ? Navigation.styles.app.active : {}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="currentColor" d="M13.4 17.9c-1.1 1.1-2.6 1.8-4.2 1.8-3.2-.1-5.7-2.7-5.7-5.9C3.6 10.7 6 8.2 9 8.1c-.8 3.8 1 7.8 4.4 9.8zM32.6 13.8c0 3.2-2.6 5.8-5.8 5.8-1.6 0-3.1-.7-4.2-1.8 3.4-2 5.2-5.9 4.4-9.8 3.1.2 5.6 2.7 5.6 5.8zM7.8 23.9c-.6 1.2-.9 2.5-.9 3.9v6.1H2V30c0-3.3 2.6-6 5.8-6.1zM34 30v3.9h-4.9v-6.1c0-1.3-.3-2.7-.9-3.9 3.2.1 5.8 2.8 5.8 6.1zM24.8 9.9c0 3.7-3 6.8-6.8 6.8-3.7 0-6.8-3-6.8-6.8s3-6.8 6.8-6.8c3.7 0 6.7 3.1 6.8 6.8zM26.6 27.7v6.1H9.4v-6.1c0-1.4.5-2.8 1.4-3.9.3-.4.7-.8 1.1-1.1.3-.3.7-.5 1.1-.6.8-.4 1.7-.6 2.6-.5h4.9c.9 0 1.8.2 2.6.5.4.2.7.4 1.1.6.4.3.8.7 1.1 1.1.8 1.1 1.3 2.5 1.3 3.9z"/></svg>
        </RippleNavLink>
        <RippleNavLink to='/jobs' viewTransition onClick={location.pathname === '/jobs' ? () => {} : handleAppNavigation} style={({ isActive }) => isActive ? Navigation.styles.app.active : {}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="currentColor" d="M24.9 20.8v8c0 .6-.5 1.1-1.1 1.1h-.1c-.6-2.4-3.1-3.9-5.5-3.3-1.6.4-2.9 1.7-3.3 3.3h-2.6c-.8-2.4-3.3-3.9-5.7-3.2-1.6.4-2.9 1.7-3.3 3.3h-.2c-.3 0-.6-.1-.8-.3-.2-.3-.3-.6-.3-.9v-8c0-.6.5-1.1 1.1-1.1h20.6c.3 0 .6.1.8.4.2.1.4.4.4.7zM32.9 29.9h-2.3c-.9 0-1.8-.4-2.4-1-.6-.6-1-1.5-1-2.4V8.2c.1-.6.6-1.1 1.3-1 .6.1 1 .5 1 1v18.3c0 .3.1.6.3.8.2.2.5.3.8.3h2.3c.6.1 1.1.6 1 1.3 0 .5-.5 1-1 1z"/><path fill="currentColor" d="M10 31.1c-.1 1.3-1.2 2.2-2.4 2.1-1.1-.1-2.1-1-2.1-2.1-.1-1.3.9-2.4 2.1-2.4s2.4.9 2.4 2.1v.3zM21.4 31.1c0 1.3-1 2.3-2.3 2.3-1.3 0-2.3-1-2.3-2.3 0-1.3 1-2.3 2.3-2.3 1.3 0 2.3 1 2.3 2.3zM20 17.4H5.4V4.8c0-.6.5-1.1 1.1-1.1h7.7c1.6 0 3 1.1 3.3 2.7l2.5 11z"/></svg>
        </RippleNavLink>
        <RippleNavLink to='/settings' viewTransition onClick={location.pathname === '/settings' ? () => {} : handleAppNavigation} style={({ isActive }) => isActive ? Navigation.styles.app.active : {}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="currentColor" d="M32.2 14.7c-.9-.2-2.1-.4-3.4-.6.8-1.1 1.5-2.1 2-2.9.6-.9.5-2.1-.3-2.9l-2.2-2.2c-.8-.8-2-.9-2.9-.3-.8.5-1.8 1.2-2.9 2-.2-1.3-.5-2.5-.6-3.4-.2-1.1-1.1-1.8-2.2-1.8h-3.1c-1.1 0-2 .8-2.2 1.8-.2.9-.4 2.1-.6 3.4-1.1-.8-2.1-1.5-2.9-2-1.1-.6-2.3-.5-3.1.3L5.6 8.3c-.8.8-.9 2-.3 2.9.5.8 1.2 1.8 2 2.9-1.3.2-2.5.5-3.4.6-1.1.2-1.9 1.1-1.9 2.2V20c0 1.1.8 2 1.8 2.2.9.2 2.1.4 3.4.6-.8 1.1-1.4 2.1-2 2.9-.6.9-.5 2.1.3 2.9l2.2 2.2c.8.8 2 .9 2.9.3.8-.5 1.8-1.2 2.9-2 .2 1.3.5 2.5.6 3.4.2 1.1 1.2 1.9 2.2 1.9h3.1c1.1 0 2-.8 2.2-1.8.2-.9.4-2.1.6-3.4 1.1.8 2.1 1.5 2.9 2 .9.6 2.1.5 2.9-.3l2.2-2.2c.8-.8.9-2 .3-2.9-.5-.8-1.2-1.8-2-2.9 1.3-.2 2.5-.5 3.4-.6 1.1-.2 1.9-1.2 1.9-2.3v-3.1c.2-1.1-.6-2-1.6-2.2zM18 24.2c-3.2 0-5.7-2.6-5.7-5.7 0-3.2 2.6-5.7 5.7-5.7 3.2 0 5.7 2.6 5.7 5.7 0 3.2-2.5 5.7-5.7 5.7z"/></svg>
        </RippleNavLink>
      </div>
    )
  }

  if (!pwa && display === 'web') {
    return (
      <div sx={Navigation.styles.web.element}>
        <div ref={container} sx={Navigation.styles.web.container}>
          <NavLink onClick={handleWebNavigation} to="/" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Home</NavLink>
          <NavLink onClick={handleWebNavigation} to="/movie/library" viewTransition style={(location.pathname.startsWith('/movie') || location.pathname.startsWith('/collection')) ? Navigation.styles.web.active : {}}>Movies</NavLink>
          {location.pathname.startsWith('/movie') && (
            <div sx={Navigation.styles.web.secondary}>
              <Chevron />
              <NavLink onClick={handleWebNavigation} to="/movie/library" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Library</NavLink>
              <NavLink onClick={handleWebNavigation} to="/movie/discover" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Discover</NavLink>
              <NavLink onClick={handleWebNavigation} to="/movie/calendar" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Calendar</NavLink>
              <NavLink onClick={handleWebNavigation} to="/movie/trending" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Trending</NavLink>
              <NavLink onClick={handleWebNavigation} to="/movie/theatres" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Theatres</NavLink>
              <NavLink onClick={handleWebNavigation} to="/movie/requests" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Requests</NavLink>
            </div>
          )}
          <NavLink onClick={handleWebNavigation} to="/person/followed" viewTransition style={location.pathname.startsWith('/person') ? Navigation.styles.web.active : {}}>Stars</NavLink>
          {location.pathname.startsWith('/person') && (
            <div sx={Navigation.styles.web.secondary}>
              <Chevron />
              <NavLink onClick={handleWebNavigation} to="/person/followed" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Followed</NavLink>
              <NavLink onClick={handleWebNavigation} to="/person/trending" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Trending</NavLink>
            </div>
          )}
          <NavLink onClick={handleWebNavigation} to="/jobs" viewTransition style={({ isActive }) => isActive ? Navigation.styles.web.active : {}}>Jobs</NavLink>
          <NavLink onClick={handleWebNavigation} to={device === 'mobile' ? '/settings' : '/settings/tmdb'} viewTransition style={location.pathname.startsWith('/settings') ? Navigation.styles.web.active : {}}>Settings</NavLink>
        </div>
      </div>
    )
  }

  return null

}

Navigation.styles = {
  app: {
    element: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      backgroundColor: 'grayLighter',
      borderTop: '1px solid',
      borderColor: 'gray',
      zIndex: 5,
      '>a': {
        variant: 'link.reset',
        flex: 1,
        paddingY: 4,
        paddingBottom: 'max(1em, env(safe-area-inset-bottom))',
        color: 'grayDark',
        textAlign: 'center',
        transition: 'color 200ms ease-in-out',
        '>svg': {
          height: '1.5em',
          width: '1.5em',
        },
      },
    },
    active: {
      color: 'var(--theme-ui-colors-primary)',
    },
  },
  web: {
    element: {
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: 'white',
    },
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowX: 'auto',
      '>a': {
        variant: 'link.reset',
        paddingTop: 2,
        paddingRight: 1,
        paddingBottom: 2,
        paddingLeft: 1,
        fontWeight: 'semibold',
        fontSize: 5,
        color: 'text',
        opacity: 0.33,
        transition: 'opacity ease 300ms',
        '&:hover': {
          opacity: [0.33, 0.66],
        },
      },
    },
    secondary: {
      display: 'flex',
      alignItems: 'center',
      '>a': {
        variant: 'link.reset',
        padding: 4,
        fontWeight: 600,
        fontSize: 6,
        color: 'text',
        opacity: 0.33,
        transition: 'opacity ease 300ms',
        '&:hover': {
          opacity: [0.33, 0.66],
        },
      },
    },
    active: {
      opacity: 1,
    },
  },
}

export default Navigation
