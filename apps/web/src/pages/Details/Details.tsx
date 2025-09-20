import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useThemeUI } from '@theme-ui/core'
import { Icon } from '@sensorr/ui'
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
  ...props
}) => {
  const { title, tagline, overview, poster, billboard, meaningful } = details
  const [metadataState, setMetadataState] = useHistoryState('metadata', ['wished', 'archived', 'missing'].includes(state))
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
      <Head billboard={billboard} palette={palette.palette} entity={entity} ready={ready} onReady={onReady.billboard} />
      <div sx={UIDetails.styles.body}>
        <div sx={{ ...UIDetails.styles.poster, marginTop: expanded ? '1em' : [{ person: '-30vh', collection: '-15vh', movie: '-15vh' }[behavior], '-25vh'] }}>
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
                    <div sx={UIDetails.styles.externals}>
                      <div>
                        {meaningful?.vote_average && <meaningful.vote_average />}
                        {(additional?.reviews || [])?.map(review => (
                          <a
                            href={review.external}
                            target='_blank'
                            rel='norefer noopener'
                            key={review.source}
                            sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
                            title={{
                              'Rotten Tomatoes': `Rotten Tomatoes Critic Rating from ${review.count} reviews`,
                              'Metacritic': `Metascrore based on ${review.count} critic reviews`,
                            }[review.source]}
                          >
                            <Icon
                              value={{ 'Rotten Tomatoes': 'rottentomatoes', 'Metacritic': 'metacritic' }[review.source]}
                              height={{ 'Rotten Tomatoes': '1em', 'Metacritic': '1.2em' }[review.source]}
                              width={{ 'Rotten Tomatoes': '1em', 'Metacritic': '1.2em' }[review.source]}
                              sx={{ marginRight: 8 }}
                            />
                            {Math.round(review.score * 100)}%
                          </a>
                        ))}
                      </div>
                      {(!!metadata?.plex_url || !!((entity || {})['watch/providers']?.results[((global as any)?.config?.region || 'fr-FR').split('-')[1]]?.flatrate || [])?.length) && (
                        <div>
                          {!!metadata?.plex_url && (
                            <a
                              href={metadata?.plex_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
                              title={`Available on your own Plex server`}
                            >
                              <span {...props} sx={{ display: 'flex', justifyContent: 'center', fontSize: '1.7em', width: '0.75em', color: 'plex' }}>
                                ❯
                              </span>
                            </a>
                          )}
                          {((entity || {})['watch/providers']?.results[((global as any)?.config?.region || 'fr-FR').split('-')[1]]?.flatrate || []).map(provider => (
                            <a
                              href={(entity || {})['watch/providers']?.results[((global as any)?.config?.region || 'fr-FR').split('-')[1]]?.link}
                              target='_blank'
                              rel='norefer noopener'
                              sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
                              title={`Available for streaming on "${provider.provider_name}" (source JustWatch)`}
                            >
                              <img src={`https://image.tmdb.org/t/p/w92/${provider.logo_path}`} sx={{ height: '2em', width: '2em', borderRadius: '0.25em' }} />
                            </a>
                          ))}
                        </div>
                      )}
                      {!!Object.keys(additional?.externals || {}).filter(key => !['rottentomatoes', 'metacritic'].includes(key)).length && (
                        <div>
                          {Object.keys(additional?.externals || {}).filter(key => !['rottentomatoes', 'metacritic'].includes(key)).map(external => (
                            <a
                              href={additional?.externals[external]}
                              target='_blank'
                              rel='norefer noopener'
                              key={external}
                              sx={{ variant: 'link.reset', display: 'inline-flex', alignItems: 'center' }}
                              title={{
                                letterbox: 'Letterboxd',
                                senscritique: 'SensCritique',
                                allocine: 'AlloCiné',
                                imdb: 'IMDb',
                                mubi: 'Mubi',
                                plex: 'Plex',
                              }[external]}
                            >
                              <Icon value={external as any} sx={{ height: '2em', width: '2em', borderRadius: '0.25em' }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </Skeleton>
                </React.Fragment>
              )}
              <Skeleton palette={palette.palette} ready={ready} placeholder={false} sx={{ marginBottom: 4 }}>
                <details sx={UIDetails.styles.details} onToggle={(e: any) => setMeaningfulState(e.target.open)} open={meaningfulState}>
                  <summary>
                    <span />
                    {
                      (meaningful.directors && <meaningful.directors />) ||
                      (meaningful.known_for_department && <meaningful.known_for_department />) ||
                      (meaningful.release_dates_range && <meaningful.release_dates_range />)
                    }
                    {
                      (meaningful.runtime && <meaningful.runtime />) ||
                      (meaningful.age && <meaningful.age />)
                    }
                    {(meaningful.genres && <meaningful.genres />)}
                  </summary>
                  <div>
                    {(
                      (meaningful.release_date && <meaningful.release_date />) ||
                      (meaningful.original_language && <meaningful.original_language />) ||
                      (meaningful.place_of_birth && <meaningful.place_of_birth />) ||
                      (meaningful.popularity && <meaningful.popularity />) ||
                      (meaningful.vote_count && <meaningful.vote_count />) ||
                      (meaningful.budget && <meaningful.budget />) ||
                      (meaningful.revenue && <meaningful.revenue />)
                    ) && (
                      <span sx={{ '>*': { marginRight: 4 } }}>
                        {(meaningful.release_date && <meaningful.release_date />)}
                        {
                          (meaningful.original_language && <meaningful.original_language />) ||
                          (meaningful.place_of_birth && <meaningful.place_of_birth />)
                        }
                        {(meaningful.vote_count && <meaningful.vote_count />)}
                        {(meaningful.popularity && <meaningful.popularity />)}
                        {(meaningful.budget && <meaningful.budget />)}
                        {(meaningful.revenue && <meaningful.revenue />)}
                      </span>
                    )}
                    {
                      (meaningful.production_companies && <meaningful.production_companies />) ||
                      (meaningful.birthday && <meaningful.birthday />)
                    }
                    {
                      (meaningful.keywords && <meaningful.keywords />) ||
                      (meaningful.deathday && <meaningful.deathday />)
                    }
                  </div>
                </details>
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
    paddingX: [4, '5em'],
    marginBottom: 2,
    maxWidth: '105em',
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
  externals: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: ['column', 'row'],
    '>div': {
      display: 'flex',
      alignItems: 'center',
      ':not(:last-of-type)': {
        marginRight: [12, 0],
        marginBottom: [4, 12],
      },
      '>a': {
        marginRight: 6,
      },
    },
  },
  subtitle: {
    margin: '0em',
    fontSize: 3,
    fontWeight: 'normal',
    '>strong': {
      fontWeight: 'strong',
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
  details: {
    '>summary': {
      position: 'relative',
      lineHeight: 'space',
      '>*:first-child': {
        position: 'absolute',
        width: '1em',
        height: '100%',
        left: '0em',
        margin: '0em',
        cursor: 'pointer',
      },
      '>*': {
        fontWeight: 'semibold',
        whiteSpace: 'nowrap',
        marginX: 5,
      },
    },
    '>div': {
      marginTop: 5,
      '>*': {
        display: 'block',
        lineHeight: 'body',
        marginX: 5,
        marginBottom: 8,
      },
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

const UIDetailsWrapper = ({ ...props }) => (
  <ExpandProvider>
    <Details {...props as any} />
  </ExpandProvider>
)

export default memo(UIDetailsWrapper)
