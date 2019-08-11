import React, { Fragment, useState, useContext, useRef } from 'react'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import theme from 'theme'

const Context = React.createContext()

const styles = {
  filter: {
    zIndex: 1,
    position: 'sticky',
    top: '-1px',
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.grey,
    border: 'none',
    fontSize: '1.125em',
    padding: '0.792em 1em',
    margin: 0,
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
    outline: 'none',
  },
  state: {
    position: 'absolute',
    cursor: 'pointer',
    right: '1em',
    top: '0.375em',
    fontSize: '2em',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '2em 0',
  },
}

const Collection = ({ ...props }) => {
  const { query, state } = useContext(Context)

  return (
    <Fragment>
      <Helmet>
        <title>Sensorr - Collection</title>
      </Helmet>
      <div style={styles.wrapper}>
        <Grid
          limit={true}
          strict={false}
          query={(db) => db.movies.find().where('state').ne('ignored')}
          filter={entity => (
            (state === 'all' || entity.state === state) &&
            [entity.title, entity.original_title].some(string => new RegExp(query, 'i').test(string))
          )}
          child={Film}
        />
      </div>
    </Fragment>
  )
}

export default Collection

export const Provider = ({ ...props }) => {
  const [query, setQuery] = useState('')
  const [state, setState] = useState('all')

  return (
    <Context.Provider
      {...props}
      value={{
        query,
        setQuery,
        state,
        setState,
      }}
    />
  )
}

export const Navigation = ({ ...props }) => {
  const ref = useRef(null)
  const { query, setQuery, state, setState } = useContext(Context)

  const close = () => {
    setQuery('')
    ref.current.blur()
  }

  return (
    <div style={styles.filter}>
      <input
        ref={ref}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && close()}
        style={styles.input}
        placeholder="Filter..."
      />
      <i
        onClick={() => setState({ all: 'pinned', pinned: 'wished', wished: 'archived', archived: 'all' }[state])}
        title={{ all: 'All', pinned: 'Pinned', wished: 'Wished', archived: 'Archived' }[state]}
        style={styles.state}
      >
        {{ all: '📚', pinned: '📍', wished: '🍿', archived: '📼' }[state]}
      </i>
    </div>
  )
}
