import { memo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, Trans } from 'react-i18next'
import { Icon } from '../../../atoms/Icon/Icon'
import { Inputs, InputsProps } from './Inputs'

export interface NavProps extends Omit<InputsProps, 'control'> {
  title?: string
  strip?: InputsProps['layout']
  // The fields laid out in the strip rather than in the bar
  stripped?: string[]
  defaultValues: {
    [key: string]: any
  }
  onChange: (values: { [key: string]: any }) => void
}

const UINav = ({ layout, strip, stripped = [], fields, defaultValues, onChange, statistics, ...props }: NavProps) => {
  const { control, watch, reset } = useForm({ defaultValues })
  const next = watch()

  useEffect(() => {
    reset(defaultValues)
  }, [JSON.stringify(defaultValues), reset])

  useEffect(() => {
    onChange(Object.keys(next)
      .filter(key => Object.keys(fields).includes(key) && !['title', 'results', 'toggle'].includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: next[key] }), {})
    )
  }, [JSON.stringify(next)])

  return (
    <nav sx={UINav.styles.element}>
      <div sx={UINav.styles.container}>
        <Inputs layout={layout} fields={pick(fields, (key) => !stripped.includes(key))} statistics={statistics} control={control} />
      </div>
      {!!stripped.length && (
        <div sx={UINav.styles.strip}>
          <Inputs layout={strip} fields={pick(fields, (key) => stripped.includes(key))} statistics={statistics} control={control} />
        </div>
      )}
    </nav>
  )
}

UINav.styles = {
  element: {
    position: ['relative', 'sticky'],
    top: ['unset', '0px'],
    zIndex: ['unset', 5],
  },
  // A page lays its bar out against the width it gets, with `@container controls`.
  container: {
    containerType: 'inline-size',
    containerName: 'controls',
    display: 'flex',
    height: '4.75rem',
    backgroundColor: 'primary',
    paddingX: 0,
    fontSize: 5,
    color: 'white !important',
    '>*': {
      flex: 1,
    },
    overflowX: 'scroll',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
  },
  strip: {
    display: 'flex',
    minHeight: '3em',
    // The bar's `paddingX: 0` reads the first step of the scale, 2em
    paddingX: '2em',
    backgroundColor: 'primaryDark',
    borderTop: '1px solid',
    borderColor: 'hsla(0, 0%, 0%, 0.12)',
    fontSize: 5,
    color: 'white !important',
    '>*': {
      flex: 1,
    },
  },
}

const pick = (fields, keep: (key: string) => boolean) => Object.keys(fields)
  .filter(keep)
  .reduce((acc, key) => ({ ...acc, [key]: fields[key] }), {})

export const Nav = memo(UINav)

export const Title = ({ children, style, ...props }) => (
  <h4 sx={{ color: 'white !important' }} style={style}>{children}</h4>
)

export const Results = ({ value, onChange, loading, total, ...props }) => {
  const { t } = useTranslation()

  return (
    <div {...props} sx={Results.styles.element}>
      {loading && (
        <Icon value='spinner' color='gray-100' />
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
