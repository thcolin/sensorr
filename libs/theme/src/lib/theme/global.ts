export const global = {
  html: {
    boxSizing: 'border-box',
  },
  '*, *:before, *:after': {
    boxSizing: 'inherit',
  },
  body: {
    fontFamily: 'body',
    lineHeight: 'normal',
    fontWeight: 'normal',
    color: 'text',
    scrollBehavior: 'smooth',
    position: 'relative',
    margin: '0px',
  },
  a: {
    color: 'primary',
    '&:[disabled]': {
      pointerEvents: 'none',
    },
  },
  b: {
    fontWeight: 'semibold',
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  // small: {
  //   fontSize: '0.75em',
  // },
  h1: {
    variant: 'heading.default',
    fontSize: 0,
  },
  h2: {
    variant: 'heading.default',
    fontSize: 1,
  },
  h3: {
    variant: 'heading.default',
    fontSize: 2,
  },
  h4: {
    variant: 'heading.default',
    fontSize: 3,
  },
  h5: {
    variant: 'heading.default',
    fontSize: 4,
  },
  h6: {
    variant: 'heading.default',
    fontSize: 5,
  },
  pre: {
    fontFamily: 'monospace',
    overflowX: 'auto',
    code: {
      color: 'inherit',
    },
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: 'normal',
    fontSize: 'inherit',
  },
  '*[hidden]': {
    display: 'none !important',
  },
}
