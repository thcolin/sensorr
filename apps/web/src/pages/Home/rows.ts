import { reviver } from '@sensorr/utils'

export type HomeKey = 'all' | 'movie' | 'tv'
export type Row = { id: string, hidden: boolean }
export type List = { id: string, name: string, media: 'movie' | 'tv', sources: { kind: 'discover' | 'library' | 'custom', values?: { [key: string]: any } }[] }

// The rows the app draws itself: `media` says which PWA Home takes them, none means the browser Home only.
// `item` is their key in the `items` translations.
export const BUILTINS: { [id: string]: { media: 'movie' | 'tv' | null, item: string } } = {
  trending_movies: { media: 'movie', item: 'movies.trending' },
  trending_shows: { media: 'tv', item: 'shows.trending' },
  library: { media: 'movie', item: 'movies.library' },
  library_shows: { media: 'tv', item: 'shows.library' },
  calendar: { media: 'movie', item: 'movies.calendar' },
  swaps: { media: 'movie', item: 'movies.swaps' },
  airing: { media: 'tv', item: 'shows.airing' },
  requests: { media: null, item: 'movies.requests' },
  requested_movies: { media: 'movie', item: 'movies.requested' },
  requested_shows: { media: 'tv', item: 'shows.requested' },
  discover: { media: 'movie', item: 'movies.discover' },
  discover_shows: { media: 'tv', item: 'shows.discover' },
  theatres: { media: 'movie', item: 'movies.theatres' },
  upcoming: { media: 'movie', item: 'movies.upcoming' },
  discover_selectable: { media: 'movie', item: 'movies.discoverSelectable' },
  trending_persons: { media: null, item: 'persons.trending' },
}

// The PWA has no other way to these screens than the `more` link of their row on its Home
export const LOCKED: { [home in HomeKey]: string[] } = {
  all: [],
  movie: ['trending_movies', 'library', 'calendar', 'swaps', 'requested_movies', 'discover', 'theatres'],
  tv: ['trending_shows', 'library_shows', 'airing', 'requested_shows', 'discover_shows'],
}

export const listRowId = (list: List) => `list:${list.id}`

// The lists of the config, their filters values with the dates `config.json` keeps as strings back as dates
export const listsOf = (config): List[] => JSON.parse(JSON.stringify(config.get('lists')), reviver)

export const fits = (home: HomeKey, id: string, lists: List[]) => {
  const media = id.startsWith('list:') ? lists.find((list) => listRowId(list) === id)?.media : BUILTINS[id]?.media

  if (typeof media === 'undefined') {
    return false
  }

  return home === 'all' || media === home
}

export const rowsOf = (home: HomeKey, rows: Row[], lists: List[]): Row[] => {
  const kept = rows
    .filter((row) => fits(home, row.id, lists))
    .map((row) => LOCKED[home].includes(row.id) ? { ...row, hidden: false } : row)

  return [
    ...kept,
    ...LOCKED[home].filter((id) => !kept.some((row) => row.id === id)).map((id) => ({ id, hidden: false })),
  ]
}
