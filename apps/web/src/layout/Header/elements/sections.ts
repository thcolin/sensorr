import i18n from '@sensorr/i18n'

// A getter, so a label follows the language the interface has when it is shown
const page = (to, key) => ({ to, get label() { return i18n.t(key) } })

export const SECONDARY = {
  '/movie': [
    page('/movie/library', 'pages.library.title'),
    page('/movie/discover', 'pages.discover.title'),
    page('/movie/lists', 'header.pages.lists'),
    page('/movie/calendar', 'pages.calendar.title'),
    page('/movie/trending', 'pages.trending.movies.title'),
    page('/movie/theatres', 'pages.theatres.title'),
    page('/movie/requests', 'pages.requests.title'),
    page('/movie/swaps', 'header.pages.swaps'),
  ],
  '/tv': [
    page('/tv/library', 'pages.library.title'),
    page('/tv/discover', 'pages.discover.title'),
    page('/tv/lists', 'header.pages.lists'),
    page('/tv/calendar', 'pages.calendar.title'),
    page('/tv/trending', 'pages.trending.shows.title'),
    page('/tv/requests', 'pages.requests.title'),
  ],
  '/person': [
    page('/person/followed', 'pages.followed.title'),
    page('/person/trending', 'pages.trending.persons.title'),
  ],
}

// The page a sub-route shows, named as its tab in the browser
export const pageLabelOf = (pathname) => [
  ...Object.values(SECONDARY).flat(),
  page('/person/calendar', 'pages.calendar.title'),
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
