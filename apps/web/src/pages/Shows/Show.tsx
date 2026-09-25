import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Badge, EpisodeStatusOptions, ProgressPill, transformShowDetails, Warning } from '@sensorr/ui'
import { episodeStatus, progressOf } from '@sensorr/sensorr'
import { useTitle } from '@sensorr/utils'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTMDBRequest } from '../../store/tmdb'
import { showStateOf, useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'
import { withBody } from '../../layout/withLayout'
import ShowChild from '../../components/Show/Show'
import Person from '../../components/Person/Person'
import { ReleaseSize } from '../../components/Sensorr/Release'
import Details from '../Details/Details'
import { ShowActions } from './components/Actions'
import { useProposals } from './components/Proposals'
import { Seasons } from './components/Seasons'
import { sizeOf } from './components/fills'
import { aggregateCredits } from './credits'

const Show = ({ ...props }) => {
  const { restoreScrollPosition } = useScrollPositionContext()
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { metadata: persons } = usePersonsMetadataContext() as any
  const {
    loading: metadataLoading,
    metadata: { [id]: metadata },
    episodes: { [id]: episodes },
    loadEpisodes,
    setShowMetadata,
    setEpisodesMetadata,
    setShowState,
    banShowRelease,
  } = useShowsMetadataContext() as any
  const [episodesError, setEpisodesError] = useState(null)

  const show = useTMDBRequest(`tv/${id}`, {
    append_to_response: 'videos,external_ids,aggregate_credits,recommendations,similar,watch/providers',
    include_image_language: 'en,null',
  }, { transform: transformShowDetails })

  const inLibrary = !!metadata && metadata.state !== 'ignored'
  const ready = !show.loading && !!(show.data?.id || show.error)

  useTitle(ready && [show.details.title, show.details.year && `(${show.details.year})`].filter(part => part).join(' '))

  useEffect(() => {
    if (ready) {
      restoreScrollPosition()
    }
  }, [ready])

  useEffect(() => {
    setEpisodesError(null)

    if (!inLibrary || episodes) {
      return
    }

    loadEpisodes(Number(id)).catch(error => setEpisodesError(error))
  }, [id, inLibrary])

  const setMetadata = useCallback((key, value) => setShowMetadata(Number(id), key, value), [id])
  const proceedRelease = useCallback((release, choice) => setShowMetadata(Number(id), 'proposal', { id: release.id, choice }), [id])
  const banRelease = useCallback((release) => banShowRelease(Number(id), release.title), [id])
  // `setShowState` toasts a show it adds to or removes from the library, `setShowMetadata` nothing for a follow
  const setState = useCallback(state => setShowState(Number(id), state).catch(() => inLibrary && toast.error('Error while following the show')), [id, setShowState, inLibrary])
  // A season is a bulk and toasts its own outcome, a single episode does not
  const followEpisodes = useCallback((ids, value) => setEpisodesMetadata(Number(id), ids, 'monitored', value)
    .catch(() => ids.length === 1 && toast.error('Error while following the episode')), [id])

  const proposals = useProposals({ entity: show.data, metadata, episodes: inLibrary ? (episodes || null) : null, proceedRelease, banRelease })

  // In the pills of the "All seasons" row: owned over aired, the size, then what waits on a gesture
  const summary = useMemo(() => {
    if (!inLibrary || !episodes) {
      return null
    }

    const progress = progressOf(episodes.filter(({ season_number }) => season_number !== 0))
    const size = sizeOf(episodes)
    const pending = proposals.rows.length
    const wanted = episodes.filter(episode => episodeStatus(episode) === 'wanted').length
    // To the first proposal shown, in its season's drawer or its episode's row (Seasons.tsx)
    const toProposals = (e) => {
      e.preventDefault()
      document.querySelector('[data-proposal]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }

    return [
      <span key='pills' sx={Show.styles.pills}>
        <ProgressPill {...progress} />
        {!!size && <ReleaseSize size={size} data-size={true} />}
        {!!pending && (
          <a href={`#seasons-${id}`} onClick={toProposals} title={`${pending} pending proposal${pending > 1 ? 's' : ''}`} sx={Show.styles.anchor}>
            <Badge emoji={EpisodeStatusOptions.proposed.emoji} label={pending} compact={true} size='small' />
          </a>
        )}
        {!!wanted && (
          <Badge emoji={EpisodeStatusOptions.wanted.emoji} label={wanted} compact={true} size='small' title={`${wanted} wanted episode${wanted > 1 ? 's' : ''}`} />
        )}
      </span>,
    ]
  }, [inLibrary, episodes, proposals.rows.length, id])

  const additional = useMemo(() => ({
    externals: {
      ...(show.data?.external_ids?.imdb_id ? { imdb: `https://www.imdb.com/title/${show.data.external_ids.imdb_id}` } : {}),
    },
  }), [show.data?.external_ids?.imdb_id])

  const tabs = useMemo(() => {
    const recommendations = {
      id: `recommendations-${id}`,
      label: t('items.movies.recommendations.label'),
      entities: show.data?.recommendations?.results || [],
      child: ShowChild,
      ready,
    }

    const similar = {
      id: `similar-${id}`,
      label: t('items.movies.similar.label'),
      entities: show.data?.similar?.results || [],
      child: ShowChild,
      ready,
    }

    const cast = {
      id: `cast-${id}`,
      label: t('items.persons.cast.label'),
      entities: aggregateCredits(show.data?.aggregate_credits, Object.keys(persons), 'cast'),
      child: Person,
      ready,
    }

    const crew = {
      id: `crew-${id}`,
      label: t('items.persons.crew.label'),
      entities: aggregateCredits(show.data?.aggregate_credits, Object.keys(persons), 'crew'),
      child: Person,
      ready,
    }

    const related = ((!ready || (recommendations.entities.length || similar.entities.length)) && {
      id: 'related',
      ready,
      tabs: {
        ...((!ready || recommendations.entities.length) && { recommendations }),
        ...((!ready || similar.entities.length) && { similar }),
      },
    })

    const credits = ((!ready || (cast.entities.length || crew.entities.length)) && {
      id: 'credits',
      ready,
      tabs: {
        ...((!ready || cast.entities.length) && { cast }),
        ...((!ready || crew.entities.length) && { crew }),
      },
    })

    return [
      ...(related ? [related] : []),
      ...(credits ? [credits] : []),
    ]
  }, [ready, id, persons, show.data])

  if (show.error) {
    return (
      <Warning
        emoji='💢'
        title='Sorry, unable to display show...'
        subtitle={show.error.message}
      />
    )
  }

  const actionsReady = ready && !metadataLoading && (!inLibrary || !!episodes)

  return (
    <Details
      details={show.details}
      entity={show.data}
      additional={additional}
      metadata={metadata}
      behavior='tv'
      state={metadataLoading ? 'loading' : showStateOf(metadata)}
      setState={setState}
      summary={summary}
      tabs={tabs}
      loading={show.loading}
      ready={ready}
      actions={inLibrary ? (
        <ShowActions
          entity={show.data}
          metadata={metadata}
          ready={actionsReady}
          setMetadata={setMetadata}
        />
      ) : null}
    >
      {episodesError ? (
        <Warning
          emoji='🚨'
          title='Sorry, unable to load the episodes...'
          subtitle={episodesError.message}
        />
      ) : (
        <Seasons
          entity={show.data}
          episodes={inLibrary ? (episodes || []) : []}
          proposals={proposals.rows}
          policy={proposals.policy}
          answer={proposals.answer}
          inLibrary={inLibrary && !!episodes}
          ready={actionsReady}
          followEpisodes={followEpisodes}
        />
      )}
    </Details>
  )
}

Show.styles = {
  // The pills of the "All seasons" row (Seasons.tsx), at the size of its release tags
  pills: {
    display: 'inline-flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    '>[data-size]': {
      fontSize: 6,
      whiteSpace: 'nowrap',
    },
  },
  anchor: {
    display: 'flex',
    color: 'inherit',
    textDecoration: 'none',
    borderRadius: '2em',
    '>span': {
      transition: 'background-color 200ms ease-in-out',
    },
    ':hover >span': {
      backgroundColor: 'grayDark',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
  },
}

export default withBody({ overlayScrollbars: true })(Show)
