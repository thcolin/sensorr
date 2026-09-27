export const SECONDARY = {
  '/movie': [
    { to: '/movie/library', label: 'Library' },
    { to: '/movie/discover', label: 'Discover' },
    { to: '/movie/calendar', label: 'Calendar' },
    { to: '/movie/trending', label: 'Trending' },
    { to: '/movie/theatres', label: 'Theatres' },
    { to: '/movie/requests', label: 'Requests' },
    { to: '/movie/swaps', label: 'Swaps' },
  ],
  '/tv': [
    { to: '/tv/library', label: 'Library' },
    { to: '/tv/discover', label: 'Discover' },
    { to: '/tv/calendar', label: 'Calendar' },
    { to: '/tv/trending', label: 'Trending' },
    { to: '/tv/requests', label: 'Requests' },
  ],
  '/person': [
    { to: '/person/followed', label: 'Followed' },
    { to: '/person/trending', label: 'Trending' },
  ],
}

// null when pathname is itself a root: a bottom bar target or one of its secondary tabs
export const sectionRootOf = (pathname, device) => {
  if (
    pathname === '/' ||
    pathname === '/settings' ||
    pathname.startsWith('/jobs') ||
    (device !== 'mobile' && pathname.startsWith('/settings/')) ||
    Object.values(SECONDARY).flat().some(({ to }) => pathname === to || pathname.startsWith(`${to}/`))
  ) {
    return null
  }

  return (
    pathname.startsWith('/tv') ? '/tv/library' :
    pathname.startsWith('/person') ? '/person/followed' :
    pathname.startsWith('/settings') ? '/settings' :
    '/'
  )
}
