import React, { useRef, useState, useContext, useMemo, useCallback, useEffect, useReducer } from 'react'
import { withRouter } from 'react-router-dom'
import List from 'components/Layout/List'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import Clear from 'icons/Clear'
import Expand from 'icons/Expand'
import Reduce from 'icons/Reduce'
import tmdb from 'store/tmdb'
import nanobounce from 'nanobounce'
import qs from 'query-string'
import theme from 'theme'

export const Context = React.createContext()

export const Provider = withRouter(({ location, history, match, staticContext, children, ...props }) => {
  const reference = useRef()
  const [active, setActiveState] = useState(false)
  const [expanded, setExpandedState] = useState(false)
  const [query, setQuery] = [
    qs.parse(location.search).query || '',
    (query) => history.replace({ pathname: location.pathname, ...(query ? { search: `?query=${query}` } : {}) }),
  ]

  const trapScroll = (enable) => {
    document.body.style['max-height'] = enable ? '100vh' : 'initial'
    document.body.style['overflow'] = enable ? 'hidden' : 'initial'
  }

  const setExpanded = (value) => {
    trapScroll(value)
    setExpandedState(value)
  }

  const setActive = (value) => {
    trapScroll(expanded && value)
    setActiveState(value)
  }

  const handleClick = (e) => {
    if (!reference.current.contains(e.target)) {
      setActive(false)
    }
  }

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      setActive(false)
      setQuery(null)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  return (
    <Context.Provider {...props} value={{ active, setActive, expanded, setExpanded, query, setQuery }}>
      <div
        {...props}
        ref={reference}
        style={{
          ...(props.style || {}),
          ...((active && expanded) ? { height: '100vh' } : {}),
        }}
      >
        {children}
      </div>
    </Context.Provider>
  )
})

const Childs = {
  movie: (props) => <Film {...props} display="card" />,
  collection: (props) => <Film {...props} display="card"  withState={false} link={(entity) => `/collection/${entity.id}`} />,
  persona: (props) => <Persona context="portrait" {...props} />,
}

export const Results = ({ children, ...props }) => {
  const { active, expanded, setExpanded, query, setQuery } = useContext(Context)
  const [state, dispatch] = useReducer(Results.reducer, Results.initialState)

  const suggestions = useMemo(() => {
    const next = [
      ...new Set([
        query,
        ...(JSON.parse(localStorage.getItem('sensorr-search-suggestions')) || [])
      ].filter(q => (
        !!q &&
        (
          query !== q ||
          !Object.values(state).every(value => Array.isArray(value) && !value.length))
        )
      ))
    ].slice(0, 10)

    localStorage.setItem('sensorr-search-suggestions', JSON.stringify(next))

    return next
  }, [query, state])

  const fetchItems = useCallback(async (uri, params) => {
    dispatch([uri[uri.length - 1], null])

    try {
      const res = await tmdb.fetch(uri, params)
      await new Promise(resolve => setTimeout(resolve, 700))
      dispatch([uri[uri.length - 1], res.results])
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 700))
      dispatch([uri[uri.length - 1], []])
    }
  }, [])

  useEffect(() => {
    if (query) {
      fetchItems(['search', 'movie'], { query, sort_by: 'popularity.desc' })
      fetchItems(['search', 'collection'], { query, sort_by: 'popularity.desc' })
    } else {
      dispatch(['movie', null])
      dispatch(['collection', null])
    }
  }, [query])

  const loading = Object.values(state).every(items => items === null)
  const empty = Object.values(state).every(items => Array.isArray(items) && !items.length)
  const open = active && !!suggestions.length

  return (
    <div
      css={Results.styles.element}
      style={{
        height: !open ? 0 : (expanded && query) ? '100%' : (!query || (!loading && !empty)) ? 'auto' : '50vh',
        maxHeight: expanded ? '100%' : '50vh',
      }}
    >
      <hr css={Results.styles.separator} />
      <div css={Results.styles.scroller} style={{ opacity: open ? 1 : 0 }}>
        {!query ? (
          <div css={[Results.styles.container, Results.styles.suggestions]}>
            <List
              key="suggestions"
              items={suggestions.map(suggestion => ({ id: suggestion }))}
              strict={false}
              child={({ entity }) => (
                <button onClick={() => setQuery(entity.id)} css={Results.styles.suggestion}>
                  <small><code>{entity.id}</code></small>
                </button>
              )}
              display="column"
              space={0}
            />
          </div>
        ) : (!loading && !empty) ? (
          <div css={Results.styles.container}>
            {state.movie && (
              <List
                label="🎞️&nbsp; Movies"
                items={state.movie}
                hide={true}
                child={Childs.movie}
                css={Results.styles.label}
                display="column"
                space={0.5}
              />
            )}
            {/* <List
              label="⭐&nbsp; Stars"
              uri={['search', 'person']}
              params={{ query, sort_by: 'popularity.desc' }}
              child={Childs.persona}
            /> */}
            {state.collection && (
              <List
                label="📚&nbsp; Collections"
                items={state.collection}
                hide={true}
                child={Childs.collection}
                css={Results.styles.label}
                display="column"
                space={0.5}
              />
            )}
            {/*
              // How to display "company" ?
              <List
                label="🏛️&nbsp; Companies"
                uri={['search', 'company']}
                params={{ query, sort_by: 'popularity.desc' }}
              />
            */}
            {/*
              // How to display "keyword" ?
              <List
                label="🔗&nbsp; Keywords"
                title={`Search for "${query}" keywords`}
                uri={['search', 'keywords']}
              />
            */}
          </div>
        ) : (!loading && empty) ? (
          <div css={Results.styles.fallback}>
            <Empty
              css={Results.styles.empty}
              emoji="🔍"
              title="Sorry, no results"
              subtitle={(
                <span>
                  Try something more familiar, like "Pulp Fiction" ?
                </span>
              )}
            />
          </div>
        ) : (
          <div css={Results.styles.fallback}>
            <Spinner />
          </div>
        )}
      </div>
      {(!!query || expanded) && (
        <button onClick={() => setExpanded(!expanded)} css={Results.styles.resize}>
          {expanded ? <Reduce /> : <Expand />}
        </button>
      )}
      <hr css={Results.styles.hr} />
    </div>
  )
}

Results.reducer = (state, [key, value]) => ({
  ...state,
  [key]: value,
})

Results.initialState = {
  movie: null,
  collection: null,
}

Results.styles = {
  element: {
    position: 'relative',
    overflow: 'hidden',
    margin: '0 0 -1px 0',
  },
  separator: {
    border: 'none',
    margin: '0 calc(15% + 5em) 0 calc(15% + 10em)',
    borderBottom: `1px solid ${theme.colors.mercury}`,
  },
  resize: {
    ...theme.resets.button,
    color: theme.colors.gray,
    display: 'flex',
    padding: '0.5em',
    height: '2em',
    width: '2em',
    position: 'absolute',
    top: '1em',
    right: '1em',
    ':hover': {
      color: theme.colors.rangoon,
    }
  },
  scroller: {
    background: 'white',
    height: '100%',
    overflowY: 'auto',
    transition: 'opacity 600ms ease-in-out',
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    minHeight: '15em',
    '>div': {
      padding: '2em',
    },
  },
  fallback: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  empty: {
    fontSize: '0.75em',
  },
  suggestions: {
    minHeight: '1em',
    '>div': {
      width: '100%',
      padding: '1em 0',
      textAlign: 'center',
    },
  },
  label: {
    padding: '0 0 1em 0',
    fontSize: '1em',
  },
  suggestion: {
    ...theme.resets.button,
    width: '100%',
    padding: '0.5em 0',
    ':hover,:focus': {
      color: theme.colors.primary,
    },
  },
  hr: {
    position: 'absolute',
    bottom: '1px',
    width: '100%',
    border: 'none',
    margin: '0 0 -1px 0',
    borderBottom: `1px solid ${theme.colors.grey}`,
  },
}

export const Input = ({ location, history, match, staticContext, ...props }) => {
  const { active, setActive, query, setQuery } = useContext(Context)
  const reference = useRef()
  const [input, setInput] = useState('')

  const onChange = (value) => {
    setInput(value)
    Input.debounce(() => setQuery(value || ''))
  }

  const close = (active = false) => {
    setInput('')
    setQuery('')
    setActive(active)
    reference.current[active ? 'focus' : 'blur']()
  }

  const handleKeyDown = (e) => {
    if (
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      /^[a-zA-Z0-9]{1}$/.test(e.key)
    ) {
      reference.current.focus()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (query !== input) {
      setInput(query)
      setActive(!!query)
    }

    reference.current[!!query || active ? 'focus' : 'blur']()
  }, [query, active])

  return (
    <div css={Input.styles.element}>
      {input && input !== query ? (
        <Spinner css={Input.styles.icon} />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 129 129"
          css={[
            Input.styles.icon,
            (active || query ? Input.styles.active : Input.styles.blured),
          ]}
          onClick={() => reference.current.focus()}
        >
          <path fill="currentColor" d="M51.6 96.7c11 0 21-3.9 28.8-10.5l35 35c.8.8 1.8 1.2 2.9 1.2s2.1-.4 2.9-1.2c1.6-1.6 1.6-4.2 0-5.8l-35-35c6.5-7.8 10.5-17.9 10.5-28.8 0-24.9-20.2-45.1-45.1-45.1-24.8 0-45.1 20.3-45.1 45.1 0 24.9 20.3 45.1 45.1 45.1zm0-82c20.4 0 36.9 16.6 36.9 36.9C88.5 72 72 88.5 51.6 88.5S14.7 71.9 14.7 51.6c0-20.3 16.6-36.9 36.9-36.9z"/>
        </svg>
      )}
      <input
        ref={reference}
        type="text"
        placeholder="Search for anything"
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setActive(true)}
        css={Input.styles.input}
      />
      {!!input && (
        <button onClick={() => close(true)} css={Input.styles.clear}>
          <Clear />
        </button>
      )}
    </div>
  )
}

Input.debounce = nanobounce(500)

Input.styles = {
  element: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    ...theme.resets.input,
    fontSize: '0.625em',
    padding: '1.3334em 0.5em',
  },
  icon: {
    height: '0.75em',
    width: '0.75em',
    margin: '0 0.25em',
    cursor: 'pointer',
    transition: 'color ease 600ms',
  },
  active: {
    color: theme.colors.primary,
    opacity: 1,
  },
  blured: {
    color: theme.colors.rangoon,
    opacity: 0.8,
  },
  clear: {
    ...theme.resets.button,
    position: 'absolute',
    right: '1.25em',
    alignSelf: 'center',
    width: '0.583em',
  },
}

export default {
  Context,
  Provider,
  Input,
  Results,
}
