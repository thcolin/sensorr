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
      '>div>button:first-of-type': {
        margin: '0 0.75em 0 0',
      },
      '>div>button:last-of-type': {
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
        ':first-of-type:not(:last-of-type)': {
          margin: '2em 0 1em 0',
        },
        ':last-of-type:not(:first-of-type)': {
          margin: '1em 0 2em',
        },
      },
    },
  },
  checkbox: {
    flex: 1,
  },
  range: {
    flex: 1,
  },
  sort: {
    display: 'flex',
    '>*': {
      flex: 1,
    }
  },
}

const debounce = nanobounce(500)

const Controls = ({ label, entities, filters, sortings, defaults, onChange, render = {}, ...props }) => {
  const [filtering, setFiltering] = useState(defaults.filtering)
  const [sorting, setSorting] = useState(defaults.sorting)
  const [reverse, setReverse] = useState(defaults.reverse)
  const [query, setQuery] = useState('')
  const [previous, setPrevious] = useState(defaults)
  const [open, setOpen] = useState(false)
  const input = useRef(null)

  const active = Object.keys(filtering)
    .filter(key => !['query'].includes(key))
    .filter(key => !filters[key].default || JSON.stringify(filtering[key]) !== JSON.stringify(filters[key].default))

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

  const Blocks = Object.keys(filters)
    .reduce((Blocks, key) => {
      const filter = filters[key]
      const histogram = filter.histogram ? filter.histogram(without([key])) : {}

      switch (filter.type) {
        case 'checkbox':
          return {
            ...Blocks,
            [key]: (props) => (
              <Checkbox
                {...props}
                key={key}
                css={[styles.checkbox, props.css]}
                label={filter.label}
                inputs={filter.inputs
                  .map(input => ({ ...input, count: histogram[input.value] }))
                  .sort((a, b) => filter.orderize ? b.count - a.count : 0)
                }
                onChange={values => setFiltering({ ...filtering, [key]: values })}
                values={filtering[key] || filter.default || []}
              />
            ),
          }
        case 'range':
          return {
            ...Blocks,
            [key]: (props) => (
              <Range
                {...props}
                key={key}
                css={[styles.range, props.css]}
                label={filter.label}
                values={filtering[key] || filter.default || [filter.min, filter.max]}
                onChange={(values) => setFiltering({ ...filtering, [key]: values })}
                min={filter.min || 0}
                max={filter.max || 100}
                step={filter.step || 1}
                unit={filter.unit || null}
                data={histogram}
              />
            ),
          }
        default:
          return Blocks
      }
    }, {})

  return (
    <div css={styles.element}>
      <div css={styles.menu}>
        {render.menu ? (
          render.menu({ setOpen })
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
              {active.length ? active.map(key => (
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
              )) : (
                <button onClick={() => setOpen(true)}>
                  <span>All</span>
                  <Chevron.Down />
                </button>
              )}
              {sorting && (
                <button onClick={() => setOpen(true)} title={`Sorted by ${sorting.label} ${reverse ? '↓' : '↑'}`}>
                  <span>Sort</span>
                  <Chevron.Down />
                </button>
              )}
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
          {render.filters ? render.filters(Blocks) : Object.values(Blocks).map(Block => <Block />)}
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
