import React, { useState, useEffect } from 'react'
import Items from 'components/Layout/Items'
import theme from 'theme'

const Tabs = ({ details, items: rows, initial, placeholder, palette, ready }) => {
  const items = rows.reduce((acc, row) => ({
    ...acc,
    ...(!Array.isArray(row) ?
      { [row.key]: row } :
      row.reduce((cca, item) => ({ ...cca, [item.key]: item }), {})
    ),
  }), {})

  const [key, setKey] = useState(initial)
  const [state, setState] = useState((items[key] || { state: {} }).state)

  useEffect(() => {
    setKey(initial)
    setState((items[initial] || { state: {} }).state)
  }, [(details || {}).id, rows, initial])

  const props = (items[key] || { props: {} }).props
  const source = (props.source || [])
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
                  onClick={() => {
                    setKey(item.key)
                    setState(item.state)
                  }}
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
              onClick={() => {
                setKey(row.key)
                setState(item.state)
              }}
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
              source={source}
              state={state}
              setState={setState}
            />
          </div>
        )}
        source={!(ready && props.source) ? [] : source}
        strict={false}
        placeholder={true}
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
    color: theme.colors.white,
  },
}

export default Tabs
