import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import usePortal from 'react-useportal'
import { InputsProps } from './commons/Inputs'
import { Nav, Results, Title } from './commons/Nav'
import { ControlsToggleButton } from './commons/ControlsToggleButton'
import { Aside } from './commons/Aside'
import { useLayoutFields } from './commons/useLayoutFields'

export interface ControlsProps {
  title?: string
  level?: number
  watch?: [string[], (next: { [key: string]: any }, onChange: (values: { [key: string]: any }, close?: boolean) => any) => any],
  components?: {
    [key: string]: React.FC<any>
  }
  fields: {
    [key: string]: {
      component: React.FC<any>
      initial: any
      statistics?: any
      serialize?: (key: string, value: any) => { [key: string]: any }
      hideFromFiltersCount?: boolean,
      props?: {
        [key: string]: any
      }
    }
  }
  values: {
    [key: string]: any
  }
  onChange: (values: { [key: string]: any }) => void
  layout: {
    nav?: {
      [key: string]: any
      display: 'grid'
      gridTemplateAreas: any
      gridTemplateColumns?: any
      gridTemplateRows?: any
      gap?: any
    },
    aside?: {
      [key: string]: string
      display: 'grid'
      gridTemplateAreas: string
      gridTemplateColumns?: string
      gridTemplateRows?: string
      gap?: string
    } | {
      [key: string]: string
      display: 'grid'
      gridTemplateAreas: string
      gridTemplateColumns?: string
      gridTemplateRows?: string
      gap?: string
    }[],
  }
  statistics: Pick<InputsProps, 'statistics'>
  loading: boolean
  total?: number
  props?: any
}

const UIControls = ({ title, components, fields, values, onChange, layout, statistics, loading, total, level, watch, props }: ControlsProps) => {
  const { Portal, togglePortal: _togglePortal, closePortal: _closePortal, isOpen: open } = usePortal({ closeOnOutsideClick: false, closeOnEsc: true })

  const [subAsides, setSubAsides] = useState(Array(Math.max(0, (Array.isArray(layout.aside) ? layout.aside : [layout.aside]).length - 1)).fill(false))

  const togglePortal = useCallback((value) => {
    setSubAsides(subAsides => subAsides.map(() => false))
    _togglePortal(value)
  }, [_togglePortal])

  const closePortal = useCallback((value) => {
    setSubAsides(subAsides => subAsides.map(() => false))
    _closePortal(value)
  }, [_closePortal])

  const handleChange = useCallback((next, close) => {
    if (close) {
      close()
    }

    onChange({ ...values, ...next })
  }, [values, onChange, closePortal])

  const asides = (Array.isArray(layout.aside) ? layout.aside : [layout.aside]).map((aside, index) => useLayoutFields(aside, fields, index ? {} : {
    ...(subAsides.reduce((acc, subAside, i) => ({ ...acc, [`toggle_sub_asides_${i}`]: {
        initial: null,
        serialize: () => ({}),
        component: components?.[`toggle_sub_asides_${i}`] || ControlsToggleButton,
        props: {
          toggleOpen: () => setSubAsides(subAsides => subAsides.map((subAside, j) => j === i ? !subAside : subAside)),
          ...props,
        },
    } }), {}))
  }))

  const nav = useLayoutFields(layout.nav, fields, {
    ...Object.keys(components || {}).filter(component => new RegExp(component).test(layout.nav?.gridTemplateAreas)).reduce((acc, key) => ({
      ...acc,
      [key]: {
        initial: null,
        serialize: () => ({}),
        component: components[key],
        props,
      },
    }), {}),
    ...(title ? {
      title: {
        initial: null,
        serialize: () => ({}),
        component: components?.title || Title,
        props: { children: title, ...props },
      }
    } : {}),
    results: {
      initial: null,
      serialize: () => ({}),
      component: components?.results || Results,
      props: { loading, total, ...props },
    },
    ...(layout.aside ? {
      toggle: {
        initial: null,
        serialize: () => ({}),
        component: components?.toggle || ControlsToggleButton,
        props: { toggleOpen: togglePortal, fields, values, handleChange: (next) => handleChange(next, () => closePortal(false)), ...props },
      },
    } : {}),
  })

  const group = useMemo(() => ({
    nav: {
      fields: nav,
      defaultValues: Object.keys(values)
        .filter(key => Object.keys(nav).includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: values[key] }), {})
    },
    asides: asides.map(aside => ({
      fields: aside,
      defaultValues: Object.keys(values)
        .filter(key => Object.keys(aside).includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: values[key] }), {})
    })),
  }), [nav, asides, values])

  return (
    <>
      {layout.nav ? (
        <Nav
          {...group.nav}
          layout={layout.nav}
          onChange={(next) => handleChange(next, () => closePortal(false))}
          statistics={statistics}
        />
      ) : components.toggle ? (
        <components.toggle toggleOpen={togglePortal} />
      ) : null}
      {layout.aside && (
        <Portal>
          <div>
            {(Array.isArray(layout.aside) ? layout.aside : [layout.aside]).map((aside, index, arr) => (
              <Aside
                {...group.asides[index]}
                layout={aside}
                statistics={statistics}
                order={index}
                watch={watch}
                {...((Array.isArray(layout.aside) ? layout.aside : [layout.aside]).length > 1 ? {
                  level: index === 0 ? (level || 0) + (subAsides.findLastIndex(v => v) >= index ? 0 : 2) : (level || 0) + 1,
                } : {
                  level,
                })}
                {...(index === 0 ? {
                  open,
                  toggleOpen: togglePortal,
                  onChange: (next) => handleChange(next, () => closePortal(false)),
                } : {
                  open: subAsides[index - 1],
                  toggleOpen: () => setSubAsides(subAsides => subAsides.map((subAside, i) => i === (index - 1) ? !subAside : subAside)),
                  onChange: (next) => handleChange(next, () => setSubAsides(subAsides => subAsides.map((subAside, i) => i === (index - 1) ? !subAside : subAside))),
                })}
              />
            ))}
          </div>
        </Portal>
      )}
    </>
  )
}

export const Controls = memo(UIControls)

export interface withControlsArgs extends Omit<ControlsProps, 'values' | 'onChange' | 'statistics' | 'loading' | 'total'> {
  useStatistics: (entities: any[], fields: any) => { [key: string]: any }
  level?: number
  hooks?: {
    onChange?: (values: { [key: string]: any }, serialized: { [key:string]: any }) => any,
  }
}

export const withControls = ({ title = '', useStatistics, level, watch, hooks, layout, components, fields }: withControlsArgs) => (WrappedComponent) => {
  const withControls = ({ controls, ...props }: any) => {
    const statistics = useStatistics(props.entities, fields)

    const state = useMemo(() => ({
      props: controls?.props,
      values: Object.keys(fields).reduce((acc, key) => ({
        ...acc,
        ...(
          (controls?.values || {})[key] ? { [key]: controls?.values[key] } :
          fields[key].initial ? { [key]: fields[key].initial } :
          {}
        ),
      }), {}),
    }), [fields, JSON.stringify(controls?.values), JSON.stringify(controls?.props)])

    const handleChange = useCallback(values => {
      const serialized = Object.keys(values).reduce((acc, key) => ({
        ...acc,
        ...(fields[key]?.serialize && fields[key].serialize(key, (values || {})[key])),
      }), {})

      controls?.onChange && controls?.onChange(values, serialized)
      hooks?.onChange && hooks?.onChange(values, serialized)
    }, [fields, controls?.onChange])

    useEffect(() => {
      if (state) {
        handleChange(state.values)
      }
    }, [state])

    // TODO: Handle custom filter function other than params
    // const [entities, setEntities] = useState(props.entities)
    // useEffect(() => {
    //   setEntities(props.entities
    //     .map(entity => Object.keys(fields).every(key => !fields[key].filter || fields[key].filter(entity, values[key])) ? entity : null)
    //   )
    // }, [props.entities, values])

    return (
      <>
        <Controls
          title={title}
          layout={layout}
          components={components}
          fields={fields}
          loading={!props.ready || props.loading}
          total={props.length}
          values={state?.values || {}}
          onChange={handleChange}
          props={controls?.props || {}}
          statistics={statistics}
          level={level}
          watch={watch}
        />
        <WrappedComponent controls={state} {...props} />
      </>
    )
  }

  withControls.displayName = `withControls(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withControls
}

export const useControlsState = (useControlsValues, transform = null) => {
  const [values, setValues] = (useControlsValues || (() => [{}, () => null]))()
  const [serialized, setSerialized] = useState(values) as any

  const controls = useMemo(() => (!useControlsValues ? {} : {
    values,
    onChange: (values, serialized) => {
      setValues(values)
      setSerialized(transform && transform(serialized) || serialized)
    },
  }), [!!useControlsValues, values, setValues])

  return [serialized, controls]
}
