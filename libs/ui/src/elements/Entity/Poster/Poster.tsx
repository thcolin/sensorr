import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LinkProps } from 'react-router-dom'
import { useDevice } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Link } from '../../../atoms/Link/Link'
import { Picture, PictureProps } from '../../../atoms/Picture/Picture'
import { Credits } from '../../../components/Movie/Credits/Credits'
import { Option } from '../../../inputs/Option/Option'
// import { MovieDetails } from '../../../components/Movie/Movie'
// import { PersonDetails } from '../../../components/Person/Person'

export interface PosterProps extends Omit<PictureProps, 'path' | 'ready' | 'onReady'> {
  details: any // MovieDetails | PersonDetails
  link?: LinkProps
  interactive?: boolean
  onLongPress?: (data: any) => void
  ready?: boolean
  selected?: boolean | null
  selectedVisible?: boolean
  onSelectedChange?: (id: string) => void
  meaningful?: boolean
  badges?: {
    state?: { component: React.FC, props: any },
    proposal?: { component: React.FC, props: any },
    focus?: { component: React.FC, props: any },
    reviews?: { component: React.FC, props: any },
    guests?: { component: React.FC, props: any },
  }
  credits?: { entity: any, state?: 'loading' | 'ignored' | 'followed' }[] | false
  onReady?: () => void
  loadExternals?: () => void
  opacity?: number
}

const UIPoster = ({
  details,
  link = null,
  interactive = false,
  onLongPress = null,
  meaningful = true,
  badges = {},
  onReady,
  credits = false,
  selected = null,
  selectedVisible = false,
  onSelectedChange,
  loadExternals,
  opacity = 1,
  ...props
}: PosterProps) => {
  const ref = useRef()
  const device = useDevice()
  const [loaded, setLoaded] = useState(details?.poster ? false : true)
  const ready = useMemo(() => loaded && props?.ready !== false, [loaded, props?.ready])
  const onPosterReady = useCallback(() => {
    setLoaded(true)

    if (typeof onReady === 'function') {
      onReady()
    }
  }, [onReady])

  const { palette } = usePalette(
    interactive && !!details?.poster && `https://image.tmdb.org/t/p/w92${details?.poster}`,
    { colorfulColor: null, backgroundColor: null, color: null, alternativeColor: null, negativeColor: null },
    details?.poster,
  )

  return (
    <div
      ref={ref}
      onMouseEnter={loadExternals}
      sx={{
        ...UIPoster.styles.element,
        opacity: ready ? opacity : 1,
        ':hover': {
          zIndex: 5,
          ...(selected !== null ? {
            '>div:first-of-type': {
              '>div:first-of-type': {
                left: ['-0.75em', '0.75em !important'],
              },
            },
          } : {}),
        },
      }}
    >
      <div sx={UIPoster.styles.wrapper}>
        <div
          sx={{
            ...UIPoster.styles.left,
            left: ['-0.75em', (selected || selectedVisible) ? '0.5em' : '-1.5em'],
            opacity: ready ? 1 : 0,
            transition: [
              ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
              'left 150ms ease-in-out, right 150ms ease-in-out',
            ].join(', '),
            ...((!badges?.focus?.component || !badges?.reviews?.component) ? {
              '>div>span>span': {
                minWidth: ['4.7em', '5.5em'],
              },
            } : {}),
            ':hover + div': {
              opacity: 0,
              transition: 'opacity 200ms ease-in-out',
            },
          }}
        >
          {selected !== null && (
            <div
              sx={{
                position: 'fixed',
                left: '1em',
                zIndex: 1,
                backgroundColor: selected ? 'primary' : 'gray',
                width: '2em',
                height: '2em',
                borderRadius: '2em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderStyle: 'solid',
                borderWidth: '0.25em',
                borderColor: 'grayLightest',
              }}
            >
              <Option
                id={`select-${details?.id}`}
                type='checkbox'
                behavior='radio'
                borderless={true}
                checked={selected}
                onChange={() => onSelectedChange(details?.id)}
              />
            </div>
          )}
          {(badges?.focus?.component || badges?.reviews?.component) && (
            <div
              sx={{
                ...UIPoster.styles.focus,
                zIndex: 2,
                ...(selected !== null ? {} : {}),
                ...((badges?.reviews?.component && badges?.focus?.component) ? {
                  ':not(:hover)>span:first-of-type': {
                    transition: 'visibility ease 0ms 200ms',
                  },
                  ':not(:hover)>span:last-of-type': {
                    transition: 'visibility ease 0ms 200ms',
                  },
                  ':hover': {
                    '>span:first-of-type': {
                      visibility: 'visible',
                    },
                    '>span:last-of-type': {
                      visibility: 'hidden',
                    },
                  },
                } : {}),
              }}
            >
              {badges?.reviews?.component && (
                <span sx={{ visibility: badges?.focus?.component ? 'hidden' : 'visible' }}>
                  <badges.reviews.component {...badges?.reviews?.props} sx={{ borderStyle: 'solid', borderWidth: '0.25em', borderColor: 'grayLightest' }} />
                </span>
              )}
              {badges?.focus?.component && (
                <span sx={{ display: 'block', marginTop: badges?.reviews?.component ? ['-1.75em', '-2em'] : 12, borderRadius: '2em', borderStyle: 'solid', borderWidth: '0.25em', borderColor: 'grayLightest' }}>
                  <badges.focus.component {...badges?.focus?.props} />
                </span>
              )}
            </div>
          )}
        </div>
        <div
          sx={{
            ...UIPoster.styles.right,
            opacity: ready ? 1 : 0,
            transition: ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
          }}
        >
          {badges?.state?.component && <div sx={UIPoster.styles.state}><badges.state.component {...badges?.state?.props} /></div>}
          {badges?.proposal?.component && <div sx={UIPoster.styles.proposal}><badges.proposal.component {...badges?.proposal?.props} /></div>}
        </div>
        <div
          sx={{
            ...UIPoster.styles.guests,
            opacity: ready ? 1 : 0,
            transition: ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
          }}
        >
          {badges?.guests?.component && <badges.guests.component {...badges?.guests?.props} />}
        </div>
        <div
          sx={{
            '>a': UIPoster.styles.link,
            ':hover >div': {
              opacity: 1,
              visibility: 'visible',
              transition: 'opacity 400ms ease-in-out, visibility 0ms ease',
            },
          }}
        >
          <InteractiveLongPressLink
            to={link?.to}
            state={link?.state}
            disabled={!link?.to}
            interactive={interactive}
            onTouchStart={loadExternals}
            onLongPress={() => onLongPress({ details, link, palette })}
            palette={palette}
          >
            <Picture
              {...props}
              ready={ready}
              path={details?.poster}
              onReady={onPosterReady}
              sx={{
                transition: `background-color 800ms ease-in-out, color 800ms ease-in-out, mask 100ms ease-in-out ${ready ? '400ms' : '200ms'}`,
                // maskPosition: 'center center',
                // maskSize: ready ? '100%' : '150%',
                // maskRepeat: 'no-repeat',
                // maskImage: !badges?.state?.component ? 'unset' : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 320 480"><path d="${(
                //   (device === 'mobile') ? (
                //     (badges?.reviews?.component) ? (
                //       (badges?.proposal?.component) ? 'M190.7,0c0,0-2.3,31.4-36.8,35H14.9c0,0-5.5,0.8-14.9-3.6V480h320V106.7c0,0-29.3-14.1-23.2-57.1 c0,0-24.8-12.5-23.3-49.6' : 'M190.7,0c0,0-2.3,31.4-36.8,35H14.9c0,0-5.5,0.8-14.9-3.6V480h320V58.5c0,0-46.8-5.2-46.4-58.5'
                //     ) : (
                //       (badges?.proposal?.component) ? 'M0,0v480h320V106.7c0,0-29.3-14.1-23.2-57.1c0,0-24.8-12.5-23.3-49.6H0z' : 'M0,0v480h320V60c0,0-49.3-9.5-46.4-60H0z'
                //     )
                //   ) : (
                //     (badges?.reviews?.component) ? (
                //       (badges?.proposal?.component) ? 'M0 32.1h97.2s27-2.2 28.9-32.1H281s-6.9 27.9 17.9 42c0 0-13.2 34.4 21.1 45v393H0V32.1z' : 'M0,32.1h97.2c0,0,27-2.2,28.9-32.1H281c0,0-7.5,44.1,39,48v432H0V32.1z'
                //     ) : (
                //       (badges?.proposal?.component) ? 'M0,0c0,0,69.2,0,126.1,0S281,0,281,0s-6.9,27.9,17.9,42c0,0-13.2,34.4,21.1,45v393H0V0z' : 'M0,0h281c0,0-7.5,44.1,39,48v432H0V0z'
                //     )
                //   )
                // )}"></path></svg>')`,
              }}
            />
          </InteractiveLongPressLink>
          {(!interactive && credits !== false) && (
            <div
              sx={{
                ...UIPoster.styles.credits,
                opacity: 0,
                visibility: 'hidden',
                transition: 'opacity 400ms ease-in-out, visibility 0ms ease 400ms',
              }}
              >
              <Credits credits={credits || []} length={device === 'mobile' ? 4 : 5} />
            </div>
          )}
        </div>
      </div>
      {meaningful && (
        <div sx={UIPoster.styles.meaningful}>
          <div
            sx={{
              ...UIPoster.styles.skeleton,
              backgroundColor: props.palette?.backgroundColor || 'grayLight',
              opacity: ready ? 0 : 1,
              transition: ready ? 'opacity 400ms ease-in-out 400ms, z-index 0ms ease 600ms' : 'opacity 400ms ease-in-out, z-index 0ms ease',
              zIndex: ready ? -1 : 0,
            }}
          ></div>
          <strong sx={UIPoster.styles.title} title={details?.title}>
            <Link to={link?.to} state={link?.state} disabled={!link?.to}>
              {details?.title || 'Loading'}
            </Link>
          </strong>
          <div sx={UIPoster.styles.subtitle}>
            {!ready && (
              <span>Loading</span>
            )}
            {!!details?.meaningful?.year && (
              <span>
                <details.meaningful.year disabled={device === 'mobile'} />
                {(!!details?.meaningful?.genres || !!details?.caption) && <span sx={{ marginX: 8 }}>&nbsp;·&nbsp;</span>}
              </span>
            )}
            {(!!details?.meaningful?.genres || !!details?.caption) && (
              <small title={details?.caption}>
                {!!details?.meaningful?.genres ? <details.meaningful.genres emoji={false} disabled={device === 'mobile'} /> : details?.caption}
              </small>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

UIPoster.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
    width: ['7.5em', '12.5em'],
    maxWidth: '100%',
    paddingRight: [4, 2],
    paddingLeft: [8, 4],
    transition: 'opacity 400ms ease-in-out',
    // overflow: 'hidden',
  },
  wrapper: {
    position: 'relative',
    width: '100%',
    marginTop: 5,
  },
  left: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    top: '-1em',
    fontSize: [5, 4],
    zIndex: 3,
  },
  right: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    top: '-1em',
    right: '-1.25em',
    fontSize: [5, 4],
    zIndex: 2,
  },
  guests: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    bottom: ['-6px', '-6px'],
    left: ['-8px', '-16px'],
    fontSize: ['4px', '5px'],
    zIndex: 2,
  },
  credits: {
    position: 'absolute',
    bottom: '-1.5em',
    left: '-4em',
    fontSize: ['4px', '5px'],
    zIndex: 2,
  },
  focus: {
    position: 'relative',
    minWidth: ['4.5em', 'auto'],
  },
  state: {
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '0.25em',
    borderColor: 'grayLightest',
    backgroundColor: 'gray',
  },
  proposal: {
    marginTop: '-0.75em',
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '0.25em',
    borderColor: 'grayLightest',
  },
  link: {
    display: 'flex',
    height: ['9em', '15em'],
    maxHeight: '100%',
    width: '100%',
  },
  meaningful: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    marginTop: 8,
    paddingY: 10,
  },
  skeleton: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  title: {
    fontSize: [6, 5],
    lineHeight: 'reset',
    fontFamily: 'heading',
    fontWeight: 'semibold',
    color: 'text',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    '>a': {
      lineHeight: 'normal',
    },
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 10,
    color: 'grayDarker',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '>span': {
      fontSize: 7,
      fontWeight: 'semibold',
      color: 'grayDarkest',
    },
    '>small': {
      fontSize: [8, 7],
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
}

export const Poster = memo(UIPoster)

const InteractiveLongPressLink = ({
  children,
  palette,
  interactive,
  onTouchStart,
  onLongPress,
  ...props
}: any) => {
  const ref = useRef<any>()
  const triggerTimer = useRef<any>()
  const longpressTimer = useRef<any>()
  const canceled = useRef<boolean>(false)
  const longpress = useRef<boolean>(false)
  const trigger = useRef<boolean>(false)
  const [action, setAction] = useState(null)
  const [, setTriggered] = useState(false)

  const startPressTimer = () => {
    longpress.current = false
    trigger.current = false
    canceled.current = false

    if (!interactive) {
      return
    }

    longpressTimer.current = setTimeout(() => {
      longpress.current = true
      setAction('longpress')
    }, 200)

    triggerTimer.current = setTimeout(() => {
      trigger.current = true
      setTriggered(true)
    }, 400)
  }

  const handleOnClick = (e) => {
    if (longpress.current) {
      e.preventDefault()
      return false
    }

    setAction('click')
  }

  const handleOnTouchStart = () => {
    startPressTimer()

    if (typeof onTouchStart === 'function') {
      onTouchStart()
    }
  }

  const handleOnTouchMove = (e) => {
    canceled.current = true
    setAction(null)
    setTriggered(false)
    clearTimeout(longpressTimer.current)
    clearTimeout(triggerTimer.current)
  }

  const handleOnTouchEnd = (e) => {
    if (longpress.current) {
      if (e.cancelable) {
        e.preventDefault()
      }

      setAction(null)
      setTriggered(false)

      if (!canceled.current && trigger.current && typeof onLongPress === 'function') {
        onLongPress()
      }

      return
    }

    clearTimeout(longpressTimer.current)
    clearTimeout(triggerTimer.current)
  }

  useEffect(() => {
    if (!ref || !ref.current) {
      return
    }

    ref.current.addEventListener('webkitmouseforcewillbegin', (e) => e.preventDefault())
  }, [ref])

  return (
    <Link
      ref={ref}
      {...props}
      onClick={handleOnClick}
      onTouchStart={handleOnTouchStart}
      onTouchMove={handleOnTouchMove}
      onTouchEnd={handleOnTouchEnd}
      sx={{
        position: 'relative',
        display: 'block',
        transition: 'transform 600ms cubic-bezier(0.165, 0.84, 0.44, 1)',
        transform: `scale(${action === 'longpress' ? '1.05, 1.05' : '1, 1'})`,
        userSelect: 'none',
        // WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserDrag: 'none',
        '::after': {
          content: '""',
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '100%',
          height: '100%',
          boxShadow: (theme) => `0px 3px 30px ${palette?.colorfulColor || theme.colors.primary}`,
          opacity: action === 'longpress' ? 1 : 0,
          transition: 'opacity 600ms cubic-bezier(0.165, 0.84, 0.44, 1)',
        },
        ...(action === 'longpress' ? {
          '>span': {
            maskSize: '110% !important'
          },
        } : {}),
      }}
    >
      {children}
    </Link>
  )
}
