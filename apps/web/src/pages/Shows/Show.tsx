import { useCallback, useEffect, useState } from 'react'
import { transformShowDetails, Warning } from '@sensorr/ui'
import { useTitle } from '@sensorr/utils'
import { useParams } from 'react-router'
import { useTMDBRequest } from '../../store/tmdb'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'
import { withBody } from '../../layout/withLayout'
import Details from '../Details/Details'
import { ShowActions } from './components/Actions'
import { Proposals } from './components/Proposals'
import { Seasons } from './components/Seasons'

// A show with a document in Sensorr, ignored aside, is in the library: its episodes come from the API
const Show = ({ ...props }) => {
  const { restoreScrollPosition } = useScrollPositionContext()
  const { id } = useParams() as any
  const {
    loading: metadataLoading,
    metadata: { [id]: metadata },
    episodes: { [id]: episodes },
    loadEpisodes,
    setShowMetadata,
    setEpisodesMetadata,
    addShow,
    removeShow,
  } = useShowsMetadataContext() as any
  const [episodesError, setEpisodesError] = useState(null)

  const show = useTMDBRequest(`tv/${id}`, {
    append_to_response: 'videos,external_ids',
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
  const add = useCallback(() => addShow(Number(id)), [id])
  const remove = useCallback(() => removeShow(Number(id)), [id])

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
      metadata={metadata}
      behavior='tv'
      tabs={[]}
      loading={show.loading}
      ready={ready}
      actions={(
        <ShowActions
          entity={show.data}
          metadata={metadata}
          episodes={episodes}
          inLibrary={inLibrary}
          ready={actionsReady}
          addShow={add}
          removeShow={remove}
          setMetadata={setMetadata}
        />
      )}
    >
      {inLibrary && (
        <Proposals metadata={metadata} proceedRelease={proceedRelease} />
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
