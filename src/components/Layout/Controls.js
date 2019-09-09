import React, { useState, useEffect, useRef } from 'react'
import AnimateHeight from 'react-animate-height'
import Range from 'components/Form/Range'
import Checkbox from 'components/Form/Checkbox'
import Radio from 'components/Form/Radio'
import Button from 'components/Button'
import Chevron from 'icons/Chevron'
import nanobounce from 'nanobounce'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
  },
  menu: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10%',
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    top: 0,
    backgroundColor: theme.colors.tertiary,
    color: 'white',
    transition: 'transform ease-in-out 250ms',
    '>div': {
      transition: 'opacity ease-in-out 250ms 250ms',
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      '>div>button': {
        width: '8em',
        margin: '0 0.75em',
        fontSize: '0.8em',
      },
      '>div>button:first-child': {
        margin: '0 0.75em 0 0',
      },
      '>div>button:last-child': {
        margin: '0 0 0 0.75em',
      },
    },
  },
  query: {
    ...theme.resets.input,
    flex: 1,
    padding: '1.75em 0',
    lineHeight: 1.5,
    color: 'white',
    '::placeholder': {
      color: 'white',
      opacity: 0.6,
    },
  },
  summary: {
    display: 'flex',
    '>button': {
      ...theme.resets.button,
      display: 'flex',
      alignItems: 'center',
      color: 'white',
      padding: '2em 1em',
      fontSize: '0.75em',
      '>span': {
        margin: '0 0.5em 0 0',
      },
      '>svg': {
        heigth: '0.6125em',
        width: '0.6125em',
      },
    }
  },
  panel: {
    overflow: 'hidden',
    backgroundColor: theme.colors.primary,
    color: 'white',
    '>div>div': {
      padding: '1em 10%',
      transition: 'opacity ease-in-out 500ms 750ms',
      '>*': {
        margin: '2em 0',
        ':first-child:not(:last-child)': {
          margin: '2em 0 1em 0',
        },
        ':last-child:not(:first-child)': {
          margin: '1em 0 2em',
        },
      },
    },
  },
  checkboxes: {
    display: 'flex',
    flexDirection: 'column',
    '>*': {
      flex: 1,
      margin: '1em 0',
      ':first-child': {
        margin: '0 0 1em',
      },
      ':last-child': {
        margin: '1em 0 0',
      },
      ':first-child:last-child': {
        margin: 0,
      },
    },
  },
  ranges: {
    display: 'flex',
    '>*': {
      flex: 1,
      margin: '0 1em 0.5em',
      ':first-child': {
        margin: '0 1em 0.5em 0',
      },
      ':last-child': {
        margin: '0 0 0.5em 1em',
      },
      ':first-child:last-child': {
        margin: '0 0 0.5em 0',
      },
    },
  },
  sort: {
    display: 'flex',
    '>*': {
      flex: 1,
    }
  },
  reverse: {
    ...theme.resets.button,
  }
}

const debounce = nanobounce(500)

const Controls = ({ label, entities, filters, sortings, defaults, onChange, children, ...props }) => {
  const [filtering, setFiltering] = useState(defaults.filtering)
  const [sorting, setSorting] = useState(defaults.sorting)
  const [reverse, setReverse] = useState(defaults.reverse)
  const [query, setQuery] = useState('')
  const [previous, setPrevious] = useState(defaults)
  const [open, setOpen] = useState(false)
  const input = useRef(null)

  const without = (keys) => entities
    .filter((entity) => Object.keys(filtering).filter(key => !keys.includes(key)).every(key => filters[key].apply(entity, filtering[key])))

  const blur = () => {
    setQuery('')
    input.current.blur()
  }

  const reset = () => {
    setFiltering(defaults.filtering)
    setSorting(defaults.sorting)
    setReverse(defaults.reverse)
  }

  const cancel = () => {
    setOpen(false)
    setFiltering(previous.filtering)
    setSorting(previous.sorting)
    setReverse(previous.reverse)
  }

  const apply = (query = '', effects = true) => {
    if (effects) {
      setOpen(false)
      setPrevious({ filtering, sorting, reverse })
    }

    onChange({
      sort: (a, b) => sorting.apply(a, b, reverse),
      filter: (entity) =>
        Object.keys(filtering).every(key => filters[key].apply(entity, filtering[key])) &&
        (!filters.query || filters.query.apply(entity, query)),
    })
  }

  // Apply default sort/filter on componentDidMount
  useEffect(() => {
    apply(query, false)
  }, [])

  const Checkboxes = ({ filters }) => !!Object.keys(filters).length && (
    <div css={styles.checkboxes}>
      {Object.keys(filters).map(key => {
        const filter = filters[key]
        const histogram = filter.histogram ? filter.histogram(without([key])) : {}

        return (
          <Checkbox
            key={key}
            label={filter.label}
            inputs={filter.inputs.map(input => ({ ...input, count: histogram[input.value] || 0 }))}
            onChange={values => setFiltering({ ...filtering, [key]: values })}
            values={filtering[key] || filter.default || []}
          />
        )
      })}
    </div>
  )

  const Ranges = ({ filters }) => !!Object.keys(filters).length && (
    <div css={styles.ranges}>
      {Object.keys(filters).map(key => {
        const filter = filters[key]
        const histogram = filter.histogram ? filter.histogram(without([key])) : {}

        return (
          <Range
            key={key}
            label={filter.label}
            values={filtering[key] || filter.default || [filter.min, filter.max]}
            onChange={(values) => setFiltering({ ...filtering, [key]: values })}
            min={filter.min || 0}
            max={filter.max || 100}
            step={filter.step || 1}
            data={histogram}
          />
        )
      })}
    </div>
  )

  return (
    <div css={styles.element}>
      <div css={styles.menu}>
        {children ? (
          children({ setOpen })
        ) : (
          <>
            <input
              key="query"
              ref={input}
              type="text"
              value={query}
              onChange={(e) => {
                const query = e.target.value || ''
                setQuery(query)
                debounce(() => apply(query))
              }}
              onKeyDown={(e) => e.key === 'Escape' && blur()}
              css={styles.query}
              placeholder="Filter"
            />
            <div key="summary" css={styles.summary}>
              {Object.keys(filtering)
                .filter(key => !['query'].includes(key))
                .filter(key => !filters[key].default || JSON.stringify(filtering[key]) !== JSON.stringify(filters[key].default))
                .map(key => {
                  return (
                    <button
                      key={key}
                      onClick={() => setOpen(true)}
                      title={({
                        range: () => filtering[key]
                          .join('-'),
                        checkbox: () => filtering[key]
                          .map(value => filters[key].inputs.filter(filter => filter.value === value).pop().label)
                          .join(', '),
                      }[filters[key].type])() || false}
                    >
                      <span>{filters[key].label}</span>
                      <Chevron.Down />
                    </button>
                  )
                })
              }
              {!Object.keys(filtering)
                .filter(key => !['query'].includes(key))
                .filter(key => !filters[key].default || JSON.stringify(filtering[key]) !== JSON.stringify(filters[key].default)).length &&
              (
                <button onClick={() => setOpen(true)}>
                  <span>All</span>
                  <Chevron.Down />
                </button>
              )}
              <button onClick={() => setOpen(true)} title={`Sorted by ${sorting.label} ${reverse ? '↓' : '↑'}`}>
                <span>Sort</span>
                <Chevron.Down />
              </button>
            </div>
          </>
        )}
        <div
          css={[styles.menu, styles.secondary]}
          style={{
            transform: `translateX(${open ? '-10%' : '-110%'})`,
            transitionDelay: open ? '0ms' : '250ms',
          }}
        >
          <div {...(open ? {} : { style: { opacity: 0 } })}>
            {React.createElement(label, { total: without([]).length, reset })}
            <div>
              <Button look={1} onClick={() => cancel()}>Cancel</Button>
              <Button onClick={() => apply(query)}>Apply</Button>
            </div>
          </div>
        </div>
      </div>
      <AnimateHeight css={styles.panel} height={open ? 'auto' : 0} delay={open ? 250 : 0}>
        <div {...(open ? {} : { style: { opacity: 0 } })}>
          <Checkboxes
            filters={Object.keys(filters)
              .filter(key => filters[key].type === 'checkbox')
              .reduce((acc, key) => ({ ...acc, [key]: filters[key] }), {})
            }
          />
          <Ranges
            filters={Object.keys(filters)
              .filter(key => filters[key].type === 'range')
              .reduce((acc, key) => ({ ...acc, [key]: filters[key] }), {})
            }
          />
          {sortings && (
            <div css={styles.sort}>
              <Radio
                label={`Sort ${reverse ? '↓' : '↑'}`}
                inputs={Object.values(sortings)}
                onChange={value => value ? setSorting(sortings[value]) : setReverse(!reverse)}
                value={sorting.value}
              />
            </div>
          )}
        </div>
      </AnimateHeight>
    </div>
  )
}

export default Controls
