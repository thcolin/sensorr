import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { EpisodeStatusOptions, transformShowDetails, Warning } from '@sensorr/ui'
import { episodeStatus } from '@sensorr/sensorr'
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
import Details from '../Details/Details'
import { isPending } from '../Proposals/queue'
import { ShowActions } from './components/Actions'
import { Proposals } from './components/Proposals'
import { Seasons } from './components/Seasons'
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

  const pending = useMemo(() => (metadata?.releases || []).filter(isPending), [metadata?.releases])

  // Only what waits on a gesture: owned over aired and the size are the "All seasons" pills below
  const summary = useMemo(() => {
    if (!inLibrary || !episodes) {
      return null
    }

    const wanted = episodes.filter(episode => episodeStatus(episode) === 'wanted').length
    const toProposals = (e) => {
      e.preventDefault()
      document.getElementById('proposals')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }

    return [
      !!pending.length && (
        <span key='pending'>
          <a href='#proposals' onClick={toProposals} title={`${pending.length} pending proposal${pending.length > 1 ? 's' : ''}`} sx={Show.styles.anchor}>
            {EpisodeStatusOptions.proposed.emoji} {pending.length}
          </a>
        </span>
      ),
      !!wanted && <span key='wanted' title={`${wanted} wanted episode${wanted > 1 ? 's' : ''}`}>{EpisodeStatusOptions.wanted.emoji} {wanted}</span>,
    ].filter(Boolean)
  }, [inLibrary, episodes, pending])

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
      {/* Before its episodes load, a swap would read as replacing nothing */}
      {inLibrary && !!episodes && (
        <Proposals entity={show.data} metadata={metadata} episodes={episodes} proceedRelease={proceedRelease} banRelease={banRelease} />
      )}
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
          proposals={pending}
          inLibrary={inLibrary && !!episodes}
          ready={actionsReady}
          followEpisodes={followEpisodes}
        />
      )}
    </Details>
  )
}

Show.styles = {
  anchor: {
    color: 'inherit',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
      textUnderlineOffset: '0.25em',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
  },
}

export default withBody({ overlayScrollbars: true })(Show)
