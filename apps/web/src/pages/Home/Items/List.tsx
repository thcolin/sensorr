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

// The query params of a source, as Discover or Library would send them with the same filters
export const paramsOf = (list: List, { kind, values }: List['sources'][number]) => kind === 'manual'
  ? { lists: list.id }
  : serializeControls(FIELDS[kind][list.media], valuesOfControls(FIELDS[kind][list.media], values))

// Where the `more` link of the row goes: the screen of its first source, on the same filters
export const screenOf = (list: List) => {
  const [source] = list.sources

  return {
    to: `/${list.media}/${source?.kind === 'discover' ? 'discover' : 'library'}`,
    state: { controls: source?.kind === 'manual' ? { lists: [list.id] } : source?.values || {} },
  }
}

// The first page of each source, laid end to end, an entity shown once
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
