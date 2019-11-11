import React from 'react'
import theme from 'theme'

const styles = {
  input: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25em 0',
    margin: '0 0 0.5em 0',
    '>input': {
      ...theme.resets.input,
      ...theme.resets.checkbox,
      margin: '0 1em 0 0.5em',
    },
  },
  element: {
    display: 'flex',
    flexDirection: 'column',
    '>label': {
      padding: '0 0 1em 0',
      fontWeight: 600,
    },
    '>div': {
      '>label': {
        fontSize: '0.917em',
      },
    },
  },
  grid: {
    '>div': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, 12em)',
      justifyContent: 'space-between',
    },
  },
  column: {
    '>div': {
      display: 'flex',
      flexDirection: 'column',
    },
  },
}

export const Option = ({ id, children, ...props }) => (
  <label css={styles.input} style={!props.disabled ? { cursor: 'pointer' } : {}} key={id} htmlFor={id}>
    <input {...props} id={id} type="checkbox" />
    {children}
  </label>
)

const Checkbox = ({ label, options, values, onChange, disabled, display = 'grid', ...props }) => options.length > 0 && (
  <div css={[styles.element, styles[display]]} {...props}>
    <label onClick={() => !disabled && onChange([])} style={!disabled ? { cursor: 'pointer' } : {}}>{label}</label>
    <div>
      {options.map(input => (
        <Option
          key={input.value}
          id={input.value}
          checked={values.includes(input.value)}
          onChange={e => onChange([...new Set([input.value, ...values])].filter(value => !!e.target.checked || input.value !== value))}
          disabled={disabled}
        >
          <span>{input.label}</span>
          {typeof input.count === 'number' && (
            <>
              <span>&nbsp;</span>
              <small><code>({input.count})</code></small>
            </>
          )}
        </Option>
      ))}
    </div>
  </div>
)

export default Checkbox
