import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Option, Guests, Icon, Link, MovieState, Pane, Picture, Warning } from '@sensorr/ui'
import { emojize, filesize } from '@sensorr/utils'
import useRipple from 'use-ripple-hook'
import Tippy from '@tippyjs/react'
import usePortal from 'react-useportal'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'
import { formatDistanceToNowStrict } from 'date-fns'
import { useNotificationsContext } from '../../../contexts/Notifications/Notifications'
import { useMoviesMetadataContext } from '../../../contexts/MoviesMetadata/MoviesMetadata'
import { useGuestsContext } from '../../../contexts/Guests/Guests'
import { useDeviceContext } from '../../../contexts/Device/Device'

const UINotifications = ({ ...props }) => {
  const { pwa } = useDeviceContext()
  const ref = useRef()
  const [pointerRef, onPointerDown] = useRipple()
  const { Portal, togglePortal, closePortal, isOpen: open } = usePortal({ closeOnOutsideClick: false, closeOnEsc: true })
  const { notifications, loading, dismissNotifications, subscribable, subscribed, subscribeNotifications } = useNotificationsContext() as any
  const unseen = useMemo(() => notifications.filter(notification => !notification.meta?.seen).map(notification => notification._id), [notifications])
  const [filters, setFilters] = useState([])
  const filtered = useMemo(() => notifications.filter(notification => !filters.length || filters.includes(notification.meta?.command)), [notifications, filters])

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
                  {!!unseen.length && <span>{unseen.length}</span>}
                </span>
                <button onClick={() => dismissNotifications(unseen)}>
                  Mark all as read
                </button>
              </span>
              <button onClick={() => closePortal()}>
                <Icon value='clear' active={true} height='1.25em' width='1.25em' />
              </button>
            </span>
            <div ref={ref} sx={UINotifications.styles.container}>
              {subscribable && (
                <div sx={UINotifications.styles.push}>
                  <button onClick={(e) => subscribeNotifications(e)}>
                    {subscribed ? '🔕' : '🔔'} <span>{subscribed ? 'Disable' : 'Enable'} Push Notifications</span>
                  </button>
                </div>
              )}
              <div sx={UINotifications.styles.filters}>
                <div sx={{ opacity: !filters.length || filters.includes('record') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('record') ? filters.filter(f => f !== 'record') : [...filters, 'record'])}>
                  <span>📹</span>
                  <code>record</code>
                </div>
                <div sx={{ opacity: !filters.length || filters.includes('refine') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('refine') ? filters.filter(f => f !== 'refine') : [...filters, 'refine'])}>
                  <span>✨</span>
                  <code>refine</code>
                </div>
                <div sx={{ opacity: !filters.length || filters.includes('shrink') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('shrink') ? filters.filter(f => f !== 'shrink') : [...filters, 'shrink'])}>
                  <span>✂️</span>
                  <code>shrink</code>
                </div>
                <div sx={{ opacity: !filters.length || filters.includes('sync') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('sync') ? filters.filter(f => f !== 'sync') : [...filters, 'sync'])}>
                  <span>💊</span>
                  <code>missing</code>
                </div>
                <div sx={{ opacity: !filters.length || filters.includes('keep-in-touch') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('keep-in-touch') ? filters.filter(f => f !== 'keep-in-touch') : [...filters, 'keep-in-touch'])}>
                  <span>🍺</span>
                  <code>request</code>
                </div>
              </div>
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
                <Warning emoji='🔔' title="Up to date" subtitle="Not notifications yet" />
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
        },
        '>button': {
          variant: 'button.reset',
          fontSize: 6,
          opacity: 0.8,
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
  filters: {
    position: 'sticky',
    top: '0px',
    display: 'flex',
    backgroundColor: 'primaryDarker',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingX: 10,
    paddingY: 8,
    zIndex: 2,
    '>div': {
      display: 'flex',
      flexShrink: 0,
      backgroundColor: 'accentDark',
      margin: 11,
      paddingX: 6,
      paddingY: 10,
      borderRadius: '1em',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      ':hover': {
      backgroundColor: 'accentDarker',
      },
      '>span': {
        marginRight: 7,
      },
      '>code': {
        display: 'flex',
        alignItems: 'center',
        fontSize: 6,
      },
    },
  },
}

export const Notifications = memo(UINotifications)

const Notification = ({ _id, timestamp, meta, closePortal, ...props }) => {
  const { dismissNotifications, answerNotification } = useNotificationsContext() as any
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
    <div sx={{ paddingX: 4, overflow: 'hidden', color: 'textLight', ...(!meta?.seen ? { backgroundColor: 'grayLighter' } : {}) }} onMouseEnter={() => meta?.seen ? {} : dismissNotifications([_id])} style={{ ...props.style, width: '100%' }}>
      <div sx={{ position: 'relative', display: 'flex', height: '240px', alignItems: 'center', paddingY: 4, borderBottom: '1px solid', borderColor: 'gray' }}>
        {!meta?.seen && (
          <span sx={{ position: 'absolute', top: '0.5em', display: 'block', backgroundColor: 'error', height: '0.5em', width: '0.5em', borderRadius: '0.25em' }}></span>
        )}
        <span sx={{ display: ['none', 'flex'], alignItems: 'center', justifyContent: 'center', backgroundColor: 'gray', width: '2em', height: '2em', padding: 8, borderRadius: '1em', fontSize: 3, marginRight: 6 }}>
          {{
            'record': '📹',
            'refine': '✨',
            'shrink': '✂️',
            'sync': '💊',
            'keep-in-touch': '🍺',
          }[meta?.command]}
        </span>
        <div sx={{ display: 'flex', alignItems: 'center' }}>
          <div sx={{ width: '6.5em', height: '10em', flexShrink: 0 }}>
            <Link to={`/movie/${meta?.movie?.id}`} onClick={() => closePortal()}>
              <Picture path={meta?.movie?.poster_path} size='w185' />
            </Link>
          </div>
        </div>
        <div sx={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 4, alignSelf: 'stretch', overflow: 'hidden' }}>
          <div sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'grayDarker' }}>
            <span sx={{ fontSize: 6, fontWeight: 'semibold' }}>
              {{
                'record': meta?.release?.proposal ? `Movie record proposal` : `Movie recorded`,
                'refine': meta?.release?.proposal ? `Movie refine proposal` : `Movie refined`,
                'shrink': meta?.release?.proposal ? `Movie shrink proposal` : `Movie shrinked`,
                'sync': `Movie missing from your Plex Server`,
                'keep-in-touch': `Movie request`,
              }[meta?.command]}
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
                'sync': `Do you want to fix it ?`,
                'keep-in-touch': `Requested by`,
              }[meta?.command]}
            </span>
          </div>
          {['record', 'refine', 'shrink'].includes(meta?.command) && (
            <div sx={{ marginTop: 8 }}>
              <Tippy maxWidth='80vw' disabled={!meta?.release?.original} content={<code><small>{meta?.release?.original}</small></code>}>
                <code
                  title={meta?.release?.title}
                  sx={{
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: 6,
                  }}
                >
                  {meta?.release?.title || 'No releases found during this job'}
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
                  {typeof meta?.release?.peers !== 'undefined' && (
                    <span title={`Peers (${meta?.release?.seeders}/${meta?.release?.peers})`}>
                      <code>{emojize('🌍 ', meta?.release?.peers || 0)}</code>
                    </span>
                  )}
                  {typeof meta?.release?.size !== 'undefined' && (
                    <span title={`Size (${filesize.stringify(meta?.release?.size)})`}>
                      <code>{emojize('📦 ', filesize.stringify(meta?.release?.size || 0))}</code>
                    </span>
                  )}
                  {typeof meta?.release?.score !== 'undefined' && (
                    <span title={`Score (${meta?.release?.score})`}>
                      <code>{emojize('💯 ', meta?.release?.score || 0)}</code>
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
                  <a href={meta?.release?.link} target='_blank' rel='norefer noopener' sx={{ color: 'primary' }}><code><small>({meta?.release?.znab})</small></code></a>
                  <span>&nbsp;&nbsp;&nbsp;</span>
                  <a href={meta?.release?.enclosure} target='_blank' rel='norefer noopener' sx={{ color: 'grayDarker' }} title={`Download .torrent file`}><code><small>.torrent</small></code></a>
                </div>
              </div>
              <div sx={{ display: 'flex', marginTop: '1em', '>button': { flex: 1, ...((choice === null || choice === false) ? { ':first-of-type': { marginRight: 8 }, ':last-of-type': { marginLeft: 8 } } : {}) } }}>
                {meta?.release?.proposal ? (
                  <>
                    {(choice === null || choice === true) && (
                      <Button
                        variant='contain'
                        color={(loading || choice !== null) ? 'gray' : 'primary'}
                        disabled={loading || choice !== null}
                        onClick={() => {
                          setMovieMetadata(meta?.movie?.id, 'proposal', true)
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
                          setMovieMetadata(meta?.movie?.id, 'proposal', false)
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
        </div>
      </div>
    </div>
  )
}
