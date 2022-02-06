import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import usePortal from 'react-useportal'
import { InputsProps } from './commons/Inputs'
import { Nav, Results, Title, ToggleButton } from './commons/Nav'
import { Aside } from './commons/Aside'
import { useLayoutFields } from './commons/useLayoutFields'

export interface ControlsProps {
  title?: string
  components?: {
    [key: string]: React.FC<any>
  }
  fields: {
    [key: string]: {
      component: React.FC<any>
      initial: any
      statistics?: any
      serialize?: (key: string, value: any) => { [key: string]: any }
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
    },
  }
  statistics: Pick<InputsProps, 'statistics'>
  loading: boolean
  total?: number
  props?: any
}

const UIControls = ({ title, components, fields, values, onChange, layout, statistics, loading, total, props }: ControlsProps) => {
  const { Portal, togglePortal, closePortal, isOpen: open } = usePortal()
  const handleChange = useCallback((next) => {
    closePortal(false)
    onChange({ ...values, ...next })
  }, [values, onChange, closePortal])

  const aside = useLayoutFields(layout.aside, fields)
  const nav = useLayoutFields(layout.nav, fields, {
    ...Object.keys(components || {}).reduce((acc, key) => ({
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
        component: components?.toggle || ToggleButton,
        props: { toggleOpen: togglePortal, fields, values, ...props },
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
    aside: {
      fields: aside,
      defaultValues: Object.keys(values)
        .filter(key => Object.keys(aside).includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: values[key] }), {})
    },
  }), [nav, aside, values])

  return (
    <>
      {layout.nav ? (
        <Nav
          {...group.nav}
          layout={layout.nav}
          onChange={handleChange}
          statistics={statistics}
        />
      ) : components.toggle ? (
        <components.toggle toggleOpen={togglePortal} />
      ) : null}
      {layout.aside && (
        <Portal>
          <Aside
            {...group.aside}
            layout={layout.aside}
            onChange={handleChange}
            statistics={statistics}
            open={open}
            toggleOpen={togglePortal}
          />
        </Portal>
      )}
    </>
  )
}

export const Controls = memo(UIControls)

export interface withControlsArgs extends Omit<ControlsProps, 'values' | 'onChange' | 'statistics' | 'loading' | 'total'> {
  useStatistics: (entities: any[], fields: any) => { [key: string]: any }
  hooks?: {
    onChange?: (values: { [key: string]: any }, serialized: { [key:string]: any }) => any,
  }
}

export const withControls = ({ title = '', useStatistics, hooks, layout, components, fields }: withControlsArgs) => (WrappedComponent) => {
  const withControls = ({ controls, ...props }: any) => {
    const statistics = useStatistics(props.entities, fields)

    const values = useMemo(() => Object.keys(fields).reduce((acc, key) => ({
      ...acc,
      ...(
        (controls?.values || {})[key] ? { [key]: controls?.values[key] } :
        fields[key].initial ? { [key]: fields[key].initial } :
        {}
      ),
    }), {}), [fields, JSON.stringify(controls?.values)])

    const handleChange = useCallback(values => {
      const serialized = Object.keys(values).reduce((acc, key) => ({
        ...acc,
        ...(fields[key]?.serialize && fields[key].serialize(key, (values || {})[key])),
      }), {})

      controls?.onChange && controls?.onChange(values, serialized)
      hooks?.onChange && hooks?.onChange(values, serialized)
    }, [fields, controls?.onChange])

    useEffect(() => {
      if (values) {
        handleChange(values)
      }
    }, [values])

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
          values={values || {}}
          onChange={handleChange}
          props={controls?.props || {}}
          statistics={statistics}
        />
        <WrappedComponent controls={{ values }} {...props} />
      </>
    )
  }

  withControls.displayName = `withControls(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withControls
}

export const useControlsState = (useControlsValues, transform = null) => {
  const [values, setValues] = (useControlsValues || (() => [{}, () => null]))()
  const [serialized, setSerialized] = useState({}) as any

  const controls = useMemo(() => (!useControlsValues ? {} : {
    values,
    onChange: (values, serialized) => {
      setValues(values)
      setSerialized(transform && transform(serialized) || serialized)
    },
  }), [!!useControlsValues, values, setValues])

  return [serialized, controls]
}
