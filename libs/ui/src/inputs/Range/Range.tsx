import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import MaterialSlider from '@material-ui/core/Slider'
import { withStyles } from '@material-ui/core/styles'
import { useThemeUI } from 'theme-ui'

export interface RangeProps extends InputProps {
  label: string
  unit?: string
}

const UIRange = ({ label, labelize, value, onChange, min, max, marks, step, disabled, unit, data, ...props }: RangeProps) => (
  <div sx={UIRange.styles.element} {...props}>
    <label onClick={() => !disabled && onChange([min, max])} style={!disabled ? { cursor: 'pointer' } : {}}>
      <span>{label}</span>
      <span>&nbsp;</span>
      <small><code>({value.map(value => labelize ? labelize(value) : value).join('-')}{value[1] === max ? '+' : ''}{unit ? ` ${unit}` : ''})</code></small>
    </label>
    <Input
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      marks={marks}
      step={step}
      labelize={labelize}
      disabled={disabled}
      data={data}
    />
  </div>
)

UIRange.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    '>label': {
      paddingBottom: 4,
      fontWeight: 'semibold',
    },
  },
}

export const Range = memo(UIRange)

export interface InputProps {
  labelize?: (value: string|number) => any
  value: [number, number]
  onChange: (value: [number, number]) => void
  min: number
  max: number
  marks?: boolean | { value: number; label: string }[]
  step?: number
  disabled?: boolean
  data?: {
    [value: string]: number
  }
}

const UIInput = ({ value, onChange, min, max, step, labelize, data, ...props }: InputProps) => {
  const [state, setState] = useState(value)
  const handleChange = useCallback((e, value) => setState(value as [number, number]), [setState])
  const handleCommit = useCallback((e, value) => onChange(value as [number, number]), [onChange])

  useEffect(() => {
    setState(value)
  }, [value])

  return (
    <div sx={UIInput.styles.element}>
      <Histogram
        value={state}
        labelize={labelize}
        data={data}
        max={max}
      />
      <Slider
        {...props}
        value={state}
        onChange={handleChange}
        onChangeCommitted={handleCommit}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
        valueLabelFormat={labelize}
      />
    </div>
  )
}

UIInput.styles = {
  element: {
    marginX: 6,
  },
}

const Input = memo(UIInput)

const UIHistogram = ({ value, data, labelize, max, ...props }) => {
  const highest = useMemo(() => Math.max.apply(null, Object.values(data || {})), [data])
  const styles = useMemo(() => ({
    ...UIHistogram.styles,
    element: {
      ...UIHistogram.styles.element,
      height: data ? '3em' : '1em',
    },
  }), [data])

  return (
    <div sx={styles.element}>
      {Object.keys(data || {}).map((key, index, arr) => (
        <div
          title={`${labelize ? labelize(key) : key}${arr[index + 1] ? `-${labelize ? labelize(arr[index + 1]) : arr[index + 1]}` : '+'} (${data[key]})`}
          key={key}
          sx={{
            height: `${(100 * data[key]) / highest || 0}%`,
            width: `${((parseInt(arr[index + 1] || max) - parseInt(key)) / arr.length) * 100}%`,
            ...(
              (
                parseInt(Object.keys(data)[index]) >= value[0] ||
                value[0] < parseInt(Object.keys(data)[index + 1])
              ) &&
              parseInt(Object.keys(data)[index]) < value[1] ?
            {
              backgroundColor: 'accent',
            } : {
              backgroundColor: 'accent',
              opacity: 0.5,
            }),
          }}
        />
      ))}
    </div>
  )
}

UIHistogram.styles = {
  element: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '3em',
    '>div': {
      display: 'block',
    },
  },
}

const Histogram = memo(UIHistogram)

const UISlider = ({ ...props }) => {
  const { theme } = useThemeUI()
  const Component = useMemo(() => withStyles({
    root: {
      color: 'white',
      borderBottom: `1px solid #e4e4e4`,
      display: 'block',
      padding: 0,
    },
    disabled: {
      color: 'white !important',
      opacity: 0.5,
    },
    valueLabel: {
      '&>span': {
        color: theme.rawColors.accent,
        '&>span': {
          color: 'white',
          fontFamily: (theme.fonts as any).monospace,
          fontSize: '0.75em',
        },
      },
    },
    mark: {
      visibility: 'hidden',
    },
    thumb: {
      color: 'white',
      boxShadow: '0px 0px 0px 2px rgba(0, 0, 0, 0.1)',
      '&:hover': {
        boxShadow: '0px 0px 0px 8px rgba(0, 0, 0, 0.1)',
      },
    },
    focusVisible: {
      boxShadow: '0px 0px 0px 8px rgba(0, 0, 0, 0.1) !important',
    },
    active: {
      boxShadow: '0px 0px 0px 14px rgba(0, 0, 0, 0.1) !important',
    },
  }, { name: 'SensorrRange' })(MaterialSlider), [theme])

  return (
    <Component {...props} />
  )
}

const Slider = memo(UISlider)
