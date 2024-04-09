import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Entities, AbstractEntity, transformCollectionDetails, transformCompanyDetails, transformKeywordDetails, Warning, Icon } from '@sensorr/ui'
import { useSearchContext } from '../../../contexts/Search/Search'
import { useDeviceContext } from '../../../contexts/Device/Device'
import Movie from '../../../components/Movie/Movie'
import Person from '../../../components/Person/Person'
import nanobounce from 'nanobounce'

export const Input = ({ ...props }) => {
  const ref = useRef<HTMLInputElement>()
  const [focused, setFocused] = useState(false)
  const { input, setInput, results, loading, clear, query, setQuery, history, historyDisplay, setHistoryDisplay } = useSearchContext() as any
  const debounce = useMemo(() => nanobounce(400), [])

  const onChange = useCallback((query) => {
    setInput(query)
    debounce(() => {
      setHistoryDisplay(false)
      setQuery(query)
    })
  }, [])

  const onClear = useCallback(() => {
    setInput('')
    clear()

    if (!ref.current) {
      return
    }

    ref.current.blur()
    setHistoryDisplay(false)
  }, [ref.current])

  useEffect(() => {
    const cb = (e) => {
      if (e.key === 'Escape') {
        onClear()
      }
    }

    document.addEventListener('keydown', cb)
    return () => document.removeEventListener('keydown', cb)
  }, [])

  useEffect(() => {
    if (!query) {
      setInput('')
    }
  }, [query])

  return (
    <form
      action='#'
      sx={Input.styles.element}
      onSubmit={e => {
        e.preventDefault()
        ref.current.blur()
      }}
    >
      {(!!input && (results === null || loading)) ? (
        <Icon value='spinner' sx={Input.styles.loading} />
      ) : (
        <Icon
          value='search'
          sx={{
            ...Input.styles.icon,
            ...(focused ? { color: 'primary', opacity: 1 } : { opacity: 0.8 }),
          }}
        />
      )}
      <input
        sx={Input.styles.input}
        {...props}
        type='text'
        ref={ref}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true)

          if (!input) {
            setHistoryDisplay(true)
          }
        }}
        onBlur={() => setFocused(false)}
      />
      {!!input && (
        <button sx={Input.styles.clear} type='button' onClick={onClear}>
          <Icon value='clear' active={false} />
        </button>
      )}
      {(historyDisplay && !!history.length) && (
        <button sx={Input.styles.clear} type='button' onClick={() => setHistoryDisplay(false)}>
          <Icon value='clear' active={false} />
        </button>
      )}
    </form>
  )
}

Input.styles = {
  element: {
    flex: 1,
    display: 'flex',
    height: '100%',
    alignItems: 'center',
  },
  icon: {
    height: '1em',
    width: '1em',
    margin: '0 1em 0 0',
    transition: 'opacity 300ms ease-in-out, color 300ms ease-in-out',
  },
  loading: {
    height: '1em',
    width: '1em',
    margin: '0 1em 0 0',
  },
  clear: {
    variant: 'button.reset',
    height: '0.75em',
    width: '0.75em',
    margin: '0 0 0 1em',
    lineHeight: '0.5',
  },
  input: {
    variant: 'input.reset',
    flex: 1,
    height: '100%',
  },
}

export const History = ({ ...props }) => {
  const ref = useRef()
  const { history, removeHistoryQuery, setQuery, setInput, historyDisplay, setHistoryDisplay } = useSearchContext() as any

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !(ref.current as any).contains(event.target)) {
        setHistoryDisplay(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref])

  return (
    <div ref={ref} sx={History.styles.element} style={(historyDisplay && !!history.length) ? {} : { display: 'none' }}>
      <h4>Recent searches</h4>
      <ul>
        {history.map(query => (
          <li>
            <span
              onClick={() => {
                setInput(query)
                setQuery(query)
                setHistoryDisplay(false)
              }}
            >
              {query}
            </span>
            <button sx={History.styles.remove} type='button' onClick={() => removeHistoryQuery(query)}>
              <Icon value='clear' active={false} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

History.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    padding: 4,
    backgroundColor: 'grayLightest',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    '>h4': {
      variant: 'heading.default',
      margin: 12,
      marginBottom: 6,
      fontWeight: 'semibold',
      color: 'grayDark',
      fontSize: 4,
      width: '100%',
      maxWidth: '30rem',
    },
    '>ul': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      listStyleType: 'none',
      width: '100%',
      maxWidth: '30rem',
      margin: 12,
      padding: 12,
      overflowY: 'auto',
      '>li': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 10,
        padding: 12,
        paddingBottom: 8,
        borderBottom: '1px solid',
        borderColor: 'grayLight',
        '>span': {
          flex: 1,
          paddingX: 6,
          paddingY: 10,
          borderRadius: '0.25em',
          fontSize: 5,
          color: 'grayDarkest',
          cursor: 'pointer',
          ':hover': {
            backgroundColor: 'grayLighter',
            color: 'text',
          },
        },
        '>button': {
          visibility: 'hidden',
        },
        ':hover >button': {
          visibility: 'visible',
        }
      },
    },
  },
  remove: {
    variant: 'button.reset',
    height: '0.75em',
    width: '0.75em',
    margin: '0 0 0 1em',
    lineHeight: '0.5',
  }
}

export const Results = ({ ...props }) => {
  const { query, results, loading } = useSearchContext() as any
  const { device } = useDeviceContext()
  const extanded = results !== null || loading

  return (
    <div sx={Results.styles.element} style={extanded ? {} : { display: 'none' }}>
      <div sx={Results.styles.wrapper}>

        {loading ? (
          <div sx={Results.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : (results === null || Object.keys(results).every(key => results[key].total_results === 0) )? (
          <div sx={Results.styles.placeholder}>
            <Warning
              emoji="🔍"
              title="Sorry, no results"
              subtitle={(
                <span>
                  Try something more familiar, like <em>Pulp Fiction</em> ?
                </span>
              )}
            />
          </div>
        ) : (
          <>
            <div sx={Results.styles.container}>
              {!!results.movies?.results?.length && (
                <Entities
                  id="search-movies"
                  label="🎞️ Movies"
                  entities={results.movies.results}
                  hide={true}
                  child={Movie}
                  props={() => ({ display: device !== 'mobile' ? 'card' : 'poster' })}
                  display={device !== 'mobile' ? 'column' : 'row'}
                  // {...(device !== 'mobile' ? {} : { stack: true })}
                  more={{
                    title: `More results for ${query}`,
                    // TODO: Fix
                    to: `/movie/search`,
                    state: { query },
                  }}
                />
              )}
              {!!results.collections?.results?.length && (
                <Entities
                  id="search-collections"
                  label="📚 Collections"
                  entities={results.collections.results}
                  hide={true}
                  child={AbstractEntity}
                  props={() => ({
                    display: device !== 'mobile' ? 'card' : 'poster',
                    transformDetails: transformCollectionDetails,
                    link: (entity) => ({ to: `/collection/${entity.id}` }),
                  })}
                  display={device !== 'mobile' ? 'column' : 'row'}
                  // {...(device !== 'mobile' ? {} : { stack: true })}
                  more={{
                    title: `More results for ${query}`,
                    // TODO: Fix
                    to: `/collection/search`,
                    state: { query },
                  }}
                />
              )}
              {!!results.persons?.results?.length && (
                <Entities
                  id="search-stars"
                  label="⭐ Stars"
                  entities={results.persons.results}
                  hide={true}
                  child={Person}
                  props={() => ({ display: device !== 'mobile' ? 'card' : 'poster' })}
                  display={device !== 'mobile' ? 'column' : 'row'}
                  // {...(device !== 'mobile' ? {} : { stack: true })}
                  // TODO: Fix
                  more={{
                    title: `More results for ${query}`,
                    to: `/person/search`,
                    state: { query },
                  }}
                />
              )}
            </div>
            <div sx={Results.styles.tags}>
              {!!results.companies?.results?.length && (
                <Entities
                  id="search-companies"
                  label="🏛️ Companies"
                  entities={results.companies.results}
                  hide={true}
                  child={AbstractEntity}
                  props={() => ({
                    display: 'tag',
                    transformDetails: transformCompanyDetails,
                    link: (entity) => ({
                      to: '/movie/discover',
                      state: {
                        controls: {
                          with_companies: {
                            behavior: 'or',
                            values: [
                              {
                                value: entity.id,
                                label: entity.name,
                              },
                            ],
                          },
                        },
                      },
                    } as any),
                  })}
                  display="wrap"
                />
              )}
              {!!results.keywords?.results?.length && (
                <Entities
                  id="search-keywords"
                  label="🔗 Keywords"
                  entities={results.keywords.results}
                  hide={true}
                  child={AbstractEntity}
                  props={() => ({
                    display: 'tag',
                    transformDetails: transformKeywordDetails,
                    link: (entity) => ({
                      to: '/movie/discover',
                      state: {
                        controls: {
                          with_keywords: {
                            behavior: 'or',
                            values: [
                              {
                                value: entity.id,
                                label: entity.name,
                              },
                            ],
                          },
                        },
                      },
                    } as any),
                  })}
                  display="wrap"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

Results.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    backgroundColor: 'grayLightest',
    overflowY: 'auto',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    alignSelf: 'center',
    width: '100%',
    maxWidth: '96rem',
    paddingX: 4,
    paddingBottom: 0,
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: ['column', 'column', 'row'],
    justifyContent: ['stretch', 'stretch', 'center'],
    width: '100%',
    '>*': {
      paddingX: 4,
      maxWidth: ['none', 'none', '35em'],
    }
  },
  tags: {
    display: 'flex',
    flexDirection: ['column', 'row', 'row'],
    justifyContent: ['stretch', 'stretch', 'center'],
    width: '100%',
    '>*': {
      paddingX: 4,
      maxWidth: ['none', 'none', '35em'],
    }
  },
  placeholder: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
