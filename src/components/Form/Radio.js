import React from 'react'
import theme from 'theme'

const styles = {
  input: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25em 0',
    cursor: 'pointer',
    margin: '0 0 0.5em 0',
    '>input': {
      ...theme.resets.input,
      ...theme.resets.radio,
      margin: '0 1em 0 0.5em',
    },
  },
  element: {
    display: 'flex',
    flexDirection: 'column',
    '>label': {
      padding: '0 0 1em 0',
      fontWeight: 600,
      cursor: 'pointer',
    },
    '>div': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, 12em)',
      justifyContent: 'space-between',
      '>label': {
        fontSize: '0.917em',
      },
    },
  },
}

export const Input = ({ id, children, ...props }) => (
  <label css={styles.input} key={id} htmlFor={id}>
    <input {...props} id={id} type="radio" />
    {children}
  </label>
)

const Radio = ({ label, inputs, value, onChange, ...props }) => (
  <div css={styles.element}>
    <label onClick={() => onChange()}>{label}</label>
    <div>
      {inputs.map(input => (
        <Input
          key={input.value}
          id={input.value}
          checked={value === input.value}
          onChange={e => !!e.target.checked && onChange(input.value)}
        >
          <span>{input.label}</span>
          {typeof input.count === 'number' && (
            <>
              <span>&nbsp;</span>
              <small><code>({input.count})</code></small>
            </>
          )}
        </Input>
      ))}
    </div>
  </div>
)

export default Radio
