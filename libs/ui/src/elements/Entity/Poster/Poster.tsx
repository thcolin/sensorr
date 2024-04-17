import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { LinkProps } from 'react-router-dom'
import Tippy from '@tippyjs/react'
import { useDevice } from '@sensorr/utils'
import { Link } from '../../../atoms/Link/Link'
import { Picture, PictureProps } from '../../../atoms/Picture/Picture'
import { Credits } from '../../../components/Movie/Credits/Credits'
// import { MovieDetails } from '../../../components/Movie/Movie'
// import { PersonDetails } from '../../../components/Person/Person'

export interface PosterProps extends Omit<PictureProps, 'path' | 'ready' | 'onReady'> {
  details: any // MovieDetails | PersonDetails
  link?: LinkProps
  ready?: boolean
  meaningful?: boolean
  badges?: {
    state?: { component: React.FC, props: any },
    proposal?: { component: React.FC, props: any },
    reviews?: { component: React.FC, props: any },
    guests?: { component: React.FC, props: any },
  }
  credits?: { entity: any, state?: 'loading' | 'ignored' | 'followed' }[] | false
  onReady?: () => void
}

const UIPoster = ({
  details,
  link = null,
  meaningful = true,
  badges = {},
  onReady,
  credits = false,
  onMouseEnter,
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

  return (
    <div sx={UIPoster.styles.element} ref={ref} onMouseEnter={onMouseEnter}>
      <div sx={UIPoster.styles.wrapper}>
        <div
          sx={{
            ...UIPoster.styles.left,
            opacity: ready ? 1 : 0,
            transition: ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
          }}
        >
          {badges?.reviews?.component && <div sx={UIPoster.styles.reviews}><badges.reviews.component {...badges?.reviews?.props} /></div>}
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
        <Link to={link?.to} state={link?.state} sx={UIPoster.styles.link} disabled={!link?.to}>
          <Picture
            {...props}
            ready={ready}
            path={details?.poster}
            onReady={onPosterReady}
          />
        </Link>
        <div
          sx={{
            ...UIPoster.styles.guests,
            opacity: ready ? 1 : 0,
            transition: ready ? 'opacity 400ms ease-in-out 400ms' : 'opacity 400ms ease-in-out',
          }}
        >
          {badges?.guests?.component && <badges.guests.component {...badges?.guests?.props} />}
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
              {details?.title}
            </Link>
          </strong>
          <div sx={UIPoster.styles.subtitle}>
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
          {credits !== false && (
            <Tippy
              theme='transparent'
              placement='top'
              interactive={true}
              hideOnClick={true}
              popperOptions={{ modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', enabled: false }] }}
              content={<div sx={{ marginBottom: ['-0.375rem', '-0.5rem'], marginLeft: ['-0.125rem', '0.5rem'], fontSize: [10, 9] }}><Credits credits={credits || []} length={device === 'mobile' ? 4 : 5} /></div>}
            >
              <button sx={UIPoster.styles.credits}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" height='1em' width='1em'>
                  <path fill="currentColor" d="M5273.1 2397.6v-2c0-2.8-5-4-9.7-4s-9.7 1.3-9.7 4v2c0 1.8.7 3.6 2 4.9l5 4.9c.3.3.4.6.4 1v6.4c0 .4.2.7.6.8l2.9.9c.5.1 1-.2 1-.8v-7.2c0-.4.2-.7.4-1l5.1-5c1.3-1.3 2-3.1 2-4.9zm-9.7-.1c-4.8 0-7.4-1.3-7.5-1.8.1-.5 2.7-1.8 7.5-1.8s7.3 1.3 7.5 1.8c-.2.5-2.7 1.8-7.5 1.8z"/>
                  <path fill="currentColor" d="M5268.4 2407.8c-.6 0-1 .4-1 1s.4 1 1 1h4.3c.6 0 1-.4 1-1s-.4-1-1-1h-4.3zM5272.7 2411.2h-4.3c-.6 0-1 .4-1 1s.4 1 1 1h4.3c.6 0 1-.4 1-1s-.4-1-1-1zM5272.7 2414.5h-4.3c-.6 0-1 .4-1 1s.4 1 1 1h4.3c.6 0 1-.4 1-1 0-.5-.4-1-1-1zM96 40.5c-11.1-4.6-23-7.4-35-7.9.4 4 .2 8-.6 11.9-.1.7-.4 1.3-.5 2 .7-.2 1.5-.2 2.2-.1 2.6.5 4.6 2.6 5.4 5.8.1.5 0 1-.4 1.3-.3.4-.8.5-1.3.4l-8.3-1.4c-3 5.5-7.6 10-13.2 12.6.1 1.5.3 2.9.6 4.4 2 9.7 9.6 17.1 19.4 18.8 9.8 1.7 19.4-2.6 24.7-11 2.3-3.7 3.8-7.7 4.6-12l3.9-22.1c.1-1.1-.4-2.2-1.5-2.7zM75.9 74.6 58 71.5c-1-.2-1.7-1.2-1.3-2.2 1.8-4.8 6.8-7.9 12.1-6.9 5.3.9 9 5.5 9 10.7.1.9-.8 1.7-1.9 1.5zm9.8-17.8c-.3.4-.8.5-1.3.4l-9.7-1.7c-.5-.1-.9-.4-1.1-.8-.2-.4-.2-1 .1-1.4 1.7-2.7 4.4-4.1 7-3.6s4.6 2.6 5.4 5.8c0 .4-.1.9-.4 1.3z"/>
                  <path fill="currentColor" d="M55.1 43.4c.9-4.2 1-8.6.2-12.8L51.4 8.4c-.2-1.1-1.1-1.9-2.2-2-15.4-.8-31 2-45.2 8-1 .4-1.6 1.5-1.4 2.6l3.9 22.2c.8 4.3 2.3 8.3 4.6 12 5.2 8.4 14.9 12.8 24.7 11 9.7-1.7 17.3-9.1 19.3-18.8zM15.7 31.1c-.5.1-1-.1-1.3-.4-.3-.4-.5-.8-.4-1.3.7-3.1 2.7-5.3 5.3-5.8s5.2.9 7 3.6c.3.4.3.9.1 1.4-.2.5-.6.8-1.1.9l-9.6 1.6zm17.7 18.2c-5.3.9-10.3-2.1-12.1-6.9-.4-1 .3-2 1.3-2.2l17.9-3.1c1-.2 2 .6 2 1.6-.1 5.1-3.8 9.6-9.1 10.6zM45 25.2c-.2.4-.6.8-1.1.9l-9.7 1.7c-.5.1-1-.1-1.3-.4-.3-.4-.5-.8-.4-1.3.7-3.1 2.7-5.3 5.3-5.8s5.2.9 7 3.6c.3.4.3.9.2 1.3z"/>
                </svg>
              </button>
            </Tippy>
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
    overflow: 'hidden',
  },
  wrapper: {
    position: 'relative',
    width: '100%',
    marginTop: 5,
  },
  left: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    top: '-1em',
    left: ['-0.5em', '-0.875em'],
    fontSize: [5, 4],
    zIndex: 2,
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
    bottom: ['-4px', '-4px'],
    left: ['-8px', '-16px'],
    fontSize: ['4px', '6px'],
    zIndex: 2,
  },
  reviews: {
    backgroundColor: 'grayLightest',
    padding: 10,
    borderRadius: '2em',
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
    minHeight: ['4em', '4.25em'],
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    marginTop: 8,
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
    marginBottom: 6,
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
  credits: {
    variant: 'button.reset',
    color: 'gray',
    borderRadius: '0.25em',
    transition: 'all 200ms ease-in-out',
    paddingTop: 11,
    ':hover': {
      color: 'grayDark',
      backgroundColor: 'grayLight'
    },
  },
}

export const Poster = memo(UIPoster)
