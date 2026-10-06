import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useThemeUI } from '@theme-ui/core'
import Color from 'color'
import { useHistoryState, createPendingReducer } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Bar, Billboard, Lines, Link, ReviewsBadge, pictureSrc, reveal } from '@sensorr/ui'
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
import { Artworks, TitleLogo, logoSrcOf, useArtworksOf } from '../../components/Artworks/Artworks'
import { ratingKeyOf } from '../../components/Artworks/candidates'
import { logoFilterOf, toneOfImage } from '../../components/Artworks/tone'
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
    '--poster-pill': color,
    '--poster-pill-text': backgroundColor,
    ...Object.fromEntries(Object.entries(tokens).map(([token, value]) => [`--theme-ui-colors-${token}`, value])),
  }
}

// One of the poster's other colors on the text tokens of a block, as `Pretty` gives the year, the genres and the
// overview their own: the neutrals stay `paintOf`'s
const tintOf = (color) => color ? {
  color,
  ...Object.fromEntries(['text', 'textLight', 'grayDarkest', 'grayDarker', 'gray-500', 'gray-550', 'gray-600']
    .map(token => [`--theme-ui-colors-${token}`, color])),
} : {}

// The theme's own colors back, under what `paintOf` retinted: the pills' variables fall back to their raw values
const plainOf = (rawColors) => ({
  backgroundColor: 'transparent',
  color: rawColors.text,
  '--poster-cutout': 'initial',
  '--poster-pill': 'initial',
  '--poster-pill-text': 'initial',
  ...Object.fromEntries(Object.keys(paintOf({ backgroundColor: '', color: '' }))
    .filter(key => key.startsWith('--theme-ui-colors-'))
    .map(key => [key, rawColors[key.replace('--theme-ui-colors-', '')]])),
})

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
  // The show's subtitle and settings wait for its metadata and episodes, the externals for Wikidata
  subtitleReady = true,
  additionalReady = true,
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
  const resolved = usePalette(
    !!poster && pictureSrc(poster, 'w92'),
    {
      backgroundColor: theme.rawColors.grayLight,
      color: theme.rawColors.text,
      alternativeColor: theme.rawColors.text,
      negativeColor: theme.rawColors.text,
    },
    poster,
  )
  // The drawer is painted by the poster's ambiance, the page keeps the palette `Pretty` shares
  const ambianceOf = (palette) => variant === 'drawer' && palette?.ambiance ? palette.ambiance : palette
  const palette = { ...resolved, palette: ambianceOf(resolved.palette) }
  const initial = ambianceOf(initialPalette)
  // The drawer knows the poster's palette from the poster tapped, before this one resolves. A poster tapped before
  // its own palette resolved passes empty colors, which would leave the drawer see-through
  const shown = (palette.loading || palette.initial) && initial?.backgroundColor ? initial : palette.palette
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
  // In the drawer, the first logo that reads on the poster's colors, the one chosen in Artworks before TMDB's: a white
  // logo on a light background leaves its place to another
  const logos = useMemo(() => variant !== 'drawer' ? [] : [
    ...(artworks?.logo ? [logoSrcOf(artworks.logo, api.access_token)] : []),
    ...(entity?.images?.logos || []).slice(0, 8).map(({ file_path }) => pictureSrc(file_path, 'w500')),
  ], [variant, artworks?.logo, api.access_token, entity?.images?.logos])
  const background = useMemo(() => Color(shown.backgroundColor).luminosity(), [shown.backgroundColor])
  const [chosenLogo, setChosenLogo] = useState(null)
  const logo = chosenLogo?.logos === logos.join() ? chosenLogo.src : null
  // In the drawer, the title waits for its logo to be chosen, or for none to load. Once shown it stays: a logo known
  // later takes the place of the text
  const titled = useRef(null)
  if (ready && (!logos.length || chosenLogo?.logos === logos.join())) {
    titled.current = entity?.id
  }
  const titleReady = ready && titled.current === entity?.id

  // On the page, the title waits for its logo to be decoded, so its bar takes the logo's size and not an empty one's
  const pageLogo = page ? artworks?.logo : null
  const [decodedLogo, setDecodedLogo] = useState(null)
  useEffect(() => {
    if (!pageLogo) {
      return
    }

    let active = true
    const image = new Image()
    image.src = logoSrcOf(pageLogo, api.access_token)
    image.decode().catch(() => null).then(() => active && setDecodedLogo(pageLogo))
    return () => {
      active = false
    }
  }, [pageLogo, api.access_token])
  const pageTitleReady = ready && state !== 'loading' && (!pageLogo || decodedLogo === pageLogo)
  const externalsReady = ready && state !== 'loading' && additionalReady

  // A logo that reads on none keeps the first, with the tone the page would give it; none loaded leaves the title
  useEffect(() => {
    if (!logos.length) {
      return
    }

    let cancelled = false
    const load = (src) => new Promise<HTMLImageElement>((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => resolve(null)
      image.src = src
    })

    const choose = async () => {
      let first = null

      for (const src of logos) {
        const image = await load(src)

        if (cancelled) {
          return
        }

        if (!image) {
          continue
        }

        const tone = toneOfImage(image, background)
        first = first || { src, tone }

        if (tone === 'as-is') {
          return setChosenLogo({ logos: logos.join(), src, tone })
        }
      }

      setChosenLogo({ logos: logos.join(), src: first?.src || null, tone: first?.tone })
    }

    choose()
    return () => {
      cancelled = true
    }
  }, [logos, background])

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
      variant={variant}
    />
  )

  const ticketBlock = (
    <>
      {behavior === 'tv' && !!search && (
        <div sx={UIDetails.styles.ticket}>
          <ShowTicket
            palette={shown}
            ready={ready && state !== 'loading'}
            entity={entity}
            toggleSensorr={search}
          />
        </div>
      )}
      {behavior === 'movie' && (
        <div sx={UIDetails.styles.ticket}>
          <MovieActions
            palette={shown}
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
    <h1 sx={UIDetails.styles.title}>
      <Skeleton palette={shown} ready={pageTitleReady} shape={<Bar width='8em' height='1em' />} clip={true}>
        {artworks?.logo ? <TitleLogo key={artworks.logo} path={artworks.logo} title={title} /> : title}
      </Skeleton>
    </h1>
  )

  const subtitleShape = <Bar width='14em' height='1.25em' />

  const metadataBlock = (
    <>
      {behavior === 'movie' && (
        // Its state opens the editor of a wished, archived or missing movie: it waits for it
        <Skeleton palette={shown} ready={ready && state !== 'loading'} shape={subtitleShape} sx={{ marginBottom: 4 }}>
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
        <Skeleton palette={shown} ready={ready && subtitleReady} shape={subtitleShape} sx={{ marginBottom: 4 }}>
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

  const externalsShape = (
    <span sx={UIDetails.styles.pills}>
      {['5em', '4em', '7em'].map((width, index) => <Bar key={index} pill={true} width={width} height='2em' />)}
    </span>
  )

  const externalsBlock = ['movie', 'tv'].includes(behavior) && (
    <Skeleton palette={shown} ready={externalsReady} shape={externalsShape} sx={{ marginBottom: 4 }}>
      <Externals entity={entity} metadata={metadata} additional={additional} meaningful={meaningful} />
    </Skeleton>
  )

  const meaningfulBlock = (
    <Skeleton palette={shown} ready={ready} shape={<Bar width='22em' height='1em' />} sx={{ marginBottom: 4 }}>
      <Meaningful meaningful={meaningful} open={meaningfulState} onToggle={setMeaningfulState} />
    </Skeleton>
  )

  const overviewBlock = (
    <Skeleton palette={shown} ready={ready} shape={<Lines widths={['100%', '97%', '99%', '58%']} />}>
      <div>
        {!!tagline && <p sx={UIDetails.styles.tagline}>{tagline}</p>}
        <Overview children={overview} remembered={page} lines={page ? 8 : 4} />
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
        // The poster's colors fade to the page's black behind the releases, so that the rows start on black
        <div sx={UIDetails.styles.drawer.dusk} style={{ backgroundImage: `linear-gradient(to bottom, ${shown.backgroundColor}, ${theme.rawColors.grayLightest})` }}>
          {/* Nothing until the movie's releases are known, and nothing without any: an empty band says nothing */}
          {ready && !!metadata?.releases?.length && (
            // The releases' dimmed details need more contrast than the head's text: their background steps a fifth
            // further from the drawer's. The indexers' links take their text color, the app's green reads on none
            <div sx={{ ...UIDetails.styles.drawer.releases, ...reveal }} style={{ ...paintOf({ backgroundColor: `color-mix(in oklab, ${shown.color}, ${Color(shown.backgroundColor).isLight() ? 'black' : 'white'} 20%)`, color: shown.backgroundColor }), '--theme-ui-colors-primary': shown.backgroundColor } as React.CSSProperties}>{releasesBlock}</div>
          )}
        </div>
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
          <div sx={UIDetails.styles.drawer.under}>
            <Skeleton palette={shown} ready={titleReady} shape={<Bar width='12em' height='2.5em' sx={{ marginX: 'auto' }} />} clip={true} sx={{ marginBottom: 10 }}>
              <Link to={`/${behavior}/${entity?.id}`} disabled={!entity?.id} sx={{ variant: 'link.reset', display: 'block', marginX: 'auto' }}>
                {logo ? (
                  <h1 sx={UIDetails.styles.drawer.logo}>
                    <img src={logo} alt={title} crossOrigin='anonymous' style={{ filter: logoFilterOf(chosenLogo.tone, background) }} />
                  </h1>
                ) : (
                  <h1 sx={UIDetails.styles.drawer.title}>{title}</h1>
                )}
              </Link>
            </Skeleton>
            <div style={tintOf(shown.alternativeColor)} sx={{ 'details > div': tintOf(shown.negativeColor) }}>{metadataBlock}</div>
            {['movie', 'tv'].includes(behavior) && (
              <>
                <Skeleton palette={shown} ready={externalsReady} shape={<Bar pill={true} width='9em' height='2em' sx={{ marginX: 'auto' }} />}>
                  <div sx={UIDetails.styles.drawer.ratings}>
                    <span>
                      <ReviewsBadge entity={entity} reviews={additional?.reviews} palette={shown} forceOpen={true} />
                    </span>
                  </div>
                </Skeleton>
                <Skeleton palette={shown} ready={externalsReady} shape={<span sx={{ ...UIDetails.styles.pills, justifyContent: 'center' }}>{externalsShape.props.children}</span>}>
                  <div sx={UIDetails.styles.drawer.externals}>
                    <Externals entity={entity} metadata={metadata} additional={additional} meaningful={meaningful} reviews={false} />
                  </div>
                </Skeleton>
              </>
            )}
            <div style={tintOf(shown.alternativeColor)}>{meaningfulBlock}</div>
          </div>
        </div>
        <div sx={UIDetails.styles.drawer.body}>
          <div style={tintOf(shown.negativeColor)}>{overviewBlock}</div>
          {ticketBlock}
        </div>
        {/* The rows go back to the app's black, as on the page: the page's black is `html`'s, `grayLightest` */}
        <div
          sx={UIDetails.styles.drawer.rest}
          style={{ ...plainOf(theme.rawColors), backgroundColor: theme.rawColors.grayLightest }}
        >
          {restBlock}
        </div>
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
    // Transparent above its top, down from the top of the screen: the knob at 15dvh, then the poster standing out
    element: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      marginTop: 'calc(var(--drawer-rest, 15dvh) + 6em)',
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
      alignItems: 'stretch',
      gap: 8,
      marginTop: '-3.5em',
      paddingX: 2,
      textAlign: 'center',
      // A genre list longer than the drawer is wide wraps instead of running past its edge
      'details > summary > *': {
        whiteSpace: 'normal',
      },
      // A subtitle longer than a line flows after the chevron instead of going under it
      'details > summary > h4': {
        display: 'inline',
      },
    },
    rest: {
      flex: 1,
    },
    // Without releases, the gradient still needs room to reach the black
    dusk: {
      minHeight: '4em',
    },
    // The releases' panel sits against the gradient: its page margins opened a black band above it and lighter ones
    // around it
    releases: {
      '>div': {
        marginY: '0em',
        '>div': {
          marginBottom: '0em',
        },
      },
    },
    // The head under its poster, laid out as the head itself
    under: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 8,
    },
    // Above the drawer's knob, which passes behind it
    poster: {
      position: 'relative',
      zIndex: 3,
      alignSelf: 'center',
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
      display: 'flex',
      justifyContent: 'center',
      height: '5rem',
      marginY: '0em',
      '>img': {
        maxWidth: 'min(100%, 20em)',
        maxHeight: '100%',
        objectFit: 'contain',
      },
    },
    // Open at the width of its scores, not of the drawer
    ratings: {
      display: 'flex',
      justifyContent: 'center',
      fontSize: 3,
      '>span': {
        display: 'inline-block',
      },
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
      paddingX: 2,
      paddingTop: 4,
      paddingBottom: 2,
      textAlign: 'center',
      '>*': {
        width: '100%',
      },
      // The ticket: the one behind it, tilted, stands out of its box down to the releases
      '>div:last-of-type': {
        width: '100%',
        maxWidth: '17em',
        marginBottom: '3em',
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
    marginBottom: 10,
    fontSize: '2.5em',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75em',
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
