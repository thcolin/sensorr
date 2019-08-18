import React, { useRef, useState, useContext } from 'react'
import { usePrevious } from 'hooks'
import { withRouter } from 'react-router-dom'
import Row from 'components/Layout/Row'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import Spinner from 'components/Spinner'
import Clear from 'icons/Clear'
import nanobounce from 'nanobounce'
import qs from 'query-string'
import theme from 'theme'

const debounce = {
  input: nanobounce(500),
}

export const Contexts = {
  input: React.createContext(),
  toggled: React.createContext(),
}

const Providers = {
  input: withRouter(({ location, history, match, staticContext, ...props }) => {
    const { query } = qs.parse(location.search)
    const [input, setInput] = useState(query)

    return (
      <Contexts.input.Provider {...props} value={{ input, setInput }} />
    )
  }),
  toggled: withRouter(({ location, history, match, staticContext, ...props }) => {
    const { query } = qs.parse(location.search)
    const [toggled, setToggled] = useState(!!query)

    return (
      <Contexts.toggled.Provider {...props} value={{ toggled, setToggled }} />
    )
  }),
  safety: withRouter(({ location, children }) => {
    const { setInput } = useContext(Contexts.input)
    const { toggled, setToggled } = useContext(Contexts.toggled)
    const { query } = qs.parse(location.search)
    const previous = usePrevious(location.search)

    // from `/x?query=y` to `/x` (from user action, like link click) should setToggled(false) && setInput(null)
    if (previous && !location.search) {
      setToggled(false)
      setInput(null)
    }

    // from `/x?query=y` to `/x?query=yz` (from user action, like history back) should setInput(yz)
    if (typeof query !== 'undefined' && !toggled) {
      setInput(query)
      setToggled(true)
    }

    return children
  })
}

export const Provider = ({ children, ...props }) => (
  <Providers.input>
    <Providers.toggled >
      {children}
    </Providers.toggled>
  </Providers.input>
)

export const Icon = withRouter(({ location, history, match, staticContext, ...props }) => {
  const { setInput } = useContext(Contexts.input)
  const { toggled, setToggled } = useContext(Contexts.toggled)
  const { query } = qs.parse(location.search)
  const setQuery = (query) => history.replace({
    pathname: location.pathname,
    ...(query ? { search: `?query=${query}` } : {}),
  })

  return (
    <Providers.safety >
      <div
        {...props}
        onClick={() => {
          setInput(null)
          setToggled(!toggled)

          if (query) {
            setQuery(null)
          }
        }}
        style={{ ...(props.style || {}), cursor: 'pointer' }}
      >
        🔍
      </div>
    </Providers.safety>
  )
})

export const Input = withRouter(({ location, history, match, staticContext, style = {}, ...props }) => {
  const reference = useRef()
  const { input, setInput } = useContext(Contexts.input)
  const { toggled, setToggled } = useContext(Contexts.toggled)
  const { query } = qs.parse(location.search)
  const setQuery = (query) => history.replace({
    pathname: location.pathname,
    ...(query !== null ? { search: `?query=${query}` } : {}),
  })

  const close = () => {
    setToggled(false)
    setInput(null)
    setQuery(null)
  }

  if (toggled) {
    reference.current && reference.current.focus()
  } else {
    reference.current && reference.current.blur()
  }

  return (
    <div style={{ display: 'flex' }}>
      {(input && input !== query) && (
        <Spinner
          style={{
            position: 'absolute',
            left: '1.25em',
            alignSelf: 'center',
            width: '1.25em',
            height: '1.25em',
            margin: 0,
            opacity: 0.6,
          }}
        />
      )}
      <input
        {...props}
        type="text"
        value={input || ''}
        onChange={(e) => {
          e.persist()
          setInput(e.target.value)
          debounce.input(() => setQuery(e.target.value || ''))
        }}
        onKeyDown={(e) => e.key === 'Escape' && close()}
        placeholder="Search..."
        ref={reference}
        css={{
          width: '100%',
          backgroundColor: theme.colors.primary,
          border: 'none',
          padding: 0,
          margin: 0,
          fontSize: '1.25em',
          padding: '0.75em',
          textAlign: 'center',
          color: theme.colors.white,
          fontFamily: 'inherit',
          outline: 'none',
          '&::placeholder': {
            color: theme.colors.white,
            opacity: 0.5,
          },
        }}
      />
      {!!input && (
        <span
          onClick={() => close()}
          style={{
            position: 'absolute',
            right: '1.25em',
            alignSelf: 'center',
            width: '1.25em',
            cursor: 'pointer',
          }}
        >
          <Clear />
        </span>
      )}
    </div>
  )
})

export const Results = withRouter(({ location, history, match, staticContext, children, style, ...props }) => {
  const { query } = qs.parse(location.search)

  return !!query && (
    <div
      {...props}
      key="search-results"
      style={{
        ...(style || {}),
        background: 'white',
        padding: '2em 0',
      }}
    >
      <Row
        label="🎞️&nbsp; Movies"
        title={`Search for "${query}" movies`}
        hide={true}
        uri={['search', 'movie']}
        params={{ query, sort_by: 'popularity.desc' }}
        child={Film}
      />
      <Row
        label="📚&nbsp; Collections"
        title={`Search for "${query}" collections`}
        hide={true}
        uri={['search', 'collection']}
        params={{ query, sort_by: 'popularity.desc' }}
        child={(props) => <Film withState={false} link={(entity) => `/collection/${entity.id}`} {...props} />}
      />
      <Row
        label="⭐&nbsp; Stars"
        title={`Search for "${query}" movies`}
        hide={true}
        uri={['search', 'person']}
        params={{ query, sort_by: 'popularity.desc' }}
        child={(props) => <Persona context="portrait" {...props} />}
      />
      {/*
        // How to display "company" ?
        <Row
          label="🏛️&nbsp; Companies"
          title={`Search for "${query}" companies`}
          uri={['search', 'company']}
          params={{ query, sort_by: 'popularity.desc' }}
          // child={(props) => <Persona context="portrait" {...props} />}
        />
      */}
      {/*
        // How to display "keyword" ?
        <Row
          label="🔗&nbsp; Keywords"
          //label="🏷️&nbsp; Keywords"
          title={`Search for "${query}" keywords`}
          uri={['search', 'keywords']}
          params={{ query, sort_by: 'popularity.desc' }}
          // child={(props) => <Persona context="portrait" {...props} />}
        />
      */}
    </div>
  )
})

export default {
  Contexts,
  Provider,
  Icon,
  Input,
  Results,
}
