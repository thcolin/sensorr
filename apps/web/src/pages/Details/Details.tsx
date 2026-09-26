import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useThemeUI } from '@theme-ui/core'
import { useHistoryState, createPendingReducer } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Provider as ExpandProvider, useExpandContext } from './contexts/Expand'
import { Head } from './components/Head'
import { Poster } from './components/Poster'
import { Overview } from './components/Overview'
import { Skeleton } from './components/Skeleton'
import { Tabs } from '../../components/Entities/Tabs'
import { MovieActions, OptionInput } from './components/Actions'
import { Releases } from './components/Releases'
import { Sensorr } from '../../components/Sensorr'
import { Metadata } from './components/Metadata'
import { Externals, Meaningful } from './components/Externals'

const pendingReducer = createPendingReducer({
  entity: true,
  poster: true,
  billboard: true,
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
  summary = null,
  children = null,
  ...props
}) => {
  const { title, tagline, overview, poster, billboard, meaningful } = details
  // A show opens its settings once it is in the library, which is known only once its metadata loads
  const [metadataState, setMetadataState] = useHistoryState('metadata', behavior === 'tv' ? null : ['wished', 'archived', 'missing'].includes(state))
  const [meaningfulState, setMeaningfulState] = useHistoryState('meaningful', false)

  const toggleSensorr = useRef() as any

  const { expanded } = useExpandContext() as any
  const { theme } = useThemeUI() as any
  const palette = usePalette(
    !!poster && `https://image.tmdb.org/t/p/w92${poster}`,
    {
      backgroundColor: theme.rawColors.grayLight,
      color: theme.rawColors.text,
      alternativeColor: theme.rawColors.text,
      negativeColor: theme.rawColors.text,
    },
    poster,
  )

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

  return (
    <div sx={UIDetails.styles.element}>
      <Head billboard={billboard} palette={palette.palette} entity={entity} behavior={behavior} ready={ready} onReady={onReady.billboard} />
      <div sx={UIDetails.styles.body}>
        <div sx={{ ...UIDetails.styles.poster, marginTop: expanded ? '1em' : [{ person: '-30vh', collection: '-15vh', movie: '-15vh', tv: '-15vh' }[behavior], '-25vh'] }}>
          <Poster
            path={poster}
            palette={palette.palette}
            behavior={behavior}
            ready={ready}
            onReady={onReady.poster}
            requested_by={metadata?.requested_by}
            state={state}
            setState={setState}
          />
          <a href={`https://www.themoviedb.org/${behavior}/${entity.id}/edit`} target='_blank' rel='noopener noreferrer'>
            Contribute to TheMovieDB
          </a>
          {behavior === 'movie' && (
            <div sx={{ width: '100%', maxWidth: ['17em', 'unset'], marginTop: ['2em', '4em'], marginBottom: ['1em', '2em'], marginRight: ['-1em', '0em'] }}>
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
        </div>
        <div sx={{ ...UIDetails.styles.wrapper, marginTop: ['0em', expanded ? '1em' : '-2em'] }}>
          <div sx={UIDetails.styles.container}>
            <div sx={UIDetails.styles.content}>
              <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 10 }}>
                <h1 sx={UIDetails.styles.title}>{title}</h1>
              </Skeleton>
              {behavior === 'movie' && (
                <React.Fragment>
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
                        />
                      </div>
                    </details>
                    </Skeleton>
                  <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 4 }}>
                    <Externals entity={entity} metadata={metadata} additional={additional} meaningful={meaningful} />
                  </Skeleton>
                </React.Fragment>
              )}
              {behavior === 'tv' && (
                <React.Fragment>
                  <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 4 }}>
                    {actions ? (
                      <details sx={UIDetails.styles.metadata} onToggle={(e: any) => setMetadataState(e.target.open)} open={metadataState ?? true}>
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
                  <Skeleton palette={palette.palette} ready={ready} sx={{ marginBottom: 4 }}>
                    <Externals entity={entity} metadata={metadata} additional={additional} meaningful={meaningful} />
                  </Skeleton>
                </React.Fragment>
              )}
              <Skeleton palette={palette.palette} ready={ready} placeholder={false} sx={{ marginBottom: 4 }}>
                <Meaningful meaningful={meaningful} open={meaningfulState} onToggle={setMeaningfulState} />
              </Skeleton>
            </div>
            <Skeleton palette={palette.palette} ready={ready} placeholder={false}>
              <div>
                {!!tagline && <p sx={UIDetails.styles.tagline}>{tagline}</p>}
                <Overview children={overview} />
              </div>
            </Skeleton>
          </div>
        </div>
      </div>
      {behavior === 'movie' && (
        <Releases
          movie={entity}
          metadata={metadata}
          proceedRelease={proceedRelease}
          removeRelease={removeRelease}
          entities={metadata?.releases || []}
          ready={ready}
        />
      )}
      {children}
      <div>
        <div sx={UIDetails.styles.tabs}>
          {(tabs || []).map(({ id, component: Component = Tabs, tabs }) => (
            <Component key={id} id={id} tabs={tabs} props={() => ({ palette: palette.palette })} />
          ))}
        </div>
      </div>
    </div>
  )
}

UIDetails.styles = {
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
      color: 'grayDark',
      marginY: 8,
      textAlign: 'right',
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
