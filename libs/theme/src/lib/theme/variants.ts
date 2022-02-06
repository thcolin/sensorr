import { icons } from './icons'

// TODO: Should replace css rules
export const layout = {
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

export const link = {
  reset: {
    color: 'inherit',
    textDecoration: 'none',
    ':hover:not(:disabled)': {
      cursor: 'pointer',
    },
  },
}

export const button = {
  reset: {
    appearance: 'none',
    padding: 12,
    background: 'none',
    color: 'inherit',
    fontSize: '100%',
    fontFamily: 'body',
    fontWeight: 'inherit',
    lineHeight: 'reset',
    border: 'none',
    ':not(:disabled)': {
      cursor: 'pointer',
    },
  },
  default: {
    variant: 'button.reset',
    paddingY: 4,
    paddingX: 2,
    fontWeight: 'semibold',
    border: '0.125em solid',
    borderColor: 'inherit',
    borderRadius: '0.25em',
    fontSize: 5,
  },
}

export const select = {
  reset: {
    fontFamily: 'inherit',
    appearance: 'none',
    lineHeight: 'body',
    background: 'none',
    border: 'none',
    outline: 'none',
    ':not(:disabled)': {
      cursor: 'pointer',
    },
  },
}

export const input = {
  reset: {
    appearance: 'none',
    margin: 12,
    padding: 12,
    background: 'none',
    fontSize: '100%',
    fontFamily: 'body',
    lineHeight: 'body',
    border: 'none',
    width: '100%',
    outline: 'none',
    color: 'inherit',
  },
}

export const radio = {
  reset: {
    ...input.reset,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1em',
    width: '1em',
    border: '0.075em solid',
    borderColor: 'inherit',
    borderRadius: '50%',
    '&:not(:disabled)': {
      cursor: 'pointer',
    },
    '&:checked': {
      '&:before': {
        content: `url(${icons.checkmark})`,
        display: 'block',
        margin: '-100% 0 0 0',
        padding: 10,
        height: '1em',
        width: '1em',
        '&:not(:disabled):before': {
          cursor: 'pointer',
        },
      },
    },
  },
}

export const hr = {
  reset: {
    border: 'none',
    borderBottom: '1px solid',
    borderColor: 'gray2',
    margin: 12,
  },
}

export const code = {
  reset: {
    fontFamily: 'monospace',
  },
  tag: {
    borderRadius: '0.25em',
    backgroundColor: 'darkShadow',
    padding: '0.25em 0.5em',
    fontSize: '0.875em',
  }
}
