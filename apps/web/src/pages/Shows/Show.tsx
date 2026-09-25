import { useCallback, useEffect, useMemo, useState } from 'react'
import { transformShowDetails, Warning } from '@sensorr/ui'
import { useTitle } from '@sensorr/utils'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTMDBRequest } from '../../store/tmdb'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'
import { withBody } from '../../layout/withLayout'
import ShowChild from '../../components/Show/Show'
import Person from '../../components/Person/Person'
import Details from '../Details/Details'
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
    followShow,
    removeShow,
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
  const setState = useCallback(state => followShow(Number(id), state === 'followed').catch(() => null), [id, followShow])
  const remove = useCallback(() => removeShow(Number(id)), [id])

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
      state={metadataLoading ? 'loading' : metadata?.monitored ? 'followed' : 'unfollowed'}
      setState={setState}
      tabs={tabs}
      loading={show.loading}
      ready={ready}
      actions={inLibrary ? (
        <ShowActions
          entity={show.data}
          metadata={metadata}
          episodes={episodes}
          ready={actionsReady}
          removeShow={remove}
          setMetadata={setMetadata}
        />
      ) : null}
    >
      {inLibrary && (
        <Proposals metadata={metadata} episodes={episodes || []} proceedRelease={proceedRelease} />
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
          inLibrary={inLibrary && !!episodes}
          ready={actionsReady}
          setEpisodesMetadata={setEpisodesMetadata}
        />
      )}
    </Details>
  )
}

export default withBody({ overlayScrollbars: true })(Show)
