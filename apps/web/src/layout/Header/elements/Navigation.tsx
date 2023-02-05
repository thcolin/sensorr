import { useCallback, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const Chevron = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" sx={Chevron.styles.element} viewBox="0 0 320 512">
    <path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
  </svg>
)

Chevron.styles = {
  element: {
    height: 8,
  }
}

const Navigation = ({ ...props }) => {
  const location = useLocation()
  const container = useRef() as any
  const scrollTo = useCallback(e => container?.current?.scrollTo({
    top: 0,
    left: e.target.offsetLeft - (window.innerWidth / 2) + (e.target.offsetWidth / 2),
    behavior: 'smooth',
  }), [])

  return (
    <div sx={Navigation.styles.element}>
      <div ref={container} sx={Navigation.styles.container}>
        <NavLink onClick={scrollTo} to="/" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Home</NavLink>
        <NavLink onClick={scrollTo} to="/movie/library" style={(location.pathname.startsWith('/movie') || location.pathname.startsWith('/collection')) ? Navigation.styles.active : {}}>Movies</NavLink>
        {location.pathname.startsWith('/movie') && (
          <div sx={Navigation.styles.secondary}>
            <Chevron />
            <NavLink onClick={scrollTo} to="/movie/library" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Library</NavLink>
            <NavLink onClick={scrollTo} to="/movie/discover" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Discover</NavLink>
            <NavLink onClick={scrollTo} to="/movie/calendar" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Calendar</NavLink>
            <NavLink onClick={scrollTo} to="/movie/trending" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Trending</NavLink>
            <NavLink onClick={scrollTo} to="/movie/theatres" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Theatres</NavLink>
            <NavLink onClick={scrollTo} to="/movie/requests" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Requests</NavLink>
          </div>
        )}
        <NavLink onClick={scrollTo} to="/person/followed" style={location.pathname.startsWith('/person') ? Navigation.styles.active : {}}>Stars</NavLink>
        {location.pathname.startsWith('/person') && (
          <div sx={Navigation.styles.secondary}>
            <Chevron />
            <NavLink onClick={scrollTo} to="/person/followed" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Followed</NavLink>
            <NavLink onClick={scrollTo} to="/person/trending" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Trending</NavLink>
          </div>
        )}
        <NavLink onClick={scrollTo} to="/jobs" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Jobs</NavLink>
        <NavLink onClick={scrollTo} to="/settings" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Settings</NavLink>
        {location.pathname.startsWith('/settings') && (
          <div sx={Navigation.styles.secondary}>
            <Chevron />
            <NavLink onClick={scrollTo} to="/settings" end style={({ isActive }) => isActive ? Navigation.styles.active : {}}>General</NavLink>
            <NavLink onClick={scrollTo} to="/settings/downloads" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Downloads</NavLink>
            <NavLink onClick={scrollTo} to="/settings/plex" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Plex</NavLink>
            <NavLink onClick={scrollTo} to="/settings/friends" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Friends</NavLink>
            <NavLink onClick={scrollTo} to="/settings/pwa" style={({ isActive }) => isActive ? Navigation.styles.active : {}}>Mobile</NavLink>
          </div>
        )}
      </div>
    </div>
  )
}

Navigation.styles = {
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
}

export default Navigation
