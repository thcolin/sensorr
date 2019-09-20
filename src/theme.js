const colors = {
  primary: '#01D277',
  secondary: '#081C24',
  tertiary: '#03ba6b',
  wrong: '#E32626',
  white: '#FFFFFF',
  smoke: '#FBFBFB',
  grey: '#EEEEEE',
  mercury: '#E4E4E4',
  gray: '#CCCCCC',
  black: '#000000',
  rangoon: '#1a1a1a',
  shadows: {
    black: 'hsla(0, 0%, 0%, 0.75)',
    grey: 'hsla(0, 0%, 0%, 0.5)',
  },
}

const fonts = {
  primary: '"Raleway", sans-serif',
  secondary: '"Open Sans", sans-serif',
  monospace: '"Maison Mono", monospace',
}

const resets = {
  a: {
    textDecoration: 'none',
    ':hover:not(:disabled)': {
      cursor: 'pointer',
    },
  },
  button: {
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    padding: 0,
    background: 'none',
    color: 'inherit',
    fontSize: '100%',
    fontFamily: 'inherit',
    lineHeight: 1,
    border: 'none',
    ':not(:disabled)': {
      cursor: 'pointer',
    },
  },
  select: {
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    lineHeight: 1.633,
    background: 'none',
    border: 'none',
    outline: 'none',
    ':not(:disabled)': {
      cursor: 'pointer',
    },
  },
  input: {
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    padding: 0,
    background: 'none',
    fontSize: '100%',
    fontFamily: 'inherit',
    lineHeight: 1.633,
    border: 'none',
    width: '100%',
    outline: 'none',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1em',
    width: '1em',
    border: '0.075em solid white',
    borderRadius: '0.125em',
    cursor: 'pointer',
    '&:checked': {
      '&:before': {
        content: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMTczLjg5OCA0MzkuNDA0bC0xNjYuNC0xNjYuNGMtOS45OTctOS45OTctOS45OTctMjYuMjA2IDAtMzYuMjA0bDM2LjIwMy0zNi4yMDRjOS45OTctOS45OTggMjYuMjA3LTkuOTk4IDM2LjIwNCAwTDE5MiAzMTIuNjkgNDMyLjA5NSA3Mi41OTZjOS45OTctOS45OTcgMjYuMjA3LTkuOTk3IDM2LjIwNCAwbDM2LjIwMyAzNi4yMDRjOS45OTcgOS45OTcgOS45OTcgMjYuMjA2IDAgMzYuMjA0bC0yOTQuNCAyOTQuNDAxYy05Ljk5OCA5Ljk5Ny0yNi4yMDcgOS45OTctMzYuMjA0LS4wMDF6Ij48L3BhdGg+PC9zdmc+)',
        display: 'block',
        margin: '-100% 0 0 0',
        padding: '0.2em',
        height: '1em',
        width: '1em',
        cursor: 'pointer',
      },
    },
  },
  radio: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1em',
    width: '1em',
    border: '0.075em solid white',
    borderRadius: '50%',
    cursor: 'pointer',
    '&:checked': {
      '&:before': {
        content: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMTczLjg5OCA0MzkuNDA0bC0xNjYuNC0xNjYuNGMtOS45OTctOS45OTctOS45OTctMjYuMjA2IDAtMzYuMjA0bDM2LjIwMy0zNi4yMDRjOS45OTctOS45OTggMjYuMjA3LTkuOTk4IDM2LjIwNCAwTDE5MiAzMTIuNjkgNDMyLjA5NSA3Mi41OTZjOS45OTctOS45OTcgMjYuMjA3LTkuOTk3IDM2LjIwNCAwbDM2LjIwMyAzNi4yMDRjOS45OTcgOS45OTcgOS45OTcgMjYuMjA2IDAgMzYuMjA0bC0yOTQuNCAyOTQuNDAxYy05Ljk5OCA5Ljk5Ny0yNi4yMDcgOS45OTctMzYuMjA0LS4wMDF6Ij48L3BhdGg+PC9zdmc+)',
        display: 'block',
        margin: '-100% 0 0 0',
        padding: '0.2em',
        height: '1em',
        width: '1em',
        cursor: 'pointer',
      },
    },
  },
}

const styles = {
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  spacings: {
    row: {
      '>*': {
        margin: '0 1em',
        ':first-of-type': {
          margin: '0 1em 0 0',
        },
        ':last-of-type': {
          margin: '0 0 0 1em',
        },
        ':first-of-type:last-of-type': {
          margin: 0,
        },
      },
    },
    column: {
      '>*': {
        margin: '1em 0',
        ':first-of-type': {
          margin: '0 0 1em',
        },
        ':last-of-type': {
          margin: '1em 0 0',
        },
        ':first-of-type:last-of-type': {
          margin: 0,
        },
      },
    },
  },
  semitransparent: {
    opacity: 0.5,
  },
}

export default {
  colors,
  fonts,
  resets,
  styles,
}
