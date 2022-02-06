import { useMemo } from 'react'
import { transformMovieDetails, transformCollectionDetails, Warning, Link } from '@sensorr/ui'
import { utils } from '@sensorr/tmdb'
import { compose } from '@sensorr/utils'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTMDBRequest } from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import Details from '../Details/Details'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import withProps from '../../components/enhancers/withProps'
import MovieComponent from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import { useAnimationContext } from '../../contexts/Animation/Animation'

const MovieDetails = compose(
  withMovieMetadataContext(),
  withProps({ behavior: 'movie' }),
)(Details)

const Movie = ({ ...props }) => {
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { metadata: persons } = usePersonsMetadataContext() as any
  const { ongoing } = useAnimationContext() as any

  const movie = useTMDBRequest(`/movie/${id}`, {
    append_to_response: 'images,recommendations,similar,credits,videos,alternative_titles,release_dates,keywords',
    include_image_language: 'en,null',
  }, { transform: transformMovieDetails })

  const collection = useTMDBRequest(`collection/${movie.data?.belongs_to_collection?.id}`, {}, {
    ready: !movie.loading && !!movie.data?.belongs_to_collection,
    transform: transformCollectionDetails,
  })

  const ready = !ongoing && !movie.loading && (!movie?.data?.belongs_to_collection || !collection.loading)

  const tabs = useMemo(() => {
    const recommendations = {
      label: t('items.movies.recommendations.label'),
      entities: movie.data?.recommendations?.results || [],
      child: MovieComponent,
      ready: ready,
      props: ({ index }) => ({ display: index < 5 ? 'pretty' : 'poster' }),
    }

    const similar = {
      label: t('items.movies.similar.label'),
      entities: movie.data?.similar?.results || [],
      child: MovieComponent,
      ready: ready,
      props: ({ index }) => ({ display: index < 5 ? 'pretty' : 'poster' }),
    }

    const saga = {
      label: (
        <Link to={`/collection/${movie.data?.belongs_to_collection?.id}`}>
          {t('items.movies.belongs_to_collection.label', { collection: movie.data?.belongs_to_collection?.name || 'Saga' })}
        </Link>
      ),
      entities: movie.data?.belongs_to_collection && !collection.loading && collection.details.parts,
      child: MovieComponent,
      props: ({ index }) => ({ display: (ready || index < 5) ? 'pretty' : 'poster' }),
      ready: ready,
    }

    const cast = {
      label: t('items.persons.cast.label'),
      entities: utils.sortCredits(movie.data?.credits, Object.keys(persons), ['cast']),
      child: Person,
      ready: ready,
    }

    const crew = {
      label: t('items.persons.crew.label'),
      entities: utils.sortCredits(movie.data?.credits, Object.keys(persons), ['crew']),
      child: Person,
      ready: ready,
    }

    const movies = ((!ready || (recommendations.entities?.length || similar.entities?.length)) && {
      movies: {
        ...((!ready || recommendations?.entities?.length) && {
          recommendations,
        }),
        ...((!ready || similar.entities?.length) && {
          similar,
        }),
      },
    })

    const credits = ((!ready || (cast.entities?.length || crew.entities?.length)) && {
      credits: {
        ...((!ready || cast.entities?.length) && {
          cast,
        }),
        ...((!ready || crew.entities?.length) && {
          crew,
        }),
      },
    })

    if (saga.entities?.length) {
      return ({
        collections: { saga },
        ...credits,
        ...movies,
      })
    }

    return ({
      ...movies,
      ...credits,
    })
  }, [ready, persons, movie.data, collection.details])

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
      tabs={tabs}
      loading={movie.loading}
      ready={ready}
    />
  )
}

export default Movie
