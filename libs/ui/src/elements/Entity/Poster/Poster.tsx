import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LinkProps } from 'react-router-dom'
import { useDevice } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Link } from '../../../atoms/Link/Link'
import { Picture, PictureProps, pictureSrc } from '../../../atoms/Picture/Picture'
import { Credits } from '../../../components/Movie/Credits/Credits'
import { Option } from '../../../inputs/Option/Option'
import { useCutout } from './cutout'
// import { MovieDetails } from '../../../components/Movie/Movie'
// import { PersonDetails } from '../../../components/Person/Person'

// The ring around a badge stays empty: its badge cuts it out of the poster, see `./cutout`
const cutout = { borderStyle: 'solid', borderWidth: '0.25em', borderColor: 'transparent', backgroundClip: 'padding-box' }

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
  const wrapper = useRef<HTMLDivElement>()
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
  // On a phone an open selection moves the ratings to the right corner, over the state, and shows the whole checkbox
  const aside = interactive && (!!selected || selectedVisible)
  const ratings = useRef<HTMLDivElement>()
  const state = useRef<HTMLDivElement>()
  const placed = useRef<{ left: number, top: number }>(null)

  // The badges slide to their new corner instead of jumping there, which reveals the checkbox under the ratings
  useLayoutEffect(() => {
    if (!ratings.current || !state.current) {
      return
    }

    const now = { left: ratings.current.offsetLeft, top: state.current.offsetTop }
    const before = placed.current
    placed.current = now

    if (!before || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const timing = { duration: aside ? 250 : 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    ratings.current.animate([{ transform: `translateX(${before.left - now.left}px)` }, { transform: 'none' }], timing)
    state.current.animate([{ transform: `translateY(${before.top - now.top}px)` }, { transform: 'none' }], timing)
  }, [aside])

  useCutout(wrapper)

  useEffect(() => {
    if (!focused) {
      return
    }

    // The touch that clears the focus does only that: the click it ends with opens nothing
    const onTouchStart = (e) => {
      if (ref.current?.contains(e.target)) {
        return
      }

      const swallow = (event) => {
        event.preventDefault()
        event.stopPropagation()
      }

      setFocused(false)
      document.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => document.removeEventListener('click', swallow, true), 800)
    }
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
          ...((selected !== null && !interactive) ? {
            '>div:first-of-type': {
              '>div:first-of-type': {
                left: ['1.25em !important', '0.25em !important'],
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
        ref={wrapper}
        sx={{
          ...UIPoster.styles.wrapper,
          transition: 'transform 600ms cubic-bezier(0.165, 0.84, 0.44, 1)',
          transform: (interactive && focused) ? 'scale(1.05)' : 'none',
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
        }}
      >
        <div
          ref={ratings}
          sx={{
            ...UIPoster.styles.left,
            // Au repos le badge recouvre totalement la coche (position d'origine, identique aux
            // pages sans sélection). Il se décale (hover ou coché) pour révéler la coche.
            ...(aside ? { left: 'auto', right: '-1.25em' } : { left: (selected || selectedVisible) ? ['1.25em', '0.25em'] : ['-0.75em', '-1.5em'] }),
            opacity: ready ? 1 : 0,
            transition: [
              ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
              interactive ? null : 'left 150ms ease-in-out, right 150ms ease-in-out',
            ].filter(Boolean).join(', '),
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
                  <badges.reviews.component {...badges?.reviews?.props} forceOpen={focused} data-cutout={true} sx={cutout} />
                </span>
              )}
              {badges?.focus?.component && (
                <span data-cutout={true} sx={{ display: 'block', marginTop: badges?.reviews?.component ? ['-1.75em', '-2em'] : 12, borderRadius: '2em', ...cutout }}>
                  <badges.focus.component {...badges?.focus?.props} />
                </span>
              )}
            </div>
          )}
        </div>
        <div
          ref={state}
          sx={{
            ...UIPoster.styles.right,
            ...pills,
            top: aside ? '0.75em' : UIPoster.styles.right.top,
            // Like a hover on the badges at left, the focus opens the ratings over these
            opacity: (ready && !focused) ? 1 : 0,
            transition: focused ? 'opacity 200ms ease-in-out' : ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
          }}
        >
          {badges?.state?.component && <div data-cutout={true} sx={UIPoster.styles.state}><badges.state.component {...badges?.state?.props} /></div>}
          {badges?.proposal?.component && <div data-cutout={true} sx={UIPoster.styles.proposal}><badges.proposal.component {...badges?.proposal?.props} /></div>}
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
              data-cutout-picture={true}
              sx={{
                transition: 'background-color 800ms ease-in-out, color 800ms ease-in-out',
                maskSize: '100% 100%',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
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
            data-cutout={true}
            sx={{
              position: 'absolute',
              top: '-1em',
              left: ['-0.75em', '-1.25em'],
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
              ...cutout,
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
    ...cutout,
    backgroundColor: 'gray',
  },
  proposal: {
    marginTop: '-0.75em',
    borderRadius: '50%',
    ...cutout,
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
        isolation: 'isolate',
        // The aura lies under the picture, so a badge's cutout shows it as well
        '::after': {
          content: '""',
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '100%',
          height: '100%',
          zIndex: -1,
          backgroundColor: (theme) => palette?.colorfulColor || theme.colors.primary,
          filter: 'blur(15px)',
          transform: 'translateY(3px)',
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
