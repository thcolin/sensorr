import { memo, useMemo, useState } from 'react'
import { useHover, useTouchable } from '@sensorr/utils'
import { Link } from '../../../atoms/Link/Link'
import { Picture, PictureProps } from '../../../atoms/Picture/Picture'
import { MovieDetails } from '../../../components/Movie/Movie'
import { PersonDetails } from '../../../components/Person/Person'

export interface PosterProps extends Omit<PictureProps, 'path' | 'ready' | 'onLoad' | 'onError'> {
  details: MovieDetails | PersonDetails
  link?: string
  focus?: [React.FC, any] | []
  state?: [React.FC, any] | []
  actions?: React.FC
  relations?: [React.FC, any] | []
  overrides?: { focus?: [React.FC, any] | [], ready?: boolean, hover?: boolean }
  onReady?: () => void
  onHover?: {
    onMouseEnter?: (event?: React.SyntheticEvent<HTMLSpanElement, Event>) => void
    onMouseLeave?: (event?: React.SyntheticEvent<HTMLSpanElement, Event>) => void
  }
}

const UIPoster = ({
  details,
  link = '',
  focus: [Focus, focus] = [],
  state: [State, state] = [],
  actions: Actions,
  relations: [Relations, relations] = [],
  overrides: { focus: [FocusOverride, focusOverride] = [], ...overrides } = {},
  onReady,
  onHover,
  ...props
}: PosterProps) => {
  const [hover, hoverProps] = useHover({ mouseEnterDelayMS: 0, mouseLeaveDelayMS: 0 }, onHover)
  const isTouchable = useTouchable()
  const isHover = !isTouchable && hover
  const [loaded, setLoaded] = useState(details?.poster ? false : true)
  const ready = useMemo(() => loaded && overrides?.ready !== false, [loaded, overrides?.ready])
  // TODO: Refacto, create custom util to call n fn?
  const loadProps = useMemo(() => {
    const cb = () => {
      setLoaded(true)

      if (typeof onReady === 'function') {
        onReady()
      }
    }

    return ({ onLoad: cb, onError: cb })
  }, [])

  const styles = useMemo(
    () => ({
      ...UIPoster.styles,
      focus: {
        ...UIPoster.styles.focus,
        opacity: ready && loaded && (isHover || FocusOverride) ? 1 : 0,
        transitionDelay: FocusOverride && ready ? '800ms' : '0ms',
      },
      badges: {
        ...UIPoster.styles.badges,
        opacity: ready && loaded ? 1 : 0,
        transitionDelay: ready ? '800ms' : '0ms',
      },
      actions: {
        ...UIPoster.styles.actions,
        opacity: ready && loaded && isHover ? 1 : 0,
      },
      relations: {
        ...UIPoster.styles.relations,
        opacity: ready && loaded && isHover ? 1 : 0,
        transitionDuration: ready && loaded && isHover ? '400ms' : '0ms',
      },
    }),
    [ready, loaded, isHover],
  )

  return (
    <PosterWrapper {...hoverProps}>
      <div sx={styles.element}>
        <div sx={styles.focus}>{!isHover && FocusOverride ? <FocusOverride {...focusOverride} /> : (Focus && <Focus {...focus} />)}</div>
        <div sx={styles.badges}>
          {State && <State {...state} />}
          {!!Actions && <div sx={styles.actions}>{<Actions />}</div>}
        </div>
        <Link to={link} sx={styles.link} disabled={!link}>
          <Picture
            {...props}
            {...loadProps}
            path={details?.poster}
            ready={ready}
          />
          {ready && overrides?.hover !== false && (
            <Hover
              title={details?.title}
              subtitle={details?.caption}
              year={details?.year}
              open={isHover}
              pad={!!Relations}
            />
          )}
        </Link>
      </div>
      <div sx={styles.relations}>{Relations && <Relations {...relations} />}</div>
    </PosterWrapper>
  )
}

UIPoster.styles = {
  element: {
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
  focus: {
    position: 'absolute',
    top: '0.75em',
    left: '0.5em',
    zIndex: 1,
    transition: 'opacity 250ms ease-in-out',
  },
  badges: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    top: '0.5em',
    right: '0.5em',
    zIndex: 1,
    transition: 'opacity 250ms ease-in-out',
  },
  actions: {
    marginTop: 8,
    transition: 'opacity 250ms ease-in-out',
  },
  link: {
    display: 'flex',
    height: '100%',
    width: '100%',
  },
  relations: {
    position: 'absolute',
    bottom: '0em',
    left: '0em',
    zIndex: 1,
    transition: 'opacity 400ms ease-in-out',
  },
}

export const Poster = memo(UIPoster)

const UIPosterWrapper = ({ ...props }) => (
  <div {...props} sx={UIPosterWrapper.styles.element} />
)

UIPosterWrapper.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    height: '15em',
    maxHeight: '100%',
    width: '10em',
    maxWidth: '100%',
  },
}

const PosterWrapper = memo(UIPosterWrapper)

const UIHover = ({
  title,
  subtitle = null,
  year = null,
  open = false,
  pad = false,
  ...props
}: {
  title: string
  subtitle?: string
  year?: number
  open: boolean
  pad?: boolean
}) => {
  const styles = useMemo(() => ({
    element: {
      ...UIHover.styles.element,
      transform: `translate3d(0, ${open ? '0%' : '100%'}, 0)`,
      ...(pad ? { paddingBottom: '4.25em' } : {}),
    }
  }), [open, pad])

  return (
    <div {...props} sx={styles.element}>
      <span>
        <strong>{title}</strong>
        {!!year && <span> ({year})</span>}
      </span>
      {!!subtitle && <small>{subtitle}</small>}
    </div>
  )
}

UIHover.styles = {
  element: {
    position: 'absolute',
    bottom: '0em',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'blackShadow',
    color: 'shadowText',
    padding: 4,
    fontSize: 6,
    transition: 'transform 250ms ease-in-out',
    '>span': {
      display: 'block',
      margin: '0 0 0.5em 0',
      '>strong': {
        fontWeight: 'bold',
      },
    },
    '>small': {
      display: 'block',
      margin: '0 0 0.5em 0',
      lineHeight: 'body',
    },
  },
}

const Hover = memo(UIHover)
