import { useMemo } from 'react'
import { useResponsiveValue } from '@theme-ui/match-media'
import Tippy from '@tippyjs/react'
import { utils } from '@sensorr/tmdb'
import { Badge } from '../../../atoms/Badge/Badge'
import { Icon } from '../../../atoms/Icon/Icon'

export const ReviewsBadge = ({ entity, reviews: _reviews, loadReviews, palette, ...props }) => {
  const maxWidth = useResponsiveValue(['100vw', '80vw'])

  const reviews = useMemo(() => {
    if (!entity?.id) {
      return []
    }

    return [
      { source: 'TMDB', score: ((entity.vote_average || 0) / 10) },
      ...(_reviews || []),
    ]
  }, [entity?.id, _reviews])

  const vote_average = useMemo(() => Math.round(Number(reviews
    .map(review => review.score)
    .reduce((acc, curr) => Number(acc) + Number(curr), 0)
  ) / Math.max(1, (reviews.filter(r => r.score).length || 0)) * 100), [reviews])

  return (
    <Tippy
      maxWidth={maxWidth}
      {...(loadReviews ? { onShow: loadReviews } : {})}
      disabled={!reviews?.length}
      placement='bottom'
      content={(
        <span sx={{ display: 'flex', alignItems: 'center', '>span:not(:last-of-type)': { marginRight: 6 } }}>
          {(reviews || [])?.map((review: any) => (
            <span sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <Icon
                value={{ 'TMDB': 'tmdb', 'Rotten Tomatoes': 'rottentomatoes', 'Metacritic': 'metacritic' }[review.source]}
                height={{ 'TMDB': '1em', 'Rotten Tomatoes': '1em', 'Metacritic': '1.2em' }[review.source]}
                width={{ 'TMDB': '1.75em', 'Rotten Tomatoes': '1em', 'Metacritic': '1.2em' }[review.source]}
                sx={{ marginRight: 8 }}
              />
              <span>{Math.round(review.score * 100)}%</span>
            </span>
          ))}
        </span>
      )}
    >
      <span>
        <Badge
          emoji={utils.judge({ vote_average: vote_average / 10 } as any)}
          compact={true}
          size='small'
          palette={palette}
          label={`${vote_average || '-'} %`}
        />
      </span>
    </Tippy>
  )
}
