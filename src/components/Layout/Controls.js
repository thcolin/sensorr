import React, { useState, useEffect, useMemo, useRef } from 'react'
import * as Emotion from '@emotion/core'
import { setHistoryState } from 'utils/history'
import AnimateHeight from 'react-animate-height'
import Range from 'components/Form/Range'
import Checkbox from 'components/Form/Checkbox'
import Radio from 'components/Form/Radio'
import Select from 'components/Form/Select'
import Button from 'components/Button'
import Chevron from 'icons/Chevron'
import nanobounce from 'nanobounce'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    // overflow: 'hidden',
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
  input: {
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
  pane: {
    // overflow: 'hidden',
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
  radio: {
    flex: 1,
  },
  select: {
    flex: 1,
  }
}

const Input = ({ onChange, ...props }) => {
  const input = useRef(null)
  const [value, setValue] = useState('')
  const debounce = useMemo(() => nanobounce(500), [])

  return (
    <input
      ref={input}
      type="text"
      value={value}
      onChange={(e) => {
        const value = e.target.value || ''
        setValue(value)
        debounce(() => onChange(value))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setValue('')
          onChange('')
          input.current.blur()
        }
      }}
      css={styles.input}
      placeholder="Filter"
    />
  )
}

const Controls = ({
  label,
  entities,
  filters,
  sortings,
  defaults: _defaults,
  initial: _initial,
  total,
  onChange,
  render = {},
  disabled,
  ...props
}) => {
  const defaults = useMemo(() => typeof _defaults === 'function' ? _defaults() : _defaults, [_defaults])
  const initial = useMemo(() => typeof _initial === 'function' ? _initial() : _initial, [_initial])

  const [filtering, setFiltering] = useState((initial || defaults).filtering)
  const [sorting, setSorting] = useState((initial || defaults).sorting)
  const [reverse, setReverse] = useState((initial || defaults).reverse)
  const [state, setState] = useState((initial || defaults).state)
  const [query, setQuery] = useState('')
  const [previous, setPrevious] = useState(initial || defaults)
  const [open, setOpen] = useState(false)

  const active = Object.keys(filtering)
    .filter(key => !['query'].includes(key))
    .filter(key => !filters[key].default || (!!filtering[key] && JSON.stringify(filtering[key]) !== JSON.stringify(filters[key].default)))

  const without = (keys) => entities
    .filter((entity) => Object.keys(filtering)
      .filter(key => !keys.includes(key)).every(key => filters[key].apply(entity, filtering[key]))
    )

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

  const apply = ({ query = '', ...diff } = {}, effects = true) => {
    if (effects) {
      setOpen(false)
      setPrevious({ filtering, sorting, reverse })
    }

    setHistoryState({
      controls: {
        filtering,
        sorting,
        reverse,
      },
    })

    onChange({
      state,
      filtering,
      filter: (entity) =>
        Object.keys(filtering).every(key => filters[key].apply(entity, filtering[key])) &&
        (!filters.query || filters.query.apply(entity, query)),
      sorting,
      reverse,
      sort: (a, b) => sortings[sorting].apply(a, b, reverse),
      ...diff,
    })
  }

  // Apply default sort/filter on componentDidMount
  useEffect(() => {
    apply({ query }, false)
  }, [])

  const blocks = Object.keys(filters)
    .reduce((blocks, key) => {
      const filter = filters[key]
      const histogram = filter.histogram ? filter.histogram(without([key])) : {}

      switch (filter.type) {
        case 'checkbox':
          return {
            ...blocks,
            [key]: {
              element: Checkbox,
              props: {
                ...(filter.props || {}),
                key: key,
                css: styles.checkbox,
                label: filter.label,
                options: filter.options
                  .map(input => ({ ...input, count: histogram[input.value] }))
                  .sort((a, b) => filter.orderize ? b.count - a.count : 0),
                onChange: values => setFiltering({ ...filtering, [key]: values }),
                values: filtering[key] || filter.default || [],
                disabled: disabled,
              },
            },
          }
        case 'range':
          return {
            ...blocks,
            [key]: {
              element: Range,
              props: {
                ...(filter.props || {}),
                key: key,
                css: styles.range,
                label: filter.label,
                labelize: filter.labelize,
                values: filtering[key] || filter.default || [filter.min, filter.max],
                onChange: (values) => setFiltering({ ...filtering, [key]: values }),
                min: filter.min || 0,
                max: filter.max || 100,
                marks: filter.marks,
                step: typeof filter.step === 'undefined' ? 1 : filter.step,
                unit: filter.unit || null,
                data: histogram,
                disabled: disabled,
              },
            }
          }
        case 'select':
          return {
            ...blocks,
            [key]: {
              element: Select,
              props: {
                ...(filter.props || {}),
                key: key,
                css: styles.select,
                label: filter.label,
                options: filter.options,
                value: filtering[key] || filter.default,
                onChange: (values) => setFiltering({ ...filtering, [key]: values }),
                disabled: disabled,
              },
            }
          }
        case 'radio':
          return {
            ...blocks,
            [key]: {
              element: Radio,
              props: {
                ...(filter.props || {}),
                key: key,
                css: styles.radio,
                label: filter.label,
                options: filter.options,
                value: filtering[key] || filter.default,
                onChange: (value) => setFiltering({ ...filtering, [key]: value }),
                disabled: disabled,
              },
            }
          }
        default:
          return blocks
      }
    }, {})

  if (sortings) {
    blocks.sorting = {
      element: Radio,
      props: {
        key: 'sorting',
        label: `Sort ${reverse ? '↓' : '↑'}`,
        css: styles.radio,
        options: Object.values(sortings),
        onChange: value => value ? setSorting(value) : setReverse(!reverse),
        value: sorting,
        disabled: disabled,
      },
    }
  }

  return (
    <div css={styles.element}>
      <div css={styles.menu}>
        {render.menu ? (
          render.menu({
            setOpen,
            state,
            setState: (state) => {
              setState(state)
              apply({ state })
            },
          })
        ) : (
          <>
            <Input
              key="query"
              onChange={query => {
                setQuery(query)
                apply({ query }, false)
              }}
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
                      .map(value => (filters[key].options.filter(filter => filter.value === value).pop() || {}).label)
                      .filter(label => label)
                      .join(', '),
                  }[filters[key].type] || (() => null))()}
                >
                  <span>{filters[key].label}</span>
                  <Chevron.Down />
                </button>
              )) : (
                <button onClick={() => setOpen(true)} data-test="controls-all">
                  <span>All</span>
                  <Chevron.Down />
                </button>
              )}
              {sorting && (
                <button onClick={() => setOpen(true)} title={`Sorted by ${sortings[sorting].label} ${reverse ? '↓' : '↑'}`}>
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
            {Emotion.jsx(label, {
              total: total || without([]).length,
              reset,
              state,
              setState: (state) => {
                setState(state)
                apply({ state })
              }
            })}
            <div>
              <Button look={1} onClick={() => cancel()}>Cancel</Button>
              <Button onClick={() => apply({ query })}>Apply</Button>
            </div>
          </div>
        </div>
      </div>
      <AnimateHeight css={styles.pane} height={open ? 'auto' : 0} delay={open ? 250 : 0}>
        <div {...(open ? {} : { style: { opacity: 0 } })}>
          {render.pane ?
            render.pane(blocks) :
            Object.values(blocks).map(({ element, props }) => Emotion.jsx(element, props))
          }
        </div>
      </AnimateHeight>
    </div>
  )
}

export default Controls
