import React, { useRef, useState } from 'react'
import { withRouter } from 'react-router-dom'
import List from 'components/Layout/List'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import Spinner from 'components/Spinner'
import Clear from 'icons/Clear'
import nanobounce from 'nanobounce'
import qs from 'query-string'
import theme from 'theme'

const styles = {
  input: {
    element: {
      position: 'relative',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
    },
    input: {
      ...theme.resets.input,
      fontSize: '0.6125em',
      padding: '1.36em 0.5em',
    },
    icon: {
      height: '0.75em',
      width: '0.75em',
      margin: '0 0.25em',
      cursor: 'pointer',
      transition: 'color ease 600ms',
    },
    focused: {
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
      cursor: 'pointer',
    },
  },
  results: {
    element: {
      padding: '2em 0',
    },
  },
}

const debounce = nanobounce(500)

export const Input = withRouter(({ location, history, match, staticContext, ...props }) => {
  const reference = useRef()
  const [query, setQuery] = [
    qs.parse(location.search).query || '',
    (query) => history.replace({ pathname: location.pathname, ...(query ? { search: `?query=${query}` } : {}) }),
  ]
  const [input, setInput] = useState(query || '')
  const [focused, setFocused] = useState(false)

  const onChange = (value) => {
    setInput(value)
    debounce(() => setQuery(value || ''))
  }

  const close = () => {
    setInput('')
    setQuery('')
    reference.current.blur()
  }

  return (
    <div css={styles.input.element}>
      {input && input !== query ? (
        <Spinner css={styles.input.icon} />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 129 129"
          css={[
            styles.input.icon,
            (focused || query ? styles.input.focused : styles.input.blured),
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
        onKeyDown={(e) => e.key === 'Escape' && close()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        css={styles.input.input}
      />
      {!!input && (
        <button onClick={() => close()} css={styles.input.clear}>
          <Clear />
        </button>
      )}
    </div>
  )
})

const Childs = {
  collection: (props) => <Film withState={false} link={(entity) => `/collection/${entity.id}`} {...props} />,
  persona: (props) => <Persona context="portrait" {...props} />,
}

export const Results = withRouter(({ location, history, match, staticContext, children, ...props }) => {
  const { query } = qs.parse(location.search)

  return !!query && (
    <div {...props} css={styles.results.element}>
      <List
        label="🎞️&nbsp; Movies"
        title={`Search for "${query}" movies`}
        hide={true}
        uri={['search', 'movie']}
        params={{ query, sort_by: 'popularity.desc' }}
        child={Film}
      />
      <List
        label="📚&nbsp; Collections"
        title={`Search for "${query}" collections`}
        hide={true}
        uri={['search', 'collection']}
        params={{ query, sort_by: 'popularity.desc' }}
        child={Childs.collection}
      />
      <List
        label="⭐&nbsp; Stars"
        title={`Search for "${query}" movies`}
        hide={true}
        uri={['search', 'person']}
        params={{ query, sort_by: 'popularity.desc' }}
        child={Childs.persona}
      />
      {/*
        // How to display "company" ?
        <List
          label="🏛️&nbsp; Companies"
          title={`Search for "${query}" companies`}
          uri={['search', 'company']}
          params={{ query, sort_by: 'popularity.desc' }}
          // child={(props) => <Persona context="portrait" {...props} />}
        />
      */}
      {/*
        // How to display "keyword" ?
        <List
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
  Input,
  Results,
}
