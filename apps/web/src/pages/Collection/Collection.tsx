import { useMemo } from 'react'
import { transformCollectionDetails, Warning } from '@sensorr/ui'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTMDBRequest } from '../../store/tmdb'
import Details from '../Details/Details'
import { useAnimationContext } from '../../contexts/Animation/Animation'
import MovieComponent from '../../components/Movie/Movie'

const Collection = ({ ...props }) => {
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { ongoing } = useAnimationContext() as any
  const { loading, error, data, details } = useTMDBRequest(`/collection/${id}`, {
    append_to_response: 'images',
    include_image_language: 'en,null',
  }, { transform: transformCollectionDetails })

  // console.log(data, details)

  // TODO: Get all details from collection movies
  // TODO: Get all credits and display them in 'credits' tab

  const ready = !ongoing && !loading

  const tabs = useMemo(() => {
    const saga = {
      label: t('items.movies.belongs_to_collection.label', { collection: details.title || 'Saga' }),
      entities: details.parts,
      child: MovieComponent,
      props: () => ({ display: 'pretty' }),
      ready: ready,
    }

    return {
      collections: { saga },
    }
  }, [ready, details])


  if (error) {
    return (
      <Warning
        emoji='💢'
        title='Sorry, unable to display collection...'
        subtitle={error.message}
      />
    )
  }

  return (
    <Details
      behavior='collection'
      details={details}
      entity={data}
      tabs={tabs}
      loading={loading}
      ready={ready}
    />
  )
}

export default Collection
