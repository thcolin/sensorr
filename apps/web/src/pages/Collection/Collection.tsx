import { useEffect, useMemo } from 'react'
import { transformCollectionDetails, Warning } from '@sensorr/ui'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTMDBRequest } from '../../store/tmdb'
import Details from '../Details/Details'
import { useDeviceContext } from '../../contexts/Device/Device'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'
import { withBody } from '../../layout/withLayout'

const Collection = ({ ...props }) => {
  const { restoreScrollPosition } = useScrollPositionContext()
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { device } = useDeviceContext()
  const { loading, error, data, details } = useTMDBRequest(`collection/${id}`, {
    append_to_response: 'images',
    include_image_language: 'en,null',
  }, { transform: transformCollectionDetails })

  // console.log(data, details)

  // TODO: Get all details from collection movies
  // TODO: Get all credits and display them in 'credits' tab

  const ready = !loading && !!(data?.id || error)

  useEffect(() => {
    if (ready) {
      restoreScrollPosition()
    }
  }, [ready])

  const tabs = useMemo(() => {
    return [
      {
        id: 'collection',
        ready,
        tabs: {
          saga: {
            id: `saga-${id}`,
            label: t('items.movies.belongs_to_collection.label', { collection: details.title || 'Saga' }),
            entities: details.parts,
            child: MovieWithCreditsAndReviews,
            props: () => ({ display: device !== 'mobile' ? 'pretty' : 'poster' }),
            ready: ready,
          },
        },
      },
    ]
  }, [ready, id, details])


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

export default withBody()(Collection)
