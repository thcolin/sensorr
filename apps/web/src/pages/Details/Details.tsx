import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useThemeUI } from '@theme-ui/core'
import { useHistoryState, createPendingReducer } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Billboard, Link, ReviewsBadge, pictureSrc } from '@sensorr/ui'
import { Provider as ExpandProvider, useExpandContext } from './contexts/Expand'
import { Head } from './components/Head'
import { Poster } from './components/Poster'
import { Overview } from './components/Overview'
import { Skeleton } from './components/Skeleton'
import { Tabs } from '../../components/Entities/Tabs'
import { MovieActions, OptionInput, ShowTicket } from './components/Actions'
import { Releases } from './components/Releases'
import { Sensorr } from '../../components/Sensorr'
import { Metadata } from './components/Metadata'
import { Externals, Meaningful } from './components/Externals'
import { Artworks, TitleLogo, useArtworksOf } from '../../components/Artworks/Artworks'
import { ratingKeyOf } from '../../components/Artworks/candidates'
import { artworkOf } from '../../store/plex'
import { useAPI } from '../../store/api'

const pendingReducer = createPendingReducer({
  entity: true,
  poster: true,
  billboard: true,
})

// The theme's neutrals retinted from the poster, so every block keeps its own styles on the poster's colors
const paintOf = ({ backgroundColor, color }) => {
  const mix = (amount) => `color-mix(in srgb, ${color} ${amount}%, ${backgroundColor})`
  const tokens = {
    text: color,
    textLight: color,
    grayDarkest: color,
    grayDarker: color,
    grayDark: mix(25),
    gray: mix(12),
    grayLight: mix(8),
    grayLighter: mix(6),
    grayLightest: mix(3),
    'gray-500': color,
    'gray-550': color,
    'gray-600': color,
    'gray-700': mix(35),
    'gray-800': mix(25),
    'gray-900': mix(12),
  }

  return {
    backgroundColor,
    color,
    transition: 'background-color 800ms ease-in-out, color 800ms ease-in-out',
    '--poster-cutout': backgroundColor,
    '--poster-pill': color,
    '--poster-pill-text': backgroundColor,
      ...Object.fromEntries(Object.entries(tokens).map(([token, value]) => [`--theme-ui-colors-${token}`, value])),
  }
}

const UIDetails = ({
  entity,
  additional,
  loading,
  details,
  behavior,
  state,
  setState,
  metadata,
  setMetadata,
  proceedRelease,
  removeRelease,
  tabs,
  actions = null,
  search = null,
  summary = null,
  children = null,
  variant = 'page',
  initialPalette = null,
  ...props
}) => {
  const { title, tagline, overview, poster, billboard, meaningful } = details
  const artworks = useArtworksOf(behavior, entity?.id, metadata)
  // A show opens its settings once it is in the library, which is known only once its metadata loads
  const page = variant === 'page'
  // In the drawer, every movie opened from a grid would share the grid's history entry: its toggles stay local
  const remembered = {
    metadata: useHistoryState('metadata', behavior === 'tv' ? null : ['wished', 'archived', 'missing'].includes(state), { enabled: page }),
    meaningful: useHistoryState('meaningful', false, { enabled: page }),
  }
  const local = {
    metadata: useState(null),
    meaningful: useState(false),
  }
  const [metadataState, setMetadataState] = page ? remembered.metadata : local.metadata
  const [meaningfulState, setMeaningfulState] = page ? remembered.meaningful : local.meaningful

  const toggleSensorr = useRef() as any

  const { expanded } = useExpandContext() as any
  const { theme } = useThemeUI() as any
  const palette = usePalette(
    !!poster && pictureSrc(poster, 'w92'),
    {
      backgroundColor: theme.rawColors.grayLight,
      color: theme.rawColors.text,
      alternativeColor: theme.rawColors.text,
      negativeColor: theme.rawColors.text,
    },
    poster,
  )
  // The drawer knows the poster's palette from the poster tapped, before this one resolves
  const shown = (palette.loading || palette.initial) && initialPalette ? initialPalette : palette.palette
  const paint = useMemo(() => paintOf(shown), [shown])

  const [pending, mutatePending] = useReducer(pendingReducer.reducer, pendingReducer.initialState)
  const ready = props.ready !== false && Object.values(pending).every(pending => !pending) && !!entity?.id
  const onReady = useMemo(() => ({
    poster: () => mutatePending({ poster: false }),
    billboard: () => mutatePending({ billboard: false }),
  }), [])

  useEffect(() => {
    mutatePending({ entity: loading })
    mutatePending({ poster: loading || !!poster })
    mutatePending({ billboard: loading || !!billboard })
  }, [loading])

  const api = useAPI()
  const tmdbLogo = entity?.images?.logos?.[0]?.file_path
  const logo = variant === 'drawer' && (artworks?.logo ? pictureSrc(artworkOf(artworks.logo, null, api.access_token), 'w500') : tmdbLogo ? pictureSrc(tmdbLogo, 'w500') : null)

  const posterBlock = (
    <Poster
      path={poster}
      palette={palette.palette}
      behavior={behavior}
      ready={ready}
      onReady={onReady.poster}
      requested_by={metadata?.requested_by}
      state={state}
      setState={setState}
      artworks={['movie', 'tv'].includes(behavior) && !!ratingKeyOf(artworks) && <Artworks behavior={behavior} entity={entity} artworks={artworks} />}
      astride={variant === 'drawer'}
    />
  )

  const ticketBlock = (
    <>
      {behavior === 'tv' && !!search && (
        <div sx={UIDetails.styles.ticket}>
          <ShowTicket
            palette={!palette.loading && !palette.initial ? palette.palette : null}
            ready={ready && state !== 'loading'}
            entity={entity}
            toggleSensorr={search}
          />
        </div>
      )}
      {behavior === 'movie' && (
        <div sx={UIDetails.styles.ticket}>
          <MovieActions
            palette={!palette.loading && !palette.initial ? palette.palette : null}
            ready={ready && state !== 'loading'}
            entity={entity}
            metadata={metadata}
            setMetadata={setMetadata}
            toggleSensorr={(e) => toggleSensorr.current(e)}
          />
          <Sensorr
            entity={entity || {}}
            loading={!ready || state === 'loading'}
            metadata={metadata}
            setPortalToggle={(toggleOpen) => toggleSensorr.current = (e) => toggleOpen(e)}
          />
        </div>
      )}
    </>
  )

  const titleBlock = (
    <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 10 }}>
      <h1 sx={UIDetails.styles.title}>{artworks?.logo ? <TitleLogo key={artworks.logo} path={artworks.logo} title={title} /> : title}</h1>
    </Skeleton>
  )

  const metadataBlock = (
    <>
      {behavior === 'movie' && (
        <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 4 }}>
          <details sx={UIDetails.styles.metadata} onToggle={(e: any) => setMetadataState(e.target.open)} open={metadataState}>
            <summary>
              <span />
              <h4 sx={UIDetails.styles.subtitle}>
                {!!entity.original_title && entity.original_title !== title && (<strong>{entity.original_title}</strong>)}
                {!!entity.original_title && !!meaningful.year && (<span> </span>)}
                {!!meaningful.year && (<span>({<meaningful.year />})</span>)}
              </h4>
            </summary>
            <div>
              <Metadata
                entity={entity || {}}
                metadata={metadata}
                setMetadata={setMetadata}
                lists={true}
              />
            </div>
          </details>
        </Skeleton>
      )}
      {behavior === 'tv' && (
        <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 4 }}>
          {actions ? (
            <details sx={UIDetails.styles.metadata} onToggle={(e: any) => setMetadataState(e.target.open)} open={metadataState ?? variant !== 'drawer'}>
              <summary>
                <span />
                <ShowSubtitle entity={entity} title={title} meaningful={meaningful} summary={summary} />
              </summary>
              <div>
                {actions}
              </div>
            </details>
          ) : (
            <ShowSubtitle entity={entity} title={title} meaningful={meaningful} summary={summary} />
          )}
        </Skeleton>
      )}
    </>
  )

  const externalsBlock = ['movie', 'tv'].includes(behavior) && (
    <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 4 }}>
      <Externals entity={entity} metadata={metadata} additional={additional} meaningful={meaningful} />
    </Skeleton>
  )

  const meaningfulBlock = (
    <Skeleton palette={palette.palette} ready={ready} placeholder={false} sx={{ marginBottom: 4 }}>
      <Meaningful meaningful={meaningful} open={meaningfulState} onToggle={setMeaningfulState} />
    </Skeleton>
  )

  const overviewBlock = (
    <Skeleton palette={palette.palette} ready={ready} placeholder={false}>
      <div>
        {!!tagline && <p sx={UIDetails.styles.tagline}>{tagline}</p>}
        <Overview children={overview} />
      </div>
    </Skeleton>
  )

  const releasesBlock = behavior === 'movie' && (
    <Releases
      movie={entity}
      metadata={metadata}
      proceedRelease={proceedRelease}
      removeRelease={removeRelease}
      entities={metadata?.releases || []}
      ready={ready}
    />
  )

  const restBlock = (
    <>
      {variant === 'drawer' ? (
        <div style={paintOf({ backgroundColor: shown.color, color: shown.backgroundColor })}>{releasesBlock}</div>
      ) : releasesBlock}
      {children}
      <div>
        <div sx={UIDetails.styles.tabs}>
          {(tabs || []).map(({ id, component: Component = Tabs, tabs }) => (
            <Component key={id} id={id} tabs={tabs} props={() => ({ palette: palette.palette })} />
          ))}
        </div>
      </div>
    </>
  )

  if (variant === 'drawer') {
    return (
      <div sx={UIDetails.styles.drawer.element} style={paint}>
        <div sx={UIDetails.styles.drawer.backdrop}>
          <Billboard path={billboard} palette={palette.palette} ready={ready} onReady={onReady.billboard} lazy={false} fade={0.5} blur={4} />
        </div>
        <div sx={UIDetails.styles.drawer.head}>
          <div sx={UIDetails.styles.drawer.poster} data-drawer-poster>
            {posterBlock}
          </div>
          <Skeleton palette={palette.palette} ready={ready} sx={{ alignSelf: 'stretch', marginBottom: 10 }}>
            <Link to={`/${behavior}/${entity?.id}`} sx={{ variant: 'link.reset', display: 'block' }}>
              {logo ? (
                <h1 sx={UIDetails.styles.drawer.logo} style={{ maskImage: `url("${logo}")`, WebkitMaskImage: `url("${logo}")` }}>
                  <span>{title}</span>
                </h1>
              ) : (
                <h1 sx={UIDetails.styles.drawer.title}>{title}</h1>
              )}
            </Link>
          </Skeleton>
          {metadataBlock}
          <Skeleton palette={palette.palette} ready={ready} placeholder={false}>
            <div sx={UIDetails.styles.drawer.ratings}>
              <ReviewsBadge entity={entity} reviews={additional?.reviews} palette={shown} forceOpen={true} />
            </div>
          </Skeleton>
          <Skeleton palette={palette.palette} ready={ready} placeholder={false}>
            <div sx={UIDetails.styles.drawer.externals}>
              <Externals entity={entity} metadata={metadata} additional={additional} meaningful={meaningful} reviews={false} />
            </div>
          </Skeleton>
          {meaningfulBlock}
        </div>
        <div sx={UIDetails.styles.drawer.body}>
          {overviewBlock}
          {ticketBlock}
        </div>
        {restBlock}
      </div>
    )
  }

  return (
    <div sx={UIDetails.styles.element}>
      <Head billboard={billboard} palette={palette.palette} entity={entity} behavior={behavior} ready={ready} onReady={onReady.billboard} />
      <div sx={UIDetails.styles.body}>
        <div sx={{ ...UIDetails.styles.poster, marginTop: expanded ? '1em' : [{ person: '-30vh', collection: '-15vh', movie: '-15vh', tv: '-15vh' }[behavior], '-25vh'] }}>
          {posterBlock}
          <a href={`https://www.themoviedb.org/${behavior}/${entity.id}/edit`} target='_blank' rel='noopener noreferrer'>
            Contribute to TheMovieDB
          </a>
          {ticketBlock}
        </div>
        <div sx={{ ...UIDetails.styles.wrapper, marginTop: ['0em', expanded ? '1em' : '-2em'] }}>
          <div sx={UIDetails.styles.container}>
            <div sx={UIDetails.styles.content}>
              {titleBlock}
              {metadataBlock}
              {externalsBlock}
              {meaningfulBlock}
            </div>
            {overviewBlock}
          </div>
        </div>
      </div>
      {restBlock}
    </div>
  )
}

UIDetails.styles = {
  drawer: {
    // Transparent above its top: the knob, then the poster standing out of the drawer
    element: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      marginTop: '6em',
    },
    backdrop: {
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '16em',
      opacity: 0.5,
      maskImage: 'linear-gradient(to bottom, black, transparent)',
    },
    head: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      marginTop: '-3.5em',
      paddingX: 4,
      textAlign: 'center',
    },
    poster: {
      marginBottom: 2,
      '--theme-ui-colors-gray': 'var(--poster-pill)',
      '--theme-ui-colors-grayDark': 'var(--poster-pill)',
      '--theme-ui-colors-text': 'var(--poster-pill-text)',
      '>div': {
        height: '15em',
        width: '10em',
      },
    },
    title: {
      margin: '0em',
      fontSize: '2.5em',
      lineHeight: 'heading',
      overflowWrap: 'anywhere',
    },
    logo: {
      width: '100%',
      maxWidth: '20em',
      height: '5rem',
      marginX: 'auto',
      marginY: '0em',
      backgroundColor: 'currentColor',
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      '>span': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
      },
    },
    ratings: {
      display: 'flex',
      justifyContent: 'center',
      fontSize: 3,
    },
    // One wrapping row: the column a phone gets on the page leaves the Plex chevron alone on its line
    externals: {
      marginY: 8,
      '>div': {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        '>div': {
          margin: '0em !important',
        },
      },
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingX: 4,
      paddingTop: 4,
      paddingBottom: 2,
      textAlign: 'center',
      '>*': {
        width: '100%',
      },
      '>div:last-of-type': {
        width: '100%',
        maxWidth: '17em',
      },
    },
  },
  ticket: {
    width: '100%',
    maxWidth: ['17em', 'unset'],
    marginTop: ['2em', '4em'],
    marginBottom: ['1em', '2em'],
    marginRight: ['-1em', '0em'],
  },
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  body: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignSelf: 'center',
    width: '100%',
    maxWidth: '105em',
    paddingX: [4, '5em'],
    marginBottom: 2,
  },
  poster: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: ['center', 'flex-start'],
    paddingRight: ['0em', '3em'],
    marginBottom: [2, '0em'],
    transition: 'margin 400ms ease-in-out',
    maxWidth: ['unset', '19em'],
    '>a': {
      alignSelf: 'center',
      color: 'grayDark',
      marginY: 8,
      // Below the artworks badge astride the poster's corner, which is wider than the gap on a phone
      marginTop: ['2em', 8],
      textAlign: 'center',
      textDecoration: 'none',
      opacity: 0.625,
      fontSize: 6,
      transition: 'opacity ease 300ms',
      '&:hover': {
        opacity: 1,
      },
    },
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: ['center', 'left'],
    overflow: 'hidden',
    transition: 'margin 400ms ease-in-out',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 4,
  },
  title: {
    margin: '0em',
    fontSize: '2.5em',
  },
  subtitle: {
    margin: '0em',
    fontSize: 3,
    fontWeight: 'normal',
    '>strong': {
      fontWeight: 'strong',
    },
  },
  summary: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    justifyContent: ['center', 'flex-start'],
    columnGap: 6,
    marginLeft: 6,
    fontFamily: 'monospace',
    fontSize: 5,
    color: 'grayDarkest',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    '>span:not(:first-of-type)::before': {
      content: '"·"',
      marginRight: 6,
    },
  },
  metadata: {
    '>summary': {
      position: 'relative',
      lineHeight: 'space',
      '>span': {
        position: 'absolute',
        width: '1em',
        height: '100%',
        left: '0em',
        margin: '0em',
        cursor: 'pointer',
      },
      '>h4': {
        display: 'inline-block',
        marginLeft: 8,
      },
    },
    '>div': {
      borderBottom: '1px solid',
      borderColor: 'grayLight',
      paddingTop: [4, 8],
    },
  },
  choices: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingY: 2,
    '>label': {
      marginX: 4,
      cursor: 'pointer',
      '>span': {
        display: 'block',
        paddingX: 0,
        paddingY: 9,
        fontSize: 5,
        fontWeight: 'semibold',
        color: 'primary',
        backgroundColor: 'transparent',
        border: '0.125em solid',
        borderColor: 'primary',
        borderRadius: '2em',
        opacity: 0.5,
        transition: 'opacity ease 300ms, color ease 300ms, background-color ease 300ms',
        '&:hover': {
          opacity: 0.75,
        },
      },
      '>input': {
        display: 'none',
        '&:checked + span': {
          opacity: 1,
          color: 'white !important',
          backgroundColor: 'primary',
        },
      },
    },
  },
  tagline: {
    margin: '0em',
    fontWeight: 'semibold',
    marginBottom: 6,
  },
  tabs: {
    marginBottom: 4,
  },
}

const Details = memo(UIDetails)

const ShowSubtitle = ({ entity, title, meaningful, summary = null }) => (
  <>
    <h4 sx={UIDetails.styles.subtitle}>
      {!!entity.original_name && entity.original_name !== title && (<strong>{entity.original_name}</strong>)}
      {!!entity.original_name && entity.original_name !== title && !!meaningful.year && (<span> </span>)}
      {!!meaningful.year && (<span>({<meaningful.year />})</span>)}
    </h4>
    {!!summary?.length && <code sx={UIDetails.styles.summary}>{summary}</code>}
  </>
)

const UIDetailsWrapper = ({ ...props }) => (
  <ExpandProvider>
    <Details {...props as any} />
  </ExpandProvider>
)

export default memo(UIDetailsWrapper)
