import { useCallback, useEffect, useState } from 'react'
import { MovieProps } from '@sensorr/ui'
import { useWikiData } from '../../store/wikidata'

interface withLoadableReviewsProps extends MovieProps {}

const withLoadableReviews = () => (WrappedComponent) => {
  const withLoadableReviews = ({ entity, ...props }: withLoadableReviewsProps) => {
    const wikidata = useWikiData()
    const [reviews, setReviews] = useState(null)

    const loadReviews = useCallback(async () => {
      if (!entity?.id || reviews) {
        return
      }

      try {
        const raw = await wikidata.fetch(
          wikidata.query.movies.getMovieAdditionalData.query(entity?.id),
          wikidata.query.movies.getMovieAdditionalData.transform
        )

        setReviews(raw.reviews)
      } catch (err) {
        setReviews([])
        console.warn(err)
      }
    }, [entity, reviews])

    useEffect(() => {
      setReviews(null)
    }, [entity?.id])

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
