import { memo, useCallback, useMemo, useState } from 'react'
import { LinkProps } from 'react-router-dom'
import { Link } from '../../../atoms/Link/Link'
import { Picture, PictureProps } from '../../../atoms/Picture/Picture'
import { MovieDetails } from '../../../components/Movie/Movie'
import { PersonDetails } from '../../../components/Person/Person'

export interface PosterProps extends Omit<PictureProps, 'path' | 'ready' | 'onReady'> {
  details: MovieDetails | PersonDetails
  link?: LinkProps
  state?: [React.FC, any] | []
  focus?: [React.FC, any] | []
  action?: [React.FC, any] | []
  relations?: [React.FC, any] | []
  guests?: [React.FC, any, string] | []
  overrides?: { focus?: [React.FC, any] | [], ready?: boolean, hover?: boolean }
  onReady?: () => void
}

const UIPoster = ({
  details,
  link = null,
  focus: [Focus, focus] = [],
  state: [State, state] = [],
  action: [Action, action] = [],
  relations: [Relations, relations] = [],
  guests: [Guests, guests, guestsDisplay] = [],
  overrides: { focus: [FocusOverride, focusOverride] = [], ...overrides } = {},
  onReady,
  ...props
}: PosterProps) => {
  const [loaded, setLoaded] = useState(details?.poster ? false : true)
  const ready = useMemo(() => loaded && overrides?.ready !== false, [loaded, overrides?.ready])
  const onPosterReady = useCallback(() => {
    setLoaded(true)

    if (typeof onReady === 'function') {
      onReady()
    }
  }, [onReady])

  const styles = useMemo(() => ({
    ...UIPoster.styles,
    element: {
      ...UIPoster.styles.element,
      '>div:nth-child(2)': {
        opacity: 0,
        transitionDuration: '0ms',
      },
      '>div:nth-child(3)': {
        opacity: ready && guestsDisplay === 'always' ? 1 : 0,
        transitionDuration: '0ms',
      },
      '&:hover': {
        '>div:nth-child(2)': {
          opacity: ready ? 1 : 0,
          transitionDuration: ready ? '400ms' : '0ms',
        },
        '>div:nth-child(3)': {
          opacity: ready && guestsDisplay !== 'never' ? 1 : 0,
          transitionDuration: ready ? '400ms' : '0ms',
        },
      },
    },
    wrapper: {
      ...UIPoster.styles.wrapper,
      '>div:nth-child(1)': {
        opacity: ready && FocusOverride ? 1 : 0,
      },
      '>div:nth-child(2)': {
        opacity: 0,
      },
      '>div:nth-child(3)>div:nth-child(2)': {
        opacity: 0,
      },
      '>a >div': {
        zIndex: -1,
        transform: `translate3d(0, 100%, 0)`,
        transition: 'transform 250ms ease-in-out, z-index 0ms linear 250ms',
      },
      '&:hover': {
        '>div:nth-child(1)': {
          opacity: 0,
        },
        '>div:nth-child(2)': {
          opacity: ready ? 1 : 0,
        },
        '>div:nth-child(3)>div:nth-child(2)': {
          opacity: ready ? 1 : 0,
        },
        '>a >div': {
          zIndex: ready ? 0 : -1,
          transform: (ready && overrides.hover !== false) ? `translate3d(0, 0%, 0)` : `translate3d(0, 100%, 0)`,
          transition: 'transform 250ms ease-in-out, z-index 0ms linear',
        },
      },
    },
    badges: {
      ...UIPoster.styles.badges,
      opacity: ready ? 1 : 0,
      transitionDelay: ready ? '800ms' : '0ms',
    },
  }), [ready, FocusOverride, guestsDisplay])

  return (
    <div sx={styles.element}>
      <div sx={styles.wrapper}>
        <div sx={styles.focus}>{FocusOverride && <FocusOverride {...focusOverride} />}</div>
        <div sx={styles.focus}>{Focus && <Focus {...focus} />}</div>
        <div sx={styles.badges}>
          {State && <State {...state} />}
          {Action && <Action {...action} />}
        </div>
        <Link to={link?.to} state={link?.state} sx={styles.link} disabled={!link?.to}>
          <Picture
            {...props}
            ready={ready}
            path={details?.poster}
            onReady={onPosterReady}
          />
          <Hover
            title={details?.title}
            subtitle={details?.caption}
            year={details?.year}
            pad={!!Relations}
          />
        </Link>
      </div>
      <div sx={styles.relations}>{Relations && <Relations {...relations} />}</div>
      <div sx={styles.guests}>{Guests && <Guests {...guests} />}</div>
    </div>
  )
}

UIPoster.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    height: '15em',
    maxHeight: '100%',
    width: '10em',
    maxWidth: '100%',
  },
  wrapper: {
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    position: 'absolute',
    top: '0.5em',
    right: '0.5em',
    zIndex: 1,
    transition: 'opacity 250ms ease-in-out',
    '>*': {
      marginTop: 10,
    },
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
    '&:hover': {
      zIndex: 2,
    },
  },
  guests: {
    position: 'absolute',
    bottom: '0em',
    right: '0em',
    zIndex: 1,
    transition: 'opacity 400ms ease-in-out',
    '&:hover': {
      zIndex: 2,
    },
  },
}

export const Poster = memo(UIPoster)

const UIHover = ({
  title,
  subtitle = null,
  year = null,
  pad = false,
  ...props
}: {
  title: string
  subtitle?: string
  year?: number
  pad?: boolean
}) => {
  const styles = useMemo(() => ({
    element: {
      ...UIHover.styles.element,
      ...(pad ? { paddingBottom: '4.25em' } : {}),
    }
  }), [pad])

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
    color: 'textShadow',
    padding: 4,
    fontSize: 6,
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
