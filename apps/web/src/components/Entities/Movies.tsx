import { useMemo } from 'react'
import { compose } from '@sensorr/utils'
import { EntitiesProps, Entities } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import withFetchQuery from '../enhancers/withFetchQuery'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import tmdb from '../../store/tmdb'
import api from '../../store/api'
import withProps from '../enhancers/withProps'

export const TrendingMovies = compose(
  withFetchQuery({
    uri: 'trending/movie/day',
    params: { sort_by: 'popularity.desc' },
  }, 1, tmdb),
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
  }, null, tmdb),
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
  }, null, tmdb),
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
  withFetchQuery({
    uri: 'discover/movie',
  }, 1, tmdb),
)(Entities)

export const CalendarMovies = ({ dateMin = new Date(), dateMax, ...props }: Omit<EntitiesProps, 'empty'> & { dateMin?: Date, dateMax?: Date }) => {
  const { metadata: persons, loading: loadingPersons } = usePersonsMetadataContext() as any
  const CalendarEntities = useMemo(() => compose(
    withFetchQuery({
      uri: 'discover/movie',
      params: {
        include_video: false,
        with_release_type: '3|2|1',
        without_genres: '99', // Documentary -- sorry
        'primary_release_date.gte': dateMin.toISOString().substring(0, 10),
        ...(dateMax ? { 'primary_release_date.lte': dateMax.toISOString().substring(0, 10) } : {}),
        sort_by: 'primary_release_date.asc',
      },
    }, 1, tmdb),
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

  return (!loadingPersons && !Object.keys(persons).length) ? null : (
    <CalendarEntities
      {...props}
      ready={!loadingPersons && props.ready !== false}
      {...(loadingPersons ? {} : {
        query: {
          params: {
            with_people: Object.keys(persons).join('|'),
          },
        },
      })}
    />
  )
}

export const LibraryMovies = compose(
  withFetchQuery(api.query.movies.getMovies({}), 1, api),
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
  withFetchQuery(api.query.movies.getMovies({ params: { state: 'archived' } }), 1, api),
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
