import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LinkProps } from 'react-router-dom'
import { useDevice } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Link } from '../../../atoms/Link/Link'
import { Picture, PictureProps, pictureSrc } from '../../../atoms/Picture/Picture'
import { Credits } from '../../../components/Movie/Credits/Credits'
import { Option } from '../../../inputs/Option/Option'
// import { MovieDetails } from '../../../components/Movie/Movie'
// import { PersonDetails } from '../../../components/Person/Person'

// The ring around a badge takes the color of the surface under the poster, which sets `--poster-cutout` when it is not `grayLightest`
const cutout = 'var(--poster-cutout, var(--theme-ui-colors-grayLightest))'

// The badges' fill and text, which a surface painted by another poster sets with `--poster-pill` and `--poster-pill-text`
const pills = {
  '--theme-ui-colors-gray': (theme) => `var(--poster-pill, ${theme.rawColors.gray})`,
  '--theme-ui-colors-text': (theme) => `var(--poster-pill-text, ${theme.rawColors.text})`,
}

export interface PosterProps extends Omit<PictureProps, 'path' | 'ready' | 'onReady'> {
  details: any // MovieDetails | PersonDetails
  link?: LinkProps
  interactive?: boolean
  onPress?: (data: any) => void
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
  footer?: React.ReactNode
}

const UIPoster = ({
  details,
  link = null,
  interactive = false,
  onPress = null,
  meaningful = true,
  badges = {},
  onReady,
  credits = false,
  selected = null,
  selectedVisible = false,
  onSelectedChange,
  loadExternals,
  opacity = 1,
  footer = null,
  ...props
}: PosterProps) => {
  const ref = useRef<HTMLDivElement>()
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
    interactive && !!details?.poster && pictureSrc(details.poster, 'w92'),
    { colorfulColor: null, backgroundColor: null, color: null, alternativeColor: null, negativeColor: null },
    details?.poster,
  )

  // On a phone, a long press checks the poster where a selection is possible, and focuses it elsewhere:
  // what a hover shows on a desktop, until the next touch or scroll
  const [focused, setFocused] = useState(false)
  const raised = !!selected || focused

  useEffect(() => {
    if (!focused) {
      return
    }

    const onTouchStart = (e) => !ref.current?.contains(e.target) && setFocused(false)
    const onScroll = () => setFocused(false)
    document.addEventListener('touchstart', onTouchStart, true)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      document.removeEventListener('touchstart', onTouchStart, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [focused])

  const onLongPress = useCallback(() => {
    if (selected !== null) {
      onSelectedChange(details?.id)
    } else {
      setFocused(true)
    }
  }, [selected, onSelectedChange, details?.id])

  const handleOnPress = useMemo(() => {
    if (selected !== null && (selected || selectedVisible)) {
      return () => onSelectedChange(details?.id)
    }

    return typeof onPress === 'function' ? () => {
      setFocused(false)
      onPress({ details, link, palette })
    } : null
  }, [selected, selectedVisible, onSelectedChange, onPress, details, link, palette])

  return (
    <div
      ref={ref}
      // Lets the cell of a list or a grid rise above its neighbours, the badges overflow the poster
      data-raised={(interactive && raised) || undefined}
      onMouseEnter={loadExternals}
      sx={{
        ...UIPoster.styles.element,
        opacity: ready ? opacity : 1,
        zIndex: (interactive && raised) ? 5 : 'auto',
        ':hover': {
          zIndex: 5,
          ...(selected !== null ? {
            '>div:first-of-type': {
              '>div:first-of-type': {
                left: '1.25em !important',
              },
            },
          } : {}),
        },
        ':hover [data-select]': {
          opacity: 1,
        },
        ':focus-within [data-select]': {
          opacity: 1,
        },
      }}
    >
      <div
        sx={{
          ...UIPoster.styles.wrapper,
          transition: 'transform 600ms cubic-bezier(0.165, 0.84, 0.44, 1)',
          transform: (interactive && raised) ? 'scale(1.05)' : 'none',
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
        }}
      >
        <div
          sx={{
            ...UIPoster.styles.left,
            // Au repos le badge recouvre totalement la coche (position d'origine, identique aux
            // pages sans sélection). Il se décale (hover ou coché) pour révéler la coche.
            left: (selected || selectedVisible) ? '1.25em' : ['-0.75em', '-1.5em'],
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
          {(badges?.focus?.component || badges?.reviews?.component) && (
            <div
              sx={{
                ...UIPoster.styles.focus,
                ...pills,
                zIndex: 2,
                ...(selected !== null ? {} : {}),
                ...((badges?.reviews?.component && badges?.focus?.component) ? {
                  ...(focused ? {
                    '>span:first-of-type': {
                      visibility: 'visible !important',
                    },
                    '>span:last-of-type': {
                      visibility: 'hidden !important',
                    },
                  } : {}),
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
                  <badges.reviews.component {...badges?.reviews?.props} forceOpen={focused} sx={{ borderStyle: 'solid', borderWidth: '0.25em', borderColor: cutout }} />
                </span>
              )}
              {badges?.focus?.component && (
                <span sx={{ display: 'block', marginTop: badges?.reviews?.component ? ['-1.75em', '-2em'] : 12, borderRadius: '2em', borderStyle: 'solid', borderWidth: '0.25em', borderColor: cutout }}>
                  <badges.focus.component {...badges?.focus?.props} />
                </span>
              )}
            </div>
          )}
        </div>
        <div
          sx={{
            ...UIPoster.styles.right,
            ...pills,
            // Like a hover on the badges at left, the focus opens the ratings over these
            opacity: (ready && !focused) ? 1 : 0,
            transition: focused ? 'opacity 200ms ease-in-out' : ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
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
          <PressableLink
            to={link?.to}
            state={link?.state}
            disabled={!link?.to}
            interactive={interactive && typeof onPress === 'function'}
            onTouchStart={loadExternals}
            onPress={handleOnPress}
            onLongPress={onLongPress}
            raised={raised}
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
          </PressableLink>
          {((!interactive || focused) && credits !== false) && (
            <div
              sx={{
                ...UIPoster.styles.credits,
                opacity: focused ? 1 : 0,
                visibility: focused ? 'visible' : 'hidden',
                transition: 'opacity 400ms ease-in-out, visibility 0ms ease 400ms',
              }}
            >
              <Credits credits={credits || []} length={device === 'mobile' ? 4 : 5} />
            </div>
          )}
        </div>
        {selected !== null && (
          <div
            data-select={true}
            sx={{
              position: 'absolute',
              top: '-1em',
              left: ['1px', '-2.5px'],
              fontSize: [5, 4],
              zIndex: 1,
              // Hidden at rest where a hover shows it: a poster without a focus badge has nothing to cover it,
              // and on a touch screen a hidden pill would still take the touch
              '@media (hover: hover)': {
                opacity: (selected || selectedVisible) ? 1 : 0,
              },
              transition: 'opacity 150ms ease-in-out',
              backgroundColor: selected ? 'primary' : 'gray',
              width: '2em',
              height: '2em',
              borderRadius: '2em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderStyle: 'solid',
              borderWidth: '0.25em',
              borderColor: cutout,
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
                {details?.meaningful?.genres ? <details.meaningful.genres emoji={false} disabled={device === 'mobile'} /> : details?.caption}
              </small>
            )}
          </div>
          {/* Out of sight while the skeleton covers the card, like the badges: a positioned pill would sit over it */}
          {!!footer && (
            <div
              sx={{
                ...UIPoster.styles.footer,
                opacity: ready ? 1 : 0,
                transition: ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
              }}
            >
              {footer}
            </div>
          )}
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
    minHeight: '2em',
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
    borderColor: cutout,
    backgroundColor: 'gray',
  },
  proposal: {
    marginTop: '-0.75em',
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '0.25em',
    borderColor: cutout,
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
  footer: {
    marginTop: 8,
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

// On a phone, a tap calls `onPress` and a long press calls `onLongPress` while the finger is still down
const PressableLink = ({
  children,
  palette,
  interactive,
  raised,
  onTouchStart,
  onPress,
  onLongPress,
  ...props
}: any) => {
  const ref = useRef<any>()
  const timer = useRef<any>()
  const origin = useRef<{ x: number, y: number }>(null)
  const pressed = useRef<boolean>(false)
  const [press, setPress] = useState(false)

  const reset = () => {
    clearTimeout(timer.current)
    origin.current = null
    setPress(false)
  }

  const handleOnTouchStart = (e) => {
    if (typeof onTouchStart === 'function') {
      onTouchStart()
    }

    if (!interactive) {
      return
    }

    pressed.current = false
    origin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    // Pressed only once the finger stays a moment: the start of a scroll does not shrink the poster
    timer.current = setTimeout(() => {
      setPress(true)
      timer.current = setTimeout(() => {
        reset()
        pressed.current = true
        navigator.vibrate?.(10)
        onLongPress?.()
      }, 320)
    }, 80)
  }

  const handleOnTouchMove = (e) => {
    if (origin.current && Math.hypot(e.touches[0].clientX - origin.current.x, e.touches[0].clientY - origin.current.y) > 10) {
      reset()
    }
  }

  // The long press already acted: the click that follows the touch must not open the poster as well
  const handleOnTouchEnd = (e) => {
    reset()

    if (pressed.current && e.cancelable) {
      e.preventDefault()
      pressed.current = false
    }
  }

  const handleOnClick = (e) => {
    if (pressed.current) {
      pressed.current = false
      e.preventDefault()
      return
    }

    if (interactive && typeof onPress === 'function') {
      e.preventDefault()
      onPress()
    }
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
      onTouchCancel={reset}
      onContextMenu={interactive ? (e) => e.preventDefault() : undefined}
      sx={{
        position: 'relative',
        display: 'block',
        transition: 'transform 600ms cubic-bezier(0.165, 0.84, 0.44, 1)',
        transform: press ? 'scale(0.96)' : 'none',
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
          opacity: (interactive && raised) ? 1 : 0,
          transition: 'opacity 600ms cubic-bezier(0.165, 0.84, 0.44, 1)',
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '::after': {
            transition: 'none',
          },
        },
      }}
    >
      {children}
    </Link>
  )
}
