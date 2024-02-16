import { Fragment, memo, useMemo } from 'react'
import { LinkProps } from 'react-router-dom'
import clanguages from 'country-language'
import { Movie as MovieInterface, Person as PersonInterface, Cast as CastInterface, Crew as CrewInterface, utils as tmdb } from '@sensorr/tmdb'
import { emojize, humanize } from '@sensorr/utils'
import { Empty } from '../../atoms/Picture/Picture'
import { Focus } from '../../atoms/Focus/Focus'
import { Link } from '../../atoms/Link/Link'
import { Details } from '../../elements/Entity'
import { Avatar } from '../../elements/Entity/Avatar/Avatar'
import { Card } from '../../elements/Entity/Card/Card'
import { Poster, PosterProps } from '../../elements/Entity/Poster/Poster'
import { Pretty } from '../../elements/Entity/Pretty/Pretty'
import { MovieState } from './State/State'
import { Credits } from './Credits/Credits'
import { Guests } from './Guests/Guests'
import { Proposal } from './Proposal/Proposal'

export interface MovieProps extends Omit<
  PosterProps,
  'link' | 'state' | 'focus' | 'placeholder' | 'details' | 'overrides' | 'size' | 'relations' | 'onReady' | 'palette' | 'empty'
> {
  entity: MovieInterface
  display?: 'poster' | 'card' | 'avatar' | 'pretty'
  link?: ((MovieInterface) => LinkProps)
  focus?: 'vote_average' | 'release_date_full' | 'release_date' | 'popularity' | 'runtime' | 'vote_count'
  credits?: { entity: (PersonInterface | CastInterface | CrewInterface), state?: 'loading' | 'ignored' | 'followed' }[]
  placeholder?: boolean
  state?: 'loading' | 'ignored' | 'missing' | 'pinned' | 'wished' | 'archived'
  setState?: (state: string) => any
  metadata?: any
  setMetadata?: (key: string, value: any) => any
  proceedRelease?: (id: number, release: any, choice?: boolean) => void
  removeRelease?: (release: any) => void
  ready?: boolean
  guestsDisplay?: 'never' | 'hover' | 'always'
}

const UIMovie = ({
  entity: data,
  display = 'poster',
  placeholder,
  credits,
  state,
  setState,
  metadata,
  setMetadata,
  proceedRelease,
  removeRelease,
  ready = true,
  guestsDisplay = 'hover',
  ...props
}: MovieProps) => {
  // data
  const entity = useMemo(() => (!placeholder && data) || { poster_path: false, id: null }, [data, placeholder]) as MovieInterface
  const details = useMemo(() => transformMovieDetails(entity), [entity])
  const link = useMemo(() => (props.link || ((entity) => !!entity?.id && { to : `/movie/${entity.id}` }))(entity), [entity, props.link])

  // components
  const focus = useMemo(() => entity.id === null ? [] : [
    Focus,
    { entity, property: display === 'pretty' ? 'vote_count' : 'vote_average', compact: true, size: 'small' }
  ], [entity, display]) as [React.FC, any]

  const badge = useMemo(() => entity.id === null ? [] : [
    MovieState,
    { value: state, onChange: setState, compact: true },
  ], [entity, state, setState]) as [React.FC, any]

  const action = useMemo(() => {
    const props = {
      releases: metadata?.releases?.filter(release => !release.proposal),
      proposals: metadata?.releases?.filter(release => release.proposal),
      proceed: proceedRelease,
    }

    return (entity.id === null || !props.proposals?.length) ? [] : [Proposal, props]
  }, [entity?.id, metadata]) as [React.FC, any]

  const guests = useMemo(() => (['pretty', 'poster'].includes(display) && metadata?.requested_by?.length && guestsDisplay === 'always' || (guestsDisplay !== 'never' && state === 'ignored')) ? [Guests, {
    guests: (metadata?.requested_by || []).reduce((guests, guest) => [
      ...guests,
      { entity: { id: 0, name: guest.name, override: guest.email, profile_path: guest.avatar } },
    ], []),
  }, guestsDisplay] : [], [guestsDisplay, display, state, metadata?.requested_by]) as [React.FC, any, string]
  const relations = useMemo(() => (['pretty', 'poster'].includes(display) && credits?.length) ? [Credits, { display, length: display === 'poster' && guests[1]?.guests?.length && 2, credits }] : [], [credits, display, guests]) as [React.FC, any]

  // stuff
  const overrides = useMemo(() => ({
    focus: !props.focus ? [] : [Focus, { entity, property: props.focus, compact: true, size: 'small' }],
    ready: typeof entity.id === 'number' && !placeholder && ready,
  }), [props.focus, ready, placeholder, entity]) as { focus: [React.FC, any], ready: boolean }

  switch (display) {
    case 'avatar':
      return (
        <Avatar
          {...props}
          details={details}
          link={link}
          highlight={['pinned', 'wished', 'archived'].includes(state)}
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
          state={badge}
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
          state={badge}
          focus={focus}
          action={action}
          overrides={overrides}
          empty={Empty.movie}
          relations={relations}
          guests={guests}
        />
      )
    default:
      return (
        <Poster
          {...props}
          details={details}
          link={link}
          state={badge}
          focus={focus}
          action={action}
          overrides={overrides}
          empty={Empty.movie}
          relations={relations}
          guests={guests}
        />
      )
  }
}

export const Movie = memo(UIMovie)

export interface MovieDetails extends Details {
  meaningful: {
    directors?: React.FunctionComponent,
    year?: React.FunctionComponent,
    release_date?: React.FunctionComponent,
    vote_average?: React.FunctionComponent,
    vote_count?: React.FunctionComponent,
    popularity?: React.FunctionComponent,
    genres?: React.FunctionComponent,
    runtime?: React.FunctionComponent,
    original_language?: React.FunctionComponent,
    budget?: React.FunctionComponent,
    revenue?: React.FunctionComponent,
    production_companies?: React.FunctionComponent,
    keywords?: React.FunctionComponent,
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
        {emojize('🎥')}{(entity as any)?.credits?.crew?.filter(credit => credit.job === 'Director').map((credit, index, arr) => (
          <Fragment key={credit.id}>
            <Link title={`Discover more movies from "${credit.name}"`} to={`/person/${credit.id}`}>
              {credit.name}
            </Link>
            {index === arr.length - 1 ? '' : ', '}
          </Fragment>
        ))}
      </span>
    ) : null,
    year: !!entity.release_date ? () => (
      <Link
        title={`Discover more movies from ${new Date(entity.release_date).getFullYear()}`}
        sx={{ whiteSpace: 'nowrap' }}
        to='/movie/discover'
        state={{
          controls: {
            primary_release_date: [
              new Date(entity.release_date),
              new Date(entity.release_date),
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
              new Date(entity.release_date),
              new Date(entity.release_date),
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
    vote_average: !!entity.vote_average ? () => (
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
        {emojize(tmdb.judge(entity), entity.vote_average.toFixed(1).toLocaleString())}
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
    genres: !!entity.genres?.length ? () => (
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
