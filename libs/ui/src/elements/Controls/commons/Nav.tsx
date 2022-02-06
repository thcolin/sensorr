import { memo, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, Trans } from 'react-i18next'
import { Icon } from '../../../atoms/Icon/Icon'
import { Inputs, InputsProps } from './Inputs'

export interface NavProps extends Omit<InputsProps, 'control'> {
  title?: string
  defaultValues: {
    [key: string]: any
  }
  onChange: (values: { [key: string]: any }) => void
}

const UINav = ({ layout, fields, defaultValues, onChange, statistics, ...props }: NavProps) => {
  const { control, watch, reset } = useForm({ defaultValues })
  const next = watch()

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  useEffect(() => {
    onChange(Object.keys(next)
      .filter(key => Object.keys(fields).includes(key) && !['title', 'results', 'toggle'].includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: next[key] }), {})
    )
  }, [JSON.stringify(next)])

  return (
    <nav sx={UINav.styles.element}>
      <div sx={UINav.styles.container}>
        <Inputs layout={layout} fields={fields} statistics={statistics} control={control} />
      </div>
    </nav>
  )
}

UINav.styles = {
  element: {
    position: 'sticky',
    top: 'calc(4em + 1px)',
    zIndex: 2,
  },
  container: {
    display: 'flex',
    height: '4.75rem',
    backgroundColor: 'accent',
    paddingX: 0,
    fontSize: 5,
    color: 'white !important',
    '>*': {
      flex: 1,
    },
    overflowX: 'scroll',
  },
}

export const Nav = memo(UINav)

export const Title = ({ children, style, ...props }) => (
  <h4 sx={{ color: 'white !important' }} style={style}>{children}</h4>
)

export const Results = ({ value, onChange, loading, total, ...props }) => {
  const { t } = useTranslation()

  return (
    <div {...props} sx={Results.styles.element}>
      {loading && (
        <Icon value='spinner' />
      )}
      {(!loading && typeof total === 'number') && (
        <span>
          {total === 10000 ? <span style={{ fontSize: '1.5em' }}>∞</span> : <span>{total}</span>}
          {t('ui.controls.results')}
        </span>
      )}
    </div>
  )
}

Results.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    // justifyContent: 'flex-end',
    minWidth: '7em',
    '>div': {
      height: '1.5em',
      width: '1.5em',
      margin: 'unset',
    },
    '>span': {
      display: 'flex',
      alignItems: 'center',
      '>span': {
        fontFamily: 'monospace',
        fontWeight: 'semibold',
        marginRight: 8,
      },
    },
  },
}

export const ToggleButton = ({ toggleOpen, fields, values, ...props }) => {
  const { t } = useTranslation()
  const active = Object.keys(values)
    .filter(key => !['sort_by'].includes(key))
    .reduce((acc, key) => acc + (values[key] && (JSON.stringify(values[key]) !== JSON.stringify(fields[key]?.initial) && fields[key]?.serialize) ? 1 : 0), 0)

  return (
    <button {...props} sx={ToggleButton.styles.element} type='button' onClick={toggleOpen}>
      <Trans t={t} i18nKey='ui.controls.toggle' values={{ active }} components={[<span style={{ whiteSpace: 'pre' }} />, <strong />]} />
      <Icon value='filters' />
    </button>
  )
}

ToggleButton.styles = {
  element: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'center',
    '>svg': {
      height: '1em',
      marginLeft: 6,
    },
  },
}
