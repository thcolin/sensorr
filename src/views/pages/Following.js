import React, { Fragment, useState, useContext, useRef } from 'react'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Persona from 'components/Entity/Persona'
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
    fontSize: '1.25em',
    padding: '0.75em 1em',
    margin: 0,
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
    outline: 'none',
  },
  wrapper: {
    padding: '2em 0',
  },
}

const Following = ({ ...props }) => {
  const { query } = useContext(Context)

  return (
    <Fragment>
      <Helmet>
        <title>Sensorr - Following</title>
      </Helmet>
      <div>
        <div style={styles.wrapper}>
          <Grid
            limit={true}
            strict={false}
            query={(db) => db.stars.find().where('state').ne('ignored')}
            filter={entity => [entity.name, ...(entity.also_known_as || [])].some(string => new RegExp(query, 'i').test(string))}
            child={(props) => <Persona context="portrait" {...props} />}
            empty={{
              emoji: '👩‍🎤',
              title: "Oh no, you are not following anyone",
              subtitle: (
                <span>
                  You should try to search for stars and start following them !
                </span>
              ),
            }}
          />
        </div>
      </div>
    </Fragment>
  )
}

export default Following

export const Provider = ({ ...props }) => {
  const [query, setQuery] = useState('')

  return (
    <Context.Provider
      {...props}
      value={{
        query,
        setQuery,
      }}
    />
  )
}

export const Navigation = ({ ...props }) => {
  const ref = useRef(null)
  const { query, setQuery } = useContext(Context)

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
    </div>
  )
}
