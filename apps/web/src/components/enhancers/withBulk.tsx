import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bulk, ShowStateOptions } from '@sensorr/ui'
import { useBulkContext } from '../../contexts/Bulk/Bulk'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useListsAction } from '../Lists/useCustomLists'

const FOLLOWED = ShowStateOptions.find(({ value }) => value === 'followed')
const UNFOLLOWED = ShowStateOptions.find(({ value }) => value === 'unfollowed')

export const movies = (count) => `${count} ${count === 1 ? 'movie' : 'movies'}`
export const shows = (count) => `${count} ${count === 1 ? 'show' : 'shows'}`

// A grid's child gets its checkbox, the selection is kept per page in the bulk context
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

// The bar of a grid without the Library's filters: what can be done to movies or shows Sensorr may not keep yet
export const EntitiesBulk = ({ media }: { media: 'movie' | 'tv' }) => {
  const { setMovieMetadata } = useMoviesMetadataContext() as any
  const { followShow, setShowLists } = useShowsMetadataContext() as any
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
      // A show Sensorr does not keep yet is added from TMDB with its episodes, one at a time
      for (const id of selected) {
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
          label: 'State',
          options: [
            { value: 'ignored', icon: '🔕', label: 'Ignored' },
            { value: 'wished', icon: '🍿', label: 'Wished' },
            { value: 'pinned', icon: '📍', label: 'Pinned' },
            { value: 'archived', icon: '📼', label: 'Archived' },
          ],
          onChange: ({ value }) => apply('state', value, `Do you want to change ${label} state to "${value}" ?`),
        } : {
          key: 'monitored',
          icon: '📚',
          label: 'State',
          options: [
            { value: true, icon: FOLLOWED.emoji, label: FOLLOWED.label },
            { value: false, icon: UNFOLLOWED.emoji, label: UNFOLLOWED.label },
          ],
          onChange: ({ value, label: state }) => apply('monitored', value, `Do you want to change the state of ${label} to "${state}"?`),
        },
        lists,
      ]}
    />
  )
}

// A page whose grid lists movies or shows, as `bulk` says, checks them and acts on them with the bar
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
