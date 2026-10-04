import { useEffect, useState } from 'react'
import { Entities, serializeControls, valuesOfControls } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import i18n from '@sensorr/i18n'
import { MovieWithCreditsAndReviews } from '../../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../../components/Show/Show'
import { useTMDB } from '../../../store/tmdb'
import { useAPI } from '../../../store/api'
import { FIELDS as DISCOVER_MOVIES } from '../../Discover/Discover'
import { FIELDS as DISCOVER_SHOWS } from '../../Shows/Discover'
import { FIELDS as LIBRARY_MOVIES } from '../../Library/Library'
import { FIELDS as LIBRARY_SHOWS } from '../../Shows/Library'
import { List } from '../rows'

const FIELDS = {
  discover: { movie: DISCOVER_MOVIES, tv: DISCOVER_SHOWS },
  library: { movie: LIBRARY_MOVIES, tv: LIBRARY_SHOWS },
}

// The param each source sorts a list on, and the field of an entity it reads; a custom source asks the library
const SORTS = {
  popularity: { movie: { discover: 'popularity', library: 'popularity', field: 'popularity' }, tv: { discover: 'popularity', library: 'popularity', field: 'popularity' } },
  release_date: { movie: { discover: 'primary_release_date', library: 'release_date', field: 'release_date' }, tv: { discover: 'first_air_date', library: 'first_air_date', field: 'first_air_date' } },
  vote_average: { movie: { discover: 'vote_average', library: 'vote_average', field: 'vote_average' }, tv: { discover: 'vote_average', library: 'vote_average', field: 'vote_average' } },
  vote_count: { movie: { discover: 'vote_count', library: 'vote_count', field: 'vote_count' }, tv: { discover: 'vote_count', library: 'vote_count', field: 'vote_count' } },
}

// The order of a sorted list, an entity without the field last
export const compareOf = ({ media, sort }: List) => (a, b) => {
  const field = SORTS[sort.by][media].field
  const [x, y] = [a[field], b[field]].map((value) => value == null || value === '' ? null : typeof value === 'number' ? value : new Date(value).getTime())

  return x === y ? 0 : x === null ? 1 : y === null ? -1 : (sort.descending ? y - x : x - y)
}

export const paramsOf = (list: List, { kind, values }: List['sources'][number]) => ({
  ...(kind === 'custom'
    ? { lists: list.id }
    : serializeControls(FIELDS[kind][list.media], valuesOfControls(FIELDS[kind][list.media], values))),
  ...(list.sort ? { sort_by: `${SORTS[list.sort.by][list.media][kind === 'discover' ? 'discover' : 'library']}.${list.sort.descending ? 'desc' : 'asc'}` } : {}),
})

// `names` gives the label of a value saved as a bare id, a genre of Library
const textOf = (value, names = {}) => value instanceof Date
  ? String(value.getFullYear())
  : Array.isArray(value)
    ? value.map((item) => textOf(item, names)).join('–')
    : value && typeof value === 'object'
      ? (Array.isArray(value.values) ? value.values.map((item) => item?.label ?? names[item]?.name ?? item).join(value.behavior === 'and' ? ' + ' : ', ') : '')
      : String(value)

// The `ui.filters` label of a field, named as Discover and Library title it
const FILTER = { primary_release_date: 'release_date', original_language: 'languages', original_languages: 'languages', production_companies: 'companies', episode_run_time: 'episode_runtime' }

// The filters a source moved off their initial value, as their panels title them
export const summaryOf = (list: List, { kind, values }: List['sources'][number], names = {}): string[] => kind === 'custom' ? [] : Object.entries(values || {})
  .filter(([key, value]) => FIELDS[kind][list.media][key] && JSON.stringify(value) !== JSON.stringify(FIELDS[kind][list.media][key].initial))
  .map(([key, value]) => {
    const name = key.replace(/^with(out)?_/, '')
    const label = `ui.filters.${FILTER[name] || name}`
    const text = textOf(value, names)
    return text && i18n.exists(label) ? `${i18n.t(label)}: ${key.startsWith('without_') ? 'not ' : ''}${text}` : null
  })
  .filter(Boolean)

// A page of the results of a source, from TMDB or from the library
export const fetchSource = (api, tmdb, list: List, source: List['sources'][number], page: number, init: { signal: AbortSignal }) => {
  const params = { ...paramsOf(list, source), page }

  if (source.kind === 'discover') {
    return tmdb.fetch(`discover/${list.media}`, params, init)
  }

  const query = list.media === 'movie'
    ? api.query.movies.getMovies({ params, init })
    : api.query.shows.getShows({ params: { ...params, progress: 'true' }, init })

  return api.fetch(query.uri, query.params, query.init)
}

// The first page of each source, laid end to end or merged on the sort of the list, an entity shown once, and
// how many each source holds
export const useListPages = (list: List) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const [pages, setPages] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all(list.sources.map((source) => fetchSource(api, tmdb, list, source, 1, { signal: controller.signal })))
      .then(setPages)
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.warn(e)
          setPages([])
          setError(e)
        }
      })

    return () => controller.abort()
  }, [api, tmdb, JSON.stringify(list)])

  const seen = new Set()

  const entities = pages && pages.flatMap(({ results }) => results).filter(({ id }) => !seen.has(id) && seen.add(id))

  return {
    entities: entities && list.sort ? [...entities].sort(compareOf(list)) : entities,
    totals: (pages || []).map(({ total_results }) => total_results),
    error,
  }
}

export const ListRow = ({ list, ...props }: { list: List, [key: string]: any }) => {
  const { entities, error } = useListPages(list)

  return (
    <Entities
      id={`list_${list.id}`}
      label={emojize('🗂️', list.name)}
      display='row'
      child={list.media === 'movie' ? MovieWithCreditsAndReviews : Show}
      extra={list.media === 'tv' ? FOOTER_HEIGHT : 0}
      limit={20}
      hide={true}
      more={{ title: list.name, to: `/${list.media}/lists/${list.id}` }}
      entities={entities || []}
      length={entities?.length}
      ready={!!entities}
      error={error}
      {...props}
    />
  )
}
