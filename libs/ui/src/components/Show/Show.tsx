import { Fragment, memo, useMemo } from 'react'
import { LinkProps } from 'react-router-dom'
import clanguages from 'country-language'
import { ENDED, coverageLabel, diffusionOf } from '@sensorr/sensorr'
import { utils as tmdb, fields } from '@sensorr/tmdb'
import { emojize, humanize, useDevice } from '@sensorr/utils'
import { Empty } from '../../atoms/Picture/Picture'
import { Link } from '../../atoms/Link/Link'
import { Icon } from '../../atoms/Icon/Icon'
import { Progress } from '../../atoms/Progress/Progress'
import { Focus } from '../../atoms/Focus/Focus'
import { Card } from '../../elements/Entity/Card/Card'
import { Poster, PosterProps } from '../../elements/Entity/Poster/Poster'
import { Pretty } from '../../elements/Entity/Pretty/Pretty'
import { Proposal } from '../Movie/Proposal/Proposal'
import { Guests } from '../Movie/Guests/Guests'
import { ReviewsBadge } from '../Movie/Badges/ReviewsBadge'
import { EpisodeStatusOptions, ShowState } from './State/State'
import { ProgressPill } from './ProgressPill/ProgressPill'

export interface ShowProps extends Omit<
  PosterProps,
  'link' | 'state' | 'focus' | 'placeholder' | 'details' | 'overrides' | 'size' | 'relations' | 'onReady' | 'palette' | 'empty' | 'footer'
> {
  entity: any
  display?: 'poster' | 'card' | 'pretty'
  link?: ((entity: any) => LinkProps)
  focus?: 'vote_average' | 'popularity' | 'vote_count'
  placeholder?: boolean
  state?: 'loading' | 'ignored' | 'unfollowed' | 'followed'
  setState?: (state: string) => any
  metadata?: any
  setMetadata?: (key: string, value: any) => any
  proceedRelease?: (release: any, choice?: boolean) => void
  ready?: boolean
  selected?: boolean | null
  selectedVisible?: boolean
  onSelectedChange?: (id: string) => void
}

const UIShow = ({
  entity: data,
  display = 'poster',
  focus,
  placeholder,
  state,
  setState,
  metadata,
  setMetadata,
  proceedRelease,
  ready = true,
  selected = null,
  selectedVisible = false,
  onSelectedChange,
  ...props
}: ShowProps) => {
  const device = useDevice()
  const entity = useMemo(() => (!placeholder && data) || { poster_path: false, id: null }, [data, placeholder])
  const details = useMemo(() => transformShowDetails(entity), [entity])
  const link = useMemo(() => (props.link || ((entity) => !!entity?.id && { to : `/tv/${entity.id}` }))(entity), [entity, props.link])
  const progress = !placeholder && entity?.progress
  const diffusion = progress ? diffusionOf(entity, progress, (global as any)?.config?.region || 'fr-FR') : null

  const badges = useMemo(() => {
    if (entity?.id === null) {
      return {}
    }

    const proposal = {
      releases: [],
      proposals: (metadata?.releases || []).filter(release => release.proposal && typeof release.choice !== 'boolean'),
      proceed: proceedRelease,
      summary: progress ? emojize('📼', `${progress.owned}/${progress.aired} aired episodes owned`) : null,
      labelize: (release) => coverageLabel(release.coverage || [], release.level || undefined),
    }

    return {
      state: { component: ShowState, props: { value: state, onChange: setState, compact: true } },
      reviews: { component: ReviewsBadge, props: { entity, display } },
      ...(!proposal.proposals.length ? {} : { proposal: { component: Proposal, props: proposal } }),
      ...(metadata?.requested_by?.length ? { guests: { component: Guests, props: { to: '/tv/requests', guests: (metadata?.requested_by || []).filter(Boolean).map(guest => ({ entity: { id: 0, name: guest.name, override: guest.email, profile_path: guest.avatar } })) } } } : {}),
      ...(focus ? { focus: { component: Focus, props: { entity, property: focus, compact: true, size: 'small' } } } : {}),
    }
  }, [entity?.id, display, state, setState, metadata?.releases, metadata?.requested_by, proceedRelease, progress?.owned, progress?.aired, focus])

  if (display === 'card') {
    return (
      <Card
        {...props}
        details={details}
        link={link}
        ready={typeof entity?.id === 'number' && !placeholder && ready}
        empty={Empty.tv}
        badges={badges}
      />
    )
  }

  if (display === 'pretty') {
    return (
      <Pretty
        {...props}
        details={details}
        link={link}
        ready={typeof entity?.id === 'number' && !placeholder && ready}
        empty={Empty.tv}
        badges={badges}
      />
    )
  }

  return (
    <Poster
      {...props}
      details={details}
      link={link}
      interactive={device === 'mobile'}
      ready={typeof entity?.id === 'number' && !placeholder && ready}
      empty={Empty.tv}
      badges={badges}
      selected={selected}
      selectedVisible={selectedVisible}
      onSelectedChange={onSelectedChange}
      footer={!!progress && <ShowProgress {...progress} first_air_date={entity.first_air_date} airing={diffusion.airing} detail={diffusion.detail} compact={device === 'mobile'} />}
    />
  )
}

export const Show = memo(UIShow)

interface ShowProgressProps {
  owned: number
  aired: number
  seasons?: { owned: number, aired: number }[]
  first_air_date?: string | Date | null
  // The series still airs: the pill takes the airing tint
  airing?: boolean
  // After the counts in the titles, like "next episode on 29/09"
  detail?: string
  compact?: boolean
}

// The owned count or the upcoming status on the left, the bar or the first air date on the right, so neighbour cards line up
const ShowProgress = ({ owned, aired, seasons, first_air_date, airing, detail, compact }: ShowProgressProps) => (
  <div sx={ShowProgress.styles.element}>
    {aired > 0 ? (
      <>
        {/* On a 96px mobile card the pill steps down with the title, so it stays lighter than it */}
        <span sx={ShowProgress.styles.pill}>
          <ProgressPill owned={owned} aired={aired} airing={airing} detail={detail} />
        </span>
        {/* A 96px mobile card leaves the bar 5px to 19px beside the pill: the pill alone says it there */}
        {!compact && (
          <Progress
            value={owned}
            max={aired}
            segments={seasons?.map(season => ({ value: season.owned, max: season.aired }))}
            title={[`${owned} of ${aired} aired episodes owned`, detail].filter(Boolean).join(' · ')}
          />
        )}
      </>
    ) : (
      <>
        <span data-upcoming={true} title={EpisodeStatusOptions.upcoming.label}>
          <span role='img' aria-label={EpisodeStatusOptions.upcoming.label}>{EpisodeStatusOptions.upcoming.emoji}</span>
          {!compact && <span aria-hidden={true}>{EpisodeStatusOptions.upcoming.label}</span>}
        </span>
        <time title='First episode air date' dateTime={first_air_date ? new Date(first_air_date).toISOString().slice(0, 10) : undefined}>
          {first_air_date ? new Date(first_air_date).toLocaleDateString((global as any)?.config?.region || 'fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'TBA'}
        </time>
      </>
    )}
  </div>
)

ShowProgress.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    // The height of a compact pill (0.75em at a normal line height of 1.2, plus its 0.25em paddings), so the upcoming line of a neighbour card sits on the same center
    minHeight: 'calc(0.75em * 1.2 + 0.375em)',
    color: 'grayDarkest',
    whiteSpace: 'nowrap',
    '>time, >[data-upcoming]': {
      fontSize: 7,
      lineHeight: 'normal',
    },
    '>time': {
      fontFamily: 'monospace',
      fontVariantNumeric: 'tabular-nums',
    },
    '>[data-upcoming]': {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontWeight: 'semibold',
    },
    '>progress, >[role="progressbar"]': {
      flex: 1,
    },
  },
  pill: {
    display: 'flex',
    fontSize: [5, 4],
  },
}

export const transformShowDetails = (entity) => {
  const first = !!entity.first_air_date && new Date(entity.first_air_date).getFullYear()
  const last = !!entity.last_air_date && new Date(entity.last_air_date).getFullYear()

  return {
    id: entity.id || null,
    title: entity.name || entity.original_name || '',
    year: first || null,
    caption: Array.isArray(entity.genres) && !!entity.genres.length && entity.genres.map((genre) => genre.name).join(', '),
    tagline: entity.tagline || '',
    overview: entity.overview || '',
    poster: entity.poster_path,
    billboard: entity.backdrop_path,
    meaningful: {
      year: first ? ({ disabled = false } = {}) => (
        <Link
          title={`Discover more shows from ${first}`}
          sx={{ whiteSpace: 'nowrap' }}
          disabled={disabled}
          to='/tv/discover'
          state={{
            controls: {
              first_air_date: [new Date(`${first}-01-01`), new Date(`${first}-12-31`)],
            },
          }}
        >
          {first}
        </Link>
      ) : null,
      release_dates_range: first ? () => (
        <span title={entity.status} sx={{ whiteSpace: 'nowrap' }}>
          {emojize('📆', ENDED.includes(entity.status) ? `${first} - ${last || first}` : `${first} - Airing`)}
        </span>
      ) : null,
      runtime: !!entity.episode_run_time?.length ? () => (
        <span title='Episode runtime' sx={{ whiteSpace: 'nowrap' }}>
          {emojize('🕙', humanize.time(`${entity.episode_run_time[0]}`))}
        </span>
      ) : null,
      genres: !!entity.genres?.length ? ({ emoji = true, disabled = false } = {}) => (
        <span>
          {emoji && emojize('🎞️')}{entity.genres.map((genre, index, arr) => (
            <Fragment key={genre.id}>
              <Link
                title={`Discover more "${genre.name}" shows`}
                disabled={disabled}
                to='/tv/discover'
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
      original_language: !!entity.original_language ? () => {
        const language = useMemo(() => clanguages.getLanguage(entity.original_language), [entity.original_language])

        return language?.name?.length && (
          <span sx={{ whiteSpace: 'nowrap' }}>{emojize('💬', language.name[0])}</span>
        )
      } : null,
      vote_average: typeof entity.vote_average !== 'undefined' ? () => (
        <Link
          title={`Discover more "${tmdb.judge(entity)}" shows${!!entity?.vote_count ? ` (${fields.vote_count.humanize(entity)} users rating)` : ''}`}
          sx={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}
          to='/tv/discover'
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
        <span title='Vote count' sx={{ whiteSpace: 'nowrap' }}>{emojize('🗳️', entity.vote_count.toLocaleString())}</span>
      ) : null,
      popularity: !!entity.popularity ? () => (
        <span title='Popularity' sx={{ whiteSpace: 'nowrap' }}>{emojize('📣', entity.popularity.toLocaleString())}</span>
      ) : null,
    },
  }
}
