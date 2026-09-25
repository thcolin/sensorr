import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Option, Guests, Icon, Link, MovieState, Pane, Picture, ShowState, Warning } from '@sensorr/ui'
import toast from 'react-hot-toast'
import { coverageLabel, jobNameOf, levelOf } from '@sensorr/sensorr'
import { emojize, filesize } from '@sensorr/utils'
import useRipple from 'use-ripple-hook'
import Tippy from '@tippyjs/react'
import usePortal from 'react-useportal'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'
import { formatDistanceToNowStrict } from 'date-fns'
import { useNotificationsContext } from '../../../contexts/Notifications/Notifications'
import { useMoviesMetadataContext } from '../../../contexts/MoviesMetadata/MoviesMetadata'
import { showStateOf, useShowsMetadataContext } from '../../../contexts/ShowsMetadata/ShowsMetadata'
import { useGuestsContext } from '../../../contexts/Guests/Guests'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { CommandTabs } from '../../../components/Sensorr/CommandTabs'
import { safeUrl } from '../../../components/Sensorr/Release'
import { swapLabelOf } from '../../../components/Sensorr/Proposal'

// Keyed by `jobNameOf`
const COMMANDS = {
  'record movies': { emoji: '📹', label: 'record movies' },
  'refine movies': { emoji: '✨', label: 'refine movies' },
  'shrink movies': { emoji: '✂️', label: 'shrink movies' },
  'report movies': { emoji: '🚩', label: 'report movies' },
  'sync movies': { emoji: '💊', label: 'missing' },
  'keep-in-touch': { emoji: '🍺', label: 'request' },
  'record shows': { emoji: '📹', label: 'record shows' },
  'airing shows': { emoji: '📡', label: 'airing shows' },
  'sync shows': { emoji: '💊', label: 'missing episodes' },
}

const UINotifications = ({ ...props }) => {
  const { pwa } = useDeviceContext()
  const ref = useRef()
  const [pointerRef, onPointerDown] = useRipple()
  const { Portal, togglePortal, closePortal, isOpen: open } = usePortal({ closeOnOutsideClick: false, closeOnEsc: true })
  const { notifications: all, loading, dismissNotifications, subscribable, subscribed, toggleNotificationsSubscription } = useNotificationsContext() as any
  const { metadata } = useMoviesMetadataContext() as any
  const { metadata: showsMetadata } = useShowsMetadataContext() as any
  const notifications = useMemo(() => all.filter(notification => !(
    notification.meta?.command === 'keep-in-touch' &&
    typeof notification.meta?.choice === 'undefined' &&
    (notification.meta?.type === 'show' ? showsMetadata[notification.meta.show.id] : metadata[notification.meta?.movie?.id])?.state === 'archived'
  )), [all, metadata, showsMetadata])
  const unseen = useMemo(() => notifications.filter(notification => !notification.meta?.seen).map(notification => notification._id), [notifications])
  const [filter, setFilter] = useState(null)
  const filtered = useMemo(() => notifications.filter(notification => !filter || jobNameOf(notification.meta) === filter), [notifications, filter])
  const options = useMemo(() => Object.keys(COMMANDS)
    .filter(name => name === filter || notifications.some(notification => jobNameOf(notification.meta) === name))
    .map(name => ({ value: name, ...COMMANDS[name], count: notifications.filter(notification => jobNameOf(notification.meta) === name).length })), [notifications, filter])

  useEffect(() => {
    if (open && navigator.clearAppBadge) {
      navigator.clearAppBadge()
    }
  }, [open])

  return (
    <>
      <button {...(pwa ? { ref: pointerRef, onPointerDown } : {})} onClick={togglePortal} sx={UINotifications.styles.button} disabled={loading}>
        {!!unseen.length && <span>{unseen.length}</span>}
        🔔
      </button>
      <Portal>
        <Pane position='right' width='40em' background='grayLightest' open={open} toggleOpen={togglePortal}>
          <div sx={UINotifications.styles.element}>
            <span>
              <span>
                <span>
                  <h2>Notifications</h2>
                  <button
                    title={!subscribable ? 'Push Notifications unavailable' : subscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
                    onClick={(e) => toggleNotificationsSubscription(e)}
                    disabled={!subscribable}
                  >
                    {subscribed ? '🔔' : '🔕'}
                  </button>
                  {!!unseen.length && (
                    <span
                      role='button'
                      title='Mark all as read'
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (confirm(`Mark all ${unseen.length} notification${unseen.length > 1 ? 's' : ''} as read ?`)) {
                          dismissNotifications(unseen)
                        }
                      }}
                    >
                      {unseen.length}
                    </span>
                  )}
                </span>
              </span>
              <button onClick={() => closePortal()}>
                <Icon value='clear' active={true} height='1.25em' width='1.25em' />
              </button>
            </span>
            <div ref={ref} sx={UINotifications.styles.container}>
              <CommandTabs options={options} all={notifications.length} value={filter} onChange={setFilter} />
              {filtered.length ? (
                <div>
                  <ResponsiveVirtualGrid
                    total={filtered.length}
                    cell={{ height: 240 }}
                    child={Notification}
                    childProps={{ closePortal }}
                    viewportOffset={10}
                    scrollContainer={ref.current}
                    scrollDirection={'vertical'}
                    useChildProps={(key) => ({
                      key: filtered[key.split('-').shift()]?._id,
                      ...filtered[key.split('-').shift()],
                    })}
                  />
                </div>
              ) : (
                filter ? (
                  <Warning emoji='🔔' title='No match' subtitle={`No ${COMMANDS[filter]?.label || filter} notification`}>
                    <Button variant='outline' color='gray' onClick={() => setFilter(null)}>Show all</Button>
                  </Warning>
                ) : (
                  <Warning emoji='🔔' title='Up to date' subtitle='No notifications yet' />
                )
              )}
            </div>
          </div>
        </Pane>
      </Portal>
    </>
  )
}

UINotifications.styles = {
  button: {
    variant: 'button.reset',
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '4rem',
    fontSize: 2,
    color: 'whitePure',
    '>span': {
      marginTop: '-0.25em',
      paddingX: 8,
      paddingY: 10,
      fontSize: 8,
      fontWeight: 'bold',
      backgroundColor: 'error',
      borderRadius: '1em',
    },
  },
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'grayLightest',
    '>span': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'primary',
      padding: 2,
      paddingBottom: 8,
      '>span': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        '>span': {
          display: 'flex',
          alignItems: 'flex-start',
          '>h2': {
            variant: 'heading.default',
            color: 'whitePure',
            padding: 12,
            margin: 12,
          },
          '>span': {
            marginLeft: 8,
            paddingX: 8,
            paddingY: 10,
            fontSize: 4,
            fontWeight: 'bold',
            backgroundColor: 'error',
            borderRadius: '1em',
          },
          '>button': {
            variant: 'button.reset',
            marginLeft: 8,
            fontSize: 1,
            alignSelf: 'center',
            ':disabled': {
              opacity: 0.8,
            },
          },
        },
        '>button': {
          variant: 'button.reset',
          fontSize: 6,
          ':disabled': {
            opacity: 0.8,
          },
        },
      },
      '>button': {
        variant: 'button.reset',
        display: ['flex', 'none'],
        padding: 8,
        '>svg': {
          color: 'whitePure',
        },
      },
    },
  },
  container: {
    flex: 1,
    overflow: 'auto',
    paddingBottom: 2,
  },
  push: {
    display: 'flex',
    backgroundColor: 'primaryDarkest',
    '>button': {
      variant: 'button.reset',
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      '>span': {
        fontSize: 6,
        marginLeft: 4,
      },
    },
  },
}

export const Notifications = memo(UINotifications)

const Notification = (props) => props.meta?.type === 'show' ? <ShowNotification {...props} /> : <MovieNotification {...props} />

const NotificationFrame = ({ _id, timestamp, meta, closePortal, style, to, poster, heading, children }) => {
  const { dismissNotifications } = useNotificationsContext() as any

  return (
    <div sx={{ paddingX: 4, overflow: 'hidden', color: 'textLight', ...(!meta?.seen ? { backgroundColor: 'grayLighter' } : {}) }} onMouseEnter={() => meta?.seen ? {} : dismissNotifications([_id])} style={{ ...style, width: '100%' }}>
      <div sx={{ position: 'relative', display: 'flex', height: '240px', alignItems: 'center', paddingY: 4, borderBottom: '1px solid', borderColor: 'gray' }}>
        {!meta?.seen && (
          <span sx={{ position: 'absolute', top: '0.5em', display: 'block', backgroundColor: 'error', height: '0.5em', width: '0.5em', borderRadius: '0.25em' }}></span>
        )}
        <span sx={{ display: ['none', 'flex'], alignItems: 'center', justifyContent: 'center', backgroundColor: 'gray', width: '2em', height: '2em', padding: 8, borderRadius: '1em', fontSize: 3, marginRight: 6 }}>
          {COMMANDS[jobNameOf(meta)]?.emoji}
        </span>
        <div sx={{ display: 'flex', alignItems: 'center' }}>
          <div sx={{ width: '6.5em', height: '10em', flexShrink: 0 }}>
            <Link to={to} onClick={() => closePortal()}>
              <Picture path={poster} size='w185' />
            </Link>
          </div>
        </div>
        <div sx={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 4, alignSelf: 'stretch', overflow: 'hidden' }}>
          <div sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'grayDarker' }}>
            <span sx={{ fontSize: 6, fontWeight: 'semibold' }}>
              {heading}
            </span>
            <span sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span sx={{ fontSize: 7, fontWeight: 'semibold', whiteSpace: 'nowrap' }}>
                {formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true })}
              </span>
              <Link to={`/jobs/${meta?.job}`} onClick={() => closePortal()} sx={{ marginTop: 10, fontSize: 7, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                #{meta?.job}
              </Link>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

const MovieNotification = ({ _id, timestamp, meta, closePortal, ...props }) => {
  const { answerNotification } = useNotificationsContext() as any
  const { loading, metadata: { [meta?.movie?.id]: metadata = {} }, setMovieMetadata } = useMoviesMetadataContext() as any
  const { guests } = useGuestsContext() as any

  const choice = useMemo(() => {
    if (typeof meta?.choice !== 'undefined') {
      return meta?.choice
    }

    if (meta?.command === 'sync') {
      return (
        loading ? null :
        metadata.state === 'missing' ? null :
        metadata.state === 'ignored' ? false : true
      )
    }

    if (meta?.command === 'keep-in-touch') {
      return (
        loading ? null :
        (metadata.state === 'wished' || metadata.state == 'archived') ? true : null
      )
    }

    return null
  }, [meta?.choice, meta?.command, loading, metadata.state])

  return (
    <NotificationFrame
      _id={_id}
      timestamp={timestamp}
      meta={meta}
      closePortal={closePortal}
      style={props.style}
      to={`/movie/${meta?.movie?.id}`}
      poster={meta?.movie?.poster_path}
      heading={{
        'record': meta?.release?.proposal ? `Movie record proposal` : `Movie recorded`,
        'refine': meta?.release?.proposal ? `Movie refine proposal` : `Movie refined`,
        'shrink': meta?.release?.proposal ? `Movie shrink proposal` : `Movie shrinked`,
        'report': meta?.release?.proposal ? `Report proposal` : `Reported movie, replacement downloaded`,
        'sync': `Movie missing from your Plex Server`,
        'keep-in-touch': `Movie request`,
      }[meta?.command]}
    >
      <div sx={{ display: 'flex', alignItems: 'center', paddingY: 10 }}>
        <span sx={{ fontSize: 6, marginRight: 6 }}>
          <MovieState
            value={(loading ? 'loading' : metadata.state) || 'ignored'}
            onChange={state => setMovieMetadata(meta?.movie?.id, 'state', state)}
            compact={true}
          />
        </span>
        <span sx={{ fontFamily: 'heading', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta?.movie?.title}</span>
      </div>
      <div sx={{ display: 'flex', alignItems: 'center', fontWeight: 'semibold', color: 'grayDarker' }}>
        <span sx={{ fontSize: 6 }}>
          {{
            'record': meta?.release?.proposal ? `Release proposal` : `Release`,
            'refine': meta?.release?.proposal ? `Release proposal` : `Release`,
            'shrink': meta?.release?.proposal ? `Release proposal` : `Release`,
            'report': meta?.release?.proposal ? `Release proposal` : `Release`,
            'sync': `Do you want to fix it ?`,
            'keep-in-touch': `Requested by`,
          }[meta?.command]}
        </span>
      </div>
      {['record', 'refine', 'shrink', 'report'].includes(meta?.command) && (
        <div sx={{ marginTop: 8 }}>
          <NotificationRelease release={meta?.release} />
          <div sx={{ display: 'flex', marginTop: '1em', '>button': { flex: 1, ...((choice === null || choice === false) ? { ':first-of-type': { marginRight: 8 }, ':last-of-type': { marginLeft: 8 } } : {}) } }}>
            {meta?.release?.proposal ? (
              <>
                {(choice === null || choice === true) && (
                  <Button
                    variant='contain'
                    color={(loading || choice !== null) ? 'gray' : 'primary'}
                    disabled={loading || choice !== null}
                    onClick={() => {
                      setMovieMetadata(meta?.movie?.id, 'proposal', meta?.release?.id ? { id: meta.release.id, choice: true } : true)
                      answerNotification(_id, true)
                    }}
                  >
                    {choice === null ? 'Accept' : 'Accepted'}
                  </Button>
                )}
                {(choice === null || choice === false) && (
                  <Button
                    variant={choice === null ? 'outline' : 'contain'}
                    color={(loading || choice !== null) ? 'gray' : 'primary'}
                    disabled={loading || choice !== null}
                    onClick={() => {
                      setMovieMetadata(meta?.movie?.id, 'proposal', meta?.release?.id ? { id: meta.release.id, choice: false } : false)
                      answerNotification(_id, false)
                    }}
                  >
                    {choice === null ? 'Refuse' : 'Refused'}
                  </Button>
                )}
                {(choice === false) && (
                  <Button
                    variant={!(metadata.banned_releases || []).includes(meta?.release?.title) ? 'outline' : 'contain'}
                    color={(loading || (metadata.banned_releases || []).includes(meta?.release?.title)) ? 'gray' : 'primary'}
                    disabled={loading || (metadata.banned_releases || []).includes(meta?.release?.title)}
                    onClick={() => setMovieMetadata(
                      meta?.movie?.id,
                      'banned_releases',
                      [...(metadata?.banned_releases || []), meta?.release?.title]
                    )}
                  >
                    {!(metadata.banned_releases || []).includes(meta?.release?.title) ? 'Ban' : 'Banned'}
                  </Button>
                )}
              </>
            ) : (
              <Button variant='contain' color='gray' disabled={true}>Downloaded</Button>
            )}
          </div>
        </div>
      )}
      {/* {meta?.command === 'refine' && (
        <Release entity={meta?.release} display='column' proceed={() => {}} />
      )} */}
      {/* {meta?.command === 'shrink' && (
        <Release entity={meta?.release} display='column' proceed={() => {}} />
      )} */}
      {meta?.command === 'sync' && (
        <div sx={{ display: 'flex', marginTop: 4, '>button': { flex: 1, ...(choice === null ? { ':first-of-type': { marginRight: 8 }, ':last-of-type': { marginLeft: 8 } } : {}) } }}>
          {(choice === null || choice === true) && (
            <Button
              variant='contain'
              color={(loading || choice !== null) ? 'gray' : 'primary'}
              disabled={loading || choice !== null}
              onClick={() => {
                setMovieMetadata(meta?.movie?.id, 'state', 'wished')
                answerNotification(_id, true)
              }}
            >
              {choice === null ? '"Wish" it back' : 'Fixed'}
            </Button>
          )}
          {(choice === null || choice === false) && (
            <Button
              variant={choice === null ? 'outline' : 'contain'}
              color={(loading || choice !== null) ? 'gray' : 'primary'}
              disabled={loading || choice !== null}
              onClick={() => answerNotification(_id, false)}
            >
              {choice === null ? 'Ignore' : 'Ignored'}
            </Button>
          )}
        </div>
      )}
      {meta?.command === 'keep-in-touch' && (
        <div sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginTop: 8, fontSize: '1rem' }}>
          <div sx={{ flex: 1, marginRight: 4, marginBottom: 3, fontSize: 9 }}>
            <Guests
              childProps={{ onClick: () => closePortal() }}
              guests={meta?.requested_by.map(guest => ({
                entity: { id: 0, name: guests[guest].name, override: guests[guest].email, profile_path: guests[guest].avatar }
              }))}
            />
          </div>
          <div sx={{ display: 'flex', marginTop: 4, '>button': { flex: 1, ...(choice === null ? { ':first-of-type': { marginRight: 8 }, ':last-of-type': { marginLeft: 8 } } : {}) } }}>
            {(choice === null || choice === true) && (
              <Button
                variant='contain'
                color={(loading || choice !== null) ? 'gray' : 'primary'}
                disabled={loading || choice !== null}
                onClick={() => {
                  setMovieMetadata(meta?.movie?.id, 'state', 'wished')
                  answerNotification(_id, true)
                }}
              >
                {choice === null ? '"Wish" it' : ({ archived: 'Archived', wished: 'Wished' }[metadata.state] || 'Loading')}
              </Button>
            )}
            {(choice === null || choice === false) && (
              <Button
                variant={choice === null ? 'outline' : 'contain'}
                color={(loading || choice !== null) ? 'gray' : 'primary'}
                disabled={loading || choice !== null}
                onClick={() => answerNotification(_id, false)}
              >
                {choice === null ? 'Ignore' : 'Ignored'}
              </Button>
            )}
          </div>
        </div>
      )}
    </NotificationFrame>
  )
}

const ShowNotification = ({ _id, timestamp, meta, closePortal, ...props }) => {
  const { answerNotification } = useNotificationsContext() as any
  const { loading, metadata: { [meta?.show?.id]: metadata = {} }, setShowMetadata, followShow, setShowState } = useShowsMetadataContext() as any
  const { guests } = useGuestsContext() as any
  const [following, setFollowing] = useState(false)
  const label = useMemo(() => (
    meta?.command === 'sync' ? `${meta?.missing} episode${meta?.missing > 1 ? 's' : ''}` :
    meta?.release?.coverage?.length ? coverageLabel(meta.release.coverage, levelOf(meta.release.meta, meta.release.category) || undefined) : ''
  ), [meta?.command, meta?.missing, meta?.release])
  const stored = (metadata.releases || []).find(release => release.id === meta?.release?.id)
  const banned = (metadata.banned_releases || []).includes(meta?.release?.title)

  const choice = useMemo(() => {
    if (typeof meta?.choice !== 'undefined') {
      return meta?.choice
    }

    if (loading) {
      return null
    }

    if (meta?.command === 'keep-in-touch') {
      return (metadata.state === 'wished' || metadata.state === 'archived') ? true : null
    }

    if (meta?.command === 'sync') {
      return null
    }

    return stored?.proposal ? null : stored ? true : false
  }, [meta?.choice, meta?.command, loading, metadata.state, stored])

  // `setShowMetadata` reverts on failure but tells nothing for a single show, so the card says it
  const answer = async (choice) => {
    answerNotification(_id, choice)

    try {
      await setShowMetadata(meta?.show?.id, 'proposal', { id: meta?.release?.id, choice })
    } catch {
      answerNotification(_id, undefined)
      toast.error('Error while answering the proposal')
    }
  }

  // `followShow` toasts a show it adds to the library, not one already there
  const followError = () => (metadata.state && metadata.state !== 'ignored') && toast.error('Error while following the show')

  const follow = async () => {
    setFollowing(true)

    try {
      await followShow(meta?.show?.id, true)
      answerNotification(_id, true)
    } catch {
      followError()
    }

    setFollowing(false)
  }

  const toggleFollow = (state) => setShowState(meta?.show?.id, state).catch(followError)

  const ban = () => setShowMetadata(meta?.show?.id, 'banned_releases', [...(metadata.banned_releases || []), meta?.release?.title])
    .catch(() => toast.error('Error while banning the release'))

  return (
    <NotificationFrame
      _id={_id}
      timestamp={timestamp}
      meta={meta}
      closePortal={closePortal}
      style={props.style}
      to={`/tv/${meta?.show?.id}`}
      poster={meta?.show?.poster_path}
      heading={{
        'record': meta?.release?.swap ? `Season swap proposal` : meta?.release?.proposal ? `Show record proposal` : `Show recorded`,
        'airing': meta?.release?.proposal ? `Airing episode proposal` : `Airing episode recorded`,
        'sync': `Episodes missing from your Plex Server`,
        'keep-in-touch': `Show request`,
      }[meta?.command]}
    >
      <div sx={{ display: 'flex', alignItems: 'center', paddingY: 10 }}>
        <span sx={{ fontSize: 6, marginRight: 6 }}>
          <ShowState
            value={loading ? 'loading' : showStateOf(metadata)}
            onChange={toggleFollow}
            compact={true}
          />
        </span>
        <span sx={{ fontFamily: 'heading', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta?.show?.name}</span>
        {!!label && (
          <code sx={{ flexShrink: 0, marginLeft: 6, fontWeight: 'semibold' }}>{label}</code>
        )}
      </div>
      <div sx={{ display: 'flex', alignItems: 'center', fontWeight: 'semibold', color: 'grayDarker' }}>
        <span sx={{ fontSize: 6 }}>
          {{
            'record': meta?.swap ? swapLabelOf(meta?.release?.size, meta.swap) : meta?.release?.proposal ? `Release proposal` : `Release`,
            'airing': meta?.release?.proposal ? `Release proposal` : `Release`,
            'sync': `${meta?.missing} episodes no longer on Plex`,
            'keep-in-touch': `Requested by`,
          }[meta?.command]}
        </span>
      </div>
      {['record', 'airing'].includes(meta?.command) && (
        <div sx={{ marginTop: 8 }}>
          <NotificationRelease release={meta?.release} />
          <div sx={{ display: 'flex', marginTop: '1em', '>button': { flex: 1, ...((choice === null || choice === false) ? { ':first-of-type': { marginRight: 8 }, ':last-of-type': { marginLeft: 8 } } : {}) } }}>
            {meta?.release?.proposal ? (
              <>
                {(choice === null || choice === true) && (
                  <Button
                    variant='contain'
                    color={(loading || choice !== null) ? 'gray' : 'primary'}
                    disabled={loading || choice !== null}
                    onClick={() => answer(true)}
                  >
                    {choice === null ? 'Accept' : 'Accepted'}
                  </Button>
                )}
                {(choice === null || choice === false) && (
                  <Button
                    variant={choice === null ? 'outline' : 'contain'}
                    color={(loading || choice !== null) ? 'gray' : 'primary'}
                    disabled={loading || choice !== null}
                    onClick={() => answer(false)}
                  >
                    {choice === null ? 'Refuse' : 'Refused'}
                  </Button>
                )}
                {(choice === false && !!metadata.state) && (
                  <Button
                    variant={!banned ? 'outline' : 'contain'}
                    color={(loading || banned) ? 'gray' : 'primary'}
                    disabled={loading || banned}
                    onClick={ban}
                  >
                    {!banned ? 'Ban' : 'Banned'}
                  </Button>
                )}
              </>
            ) : (
              <Button variant='contain' color='gray' disabled={true}>Downloaded</Button>
            )}
          </div>
        </div>
      )}
      {meta?.command === 'sync' && (
        <div sx={{ display: 'flex', marginTop: 4, '>button': { flex: 1 } }}>
          <Button
            variant={choice === null ? 'outline' : 'contain'}
            color={(loading || choice !== null) ? 'gray' : 'primary'}
            disabled={loading || choice !== null}
            onClick={() => answerNotification(_id, false)}
          >
            {choice === null ? 'Ignore' : 'Ignored'}
          </Button>
        </div>
      )}
      {meta?.command === 'keep-in-touch' && (
        <div sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginTop: 8, fontSize: '1rem' }}>
          <div sx={{ flex: 1, marginRight: 4, marginBottom: 3, fontSize: 9 }}>
            <Guests
              childProps={{ onClick: () => closePortal() }}
              guests={(meta?.requested_by || []).filter(guest => guests[guest]).map(guest => ({
                entity: { id: 0, name: guests[guest].name, override: guests[guest].email, profile_path: guests[guest].avatar }
              }))}
            />
          </div>
          <div sx={{ display: 'flex', marginTop: 4, '>button': { flex: 1, ...(choice === null ? { ':first-of-type': { marginRight: 8 }, ':last-of-type': { marginLeft: 8 } } : {}) } }}>
            {(choice === null || choice === true) && (
              <Button
                variant='contain'
                color={(loading || following || choice !== null) ? 'gray' : 'primary'}
                disabled={loading || following || choice !== null}
                aria-busy={following}
                onClick={follow}
              >
                {following ? 'Following...' : choice === null ? 'Follow' : metadata.monitored ? 'Followed' : 'Pinned'}
              </Button>
            )}
            {(choice === null || choice === false) && (
              <Button
                variant={choice === null ? 'outline' : 'contain'}
                color={(loading || following || choice !== null) ? 'gray' : 'primary'}
                disabled={loading || following || choice !== null}
                onClick={() => answerNotification(_id, false)}
              >
                {choice === null ? 'Ignore' : 'Ignored'}
              </Button>
            )}
          </div>
        </div>
      )}
    </NotificationFrame>
  )
}

const NotificationRelease = ({ release }) => (
  <>
    <Tippy maxWidth='80vw' disabled={!release?.original} content={<code><small>{release?.original}</small></code>}>
      <code
        title={release?.title}
        sx={{
          display: 'block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: 6,
        }}
      >
        {release?.title || 'No releases found during this job'}
      </code>
    </Tippy>
    <div sx={{ display: 'flex', flexDirection: ['column', 'row'], alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
      <div
        sx={{
          display: 'flex',
          alignItems: 'center',
          alignSelf: 'start',
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          marginBottom: [10, 12],
          '>span': {
            ':not(:last-of-type)': {
              marginRight: 6,
            },
            '>code': {
              display: 'block',
              paddingX: 4,
              paddingY: 8,
              backgroundColor: 'gray',
              borderRadius: '0.25em',
              color: 'text',
              fontWeight: 600,
              fontSize: 7,
              whiteSpace: 'nowrap',
            },
            '>abbr': {
              fontSize: 0,
            },
            '>svg': {
              display: 'inline',
              height: '1.5em',
              color: 'black',
            },
          },
        }}
      >
        {typeof release?.peers !== 'undefined' && (
          <span title={`Peers (${release?.seeders}/${release?.peers})`}>
            <code>{emojize('🌍 ', release?.peers || 0)}</code>
          </span>
        )}
        {typeof release?.size !== 'undefined' && (
          <span title={`Size (${filesize.stringify(release?.size)})`}>
            <code>{emojize('📦 ', filesize.stringify(release?.size || 0))}</code>
          </span>
        )}
        {typeof release?.score !== 'undefined' && (
          <span title={`Score (${release?.score})`}>
            <code>{emojize('💯 ', release?.score || 0)}</code>
          </span>
        )}
      </div>
      <div
        sx={{
          display: 'flex',
          alignItems: 'center',
          'a': {
            zIndex: 1,
            opacity: 0.8,
            fontSize: 6,
            ':hover': {
              opacity: 1,
            },
          },
        }}
      >
        <a href={safeUrl(release?.link)} target='_blank' rel='noreferrer noopener' sx={{ color: 'primary' }}><code><small>({release?.znab})</small></code></a>
        <span>&nbsp;&nbsp;&nbsp;</span>
        <a href={safeUrl(release?.enclosure)} target='_blank' rel='noreferrer noopener' sx={{ color: 'grayDarker' }} title={`Download .torrent file`}><code><small>.torrent</small></code></a>
      </div>
    </div>
  </>
)
