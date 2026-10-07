import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@sensorr/i18n'
import { Bulk, ShowStateOptions } from '@sensorr/ui'
import { useBulkContext } from '../../contexts/Bulk/Bulk'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useListsAction } from '../Lists/useCustomLists'

const FOLLOWED = ShowStateOptions.find(({ value }) => value === 'followed')
const UNFOLLOWED = ShowStateOptions.find(({ value }) => value === 'unfollowed')

export const MOVIE_STATES = [
  { value: 'ignored', icon: '🔕', label: 'Ignored' },
  { value: 'wished', icon: '🍿', label: 'Wished' },
  { value: 'pinned', icon: '📍', label: 'Pinned' },
  { value: 'archived', icon: '📼', label: 'Archived' },
]

export const SHOW_STATES = [
  { value: true, icon: FOLLOWED.emoji, get label() { return FOLLOWED.label } },
  { value: false, icon: UNFOLLOWED.emoji, get label() { return UNFOLLOWED.label } },
]

export const movies = (count) => i18n.t('enhancers.bulk.movies', { count })
export const shows = (count) => i18n.t('enhancers.bulk.shows', { count })

export const withSelection = (WrappedComponent) => {
  const WithSelection = ({ entity, ...props }) => {
    const { selection, setSelection } = useBulkContext()
    const location = useLocation()

    return (
      <WrappedComponent
        {...props}
        entity={entity}
        // A placeholder has no id yet, so it gets no checkbox.
        selected={entity?.id ? !!selection[location.key]?.includes(entity.id) : null}
        selectedVisible={selection[location.key]?.length > 0}
        onSelectedChange={(id) => setSelection(selection => ({
          ...selection,
          [location.key]: selection[location.key]?.includes(id) ? selection[location.key]?.filter(v => v !== id) : [...(selection[location.key] || []), id],
        }))}
      />
    )
  }

  WithSelection.displayName = `withSelection(${WrappedComponent.displayName || WrappedComponent.type?.name || 'Component'})`
  return WithSelection
}

export const EntitiesBulk = ({ media }: { media: 'movie' | 'tv' }) => {
  const { t } = useTranslation()
  const { setMovieMetadata } = useMoviesMetadataContext() as any
  const { metadata: keptShows, setShowMetadata, followShow, setShowLists } = useShowsMetadataContext() as any
  const { selection, setSelection } = useBulkContext()
  const location = useLocation()
  const [sending, setSending] = useState(false)
  const selected = useMemo(() => selection[location.key] || [], [selection, location.key])
  const label = media === 'movie' ? movies(selected.length) : shows(selected.length)

  // The metadata contexts already tell a failure in their toast.
  // Without a question, the action asked already
  const apply = async (key, value, question) => {
    if (question && !window.confirm(question)) {
      return
    }

    setSending(true)

    if (media === 'movie') {
      await setMovieMetadata(selected, key, value).catch(() => null)
    } else {
      const kept = selected.filter(id => keptShows[id]?.state && (key === 'lists' || keptShows[id].state !== 'ignored'))
      await (kept.length ? setShowMetadata(kept, key, value) : Promise.resolve()).catch(() => null)

      // A show Sensorr does not keep yet is added from TMDB with its episodes, one at a time
      for (const id of selected.filter(id => !kept.includes(id))) {
        await (key === 'lists' ? setShowLists(id, (lists) => value({ lists })) : followShow(id, value)).catch(() => null)
      }
    }

    setSending(false)
  }

  const lists = useListsAction(media, apply, label)

  return (
    <Bulk
      count={selected.length}
      disabled={sending}
      onClear={() => setSelection(selection => ({ ...selection, [location.key]: [] }))}
      actions={[
        media === 'movie' ? {
          key: 'state',
          icon: '📚',
          label: t('enhancers.bulk.state'),
          options: MOVIE_STATES,
          onChange: ({ value, label: state }) => apply('state', value, t('enhancers.bulk.confirm', { selection: label, state })),
        } : {
          key: 'monitored',
          icon: '📚',
          label: t('enhancers.bulk.state'),
          options: SHOW_STATES,
          onChange: ({ value, label: state }) => apply('monitored', value, t('enhancers.bulk.confirm', { selection: label, state })),
        },
        lists,
      ]}
    />
  )
}

const withBulk = () => (WrappedComponent) => {
  const WithBulk = ({ bulk = null, child, ...props }: { bulk?: 'movie' | 'tv' | null, child: any, [key: string]: any }) => {
    const selectable = useMemo(() => bulk ? withSelection(child) : child, [bulk, child])

    return (
      <>
        <WrappedComponent {...props} child={selectable} />
        {!!bulk && <EntitiesBulk media={bulk} />}
      </>
    )
  }

  WithBulk.displayName = `withBulk(${WrappedComponent.displayName || WrappedComponent.type?.name || 'Component'})`
  return WithBulk
}

export default withBulk
