import { icons } from './icons'

export const heading = {
  default: {
    color: 'text',
    fontFamily: 'heading',
    lineHeight: 'body',
    fontWeight: 'heading',
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
  default: {
    color: 'primary',
    ':hover': {
      color: 'accent',
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
    paddingY: 6,
    paddingX: 4,
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
  default: {
    appearance: 'none',
    position: 'relative',
    marginY: 12,
    paddingX: 4,
    paddingY: 8,
    background: 'none',
    fontSize: 5,
    fontFamily: 'body',
    lineHeight: 'body',
    width: '100%',
    outline: 'none',
    color: 'text',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    transition: 'border-color 100ms ease-in-out',
    ':hover': {
      borderColor: 'grayDarker',
    },
    ':focus,:active': {
      borderColor: 'grayDarkest'
    },
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
  default: {
    appearance: 'none',
    marginY: 12,
    paddingX: 4,
    paddingY: 8,
    background: 'none',
    fontSize: 5,
    fontFamily: 'body',
    lineHeight: 'body',
    width: '100%',
    outline: 'none',
    color: 'text',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    transition: 'border-color 100ms ease-in-out',
    ':hover': {
      borderColor: 'grayDarker',
    },
    ':focus,:active': {
      borderColor: 'grayDarkest'
    },
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
  default: {
    border: 'none',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    margin: 12,
  },
}

export const code = {
  reset: {
    fontFamily: 'monospace',
  },
  tag: {
    borderRadius: '0.25em',
    backgroundColor: 'gray',
    padding: '0.25em 0.5em',
    fontSize: '0.875em',
  }
}

export const textarea = {
  default: {
    backgroundColor: 'grayLight',
    color: 'text',
    paddingX: 6,
    paddingY: 8,
    borderColor: 'grayDark',
    borderWidth: '1px',
    borderRadius: '0.25em',
    outline: 'none',
    transition: 'border-color 100ms ease-in-out',
    ':hover': {
      borderColor: 'grayDarker',
    },
    ':focus,:active': {
      borderColor: 'grayDarkest'
    },
  }
}
