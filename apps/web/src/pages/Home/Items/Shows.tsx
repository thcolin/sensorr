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

    const { init: authorized } = APIQuery.shows.getShows({ init })
    const shows = await Promise.all([...first.keys()].map(id => api.fetch(`shows/${id}`, {}, authorized)))

    return shows.map(show => ({ ...show, release_date: first.get(show.id).air_date }))
  }),
)(Entities)

// Guests requests of both kinds not fulfilled yet, as `/movie/requests` and `/tv/requests` list them. A request
// leaves no date of its own: a movie's `updated_at` and a show's `refreshed_at` are both written when it is made.
export const RequestedMoviesAndShows = compose(
  withFetchRow(async (api, init) => {
    const [movies, shows] = await Promise.all([
      fetchResults(api, APIQuery.movies.getMovies({ params: { state: 'pinned|missing|ignored', 'requested_by.gte': 1, sort_by: 'updated_at.desc' }, init })),
      fetchResults(api, APIQuery.shows.getShows({ params: { state: 'ignored', 'requested_by.gte': 1, sort_by: 'refreshed_at.desc' }, init })),
    ])

    return [
      ...movies.map(movie => ({ ...movie, media_type: 'movie', requested_at: new Date(movie.updated_at).getTime() })),
      ...shows.map(show => ({ ...show, media_type: 'tv', requested_at: new Date(show.refreshed_at).getTime() })),
    ].sort((a, b) => (b.requested_at || 0) - (a.requested_at || 0))
  }),
)(Entities)

export const MovieOrShow = ({ entity, ...props }) => entity?.media_type === 'tv'
  ? <Show {...props as any} entity={entity} />
  : <MovieWithCreditsAndReviews {...props as any} entity={entity} />
