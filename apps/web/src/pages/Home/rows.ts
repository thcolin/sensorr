import { reviver } from '@sensorr/utils'

export type HomeKey = 'all' | 'movie' | 'tv'
// A group, `group:<id>`, shows its `tabs` as one row with a tab for each
export type Row = { id: string, hidden: boolean, tabs?: string[] }
export type Sort = { by: 'popularity' | 'release_date' | 'vote_average' | 'vote_count', descending: boolean }
export type List = { id: string, name: string, media: 'movie' | 'tv', sort?: Sort | null, sources: { kind: 'discover' | 'library' | 'custom', values?: { [key: string]: any } }[] }

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

// A tabbed row holds its own tabs: it stays out of a group
export const GROUPABLE = (id: string) => id !== 'discover_selectable'

export const isGroup = (row: Row) => row.id.startsWith('group:')

const idsOf = (row: Row) => isGroup(row) ? row.tabs || [] : [row.id]

// A group of one tab is that row again, a group of none is gone
const normalized = (rows: Row[]): Row[] => rows.flatMap((row) => !isGroup(row) ? [row]
  : row.tabs.length > 1 ? [row]
  : row.tabs.length === 1 ? [{ id: row.tabs[0], hidden: row.hidden }]
  : [])

// The rows of a Home once the lists left out of `ids` are deleted, from the groups too
export const pruned = (rows: Row[], ids: string[]): Row[] => normalized(rows
  .filter((row) => !row.id.startsWith('list:') || ids.includes(row.id))
  .map((row) => isGroup(row) ? { ...row, tabs: idsOf(row).filter((id) => !id.startsWith('list:') || ids.includes(id)) } : row))

// The rows a Home draws: unknown ids dropped, a locked row shown, and put back at the end when missing
export const rowsOf = (home: HomeKey, rows: Row[], lists: List[]): Row[] => {
  const kept = normalized(rows
    .map((row) => isGroup(row) ? { ...row, tabs: idsOf(row).filter((id) => fits(home, id, lists)) } : row)
    .filter((row) => isGroup(row) || fits(home, row.id, lists)))
    .map((row) => idsOf(row).some((id) => LOCKED[home].includes(id)) ? { ...row, hidden: false } : row)

  return [
    ...kept,
    ...LOCKED[home].filter((id) => !kept.some((row) => idsOf(row).includes(id))).map((id) => ({ id, hidden: false })),
  ]
}

// A row dropped on another: on its middle they make a group, or it joins the group there; on an edge it goes
// before or after it. A group only moves.
export const dropRow = (rows: Row[], active: string, over: string, zone: 'before' | 'after' | 'group', id: string): Row[] => {
  const dragged = rows.find((row) => row.id === active)
  const without = rows
    .filter((row) => row.id !== active)
    .map((row) => isGroup(row) && idsOf(row).includes(active) ? { ...row, tabs: idsOf(row).filter((tab) => tab !== active) } : row)
  const moved: Row = dragged || { id: active, hidden: false }
  const at = without.findIndex((row) => row.id === over)

  if (at !== -1) {
    const target = without[at]

    if (zone === 'group' && !isGroup(moved) && GROUPABLE(active) && GROUPABLE(over)) {
      return normalized(without.map((row, index) => index !== at ? row
        : isGroup(target) ? { ...target, tabs: [...idsOf(target), active] }
        : { id, hidden: target.hidden && moved.hidden, tabs: [over, active] }))
    }

    const index = zone === 'before' ? at : at + 1
    return normalized([...without.slice(0, index), moved, ...without.slice(index)])
  }

  // `over` is a tab: a row lands in its group, beside it; a group cannot nest
  if (isGroup(moved)) {
    return rows
  }

  return normalized(without.map((row) => {
    if (!isGroup(row) || !idsOf(row).includes(over)) {
      return row
    }

    const tabs = idsOf(row)
    const index = tabs.indexOf(over) + (zone === 'before' ? 0 : 1)
    return { ...row, tabs: [...tabs.slice(0, index), active, ...tabs.slice(index)] }
  }))
}

// The param each source sorts a list on, and the field of an entity it reads; a custom source asks the library
export const SORTS = {
  popularity: { movie: { discover: 'popularity', library: 'popularity', field: 'popularity' }, tv: { discover: 'popularity', library: 'popularity', field: 'popularity' } },
  release_date: { movie: { discover: 'primary_release_date', library: 'release_date', field: 'release_date' }, tv: { discover: 'first_air_date', library: 'first_air_date', field: 'first_air_date' } },
  vote_average: { movie: { discover: 'vote_average', library: 'vote_average', field: 'vote_average' }, tv: { discover: 'vote_average', library: 'vote_average', field: 'vote_average' } },
  vote_count: { movie: { discover: 'vote_count', library: 'vote_count', field: 'vote_count' }, tv: { discover: 'vote_count', library: 'vote_count', field: 'vote_count' } },
}

// The order of a sorted list, an entity without the field where Mongo puts it, first ascending and last
// descending: a source answers in that order, and the merge reads its head
export const compareOf = ({ media, sort }: List) => (a, b) => {
  const field = SORTS[sort.by][media].field
  const [x, y] = [a[field], b[field]].map((value) => value == null || value === '' ? null : typeof value === 'number' ? value : new Date(value).getTime())
  const missing = sort.descending ? 1 : -1

  return x === y ? 0 : x === null ? missing : y === null ? -missing : (sort.descending ? y - x : x - y)
}
