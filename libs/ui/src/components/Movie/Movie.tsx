import { Fragment, memo, useCallback, useMemo } from 'react'
import { LinkProps } from 'react-router-dom'
import clanguages from 'country-language'
import { Movie as MovieInterface, Person as PersonInterface, Cast as CastInterface, Crew as CrewInterface, utils as tmdb, fields } from '@sensorr/tmdb'
import { emojize, humanize, useDevice } from '@sensorr/utils'
import { Empty } from '../../atoms/Picture/Picture'
import { Focus } from '../../atoms/Focus/Focus'
import { Link } from '../../atoms/Link/Link'
import { Icon } from '../../atoms/Icon/Icon'
import { Details } from '../../elements/Entity'
import { Avatar } from '../../elements/Entity/Avatar/Avatar'
import { Card } from '../../elements/Entity/Card/Card'
import { Poster, PosterProps } from '../../elements/Entity/Poster/Poster'
import { Pretty } from '../../elements/Entity/Pretty/Pretty'
import { MovieState } from './State/State'
import { Proposal } from './Proposal/Proposal'
import { ReviewsBadge } from './Badges/ReviewsBadge'
// import { CreditsBadge } from './Badges/CreditsBadge'
import { Guests } from './Guests/Guests'
// import { GuestsBadge } from './Badges/GuestsBadge'

export interface MovieProps extends Omit<
  PosterProps,
  'link' | 'state' | 'focus' | 'placeholder' | 'details' | 'overrides' | 'size' | 'relations' | 'onReady' | 'palette' | 'empty'
> {
  entity: MovieInterface
  display?: 'poster' | 'card' | 'avatar' | 'pretty'
  link?: ((MovieInterface) => LinkProps)
  focus?: 'vote_average' | 'release_date_full' | 'release_date' | 'popularity' | 'runtime' | 'vote_count'
  credits?: { entity: (PersonInterface | CastInterface | CrewInterface), state?: 'loading' | 'ignored' | 'followed' }[]
  loadCredits?: () => void
  reviews?: { source: string, score: string, date: string, count: string }[],
  loadReviews?: () => void
  placeholder?: boolean
  state?: 'loading' | 'ignored' | 'missing' | 'pinned' | 'wished' | 'archived'
  setState?: (state: string) => any
  metadata?: any
  setMetadata?: (key: string, value: any) => any
  proceedRelease?: (id: number, release: any, choice?: boolean) => void
  removeRelease?: (release: any) => void
  ready?: boolean
  selected?: boolean | null
  selectedVisible?: boolean
  onSelectedChange?: (id: string) => void
}

const UIMovie = ({
  entity: data,
  display = 'poster',
  placeholder,
  credits,
  loadCredits,
  reviews,
  loadReviews,
  state,
  setState,
  metadata,
  setMetadata,
  proceedRelease,
  removeRelease,
  ready = true,
  selected = null,
  selectedVisible = false,
  onSelectedChange,
  ...props
}: MovieProps) => {
  const device = useDevice()
  const entity = useMemo(() => (!placeholder && data) || { poster_path: false, id: null }, [data, placeholder]) as MovieInterface
  const details = useMemo(() => transformMovieDetails(entity), [entity])
  const link = useMemo(() => (props.link || ((entity) => !!entity?.id && { to : `/movie/${entity.id}` }))(entity), [entity, props.link])

  const badges = useMemo(() => {
    if (entity?.id === null) {
      return {}
    }

    const proposal = {
      releases: metadata?.releases?.filter(release => !release.proposal),
      proposals: metadata?.releases?.filter(release => release.proposal),
      proceed: proceedRelease,
    }

    return {
      state: { component: MovieState, props: { value: state, onChange: setState, compact: true } },
      reviews: { component: ReviewsBadge, props: { entity, reviews, loadReviews } },
      ...(!proposal.proposals?.length ? {} : { proposal: { component: Proposal, props: proposal } }),
      ...(metadata?.requested_by?.length ? { guests: { component: Guests, props: { guests: (metadata?.requested_by || []).reduce((guests, guest) => [...guests, { entity: { id: 0, name: guest.name, override: guest.email, profile_path: guest.avatar } }], []) } } } : {}),
      ...(props?.focus ? { focus: { component: Focus, props: { entity, property: props.focus, compact: true, size: 'small' } } } : {}),
    }
  }, [
    entity?.id,
    ready,
    placeholder,
    display,
    state,
    setState,
    metadata?.releases,
    props.focus,
    reviews,
    loadReviews,
    metadata?.requested_by
  ]) as { state?: { component: React.FC, props: any }, proposal?: { component: React.FC, props: any } }

  const loadExternals = useCallback(() => {
    if (typeof loadCredits === 'function') {
      loadCredits()
    }

    if (typeof loadReviews === 'function') {
      loadReviews()
    }
  }, [loadCredits, loadReviews])

  switch (display) {
    case 'avatar':
      return (
        <Avatar
          {...props}
          details={details}
          link={link}
          highlight={['pinned', 'wished', 'archived'].includes(state)}
          ready={typeof entity?.id === 'number' && !placeholder && ready}
          empty={Empty.movie}
        />
      )
    case 'card':
      return (
        <Card
          {...props}
          details={details}
          link={link}
          ready={typeof entity?.id === 'number' && !placeholder && ready}
          empty={Empty.movie}
          badges={badges}
        />
      )
    case 'pretty':
      return (
        <Pretty
          {...props}
          details={details}
          link={link}
          ready={typeof entity?.id === 'number' && !placeholder && ready}
          empty={Empty.movie}
          badges={badges}
          credits={credits}
          loadExternals={loadExternals}
        />
      )
    default:
      return (
        <Poster
          {...props}
          details={details}
          link={link}
          interactive={device === 'mobile'}
          ready={typeof entity?.id === 'number' && !placeholder && ready}
          empty={Empty.movie}
          badges={badges}
          credits={credits}
          loadExternals={loadExternals}
          selected={selected}
          selectedVisible={selectedVisible}
          onSelectedChange={onSelectedChange}
        />
      )
  }
}

export const Movie = memo(UIMovie)

export interface MovieDetails extends Details {
  meaningful: {
    directors?: React.FunctionComponent<any>,
    year?: React.FunctionComponent<any>,
    release_date?: React.FunctionComponent<any>,
    vote_average?: React.FunctionComponent<any>,
    vote_count?: React.FunctionComponent<any>,
    popularity?: React.FunctionComponent<any>,
    genres?: React.FunctionComponent<any>,
    runtime?: React.FunctionComponent<any>,
    original_language?: React.FunctionComponent<any>,
    budget?: React.FunctionComponent<any>,
    revenue?: React.FunctionComponent<any>,
    production_companies?: React.FunctionComponent<any>,
    keywords?: React.FunctionComponent<any>,
  },
}

export const transformMovieDetails = (entity: MovieInterface): MovieDetails => ({
  id: entity.id || null,
  title: entity.title || entity.original_title || '',
  year: !!entity.release_date && new Date(entity.release_date).getFullYear(),
  caption: Array.isArray(entity.genres) && !!entity.genres.length && entity.genres.map((genre) => genre.name).join(', '),
  tagline: entity.tagline || '',
  overview: entity.overview || '',
  poster: entity.poster_path,
  billboard: entity.backdrop_path,
  meaningful: {
    directors: (entity as any)?.credits?.crew?.filter(credit => credit.job === 'Director')?.length ? () => (
      <span>
        {emojize('🎬')}{(entity as any)?.credits?.crew?.filter(credit => credit.job === 'Director').map((credit, index, arr) => (
          <Fragment key={credit.id}>
            <Link title={`Discover more movies from "${credit.name}"`} to={`/person/${credit.id}`}>
              {credit.name}
            </Link>
            {index === arr.length - 1 ? '' : ', '}
          </Fragment>
        ))}
      </span>
    ) : null,
    year: !!entity.release_date ? ({ disabled } = {}) => (
      <Link
        title={`Discover more movies from ${new Date(entity.release_date).getFullYear()}`}
        sx={{ whiteSpace: 'nowrap' }}
        disabled={disabled}
        to='/movie/discover'
        state={{
          controls: {
            primary_release_date: [
              new Date(`${new Date(entity.release_date).getFullYear()}-01-01`),
              new Date(`${new Date(entity.release_date).getFullYear()}-12-31`),
            ],
          },
        }}
      >
        {new Date(entity.release_date).getFullYear()}
      </Link>
    ) : null,
    release_date: !!entity.release_date ? () => (
      <Link
        title={`Discover more movies from ${new Date(entity.release_date).getFullYear()}`}
        sx={{ whiteSpace: 'nowrap' }}
        to='/movie/discover'
        state={{
          controls: {
            primary_release_date: [
              new Date(`${new Date(entity.release_date).getFullYear()}-01-01`),
              new Date(`${new Date(entity.release_date).getFullYear()}-12-31`),
            ],
          },
        }}
      >
        {emojize('📆', new Date(entity.release_date).toLocaleString((global as any)?.config?.region || 'fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }))}
      </Link>
    ) : null,
    vote_average: typeof entity.vote_average !== 'undefined' ? () => (
      <Link
        title={`Discover more "${tmdb.judge(entity)}" movies${!!entity?.vote_count ? ` (${fields.vote_count.humanize(entity as any)} users rating)` : ''}`}
        sx={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}
        to='/movie/discover'
        state={{
          controls: {
            vote_average: [Math.floor(entity.vote_average), Math.ceil(entity.vote_average)],
          },
        }}
      >
        <Icon value='tmdb' height='1em' width='1.75em' sx={{ marginRight: 8 }} />
        {Math.round(entity.vote_average * 10)}%
      </Link>
    ) : null,
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
    popularity: !!entity.popularity ? () => (
      <span title={`Popularity`} sx={{ whiteSpace: 'nowrap' }}>
        {emojize('📣', entity.popularity.toLocaleString())}
      </span>
    ) : null,
    genres: !!entity.genres?.length ? ({ emoji = true, disabled } = {}) => (
      <span>
        {emoji && emojize('🎞️')}{entity.genres.map((genre, index, arr) => (
          <Fragment key={genre.id}>
            <Link
              title={`Discover more "${genre.name}" movies`}
              disabled={disabled}
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
    ) : null,
    runtime: !!entity.runtime ? () => (
      <Link
        title={`Discover more movies with similar runtime`}
        sx={{ whiteSpace: 'nowrap' }}
        to='/movie/discover'
        state={{
          controls: {
            with_runtime: [
              Math.floor(entity.runtime / 60) * 60,
              Math.ceil(entity.runtime / 60) * 60,
            ],
          },
        }}
      >
        {emojize('🕙', humanize.time(`${entity.runtime || 0}`))}
      </Link>
    ) : null,
    original_language: !!entity.original_language ? () => {
      const language = useMemo(() => clanguages.getLanguage(entity.original_language), [entity.original_language])

      return language?.name?.length && (
        <Link
          title={`Discover more movies with "${language.name[0]}" as original language`}
          sx={{ whiteSpace: 'nowrap' }}
          to='/movie/discover'
          state={{
            controls: {
              with_original_language: {
                behavior: 'or',
                values: [
                  {
                    value: entity.original_language,
                    label: language.name[0],
                  },
                ],
              },
            },
          }}
        >
          {emojize('💬', language.name[0])}
        </Link>
      )
    } : null,
    budget: !!entity.budget ? () => (
      <span title={`Budget`} sx={{ whiteSpace: 'nowrap' }}>
        {emojize('💸', entity.budget.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0, maximumSignificantDigits: 3 }))}
      </span>
    ) : null,
    revenue: !!entity.revenue ? () => (
      <span title={`Revenue`} sx={{ whiteSpace: 'nowrap' }}>
        {emojize('💰', entity.revenue.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0, maximumSignificantDigits: 3 }))}
      </span>
    ) : null,
    production_companies: !!entity.production_companies?.length ? () => (
      <span>
        {emojize('🏛️')}{entity.production_companies.map((company, index, arr) => (
          <Fragment key={company.id}>
            <Link
              title={`Discover more movies from "${company.name}" production company`}
              to='/movie/discover'
              state={{
                controls: {
                  with_companies: {
                    behavior: 'or',
                    values: [{ value: company.id, label: company.name }],
                  },
                },
              }}
            >
              {company.name}
            </Link>
            {index === arr.length - 1 ? '' : ', '}
          </Fragment>
        ))}
      </span>
    ) : null,
    keywords: !!(entity as any).keywords?.keywords?.length ? () => (
      <span>
        {emojize('🔗')}{(entity as any).keywords?.keywords.map((keyword, index, arr) => (
          <Fragment key={keyword.id}>
            <Link
              title={`Discover more movies associated to "${keyword.name}" keyword`}
              to='/movie/discover'
              state={{
                controls: {
                  with_keywords: {
                    behavior: 'or',
                    values: [{ value: keyword.id, label: keyword.name }],
                  },
                },
              }}
            >
              {keyword.name}
            </Link>
            {index === arr.length - 1 ? '' : ', '}
          </Fragment>
        ))}
      </span>
    ) : null,
  },
})
