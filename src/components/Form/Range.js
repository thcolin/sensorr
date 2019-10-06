import React, { useState } from 'react'
import { usePrevious } from 'hooks'
import MaterialSlider from '@material-ui/core/Slider'
import { withStyles } from '@material-ui/core/styles'
import theme from 'theme'

const styles = {
  input: {
    margin: '0 6px',
  },
  histogram: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '2em',
    '>div': {
      flex: 1,
      display: 'block',
    },
  },
  slider: {
    root: {
      color: 'white',
      display: 'block',
      padding: 0,
    },
    disabled: {
      color: 'white !important',
      opacity: 0.5,
    },
    valueLabel: {
      '&>span': {
        color: theme.colors.tertiary,
        '&>span': {
          color: 'white',
          fontFamily: theme.fonts.monospace,
          fontSize: '0.75em',
        },
      },
    },
    thumb: {
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
  },
  element: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    '>label': {
      padding: '0 0 1em 0',
      fontWeight: 600,
    },
  },
}

const Slider = withStyles(styles.slider, { name: 'SensorrRange' })(MaterialSlider)

const Input = ({ values, onChange, min, max, step, data = {}, ...props }) => {
  const [state, setState] = useState(values)
  const previous = usePrevious(values)
  const highest = Math.max.apply(null, Object.values(data || {}))

  if (previous && previous.join('-') === state.join('-') && previous.join('-') !== values.join('-')) {
    setState(values)
  }

  return (
    <div css={styles.input}>
      {!!Object.keys(data).length && (
        <div css={styles.histogram}>
          {Object.keys(data).map((key, index) => (
            <div
              title={`${key} (${data[key]})`}
              key={key}
              style={{
                height: `${(100 * data[key]) / highest || 0}%`,
                ...(parseInt(Object.keys(data)[index]) >= state[0] && parseInt(Object.keys(data)[index]) < state[1] ? {
                  backgroundColor: theme.colors.tertiary,
                } : {
                  backgroundColor: theme.colors.tertiary,
                  opacity: 0.5,
                }),
              }}
            />
          ))}
        </div>
      )}
      <Slider
        {...props}
        value={state}
        onChange={(e, values) => setState(values)}
        onChangeCommitted={(e, values) => onChange(values)}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
      />
    </div>
  )
}

const Range = ({ label, values, onChange, min, max, step = 1, disabled, unit, data = {}, ...props }) => (
  <div css={styles.element} {...props}>
    <label onClick={() => !disabled && onChange([min, max])} style={!disabled ? { cursor: 'pointer' } : {}}>
      <span>{label}</span>
      <span>&nbsp;</span>
      <small><code>({values.join('-')}{unit ? ` ${unit}` : ''})</code></small>
    </label>
    <Input
      values={values}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      data={data}
      disabled={disabled}
    />
  </div>
)

export default Range
