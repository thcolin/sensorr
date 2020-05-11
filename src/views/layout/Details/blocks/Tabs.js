import React, { useState, useEffect, useMemo } from 'react'
import { setHistoryState } from 'utils/history'
import Items from 'components/Layout/Items'
import { withRouter } from 'react-router-dom'
import nanobounce from 'nanobounce'
import theme from 'theme'

const Tabs = ({ id, details, items: rows, initial: init, placeholder, palette, ready, history }) => {
  const initial = (!!id && !!history.location.state && history.location.state[id]) || init
  const items = rows.reduce((acc, row) => ({
    ...acc,
    ...(!Array.isArray(row) ?
      { [row.key]: row } :
      row.reduce((acc, item) => ({ ...acc, [item.key]: item }), {})
    ),
  }), {})

  const [key, setKey] = useState(initial)
  const item = items[key] || items[initial] || { state: {}, props: {} }
  const [state, setState] = useState(item.state)
  const [debounced, setDebounced] = useState(true)
  const debounce = useMemo(() => nanobounce(400), [])

  const handleItemChange = (item) => {
    setDebounced(false)
    setKey(item.key)
    setState(item.state)
    debounce(() => setDebounced(true))
    
    if (!!id) {
      setHistoryState({ [id]: item.key })
    }
  }

  useEffect(() => {
    setKey(initial)
    setState((items[initial] || { state: {} }).state)
  }, [details, JSON.stringify(Object.keys(items)), initial])

  const props = item.props
  const entities = (props.entities || [])
    .filter(state.filter || (() => true))
    .sort(state.sort || (() => 0))

  return (
    <div css={Tabs.styles.element}>
      <div css={Tabs.styles.tabs}>
        {rows.map((row, index) => (
          Array.isArray(row) ? (
            <div key={index}>
              {row.map(item => (
                <span
                  key={item.key}
                  onClick={() => handleItemChange(item)}
                  css={placeholder}
                  style={{ opacity: !ready || item.key === key ? 1 : 0.25 }}
                >
                  {item.label}
                </span>
              ))}
            </div>
          ) : (
            <span
              key={row.key}
              onClick={() => handleItemChange(item)}
              css={placeholder}
              style={{ opacity: !ready || row.key === key ? 1 : 0.25 }}
            >
              {row.label}
            </span>
          )
        ))}
      </div>
      <Items
        {...props}
        display="row"
        subtitle={props.subtitle && (
          <div css={Tabs.styles.subtitle} style={{ color: palette.color }}>
            <props.subtitle
              details={details}
              entities={entities}
              state={state}
              setState={setState}
            />
          </div>
        )}
        entities={!(ready && props.entities) ? [] : entities}
        ready={ready && debounced}
        empty={{ style: Tabs.styles.empty }}
      />
    </div>
  )
}

Tabs.styles = {
  element: {
    margin: '0 0 -6.75em 0',
    '>div': {
      padding: 0,
    }
  },
  tabs: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2em 1em 1em 1em',
    '>div': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      '>span': {
        margin: '0 1em',
        fontSize: '1.125em',
        lineHeight: '1.5em',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 400ms ease-in-out',
        '>small': {
          fontWeight: 'normal',
        }
      },
    },
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '1em 3em',
    fontSize: '0.6em',
    '>label': {
      position: 'relative',
      '>select': {
        position: 'absolute',
        opacity: 0,
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        appearance: 'none',
        border: 'none',
        cursor: 'pointer',
      },
    },
  },
  empty: {
    color: theme.colors.rangoon,
  },
}

export default withRouter(Tabs)
