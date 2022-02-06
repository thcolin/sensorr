import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Entities, AbstractEntity, transformCollectionDetails, transformCompanyDetails, transformKeywordDetails, Warning, Icon } from '@sensorr/ui'
import { useSearchContext } from '../../../contexts/Search/Search'
import Movie from '../../../components/Movie/Movie'
import Person from '../../../components/Person/Person'
import nanobounce from 'nanobounce'

export const Input = ({ ...props }) => {
  const input = useRef<HTMLInputElement>()
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState('')
  const { results, loading, clear, query, setQuery } = useSearchContext() as any
  const debounce = useMemo(() => nanobounce(400), [])

  const onChange = useCallback((query) => {
    setValue(query)
    debounce(() => setQuery(query))
  }, [])

  const onClear = useCallback(() => {
    setValue('')
    clear()

    if (!input.current) {
      return
    }

    input.current.blur()
  }, [input.current])

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
      setValue('')
    }
  }, [query])

  return (
    <form
      action='#'
      sx={Input.styles.element}
      onSubmit={e => {
        e.preventDefault()
        input.current.blur()
      }}
    >
      {(!!value && (results === null || loading)) ? (
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
        ref={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!!value && (
        <button sx={Input.styles.clear} type='button' onClick={onClear}>
          <Icon value='clear' />
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

export const Results = ({ ...props }) => {
  const { query, results, loading } = useSearchContext() as any
  const extanded = results !== null || loading

  return (
    <div sx={Results.styles.element} hidden={!extanded}>
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
                label="🎞️ Movies"
                entities={results.movies.results}
                hide={true}
                child={Movie}
                props={() => ({ display: 'card' })}
                display="column"
                more={{
                  title: `More results for ${query}`,
                  to: {
                    pathname: `/movie/search`,
                    // TODO: Fix
                    state: { query },
                  },
                }}
              />
            )}
            {!!results.collections?.results?.length && (
              <Entities
                label="📚 Collections"
                entities={results.collections.results}
                hide={true}
                child={AbstractEntity}
                props={() => ({
                  display: 'card',
                  transformDetails: transformCollectionDetails,
                  link: (entity) => `/collection/${entity.id}`,
                })}
                display="column"
                more={{
                  title: `More results for ${query}`,
                  // TODO: Fix
                  to: {
                    pathname: `/collection/search`,
                    state: { query },
                  },
                }}
              />
            )}
            {!!results.persons?.results?.length && (
              <Entities
                label="⭐ Stars"
                entities={results.persons.results}
                hide={true}
                child={Person}
                props={() => ({ display: 'card' })}
                display="column"
                // TODO: Fix
                more={{
                  title: `More results for ${query}`,
                  to: {
                    pathname: `/person/search`,
                    state: { query },
                  },
                }}
              />
            )}
          </div>
          <div sx={Results.styles.tags}>
            {!!results.companies?.results?.length && (
              <Entities
                label="🏛️ Companies"
                entities={results.companies.results}
                hide={true}
                child={AbstractEntity}
                props={() => ({
                  display: 'tag',
                  transformDetails: transformCompanyDetails,
                  link: (entity) => ({
                    pathname: '/movie/discover',
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
                label="🔗 Keywords"
                entities={results.keywords.results}
                hide={true}
                child={AbstractEntity}
                props={() => ({
                  display: 'tag',
                  transformDetails: transformKeywordDetails,
                  link: (entity) => ({
                    pathname: '/movie/discover',
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
  )
}

Results.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'center',
    width: '100vw',
    maxWidth: '96rem',
    paddingX: 4,
    paddingBottom: 0,
    overflowY: 'auto',
  },
  container: {
    display: 'flex',
    flexDirection: ['column', 'column', 'row'],
    alignItems: ['center', 'center', 'flex-start'],
    justifyContent: ['flex-start', 'flex-start', 'center'],
    width: '100%',
    '>*': {
      maxWidth: '100%',
      overflowX: 'hidden',
      paddingX: 4,
    }
  },
  tags: {
    display: 'flex',
    flexDirection: ['column', 'row', 'row'],
    alignItems: ['center', 'flex-start', 'flex-start'],
    justifyContent: ['flex-start', 'center', 'center'],
    width: '100%',
    '>*': {
      maxWidth: '100%',
      overflowX: 'hidden',
      paddingX: 4,
    }
  },
  placeholder: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
