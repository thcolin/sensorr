import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Badge, Button, Option, Sorting, Warning, withControls, useControlsState } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { compose, emojize, useHistoryState } from '@sensorr/utils'
import { useNotificationsContext } from '../../contexts/Notifications/Notifications'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { Notification, NotificationDetails } from '../../components/Sensorr/Notification'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import { withBody } from '../../layout/withLayout'

const COMMANDS = [
  { value: 'record', emoji: '📹', label: 'record' },
  { value: 'refine', emoji: '✨', label: 'refine' },
  { value: 'shrink', emoji: '✂️', label: 'shrink' },
  { value: 'sync', emoji: '💊', label: 'missing' },
  { value: 'keep-in-touch', emoji: '🍺', label: 'request' },
]

// A notification waits for a decision when it carries an untreated proposal, or
// when it is a `sync` / `keep-in-touch` entry nobody answered yet.
const isPending = (notification) => (
  ['record', 'refine', 'shrink'].includes(notification.meta?.command) ?
    (notification.meta?.release?.proposal && !notification.meta?.treated && typeof notification.meta?.choice !== 'boolean') :
    typeof notification.meta?.choice !== 'boolean'
)

const SCOPES = {
  pending: { label: 'To treat', filter: isPending },
  unseen: { label: 'Unread', filter: (notification) => !notification.meta?.seen },
  all: { label: 'All', filter: () => true },
}

const SORTINGS = {
  timestamp: (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  title: (a, b) => (a.meta?.movie?.title || '').localeCompare(b.meta?.movie?.title || ''),
  size: (a, b) => (a.meta?.release?.size || 0) - (b.meta?.release?.size || 0),
  score: (a, b) => (b.meta?.release?.score || 0) - (a.meta?.release?.score || 0),
}

// Page-wide state the green Nav fields need but `withControls` does not hand
// them: it only forwards `fields[name].props`, which is frozen at module level.
// Library solves the same problem with `useBulkContext` (Library.tsx:219).
const pageContext = createContext({} as any)
const usePageContext = () => useContext(pageContext)

const UINotificationsList = ({ entities, loading, ready, ...props }) => {
  const ref = useRef(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const { dismissNotifications, answerNotification } = useNotificationsContext() as any
  const { metadata: moviesMetadata, setMovieMetadata, enhanceMovieMetadata } = useMoviesMetadataContext() as any
  const { selection, setSelection } = usePageContext()
  const [active, setActive] = useState(null)

  const entity = useMemo(() => entities.find(({ _id }) => _id === active) || null, [entities, active])

  const proceed = useCallback((id, notification, release, choice) => {
    setMovieMetadata(id, 'proposal', release?.id ? { id: release.id, choice } : choice)
    answerNotification(notification, choice)
  }, [setMovieMetadata, answerNotification])

  const rowVirtualizer = useVirtualizer({
    count: entities.length,
    getScrollElement: () => document.getElementById('body'),
    estimateSize: () => 64,
    getItemKey: (index) => entities[index]?._id ?? index,
    overscan: 8,
    scrollMargin,
  })

  // The green Nav scrolls above the list inside the same scroll container, so the
  // virtualized list starts at a non-zero offset. Keep `scrollMargin` in sync with it.
  useLayoutEffect(() => {
    const element = ref.current as HTMLElement

    if (!element) {
      return
    }

    const compute = () => setScrollMargin(element.offsetTop)
    compute()

    const observer = new ResizeObserver(compute)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ready, loading])

  if (!ready || loading) {
    return (
      <div sx={UINotificationsList.styles.placeholder}>
        {Array(12).fill(null).map((foo, index) => <div key={index} />)}
      </div>
    )
  }

  if (!entities.length) {
    return (
      <Warning
        emoji='🔔'
        title='Nothing to treat'
        subtitle='Proposals only show up when a job runs with "proposalOnly" enabled'
      />
    )
  }

  return (
    <div sx={UINotificationsList.styles.element}>
      <div ref={ref} sx={{ ...UINotificationsList.styles.list, ...(entity ? UINotificationsList.styles.narrow : {}) }}>
        <div sx={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map(virtualItem => {
            const notification = entities[virtualItem.index]

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
                }}
              >
                <Notification
                  {...notification}
                  metadata={moviesMetadata[notification.meta?.movie?.id] || {}}
                  enhance={enhanceMovieMetadata}
                  selected={selection.includes(notification._id)}
                  active={active === notification._id}
                  compact={!!entity}
                  onSelectedChange={(id) => setSelection(selection => selection.includes(id) ? selection.filter(v => v !== id) : [...selection, id])}
                  onActiveChange={(id) => {
                    setActive(current => current === id ? null : id)

                    if (!notification.meta?.seen) {
                      dismissNotifications([id])
                    }
                  }}
                  proceed={(release, choice) => proceed(notification.meta?.movie?.id, notification._id, release, choice)}
                />
              </div>
            )
          })}
        </div>
      </div>
      {!!entity && (
        <div sx={UINotificationsList.styles.details}>
          <NotificationDetails
            entity={entity}
            metadata={moviesMetadata[entity.meta?.movie?.id] || {}}
            enhance={enhanceMovieMetadata}
            proceed={(release, choice) => proceed(entity.meta?.movie?.id, entity._id, release, choice)}
            ban={() => setMovieMetadata(
              entity.meta?.movie?.id,
              'banned_releases',
              (moviesMetadata[entity.meta?.movie?.id]?.banned_releases || []).includes(entity.meta?.release?.title) ?
                (moviesMetadata[entity.meta?.movie?.id]?.banned_releases || []).filter(title => title !== entity.meta?.release?.title) :
                [...(moviesMetadata[entity.meta?.movie?.id]?.banned_releases || []), entity.meta?.release?.title]
            )}
          />
        </div>
      )}
    </div>
  )
}

UINotificationsList.styles = {
  element: {
    display: 'flex',
    alignItems: 'flex-start',
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
    minWidth: 0,
  },
  narrow: {
    flex: 'unset',
    width: ['100%', '24em'],
    borderRight: '1px solid',
    borderColor: 'gray',
  },
  details: {
    display: ['none', 'block'],
    flex: 1,
    position: 'sticky',
    top: 0,
    minWidth: 0,
    maxHeight: '100vh',
    overflowY: 'auto',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    '>div': {
      height: '64px',
      backgroundColor: 'grayLighter',
      borderBottom: '1px solid',
      borderColor: 'gray',
    },
  },
}

// Notifications live in a global SSE context, not behind a paginated query, so
// scope, category and sorting are all applied in memory on the raw values.
const withNotifications = () => (WrappedComponent) => {
  const withNotifications = (props) => {
    const { notifications, loading, dismissNotifications } = useNotificationsContext() as any
    const [serialized, controls] = useControlsState(() => useHistoryState('controls', { values: {} }) as any)
    const [selection, setSelection] = useState([])

    const values = (controls as any)?.values || {}
    const scope = SCOPES[values.scope] ? values.scope : 'pending'
    const commands = Array.isArray(values.commands) ? values.commands : []
    const sorting = SORTINGS[values.sort_by?.value] ? values.sort_by.value : 'timestamp'

    const scoped = useMemo(() => notifications.filter(SCOPES[scope].filter), [notifications, scope])

    const entities = useMemo(() => scoped
      .filter(notification => !commands.length || commands.includes(notification.meta?.command))
      .sort(SORTINGS[sorting])
    , [scoped, JSON.stringify(commands), sorting])

    const unseen = useMemo(() => notifications.filter(({ meta }) => !meta?.seen).map(({ _id }) => _id), [notifications])

    useEffect(() => {
      setSelection(selection => selection.filter(id => entities.some(({ _id }) => _id === id)))
    }, [entities])

    const value = useMemo(
      () => ({ selection, setSelection, scoped, entities, unseen, dismissNotifications }),
      [selection, scoped, entities, unseen, dismissNotifications],
    )

    return (
      <pageContext.Provider value={value}>
        <WrappedComponent
          {...props}
          controls={controls}
          entities={entities}
          length={entities.length}
          loading={loading}
          ready={!loading}
        />
      </pageContext.Provider>
    )
  }

  withNotifications.displayName = `withNotifications(${(WrappedComponent as any).displayName || 'Component'})`
  return withNotifications
}

const Scope = ({ value, onChange, style, ...props }) => (
  <div style={style} sx={Scope.styles.element}>
    {Object.keys(SCOPES).map(key => (
      <button
        key={key}
        type='button'
        sx={{ ...Scope.styles.button, opacity: (SCOPES[value] ? value : 'pending') === key ? 1 : 0.5 }}
        onClick={() => onChange(key)}
      >
        {SCOPES[key].label}
      </button>
    ))}
  </div>
)

Scope.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    variant: 'button.reset',
    paddingX: 6,
    fontWeight: 'semibold',
    whiteSpace: 'nowrap',
  },
}

const Commands = ({ value, onChange, style, ...props }) => {
  const { scoped } = usePageContext()
  const values = Array.isArray(value) ? value : []

  return (
    <div style={style} sx={{ display: 'flex', alignItems: 'center' }}>
      {COMMANDS.map(command => {
        const total = (scoped || []).filter(notification => notification.meta?.command === command.value).length
        const selected = values.includes(command.value)

        return (
          <button
            key={command.value}
            type='button'
            title={command.label}
            disabled={!total}
            sx={{ variant: 'button.reset', paddingX: 10, opacity: (!values.length || selected) && total ? 1 : 0.4 }}
            onClick={() => onChange(selected ? values.filter(v => v !== command.value) : [...values, command.value])}
          >
            <Badge emoji={command.emoji} label={total} compact={true} size='small' color='theme' />
          </button>
        )
      })}
    </div>
  )
}

const Bulk = ({ style, ...props }) => {
  const { selection, setSelection, entities, unseen, dismissNotifications } = usePageContext()

  return (
    <div style={style} sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      <Option
        id='notifications'
        type='checkbox'
        checked={!!selection.length}
        onChange={() => setSelection(selection.length ? [] : entities.map(({ _id }) => _id))}
      >
        {!selection.length ? 'Select All' : selection.length === entities.length ? 'Unselect All' : `${selection.length} Selected`}
      </Option>
      {!!unseen.length && (
        <Button
          variant='outline'
          color='white'
          type='button'
          sx={{ marginLeft: 4 }}
          onClick={() => {
            if (confirm(`Mark all ${unseen.length} notification${unseen.length > 1 ? 's' : ''} as read ?`)) {
              dismissNotifications(unseen)
            }
          }}
        >
          Mark all as read
        </Button>
      )}
    </div>
  )
}

const Notifications = compose(
  withTitle('Notifications'),
  withNotifications(),
  withControls({
    title: 'Notifications',
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['min-content 1fr min-content', 'min-content min-content min-content 1fr min-content'],
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: [
          `"scope commands sort_by"`,
          `"title scope commands bulk sort_by"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
    },
    components: {
      bulk: Bulk,
    },
    fields: {
      scope: {
        initial: 'pending',
        serialize: () => ({}),
        component: Scope,
      },
      commands: {
        initial: [],
        serialize: () => ({}),
        component: Commands,
      },
      sort_by: {
        initial: { value: 'timestamp', sort: true },
        serialize: () => ({}),
        component: withProps({
          label: i18n.t('ui.sorting'),
          options: [
            { label: emojize('🕗', 'Recent'), value: 'timestamp' },
            { label: emojize('📦', 'Size'), value: 'size' },
            { label: emojize('💯', 'Score'), value: 'score' },
            { label: emojize('🔠', 'Title'), value: 'title' },
          ],
        })(Sorting),
      },
    },
    useStatistics: () => ({}),
  }),
  withBody(),
)(UINotificationsList)

export default Notifications
