import { useMemo } from 'react'
import { transformMovieDetails, transformCollectionDetails, Warning, Link, Entities } from '@sensorr/ui'
import { utils } from '@sensorr/tmdb'
import { compose, emojize } from '@sensorr/utils'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { query as wikidataQuery, useWikiDataRequest } from '../../store/wikidata'
import { useTMDB, useTMDBRequest } from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import Details from '../Details/Details'
import { withTabsBehavior } from '../../components/Entities/Tabs'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withProps from '../../components/enhancers/withProps'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import { useAnimationContext } from '../../contexts/Animation/Animation'
import { useDeviceContext } from '../../contexts/Device/Device'

const TMDBTabs = compose(
  withTabsBehavior(),
  withFetchQuery({}, 0, useTMDB),
)(Entities)

const MovieDetails = compose(
  withMovieMetadataContext({ enhanced: true }),
  withProps({ behavior: 'movie' }),
)(Details)

const Movie = ({ ...props }) => {
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { device } = useDeviceContext()
  const { metadata: persons } = usePersonsMetadataContext() as any
  const { ongoing } = useAnimationContext() as any

  const movie = useTMDBRequest(`movie/${id}`, {
    append_to_response: 'images,recommendations,similar,credits,videos,alternative_titles,release_dates,keywords,watch/providers',
    include_image_language: 'en,null',
  }, { transform: transformMovieDetails })

  const collection = useTMDBRequest(`collection/${movie.data?.belongs_to_collection?.id}`, {}, {
    ready: !movie.loading && !!movie.data?.belongs_to_collection,
    transform: transformCollectionDetails,
  })

  const additional = useWikiDataRequest(
    wikidataQuery.movies.getMovieAdditionalData.query(id),
    wikidataQuery.movies.getMovieAdditionalData.transform,
    { ready: true }
  )

  const ready = !ongoing && !movie.loading && (movie?.data?.id || movie?.error) && (!movie?.data?.belongs_to_collection || !collection.loading)

  const tabs = useMemo(() => {
    const saga = {
      id: `saga-${id}`,
      label: t('items.movies.belongs_to_collection.label', { collection: movie.data?.belongs_to_collection?.name || 'Saga' }),
      entities: movie.data?.belongs_to_collection && !collection.loading && collection.details.parts,
      child: MovieWithCreditsAndReviews,
      props: ({ index }) => ({ display: ((ready || (index < 5)) && device !== 'mobile') ? 'pretty' : 'poster' }),
      ready: ready,
      more: {
        to: `/collection/${movie.data?.belongs_to_collection?.id}`,
      },
    }

    const recommendations = {
      id: `recommendations-${id}`,
      label: t('items.movies.recommendations.label'),
      entities: movie.data?.recommendations?.results || [],
      child: MovieWithCreditsAndReviews,
      ready: ready,
      props: ({ index }) => ({ display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster' }),
      more: {
        to: `/movie/${id}/recommendations`,
      },
    }

    const similar = {
      id: `similar-${id}`,
      label: t('items.movies.similar.label'),
      entities: movie.data?.similar?.results || [],
      child: MovieWithCreditsAndReviews,
      ready: ready,
      props: ({ index }) => ({ display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster' }),
      more: {
        to: `/movie/${id}/similar`,
      },
    }

    const cast = {
      id: `cast-${id}`,
      label: t('items.persons.cast.label'),
      entities: utils.sortCredits(movie.data?.credits, Object.keys(persons), ['cast']),
      child: Person,
      ready: ready,
    }

    const crew = {
      id: `crew-${id}`,
      label: t('items.persons.crew.label'),
      entities: utils.sortCredits(movie.data?.credits, Object.keys(persons), ['crew']),
      child: Person,
      ready: ready,
    }

    const related = ((!ready || (saga.entities?.length || recommendations.entities?.length || similar.entities?.length)) && {
      id: 'related',
      ready,
      tabs: {
        ...((!ready || saga.entities?.length) && {
          saga,
        }),
        ...((!ready || recommendations?.entities?.length) && {
          recommendations,
        }),
        ...((!ready || similar.entities?.length) && {
          similar,
        }),
      },
    })

    const credits = ((!ready || (cast.entities?.length || crew.entities?.length)) && {
      id: 'credits',
      ready,
      tabs: {
        ...((!ready || cast.entities?.length) && {
          cast,
        }),
        ...((!ready || crew.entities?.length) && {
          crew,
        }),
      },
    })

    const directors = movie.data?.credits?.crew?.filter(credit => credit.job === 'Director') || [{ id: null }]
    const headliners = movie.data?.credits?.cast?.filter(cast => cast.order <= 2) || [{ id: null }, { id: null }, { id: null }]

    const linked = ((!ready || (directors.length || headliners.length)) && {
      id: 'linked',
      component: TMDBTabs,
      ready,
      tabs: {
        ...((!ready || directors?.length) && (directors || []).reduce((acc, curr, index) => ({
          ...acc,
          [`directors-${index}`]: {
            id: `linked-${id}-${curr.id || index}`,
            label: emojize('🎬', curr.name),
            child: MovieWithCreditsAndReviews,
            ready: ready,
            query: { uri: `person/${curr.id}/movie_credits` },
            transform: (res) => {
              const entities = utils.sortCredits(res || { cast: [], crew: [] }, [], ['crew']).sort((a, b) => b.vote_count - a.vote_count).filter(credit => credit.job === 'Director').slice(0, 20)
              return { entities, total: Math.min(entities.length, 20) }
            },
            props: ({ index, entity }) => ({
              display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster',
              credits: [
                {
                  entity: {
                    cast_id: null,
                    character: entity.character,
                    credit_id: entity.credit_id,
                    override: entity.override,
                    gender: entity.gender,
                    id: curr?.id,
                    name: curr?.name,
                    order: entity.order,
                    profile_path: curr?.profile_path,
                  },
                },
              ],
            }),
            more: {
              to: '/movie/discover',
              state: {
                controls: {
                  with_crew: {
                    behavior: 'or',
                    values: [{ value: curr?.id, label: curr?.name }],
                  },
                  sorting: 'popularity',
                  reverse: false,
                },
              },
            },
          }
        }), {})),
        ...((!ready || headliners?.length) && (headliners || []).reduce((acc, curr, index) => ({
          ...acc,
          [`headliners-${index}`]: {
            id: `linked-${id}-${curr.id || index}`,
            label: emojize('🤵', curr.name),
            child: MovieWithCreditsAndReviews,
            ready: ready,
            query: { uri: `person/${curr.id}/movie_credits` },
            transform: (res) => {
              const entities = utils.sortCredits(res || { cast: [], crew: [] }, [], ['cast']).sort((a, b) => (b.vote_count / ((b.order + 1) / 5)) - (a.vote_count / ((a.order + 1) / 5))).slice(0, 20)
              return { entities, total: Math.min(entities.length, 20) }
            },
            props: ({ index, entity }) => ({
              display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster',
              credits: [
                {
                  entity: {
                    cast_id: null,
                    character: entity.character,
                    credit_id: entity.credit_id,
                    override: entity.override,
                    gender: entity.gender,
                    id: curr?.id,
                    name: curr?.name,
                    order: entity.order,
                    profile_path: curr?.profile_path,
                  },
                },
              ],
            }),
            more: {
              to: '/movie/discover',
              state: {
                controls: {
                  with_cast: {
                    behavior: 'or',
                    values: [{ value: curr?.id, label: curr?.name }],
                  },
                  sorting: 'popularity',
                  reverse: false,
                },
              },
            },
          }
        }), {})),
      }
    })

    return [
      ...(related ? [related] : []),
      ...(credits ? [credits] : []),
      ...(linked ? [linked] : []),
    ]
  }, [ready, id, persons, movie.data, collection.details])

  if (movie.error) {
    return (
      <Warning
        emoji='💢'
        title='Sorry, unable to display movie...'
        subtitle={movie.error.message}
      />
    )
  }

  return (
    <MovieDetails
      details={movie.details}
      entity={movie.data}
      additional={additional.data}
      tabs={tabs}
      loading={movie.loading}
      ready={ready}
    />
  )
}

export default Movie
