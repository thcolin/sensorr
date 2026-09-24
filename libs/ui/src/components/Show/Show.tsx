import { Fragment, memo, useMemo } from 'react'
import { LinkProps } from 'react-router-dom'
import clanguages from 'country-language'
import { emojize, humanize, useDevice } from '@sensorr/utils'
import { Empty } from '../../atoms/Picture/Picture'
import { Progress } from '../../atoms/Progress/Progress'
import { Card } from '../../elements/Entity/Card/Card'
import { Poster, PosterProps } from '../../elements/Entity/Poster/Poster'
import { Proposal } from '../Movie/Proposal/Proposal'
import { Guests } from '../Movie/Guests/Guests'
import { ShowState } from './State/State'

export interface ShowProps extends Omit<
  PosterProps,
  'link' | 'state' | 'focus' | 'placeholder' | 'details' | 'overrides' | 'size' | 'relations' | 'onReady' | 'palette' | 'empty'
> {
  entity: any
  display?: 'poster' | 'card'
  link?: ((entity: any) => LinkProps)
  placeholder?: boolean
  state?: 'loading' | 'unfollowed' | 'followed'
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

  const badges = useMemo(() => {
    if (entity?.id === null) {
      return {}
    }

    const proposal = {
      releases: (metadata?.releases || []).filter(release => !release.proposal),
      proposals: (metadata?.releases || []).filter(release => release.proposal && typeof release.choice !== 'boolean'),
      proceed: proceedRelease,
    }

    return {
      state: { component: ShowState, props: { value: state, onChange: setState, compact: true } },
      ...(!proposal.proposals.length ? {} : { proposal: { component: Proposal, props: proposal } }),
      ...(metadata?.requested_by?.length ? { guests: { component: Guests, props: { guests: (metadata?.requested_by || []).filter(Boolean).map(guest => ({ entity: { id: 0, name: guest.name, override: guest.email, profile_path: guest.avatar } })) } } } : {}),
    }
  }, [entity?.id, state, setState, metadata?.releases, metadata?.requested_by, proceedRelease])

  const progress = !placeholder && entity?.progress

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
    <div sx={UIShow.styles.element}>
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
      />
      {!!progress && (
        <div sx={UIShow.styles.progress}>
          <Progress
            value={progress.owned}
            max={progress.aired}
            title={`${progress.owned} of ${progress.aired} aired episodes owned`}
          />
        </div>
      )}
    </div>
  )
}

UIShow.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
  },
  progress: {
    paddingRight: [4, 2],
    paddingLeft: [8, 4],
    marginTop: 10,
  },
}

export const Show = memo(UIShow)

const ENDED = ['Ended', 'Canceled']

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
      year: first ? () => (
        <span sx={{ whiteSpace: 'nowrap' }}>{first}</span>
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
      genres: !!entity.genres?.length ? ({ emoji = true } = {}) => (
        <span>
          {emoji && emojize('🎞️')}{entity.genres.map((genre, index, arr) => (
            <Fragment key={genre.id}>
              {genre.name}
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
