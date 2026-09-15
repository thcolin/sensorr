import { memo, useMemo } from 'react'
import oleoo from 'oleoo'
import { Badge, Icon, Link, Picture } from '@sensorr/ui'
import { emojize, filesize } from '@sensorr/utils'
import { formatDistanceToNowStrict } from 'date-fns'
import Tippy from '@tippyjs/react'
import { Release } from './Release'

const EMOJI = {
  'record': '📹',
  'refine': '✨',
  'shrink': '✂️',
  'sync': '💊',
  'keep-in-touch': '🍺',
}

// oleoo fields compared between the owned release and the proposed one, in the
// order they usually appear inside a release name.
const FIELDS = ['resolution', 'source', 'encoding', 'dub', 'language']

// Releases stored on the movie document carry no score: it is recomputed from the
// movie policy, exactly like the job does before comparing (ProcessMoviesTask.js:307).
export const scoreReleases = (releases, policy) => (typeof policy?.apply === 'function' ?
  policy.apply((releases || []).map(({ meta, ...release }) => ({ ...release, title: release.original })), null) :
  (releases || [])
)

// The owned side of the comparison is the best scored release of the movie
// document: `refine` and `shrink` compare against a synthetic pair built from
// every release (ProcessMoviesTask.js:307-311), which is not a real release.
export const pickOwnedRelease = (releases, policy) => {
  const owned = scoreReleases((releases || []).filter(({ proposal }) => !proposal), policy)

  return {
    release: owned.reduce((best, release) => (best && best.score >= release.score) ? best : release, null),
    others: Math.max(0, owned.length - 1),
  }
}

export const useReleaseDiff = (owned, proposed) => useMemo(() => {
  const left = owned?.title ? (owned.meta || oleoo.parse(owned.title, { strict: false, flagged: true })) : null
  const right = proposed?.title ? (proposed.meta || oleoo.parse(proposed.title, { strict: false, flagged: true })) : null

  return {
    changed: (left && right) ? FIELDS.filter(field => left[field] !== right[field]) : FIELDS,
    size: (typeof owned?.size === 'number' && typeof proposed?.size === 'number') ? proposed.size - owned.size : null,
    score: (typeof owned?.score === 'number' && typeof proposed?.score === 'number') ? proposed.score - owned.score : null,
    meta: { owned: left, proposed: right },
  }
}, [owned?.title, owned?.size, owned?.score, proposed?.title, proposed?.size, proposed?.score])

// Marks inside a release name only the values that differ from the other side,
// so the untouched ones prove nothing is lost without asking for attention.
const UIReleaseName = ({ entity = null, changed = [], meta = null, ...props }) => {
  const parts = useMemo(() => {
    const title = entity?.title || ''
    const values = changed
      .map(field => meta?.[field])
      .filter(value => value && typeof value === 'string')
      .map(value => ({ value, index: title.indexOf(value) }))
      .filter(({ index }) => index !== -1)
      .sort((a, b) => a.index - b.index)

    return values.reduce((acc, { value, index }) => (index < acc.cursor) ? acc : {
      cursor: index + value.length,
      nodes: [...acc.nodes, { text: title.slice(acc.cursor, index) }, { text: value, marked: true }],
    }, { cursor: 0, nodes: [] })
  }, [entity?.title, changed, meta])

  return (
    <code {...props} sx={UIReleaseName.styles.element} title={entity?.title}>
      {parts.nodes.map(({ text, marked }, index) => (
        <span key={index} sx={marked ? UIReleaseName.styles.marked : undefined}>{text}</span>
      ))}
      <span>{(entity?.title || '').slice(parts.cursor)}</span>
    </code>
  )
}

UIReleaseName.styles = {
  element: {
    display: 'block',
    color: 'grayDarker',
    fontSize: 6,
    lineHeight: 'normal',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  marked: {
    color: 'text',
    fontWeight: 'semibold',
    backgroundColor: 'gray',
    borderRadius: '0.25em',
    paddingX: 10,
  },
}

export const ReleaseName = memo(UIReleaseName)

const UIDelta = ({ value = null, unit = 'size', wanted = 'down', ...props }) => {
  if (value === null || value === 0) {
    return null
  }

  const good = wanted === 'down' ? value < 0 : value > 0

  return (
    <span {...props} sx={{ ...UIDelta.styles.element, color: good ? 'primary' : 'warning' }}>
      <code>
        {value > 0 ? '+' : '−'}
        {unit === 'size' ? filesize.stringify(Math.abs(value)) : Math.abs(value)}
      </code>
    </span>
  )
}

UIDelta.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'semibold',
    whiteSpace: 'nowrap',
    '>code': {
      fontSize: 6,
    },
  },
}

export const Delta = memo(UIDelta)

const UINotification = ({
  _id,
  timestamp,
  meta,
  metadata: raw = {} as any,
  enhance = null,
  selected = false,
  active = false,
  compact = false,
  onSelectedChange = null,
  onActiveChange = null,
  proceed = null,
  ...props
}) => {
  const metadata = useMemo(() => enhance ? enhance(meta?.movie, raw) : raw, [enhance, meta?.movie?.id, raw])

  const { release: owned, others } = useMemo(
    () => pickOwnedRelease(metadata?.releases, metadata?.policy),
    [metadata?.releases, metadata?.policy],
  )

  const comparable = ['record', 'refine', 'shrink'].includes(meta?.command) && !!meta?.release?.title
  const diff = useReleaseDiff(owned, meta?.release)
  const pending = comparable && meta?.release?.proposal && typeof meta?.choice !== 'boolean' && !meta?.treated

  return (
    <div
      sx={{
        ...UINotification.styles.element,
        ...(!meta?.seen ? { backgroundColor: 'grayLighter' } : {}),
        ...(active ? { backgroundColor: 'grayLight' } : {}),
      }}
      style={props.style}
    >
      {!meta?.seen && <span sx={UINotification.styles.unseen} />}
      {!!onSelectedChange && (
        <input
          type='checkbox'
          sx={UINotification.styles.checkbox}
          checked={selected}
          onChange={() => onSelectedChange(_id)}
          aria-label={`Select ${meta?.movie?.title}`}
        />
      )}
      <span sx={UINotification.styles.emoji} title={meta?.command}>
        {EMOJI[meta?.command]}
      </span>
      <button sx={UINotification.styles.body} onClick={() => onActiveChange && onActiveChange(_id)}>
        <span sx={UINotification.styles.head}>
          <span sx={UINotification.styles.title}>{meta?.movie?.title}</span>
          {!!others && (
            <span sx={UINotification.styles.others} title={`${others} other release${others > 1 ? 's' : ''} in your library`}>
              <code>+{others}</code>
            </span>
          )}
        </span>
        {comparable ? (
          <>
            {(!compact && !!owned?.title) && <ReleaseName entity={owned} changed={diff.changed} meta={diff.meta.owned} />}
            <ReleaseName entity={meta?.release} changed={diff.changed} meta={diff.meta.proposed} />
          </>
        ) : (
          <span sx={UINotification.styles.reason}>
            {{
              'sync': `Missing from your Plex Server`,
              'keep-in-touch': `Requested by ${(meta?.requested_by || []).join(', ')}`,
            }[meta?.command]}
          </span>
        )}
      </button>
      <span sx={UINotification.styles.deltas}>
        <Delta value={diff.size} unit='size' wanted={meta?.command === 'shrink' ? 'down' : 'up'} />
        {!compact && <Delta value={diff.score} unit='score' wanted='up' />}
      </span>
      {!compact && (
        <span sx={UINotification.styles.aside}>
          <Link to={`/jobs/${meta?.job}`} sx={UINotification.styles.job}>#{meta?.job}</Link>
          <span sx={UINotification.styles.timestamp}>
            {formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true })}
          </span>
        </span>
      )}
      <span sx={{ ...UINotification.styles.actions, ...(compact ? { display: 'none' } : {}) }}>
        {pending ? (
          <>
            <button sx={{ variant: 'button.reset' }} title='Accept' onClick={() => proceed(meta?.release, true)}>
              <Badge emoji={<Icon value='check' width='1em' height='1em' />} compact={true} size='normal' color='theme' />
            </button>
            <button sx={{ variant: 'button.reset' }} title='Refuse' onClick={() => proceed(meta?.release, false)}>
              <Badge emoji={<Icon value='clear' width='1em' height='1em' />} compact={true} size='normal' color='theme' />
            </button>
          </>
        ) : (
          <span sx={UINotification.styles.verdict} title={meta?.treated ? 'Treated' : undefined}>
            {meta?.choice === true ? '📼' : meta?.choice === false ? '❌' : ''}
          </span>
        )}
      </span>
    </div>
  )
}

UINotification.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    paddingX: 4,
    paddingY: 8,
    color: 'textLight',
    borderBottom: '1px solid',
    borderColor: 'gray',
    ':hover': {
      backgroundColor: 'grayLightest',
    },
  },
  unseen: {
    position: 'absolute',
    left: 11,
    display: 'block',
    backgroundColor: 'error',
    height: '0.5em',
    width: '0.5em',
    borderRadius: '0.25em',
  },
  checkbox: {
    flexShrink: 0,
    marginRight: 6,
    cursor: 'pointer',
  },
  emoji: {
    display: ['none', 'flex'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'gray',
    width: '2em',
    height: '2em',
    borderRadius: '1em',
    fontSize: 3,
    marginRight: 6,
  },
  body: {
    variant: 'button.reset',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
    overflow: 'hidden',
    textAlign: 'left',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: '100%',
    paddingBottom: 11,
  },
  title: {
    fontFamily: 'heading',
    fontWeight: 'bold',
    fontSize: 5,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  others: {
    marginLeft: 8,
    color: 'grayDarker',
    '>code': {
      fontSize: 7,
      fontWeight: 'semibold',
    },
  },
  reason: {
    color: 'grayDarker',
    fontSize: 6,
    fontWeight: 'semibold',
  },
  deltas: {
    display: ['none', 'flex'],
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: '6em',
    marginX: 6,
  },
  aside: {
    display: ['none', 'flex'],
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: '7em',
    color: 'grayDarker',
  },
  job: {
    fontSize: 7,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  timestamp: {
    marginTop: 11,
    fontSize: 7,
    fontWeight: 'semibold',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    minWidth: '5em',
    marginLeft: 6,
    '>button': {
      opacity: 0.75,
      transition: 'opacity 200ms ease',
      ':hover': {
        opacity: 1,
      },
    },
  },
  verdict: {
    fontSize: 4,
  },
}

export const Notification = memo(UINotification)

const UINotificationDetails = ({ entity = null, metadata: raw = {} as any, enhance = null, proceed = null, ban = null, ...props }) => {
  const meta = entity?.meta
  const metadata = useMemo(() => enhance ? enhance(meta?.movie, raw) : raw, [enhance, meta?.movie?.id, raw])
  const { release: owned } = useMemo(
    () => pickOwnedRelease(metadata?.releases, metadata?.policy),
    [metadata?.releases, metadata?.policy],
  )

  const owneds = useMemo(
    () => scoreReleases((metadata?.releases || []).filter(({ proposal }) => !proposal), metadata?.policy),
    [metadata?.releases, metadata?.policy],
  )

  if (!entity) {
    return (
      <div sx={UINotificationDetails.styles.empty}>
        <span>🔔</span>
        <span>Pick a notification to compare</span>
      </div>
    )
  }

  return (
    <div sx={UINotificationDetails.styles.element}>
      <div sx={UINotificationDetails.styles.movie}>
        <div sx={UINotificationDetails.styles.poster}>
          <Link to={`/movie/${meta?.movie?.id}`}>
            <Picture path={meta?.movie?.poster_path} size='w185' />
          </Link>
        </div>
        <div sx={UINotificationDetails.styles.head}>
          <span sx={UINotificationDetails.styles.title}>{meta?.movie?.title}</span>
          <span sx={UINotificationDetails.styles.subtitle}>
            {emojize(EMOJI[meta?.command], meta?.command)}
            <Link to={`/jobs/${meta?.job}`}>#{meta?.job}</Link>
            <span>{formatDistanceToNowStrict(new Date(entity?.timestamp), { addSuffix: true })}</span>
          </span>
        </div>
      </div>
      {['record', 'refine', 'shrink'].includes(meta?.command) ? (
        <>
          {!!owneds.length && (
            <div sx={UINotificationDetails.styles.side}>
              <span sx={UINotificationDetails.styles.label}>Current</span>
              {owneds.map(release => (
                <Release key={release.id} entity={release} display='column' compact={true} />
              ))}
            </div>
          )}
          <div sx={UINotificationDetails.styles.side}>
            <span sx={UINotificationDetails.styles.label}>Proposed</span>
            <Release
              entity={meta?.release}
              display='column'
              proceed={proceed}
              banned={(metadata?.banned_releases || []).includes(meta?.release?.title)}
              ban={ban}
            />
          </div>
        </>
      ) : (
        <div sx={UINotificationDetails.styles.side}>
          <span sx={UINotificationDetails.styles.label}>
            {{ 'sync': 'Plex', 'keep-in-touch': 'Requested by' }[meta?.command]}
          </span>
          <span sx={UINotificationDetails.styles.reason}>
            {meta?.command === 'sync' ? (
              metadata?.plex_url ? (
                <Tippy content={<code><small>{metadata.plex_url}</small></code>}>
                  <span>Missing from your Plex Server</span>
                </Tippy>
              ) : `Missing from your Plex Server`
            ) : (meta?.requested_by || []).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}

UINotificationDetails.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    paddingX: 4,
    paddingY: 2,
    overflowY: 'auto',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'grayDarker',
    '>span:first-of-type': {
      fontSize: 0,
      paddingBottom: 4,
    },
    '>span': {
      fontWeight: 'semibold',
    },
  },
  movie: {
    display: 'flex',
    alignItems: 'flex-start',
    paddingBottom: 2,
  },
  poster: {
    width: '6.5em',
    height: '10em',
    flexShrink: 0,
  },
  head: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 4,
    minWidth: 0,
  },
  title: {
    fontFamily: 'heading',
    fontWeight: 'bold',
    fontSize: 3,
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: 8,
    color: 'grayDarker',
    fontSize: 6,
    fontWeight: 'semibold',
    '>*:not(:last-child)': {
      marginRight: 6,
    },
  },
  side: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 4,
  },
  label: {
    color: 'grayDarker',
    fontSize: 7,
    fontWeight: 'semibold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    paddingBottom: 8,
  },
  reason: {
    fontSize: 6,
    fontWeight: 'semibold',
  },
}

export const NotificationDetails = memo(UINotificationDetails)
