import { memo, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useThemeUI } from '@theme-ui/core'
import { Badge, PersonState, MovieState } from '@sensorr/ui'
import { createHistoryState, createPendingReducer } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Provider as ExpandProvider, useExpandContext } from './contexts/Expand'
import { Head } from './components/Head'
import { Poster } from './components/Poster'
import { Metadata } from './components/Metadata'
import { Overview } from './components/Overview'
import { Skeleton } from './components/Skeleton'
import { Sensorr } from '../../components/Sensorr'
import { Tabs } from './components/Tabs'

const useToggledState = createHistoryState('toggled', false)
const useViewState = createHistoryState('view', 'features')
const pendingReducer = createPendingReducer({
  entity: true,
  poster: true,
  billboard: true,
})

const UIDetails = ({ entity, loading, details, behavior, state, setState, metadata, setMetadata, tabs, ...props }) => {
  const { title, tagline, overview, poster, billboard, meaningful } = details
  const [view, setView] = useViewState() as [any, any]
  const [toggled, setToggled] = useToggledState() as [any, any]

  const { expanded } = useExpandContext() as any
  const { theme } = useThemeUI() as any
  const { palette } = usePalette(
    !!poster && `https://image.tmdb.org/t/p/w92${poster}`,
    {
      backgroundColor: theme.rawColors.gray2,
      color: theme.rawColors.text,
      alternativeColor: theme.rawColors.text,
      negativeColor: theme.rawColors.text,
    },
    poster,
  )

  const handleDetailsToggle = useCallback((e) => setToggled(e.target.open), [])

  const [pending, mutatePending] = useReducer(pendingReducer.reducer, pendingReducer.initialState)
  const ready = props.ready !== false && state !== 'loading' && Object.values(pending).every(pending => !pending)
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
      <Head billboard={billboard} palette={palette} entity={entity} ready={ready} onReady={onReady.billboard} />
      <div sx={UIDetails.styles.body}>
        <div sx={{ ...UIDetails.styles.poster, marginTop: expanded ? '1em' : [{ person: '-30vh', collection: '-15vh', movie: '-15vh' }[behavior], '-25vh'] }}>
          <Poster path={poster} palette={palette} behavior={{ person: 'person', collection: 'movie', movie: 'movie' }[behavior]} ready={ready} onReady={onReady.poster} />
        </div>
        <div sx={UIDetails.styles.wrapper}>
          <div sx={UIDetails.styles.metadata}>
            <div sx={{ flex: 1 }}>
              <Skeleton palette={palette} ready={ready} sx={{ marginBottom: 10 }}>
                <h1 sx={UIDetails.styles.title}>{title}</h1>
              </Skeleton>
              {behavior === 'movie' && (
                <Skeleton palette={palette} ready={ready} sx={{ marginBottom: 2 }}>
                  <h4 sx={UIDetails.styles.subtitle}>
                    {!!entity.original_title && entity.original_title !== title && (<strong>{entity.original_title}</strong>)}
                    {!!entity.original_title && !!meaningful.year && (<span> </span>)}
                    {!!meaningful.year && (<span>({<meaningful.year />})</span>)}
                  </h4>
                </Skeleton>
              )}
              <Skeleton palette={palette} ready={ready} placeholder={false} sx={{ marginBottom: 4 }}>
                <details sx={UIDetails.styles.details} onToggle={handleDetailsToggle} open={toggled}>
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
                    {(meaningful.vote_average && <meaningful.vote_average />)}
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
            <div sx={UIDetails.styles.actions}>
              {behavior === 'movie' && (
                <MovieState value={ready ? state : 'loading'} onChange={setState} compact={false} size='normal' />
              )}
              {behavior === 'person' && (
                <PersonState value={ready ? state : 'loading'} onChange={setState} compact={false} size='normal' />
              )}
              {['movie'].includes(behavior) && ( // TODO: Should add 'collection' behavior
                <Metadata
                  entity={ready ? entity : {}}
                  loading={!ready || state === 'loading'}
                  metadata={metadata}
                  onChange={setMetadata}
                  button={(
                    <Badge emoji='🎟' label='Sensorr' compact={false} />
                  )}
                />
              )}
              <a href={`https://www.themoviedb.org/${behavior}/${entity.id}/edit`} target='_blank' rel='noopener noreferrer'>
                Edit this page
              </a>
            </div>
          </div>
          <Skeleton palette={palette} ready={ready} sx={{ marginBottom: 6 }} hide={!tagline}>
            <p sx={UIDetails.styles.tagline}>
              {tagline}
            </p>
          </Skeleton>
          <Skeleton palette={palette} ready={ready} placeholder={false}>
            <Overview children={overview} />
          </Skeleton>
          {['movie', 'collection'].includes(behavior) && (
            <Skeleton palette={palette} ready={ready} placeholder={false}>
              <div sx={UIDetails.styles.choices}>
                <label>
                  <input type='radio' name='details-view' checked={view === 'features'} onChange={() => setView('features')} />
                  <span>Features</span>
                </label>
                <label>
                  <input type='radio' name='details-view' checked={view === 'releases'} onChange={() => setView('releases')} />
                  <span>Releases</span>
                </label>
              </div>
            </Skeleton>
          )}
        </div>
      </div>
      <div>
        <div hidden={view !== 'features'} sx={UIDetails.styles.tabs}>
          {Object.entries(tabs).map(([key, tabs]) => (
            <Tabs key={key} id={key} tabs={tabs} palette={palette} />
          ))}
        </div>
        {['movie'].includes(behavior) && ( // TODO: Should add 'collection' behavior
          <div hidden={view !== 'releases'}>
            <Sensorr metadata={metadata} entity={entity} ready={state !== 'loading' && entity.id && view === 'releases'} />
          </div>
        )}
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
    justifyContent: ['center', 'flex-start'],
    paddingRight: ['0em', '3em'],
    marginBottom: [2, '0em'],
    transition: 'margin 400ms ease-in-out',
  },
  wrapper: {
    flex: 1,
    textAlign: ['center', 'left'],
  },
  metadata: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'flex-start'],
    justifyContent: 'space-between',
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
      }
    },
  },
  choices: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginY: 2,
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
  actions: {
    display: 'flex',
    flexDirection: ['row', 'column'],
    width: ['100%', '11em'],
    marginLeft: ['0em', 2],
    marginY: [6, '0em'],
    '>label, >button': {
      width: '100%',
      marginY: ['0em', 8],
      marginX: [8, '0em'],
    },
    '>a': {
      color: 'gray3',
      marginX: 4,
      marginY: 8,
      textAlign: 'right',
      textDecoration: 'none',
      opacity: 0.75,
      transition: 'opacity ease 300ms',
      '&:hover': {
        opacity: 1,
      },
    },
  },
  tagline: {
    margin: '0em',
    fontWeight: 'semibold',
  },
  tabs: {
  },
}

const Details = memo(UIDetails)

const UIDetailsWrapper = ({ ...props }) => (
  <ExpandProvider>
    <Details {...props as any} />
  </ExpandProvider>
)

export default memo(UIDetailsWrapper)
