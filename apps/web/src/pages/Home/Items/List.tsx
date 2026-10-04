import { useEffect, useState } from 'react'
import { Entities, serializeControls, valuesOfControls } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
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

export const paramsOf = (list: List, { kind, values }: List['sources'][number]) => kind === 'manual'
  ? { lists: list.id }
  : serializeControls(FIELDS[kind][list.media], valuesOfControls(FIELDS[kind][list.media], values))

// `names` gives the label of a value saved as a bare id, a genre of Library
const textOf = (value, names = {}) => Array.isArray(value)
  ? value.map((item) => textOf(item, names)).join('–')
  : value && typeof value === 'object'
    ? (Array.isArray(value.values) ? value.values.map((item) => item?.label ?? names[item]?.name ?? item).join(value.behavior === 'and' ? ' + ' : ', ') : '')
    : String(value)

export const summaryOf = (list: List, { kind, values }: List['sources'][number], names = {}) => kind === 'manual'
  ? 'added by hand'
  : Object.entries(values || {})
    .filter(([key, value]) => FIELDS[kind][list.media][key] && JSON.stringify(value) !== JSON.stringify(FIELDS[kind][list.media][key].initial))
    .map(([key, value]) => `${key}: ${textOf(value, names)}`)
    .filter((text) => !text.endsWith(': '))
    .join(' · ') || 'no filter'

// `editing` lets the filters panel write its values back in place of the source
export const screenOf = (list: List, index = 0, editing = false) => {
  const source = list.sources[index]

  return {
    to: `/${list.media}/${source?.kind === 'discover' ? 'discover' : 'library'}`,
    state: {
      controls: source?.kind === 'manual' ? { lists: { values: [list.id], behavior: 'or' } } : source?.values || {},
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
      {...props}
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
    />
  )
}
