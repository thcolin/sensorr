import { useMemo } from 'react'
import { compose } from '@sensorr/utils'
import { Entities, EntitiesProps } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import withFetchQuery from '../enhancers/withFetchQuery'
import { useTMDB } from '../../store/tmdb'
import { useAPI, query as APIQuery } from '../../store/api'
import withProps from '../enhancers/withProps'
import withFetchCalendarQuery from '../../pages/Calendar/withFetchCalendarQuery'

export const TrendingMovies = compose(
  withFetchQuery({
    uri: 'trending/movie/day',
    params: { sort_by: 'popularity.desc' },
  }, 1, useTMDB),
  withProps({
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  })
)(Entities)

export const TheatresMovies = compose(
  withFetchQuery({
    uri: 'movie/now_playing',
    params: {
      region: i18n.language.slice(-2),
    },
  }, null, useTMDB),
  withProps({
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  })
)(Entities)

export const UpcomingMovies = compose(
  withFetchQuery({
    uri: 'movie/upcoming',
    params: {
      region: i18n.language.slice(-2),
    },
  }, null, useTMDB),
  withProps({
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  })
)(Entities)

export const DiscoverMovies = compose(
  withFetchQuery({
    uri: 'discover/movie',
  }, 1, useTMDB),
  withProps({
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  }),
)(Entities)

export const CalendarMovies = ({ dateMin = new Date(), dateMax, ...props }: Omit<EntitiesProps, 'empty'> & { dateMin?: Date, dateMax?: Date }) => {
  const CalendarEntities = useMemo(() => compose(
    withFetchCalendarQuery({
      params: {
        include_video: false,
        with_release_type: '3|2|1',
        without_genres: '99', // Documentary -- sorry
        'primary_release_date.gte': dateMin.toISOString().substring(0, 10),
        ...(dateMax ? { 'primary_release_date.lte': dateMax.toISOString().substring(0, 10) } : {}),
        sort_by: 'primary_release_date.asc',
      },
    }),
    withProps({
      empty: {
        emoji: '🍿',
        title: "Oh no, your request didn't return results",
        subtitle: (
          <span>
            Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
          </span>
        ),
      },
    })
  )(Entities), [])

  return (
    <CalendarEntities {...props} />
  )
}

export const LibraryMovies = compose(
  withFetchQuery(APIQuery.movies.getMovies({}), 1, useAPI),
  withProps({
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  })
)(Entities)

export const ArchivedMovies = compose(
  withFetchQuery(APIQuery.movies.getMovies({ params: { state: 'archived' } }), 1, useAPI),
  withProps({
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  })
)(Entities)
