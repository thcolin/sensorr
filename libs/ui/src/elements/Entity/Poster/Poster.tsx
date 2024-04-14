import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { LinkProps } from 'react-router-dom'
import { Link } from '../../../atoms/Link/Link'
import { Picture, PictureProps } from '../../../atoms/Picture/Picture'
// import { MovieDetails } from '../../../components/Movie/Movie'
// import { PersonDetails } from '../../../components/Person/Person'

export interface PosterProps extends Omit<PictureProps, 'path' | 'ready' | 'onReady'> {
  details: any // MovieDetails | PersonDetails
  link?: LinkProps
  ready?: boolean
  meaningful?: boolean
  actions?: { state?: { component: React.FC, props: any }, proposal?: { component: React.FC, props: any } }
  badges?: { component: React.FC, props: any }[]
  onReady?: () => void
}

const UIPoster = ({
  details,
  link = null,
  meaningful = true,
  actions = {},
  badges = [],
  onReady,
  ...props
}: PosterProps) => {
  const ref = useRef()
  const [loaded, setLoaded] = useState(details?.poster ? false : true)
  const ready = useMemo(() => loaded && props?.ready !== false, [loaded, props?.ready])
  const onPosterReady = useCallback(() => {
    setLoaded(true)

    if (typeof onReady === 'function') {
      onReady()
    }
  }, [onReady])

  return (
    <div sx={UIPoster.styles.element} ref={ref}>
      <div sx={UIPoster.styles.wrapper}>
        <div
          sx={{
            ...UIPoster.styles.actions,
            opacity: ready ? 1 : 0,
            transition: ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
          }}
        >
          {actions?.state?.component && <div sx={UIPoster.styles.state}><actions.state.component {...actions?.state?.props} /></div>}
          {actions?.proposal?.component && <div sx={UIPoster.styles.proposal}><actions.proposal.component {...actions?.proposal?.props} /></div>}
        </div>
        <Link to={link?.to} state={link?.state} sx={UIPoster.styles.link} disabled={!link?.to}>
          <Picture
            {...props}
            ready={ready}
            path={details?.poster}
            onReady={onPosterReady}
          />
        </Link>
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
              {details?.title}
            </Link>
          </strong>
          <div sx={UIPoster.styles.subtitle}>
            {!!details?.meaningful?.year && (
              <span>
                <details.meaningful.year />
                {(!!details?.meaningful?.genres || !!details?.caption) && <span sx={{ marginX: 8 }}>&nbsp;·&nbsp;</span>}
              </span>
            )}
            {(!!details?.meaningful?.genres || !!details?.caption) && (
              <small title={details?.caption}>
                {!!details?.meaningful?.genres ? <details.meaningful.genres emoji={false} /> : details?.caption}
              </small>
            )}
          </div>
          <div sx={UIPoster.styles.badges}>
            {badges.map(({ component: Component, props }) => <Component {...props} parent={ref} />)}
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
    width: ['6em', '10em'],
    maxWidth: '100%',
    marginRight: [4, 2],
    marginLeft: [8, 4],
  },
  wrapper: {
    position: 'relative',
    width: '100%',
    marginTop: 5,
  },
  actions: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    top: '-0.875em',
    right: '-0.875em',
    zIndex: 2,
  },
  state: {
    backgroundColor: 'grayLightest',
    padding: 10,
    borderRadius: '50%',
  },
  proposal: {
    backgroundColor: 'grayLightest',
    padding: 10,
    marginTop: '-0.75em',
    marginRight: ['-0.125em', '-0.5em'],
    borderRadius: '50%',
  },
  link: {
    display: 'flex',
    height: ['9em', '15em'],
    maxHeight: '100%',
    width: '100%',
  },
  meaningful: {
    position: 'relative',
    minHeight: ['4.5em', '5.5em'],
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    marginTop: 8,
    marginBottom: '2.5em',
    overflow: 'hidden',
  },
  skeleton: {
    position: 'absolute',
    height: '4.25em',
    width: '100%',
  },
  title: {
    fontSize: [6, 5],
    fontFamily: 'heading',
    fontWeight: 'semibold',
    color: 'text',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 10,
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
  badges: {
    display: 'flex',
    alignItems: 'flex-start',
    minHeight: ['1.75em', '2.75em'],
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    '>*:not(:last-child)': {
      marginRight: 8
    },
  },
}

export const Poster = memo(UIPoster)
