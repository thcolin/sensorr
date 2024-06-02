import { useCallback, useEffect, useState } from 'react'
import { MovieProps } from '@sensorr/ui'
import { useWikiData } from '../../store/wikidata'

export const useLoadableReviews = (id) => {
  const wikidata = useWikiData()
  const [reviews, setReviews] = useState(null)

  const loadReviews = useCallback(async () => {
    if (!id || reviews) {
      return
    }

    try {
      const raw = await wikidata.fetch(
        wikidata.query.movies.getMovieAdditionalData.query(id),
        wikidata.query.movies.getMovieAdditionalData.transform
      )

      setReviews(raw.reviews)
    } catch (err) {
      setReviews([])
      console.warn(err)
    }
  }, [id, reviews])

  useEffect(() => {
    setReviews(null)
  }, [id])

  return { reviews, loadReviews }
}

interface withLoadableReviewsProps extends MovieProps {}

const withLoadableReviews = () => (WrappedComponent) => {
  const withLoadableReviews = ({ entity, ...props }: withLoadableReviewsProps) => {
    const { reviews, loadReviews } = useLoadableReviews(entity?.id)

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        reviews={reviews}
        loadReviews={loadReviews}
      />
    )
  }

  withLoadableReviews.displayName = `withLoadableReviews(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withLoadableReviews
}

export default withLoadableReviews
