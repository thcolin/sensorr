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

// The page a sub-route shows, named as its tab in the browser
export const pageLabelOf = (pathname) => [
  ...Object.values(SECONDARY).flat(),
  { to: '/person/calendar', label: 'Calendar' },
].find(({ to }) => pathname === to || pathname.startsWith(`${to}/`))?.label || null

// null when pathname is itself a root, a bottom bar target of the PWA: the home of a section, jobs or settings
export const sectionRootOf = (pathname, device) => {
  if (
    ['/', '/movie', '/tv', '/person', '/settings'].includes(pathname) ||
    pathname.startsWith('/jobs') ||
    (device !== 'mobile' && pathname.startsWith('/settings/'))
  ) {
    return null
  }

  return (
    pathname.startsWith('/tv') ? '/tv' :
    pathname.startsWith('/person') ? '/person' :
    pathname.startsWith('/settings') ? '/settings' :
    '/movie'
  )
}
