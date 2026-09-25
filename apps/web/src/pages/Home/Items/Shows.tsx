import { useEffect, useState } from 'react'
import { compose } from '@sensorr/utils'
import { Entities } from '@sensorr/ui'
import { API } from '@sensorr/services'
import withFetchQuery from '../../../components/enhancers/withFetchQuery'
import withProps from '../../../components/enhancers/withProps'
import { MovieWithCreditsAndReviews } from '../../../components/Movie/Movie'
import Show from '../../../components/Show/Show'
import { useTMDB } from '../../../store/tmdb'
import { useAPI, query as APIQuery } from '../../../store/api'
import { day } from '../../Shows/agenda'

// Fetches a whole row at once, for the rows built from more than one request
const withFetchRow = (fetcher: (api: API, init: { signal: AbortSignal }) => Promise<any[]>) => (WrappedComponent) => {
  const withFetchRow = (props) => {
    const api = useAPI() as API
    const [entities, setEntities] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
      const controller = new AbortController()

      fetcher(api, { signal: controller.signal })
        .then(setEntities)
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn(e)
            setEntities([])
            setError(e)
          }
        })

      return () => controller.abort()
    }, [api])

    return (
      <WrappedComponent
        {...props}
        entities={entities || []}
        length={entities?.length}
        ready={!!entities}
        error={error}
      />
    )
  }

  return withFetchRow
}

const fetchResults = (api: API, { uri, params, init }: { uri: string, params: {}, init: {} }) => api.fetch(uri, params, init).then(({ results }) => results)

export const TrendingShows = compose(
  withFetchQuery({ uri: 'trending/tv/day' }, 1, useTMDB),
  withProps({
    empty: {
      emoji: '📺',
      title: "Oh no, your request didn't return results",
      subtitle: 'themoviedb.org lists no trending show today, try again later',
    },
  }),
)(Entities)

export const DiscoverShows = compose(
  withFetchQuery({ uri: 'discover/tv' }, 1, useTMDB),
  withProps({
    empty: {
      emoji: '📺',
      title: "Oh no, your request didn't return results",
      subtitle: 'themoviedb.org has no show to discover right now, try again later',
    },
  }),
)(Entities)

// Shows keep no date of their addition: the row follows the library's own order, last refreshed first
export const LibraryShows = compose(
  withFetchQuery(APIQuery.shows.getShows({}), 1, useAPI),
)(Entities)

// One card per followed show with an episode airing in the next seven days, dated by its first one
export const AiringShows = compose(
  withFetchRow(async (api, init) => {
    const today = new Date()
    const episodes = await fetchResults(api, APIQuery.episodes.getEpisodes({
      params: {
        monitored_show: 'true',
        aired_after: day(today),
        aired_before: day(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6)),
        sort_by: 'air_date.asc',
        limit: '',
      },
      init,
    }))

    const first = new Map()
    episodes.forEach(episode => first.has(episode.show_id) || first.set(episode.show_id, episode))

    if (!first.size) {
      return []
    }

    // The followed shows in one request, joined on the episodes: the API filters shows by no id
    const shows = new Map<number, any>((await fetchResults(api, APIQuery.shows.getShows({ params: { monitored: 'true', limit: '' }, init }))).map(show => [show.id, show]))

    return [...first.values()]
      .filter(episode => shows.has(episode.show_id))
      .map(episode => ({ ...shows.get(episode.show_id), release_date: episode.air_date }))
  }),
)(Entities)

// A request older than `requested_at` has no date of its own, only the last time its document was written
const writtenAt = (entity) => new Date(entity.media_type === 'tv' ? entity.refreshed_at : entity.updated_at).getTime() || 0

// Guests requests of both kinds not fulfilled yet, as `/movie/requests` and `/tv/requests` list them: the latest
// request first, the undated ones after, as the API sorts each kind
export const RequestedMoviesAndShows = compose(
  withFetchRow(async (api, init) => {
    const [movies, shows] = await Promise.all([
      fetchResults(api, APIQuery.movies.getMovies({ params: { state: 'pinned|missing|ignored', 'requested_by.gte': 1, sort_by: 'requested_at.desc' }, init })),
      fetchResults(api, APIQuery.shows.getShows({ params: { state: 'ignored', 'requested_by.gte': 1, sort_by: 'requested_at.desc' }, init })),
    ])

    return [
      ...movies.map(movie => ({ ...movie, media_type: 'movie' })),
      ...shows.map(show => ({ ...show, media_type: 'tv' })),
    ].sort((a, b) => (b.requested_at || 0) - (a.requested_at || 0) || writtenAt(b) - writtenAt(a))
  }),
)(Entities)

export const MovieOrShow = ({ entity, ...props }) => entity?.media_type === 'tv'
  ? <Show {...props as any} entity={entity} />
  : <MovieWithCreditsAndReviews {...props as any} entity={entity} />
