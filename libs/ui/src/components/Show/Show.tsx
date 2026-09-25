import { Fragment, memo, useMemo } from 'react'
import { LinkProps } from 'react-router-dom'
import clanguages from 'country-language'
import { ENDED, coverageLabel } from '@sensorr/sensorr'
import { emojize, humanize, useDevice } from '@sensorr/utils'
import { Empty } from '../../atoms/Picture/Picture'
import { Link } from '../../atoms/Link/Link'
import { Progress } from '../../atoms/Progress/Progress'
import { Focus } from '../../atoms/Focus/Focus'
import { Card } from '../../elements/Entity/Card/Card'
import { Poster, PosterProps } from '../../elements/Entity/Poster/Poster'
import { Proposal } from '../Movie/Proposal/Proposal'
import { Guests } from '../Movie/Guests/Guests'
import { EpisodeStatusOptions, ShowState } from './State/State'

export interface ShowProps extends Omit<
  PosterProps,
  'link' | 'state' | 'focus' | 'placeholder' | 'details' | 'overrides' | 'size' | 'relations' | 'onReady' | 'palette' | 'empty' | 'footer'
> {
  entity: any
  display?: 'poster' | 'card'
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

  const badges = useMemo(() => {
    if (entity?.id === null) {
      return {}
    }

    // A show file lives on its episodes, so the owned releases of a movie become an episode count.
    const proposal = {
      releases: [],
      proposals: (metadata?.releases || []).filter(release => release.proposal && typeof release.choice !== 'boolean'),
      proceed: proceedRelease,
      summary: progress ? emojize('📼', `${progress.owned}/${progress.aired} aired episodes owned`) : null,
      labelize: (release) => coverageLabel(release.coverage || [], release.level || undefined),
    }

    return {
      state: { component: ShowState, props: { value: state, onChange: setState, compact: true } },
      ...(!proposal.proposals.length ? {} : { proposal: { component: Proposal, props: proposal } }),
      ...(metadata?.requested_by?.length ? { guests: { component: Guests, props: { guests: (metadata?.requested_by || []).filter(Boolean).map(guest => ({ entity: { id: 0, name: guest.name, override: guest.email, profile_path: guest.avatar } })) } } } : {}),
      ...(focus ? { focus: { component: Focus, props: { entity, property: focus, compact: true, size: 'small' } } } : {}),
    }
  }, [entity?.id, state, setState, metadata?.releases, metadata?.requested_by, proceedRelease, progress?.owned, progress?.aired, focus])

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
      footer={!!progress && <ShowProgress {...progress} />}
    />
  )
}

export const Show = memo(UIShow)

// One line under every show poster: the owned count and its bar, or the upcoming state
// of a show with no aired episode yet.
const ShowProgress = ({ owned, aired }: { owned: number, aired: number }) => (
  <div sx={ShowProgress.styles.element}>
    {aired > 0 ? (
      <>
        <code title={`${owned} of ${aired} aired episodes owned`}>{`${owned}/${aired}`}</code>
        <Progress value={owned} max={aired} title={`${owned} of ${aired} aired episodes owned`} />
      </>
    ) : (
      <span>{emojize(EpisodeStatusOptions.upcoming.emoji, EpisodeStatusOptions.upcoming.label)}</span>
    )}
  </div>
)

ShowProgress.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'grayDarkest',
    whiteSpace: 'nowrap',
    '>code': {
      fontFamily: 'monospace',
      fontSize: 7,
      fontVariantNumeric: 'tabular-nums',
    },
    '>span': {
      fontSize: 7,
      fontWeight: 'semibold',
    },
    '>progress': {
      flex: 1,
    },
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
      vote_count: !!entity.vote_count ? () => (
        <span title='Vote count' sx={{ whiteSpace: 'nowrap' }}>{emojize('🗳️', entity.vote_count.toLocaleString())}</span>
      ) : null,
      popularity: !!entity.popularity ? () => (
        <span title='Popularity' sx={{ whiteSpace: 'nowrap' }}>{emojize('📣', entity.popularity.toLocaleString())}</span>
      ) : null,
    },
  }
}
