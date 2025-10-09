import { ElementRef, useMemo, useRef } from 'react'
import Color from 'color'
import deltaE from 'delta-e'
import { utils } from '@sensorr/tmdb'
import { Badge } from '../../../atoms/Badge/Badge'

export const ReviewsBadge = ({ entity, reviews: _reviews, loadReviews, display, palette, forceOpen = false, ...props }) => {
  // const ref = useRef<HTMLSpanElement>()

  const reviews = useMemo(() => {
    if (!entity?.id) {
      return []
    }

    return [
      { source: 'TMDB', score: ((entity.vote_average || 0) / 10) },
      ...(_reviews || []),
    ].reduce((acc, curr) => ({ ...acc, [curr.source]: curr }), {})
  }, [entity?.id, _reviews])

  const vote_average = useMemo(() => Math.round(Number(Object.values<any>(reviews)
    .map(review => review.score)
    .reduce((acc, curr) => Number(acc) + Number(curr), 0)
  ) / Math.max(1, (Object.values<any>(reviews).filter(r => r.score).length || 0)) * 100), [reviews])

  const score = useMemo(() => ({
    audience: reviews['TMDB']?.score,
    critics: Object.values<any>(reviews)?.filter(review => ['Rotten Tomatoes', 'Metacritic'].includes(review.source))?.reduce((acc, review, index) => (acc + review.score) / (index + 1), 0) || null,
  }), [reviews])

  return (
    <span
      {...props}
      // ref={ref}
      tabIndex={0}
      // onClick={() => {
      //   console.log(document.activeElement, ref.current, document.activeElement === ref.current)

      //   if (document.activeElement === ref.current) {
      //     ref.current.blur()
      //   }
      // }}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        width: forceOpen ? '100%' : ['4.7em', '5em'],
        backgroundColor: 'gray', 
        borderRadius: '2em',
        overflow: 'hidden',
        transition: 'width ease-in-out 200ms',
        ':hover,:focus': { width: '100%' },
      }}
    >
      <Badge
        emoji={utils.judge({ vote_average: vote_average / 10 } as any)}
        compact={true}
        size='small'
        palette={palette}
        label={`${vote_average || '-'} %`}
        sx={{ zIndex: 1, minWidth: '6.75em' }}
      />
      <span
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: (palette?.alternativeColor ? (deltaE.getDeltaE00(
            Color(palette?.alternativeColor).lab().color.reduce((acc, v, i) => ({ ...acc, [['L', 'A', 'B'][i]]: v }), {}),
            Color(palette?.color).lab().color.reduce((acc, v, i) => ({ ...acc, [['L', 'A', 'B'][i]]: v }), {}),
          ) < 8 ? Color(palette?.alternativeColor)[(Color(palette?.alternativeColor).luminosity() > 0.5 ? 'darken' : 'lighten')](0.2).hexa() : palette?.alternativeColor) : 'grayDark'),
          color: palette?.backgroundColor || 'text',
          marginLeft: '-2em',
          paddingLeft: 1,
          paddingRight: 4,
          fontSize: 6,
          zIndex: 0,
          borderRadius: '2em',
        }}
      >
        <span sx={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }} title={`${score.audience >= 0.6 ? 'Hot' : 'Stale'} - Audience Score (TMDB)`}>
          {score.audience >= 0.6 ? <Icons.hot /> : <Icons.stale />}
          <span sx={{ fontFamily: 'monospace', fontSize: 5, marginLeft: 8 }}>{Math.round((score.audience || 0) * 100)}%</span>
        </span>
        {score.critics !== null && (
          <span sx={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }} title={`${score.critics >= 0.6 ? 'Fresh' : 'Rotten'} - Critics Score (${Object.keys(reviews).filter(review => ['Rotten Tomatoes', 'Metacritic'].includes(review)).map(source => `${Math.round(reviews[source].score * 100)}% ${source}`).join(', ')})`}>
            {score.critics >= 0.6 ? <Icons.fresh /> : <Icons.rotten />}
            <span sx={{ fontFamily: 'monospace', fontSize: 5, marginLeft: 8 }}>{Math.round(score.critics * 100)}%</span>
          </span>
        )}
      </span>
    </span>
  )
}


const Icons = {
  fresh: ({ ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" width="1em" viewBox="0 0 48 48" {...props}>
      <path fill="#FA320A" d="M41 25c0-5-3-9-7-11h-1c-2-1-7 3-10 0 0 1 0 5-5 5 0 0-1 0 0 0v-4c-2 2-3 3-7 2-3 2-4 6-4 11 0 9 9 14 18 14 9-1 17-7 16-17Z"/>
      <path fill="#00912D" d="M25 11c2 0 7 0 9 3h-1c-2-1-7 3-10 0 0 1 0 5-5 5 0 0-1 0 0 0v-4c-2 2-4 3-9 1h1l5-3h1-5c2-3 5-4 7-2l-2-3 3-2 1 4c2-2 6-3 7-1 0 0 0 1 0 0l-2 2Z"/>
    </svg>
  ),
  rotten: ({ ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" width="1em" viewBox="0 0 48 48" {...props}>
      <path fill="#0AC855" d="M38 38c-7 0-8-7-11-7-1 0-2 1-1 2l1 3c1 2-1 5-3 5-4 1-6-1-5-4 0-2 2-5 0-6-3-1-5 3-7 4s-5 1-6-2c0-1 0-4 3-5 2-1 6 1 6-2 1-2-4-2-6-3s-4-3-2-5c0-2 3-3 5-2l4 4 3 1 1-3-2-2c-2-2-4-3-3-6 2-3 5-3 5-3 1-1 2 0 3 1 2 1 2 2 2 4l-1 4c-1 2 0 4 2 4s3-2 3-3l3-4c2-1 5-1 6 1 1 3 1 5-1 7l-2 1-5 1-1 2 2 2 4 1c3 0 5 1 6 3v1c2 2 0 6-3 6Z"/>
    </svg>
  ),
  hot: ({ ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" width="1em" viewBox="0 0 42 48" {...props}>
      <path fill="#fff" d="M10 38 8 19l3 1 2 21-3-3Z"/>
      <path fill="#fff" d="m32 38-3 3 2-21 3-1-2 19Z"/>
      <path fill="#fff" d="m27 41-5 2V22l6-1-1 20Z"/>
      <path fill="#fff" d="m14 21 1 20 5 2V22l-6-1Z"/>
      <path fill="gold" d="M7 13c0 3 6 5 14 5 7 0 12-2 13-4h-1v-1l-1-1a2 2 0 0 0-2-3h-1a2 2 0 0 0-2-2l-2-1a2 2 0 0 0-3-1 2 2 0 0 0-4 2h-1a2 2 0 0 0-3 0 2 2 0 0 0-2 3 2 2 0 0 0-2 1l-1-1a2 2 0 0 0-2 3Z"/>
      <path fill="#FA320A" fillRule="evenodd" d="M32 11h-1c3 1 5 2 5 4l-3 23c-1 3-6 6-12 6S9 41 9 38L6 15l1-2c0 3 6 5 14 5 7 0 12-2 13-4h-1v-1l-1-1v-1ZM10 38 8 19l3 1 2 21-3-3Zm22 0-3 3 2-21 3-1-2 19Zm-5 3-5 2V22l6-1-1 20ZM14 21l1 20 5 2V22l-6-1Z" clipRule="evenodd"/>
    </svg>
  ),
  stale: ({ ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" width="1.25em" viewBox="0 0 52 48" {...props}>
      <path fill="#fff" d="m11 16 20-2-2 3-20 2 2-3Z"/>
      <path fill="#fff" d="M28 20 8 21l-1 5h21v-6Z"/>
      <path fill="#fff" d="M7 28h21v7L8 33l-1-5Z"/>
      <path fill="#fff" d="m11 38-2-3 20 2 2 3-20-2Z"/>
      <path fill="#00641E" d="m31 35 2-1 1 1a2 2 0 0 1 1 0v-1l2-1h1l1-6c0-7-2-12-4-12-3-1-5 5-5 12l1 8Z"/>
      <path fill="gold" d="m47 42-1-2-2-2v-1l-1-2h-1l-1-1-2-1h-2l-2 1v1a2 2 0 0 0-1 0l-1-1-2 1 3 7a1 1 0 0 0 2 0 1 1 0 0 0 1 0l1 1 2-1 1 1h1l2 1 1-1a1 1 0 0 0 2 0 2 2 0 0 0 0-1Z"/>
      <path fill="#04A53C" fillRule="evenodd" d="m34 12 3 2c3 3 4 11 3 19h-2l1-6c0-7-2-12-4-12-3-1-5 5-5 12l1 8 3 7h1-1l-23-3c-3 0-6-6-6-12s3-11 6-12l23-3Zm-5 5L9 19l2-3 20-2-2 3Zm2 23-20-2-2-3 20 2 2 3ZM7 28l1 5 20 2v-7H7Zm1-7 20-1v6H7l1-5Z" clipRule="evenodd"/>
    </svg>
  )
}
