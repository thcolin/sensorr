import { Fragment, memo, useMemo } from 'react'
import { LinkProps } from 'react-router-dom'
import { emojize } from '@sensorr/utils'
import { utils as tmdb } from '@sensorr/tmdb'
import { Empty } from '../../atoms/Picture/Picture'
import { Link } from '../../atoms/Link/Link'
import { Avatar } from '../../elements/Entity/Avatar/Avatar'
import { Card } from '../../elements/Entity/Card/Card'
import { Poster, PosterProps } from '../../elements/Entity/Poster/Poster'
import { Pretty } from '../../elements/Entity/Pretty/Pretty'
import { Tag } from '../../elements/Entity/Tag/Tag'

export interface AbstractEntityProps extends Omit<
  PosterProps,
  'link' | 'focus' | 'placeholder' | 'actions' | 'details' | 'overrides' | 'size' | 'relations' | 'onReady' | 'palette' | 'empty'
> {
  entity: any
  transformDetails: (any) => any
  display?: 'poster' | 'card' | 'avatar' | 'pretty' | 'tag'
  link: (any) => LinkProps
  placeholder?: boolean
  ready?: boolean
}

const UIAbstractEntity = ({
  entity: data,
  transformDetails,
  display = 'poster',
  placeholder,
  ready = true,
  ...props
}: AbstractEntityProps, ref) => {
  // informations
  const entity = useMemo(() => (!placeholder && data) || { poster_path: false, id: null }, [data, placeholder]) as any
  const details = useMemo(() => transformDetails(entity), [entity])
  const link = useMemo(() => props.link(entity), [entity, props.link])

  // stuff
  const overrides = useMemo(() => ({
    ready: typeof entity.id === 'number' && !placeholder && ready,
  }), [ready, placeholder, entity])

  switch (display) {
    case 'avatar':
      return (
        <Avatar
          {...props}
          details={details}
          link={link}
          overrides={overrides}
          empty={Empty.movie}
        />
      )
    case 'card':
      return (
        <Card
          {...props}
          details={details}
          link={link}
          overrides={overrides}
          empty={Empty.movie}
        />
      )
    case 'pretty':
      return (
        <Pretty
          {...props}
          details={details}
          link={link}
          overrides={overrides}
          empty={Empty.movie}
        />
      )
    case 'tag':
      return (
        <Tag {...props} details={details} link={link} />
      )
    default:
      return (
        <Poster
          {...props}
          details={details}
          link={link}
          overrides={overrides}
          empty={Empty.movie}
        />
      )
  }
}

export const AbstractEntity = memo(UIAbstractEntity)


export const transformCollectionDetails = (entity) => {
  entity.popularity = entity.parts?.reduce((acc, part) => acc + part.popularity, 0) / entity.parts?.length
  entity.vote_average = (entity.parts?.reduce((acc, part) => acc + part.vote_average, 0) / entity.parts?.length).toPrecision(2)
  entity.vote_count = Math.round(entity.parts?.reduce((acc, part) => acc + part.vote_count, 0) / entity.parts?.length)
  entity.genres = entity.parts?.reduce((acc, part) => [...acc, ...part.genres], []).filter((genre, index, self) => self.findIndex(g => genre.id === g.id) === index) || []
  entity.parts = (entity.parts || []).sort((a, b) => ((new Date(a.release_date || 10e12).getTime() || 0) - (new Date(b.release_date || 10e12).getTime() || 0)))

  const release_dates_range = entity.parts?.filter(part => part.release_date).map(part => new Date(part.release_date).getFullYear())

  return ({
    id: entity.id,
    title: entity.name,
    year: null,
    caption: entity.original_name || '',
    overview: entity.overview || '',
    poster: entity.poster_path,
    billboard: entity.backdrop_path,
    parts: entity.parts,
    meaningful: {
      popularity: () => (
        <span title={`Popularity`} sx={{ whiteSpace: 'nowrap' }}>
          {emojize('📣', entity.popularity.toLocaleString())}
        </span>
      ),
      release_dates_range: () => (
        <Link
          title={`Discover more movies from ${release_dates_range.slice(0, 1).pop()}-${release_dates_range.slice(-1).pop()}`}
          sx={{ whiteSpace: 'nowrap' }}
          to='/movie/discover'
          state={{
            controls: {
              primary_release_date: [
                new Date(`01-01-${release_dates_range.slice(0, 1).pop()}`),
                new Date(`31-12-${release_dates_range.slice(-1).pop()}`),
              ],
            },
          }}
        >
          {emojize('📆', `${release_dates_range.slice(0, 1).pop()} - ${release_dates_range.slice(-1).pop()}`)}
        </Link>
      ),
      vote_average: () => (
        <Link
          title={`Discover more "${tmdb.judge(entity)}" movies`}
          sx={{ whiteSpace: 'nowrap' }}
          to='/movie/discover'
          state={{
            controls: {
              vote_average: [Math.floor(entity.vote_average), Math.ceil(entity.vote_average)],
            },
          }}
        >
          {emojize(tmdb.judge(entity), entity.vote_average.toLocaleString())}
        </Link>
      ),
      vote_count: !!entity.vote_count ? () => (
        <Link
          title={`Discover more movies with "~${entity.vote_count}" vote count`}
          sx={{ whiteSpace: 'nowrap' }}
          to='/movie/discover'
          state={{
            controls: {
              vote_count: [
                Math.ceil((entity.vote_count - (entity.vote_count / 4)) / 100) * 100,
                Math.ceil((entity.vote_count + (entity.vote_count / 4)) / 100) * 100,
              ],
            },
          }}
        >
          {emojize('🗳️', entity.vote_count.toLocaleString())}
        </Link>
      ) : null,
      genres: () => (
        <span>
          {emojize('🎞️')}{entity.genres.map((genre, index, arr) => (
            <Fragment key={genre.id}>
              <Link
                title={`Discover more "${genre.name}" movies`}
                to='/movie/discover'
                state={{
                  controls: {
                    with_genres: {
                      behavior: 'or',
                      values: [{ value: genre.id, label: genre.name }],
                    },
                  },
                }}
              >
                {genre.name}
              </Link>
              {index === arr.length - 1 ? '' : ', '}
            </Fragment>
          ))}
        </span>
      ),
    },
  })
}

export const transformCompanyDetails = (entity) => ({
  id: entity.id,
  title: entity.name,
  year: null,
  caption: null,
  overview: null,
  poster: entity.logo_path,
  billboard: null,
  meaningful: {},
})

export const transformKeywordDetails = (entity) => ({
  id: entity.id,
  title: entity.name,
  year: null,
  caption: null,
  overview: null,
  poster: null,
  billboard: null,
  meaningful: {},
})
