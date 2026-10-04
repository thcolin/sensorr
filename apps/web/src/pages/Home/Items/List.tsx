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

export const paramsOf = (list: List, { kind, values }: List['sources'][number]) => kind === 'custom'
  ? { lists: list.id }
  : serializeControls(FIELDS[kind][list.media], valuesOfControls(FIELDS[kind][list.media], values))

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

// `editing` lets the filters panel write its values back in place of the source
export const screenOf = (list: List, index = 0, editing = false) => {
  const source = list.sources[index]

  return {
    to: `/${list.media}/${source?.kind === 'discover' ? 'discover' : 'library'}`,
    state: {
      controls: source?.kind === 'custom' ? { lists: { values: [list.id], behavior: 'or' } } : source?.values || {},
      ...(editing ? { editing: { list: list.id, source: index } } : {}),
    },
  }
}

export const ListRow = ({ list, ...props }: { list: List, [key: string]: any }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const [entities, setEntities] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const init = { signal: controller.signal }

    Promise.all(list.sources.map((source) => {
      const params = paramsOf(list, source)

      if (source.kind === 'discover') {
        return tmdb.fetch(`discover/${list.media}`, params, init)
      }

      const query = list.media === 'movie'
        ? api.query.movies.getMovies({ params, init })
        : api.query.shows.getShows({ params: { ...params, progress: 'true' }, init })

      return api.fetch(query.uri, query.params, query.init)
    }))
      .then((pages) => {
        const seen = new Set()
        setEntities(pages.flatMap(({ results }) => results).filter(({ id }) => !seen.has(id) && seen.add(id)))
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.warn(e)
          setEntities([])
          setError(e)
        }
      })

    return () => controller.abort()
  }, [api, tmdb, JSON.stringify(list)])

  return (
    <Entities
      id={`list_${list.id}`}
      label={emojize('🗂️', list.name)}
      display='row'
      child={list.media === 'movie' ? MovieWithCreditsAndReviews : Show}
      extra={list.media === 'tv' ? FOOTER_HEIGHT : 0}
      limit={20}
      hide={true}
      more={{ title: list.name, ...screenOf(list) }}
      entities={entities || []}
      length={entities?.length}
      ready={!!entities}
      error={error}
      {...props}
    />
  )
}
