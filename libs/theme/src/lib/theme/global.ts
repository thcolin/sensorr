import { sizes } from './sizes'
import { fontFamilies, fontWeights, lineHeights } from './font'

const heading = {
  color: 'text',
  fontFamily: fontFamilies.heading,
  lineHeight: lineHeights.body,
  fontWeight: fontWeights.heading,
}

export const global = {
  html: {
    boxSizing: 'border-box',
  },
  '*, *:before, *:after': {
    boxSizing: 'inherit',
  },
  body: {
    fontFamily: fontFamilies.body,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    scrollBehavior: 'smooth',
    position: 'relative',
    margin: 0,
  },
  p: {
    color: 'text',
  },
  a: {
    color: 'primary',
    '&:[disabled]': {
      pointerEvents: 'none',
    },
  },
  b: {
    fontWeight: fontWeights.semibold,
  },
  strong: {
    fontWeight: fontWeights.bold,
  },
  em: {
    fontStyle: 'italic',
  },
  // small: {
  //   fontSize: '0.75em',
  // },
  h1: {
    ...heading,
    fontSize: sizes[0],
  },
  h2: {
    ...heading,
    fontSize: sizes[1],
  },
  h3: {
    ...heading,
    fontSize: sizes[2],
  },
  h4: {
    ...heading,
    fontSize: sizes[3],
  },
  h5: {
    ...heading,
    fontSize: sizes[4],
  },
  h6: {
    ...heading,
    fontSize: sizes[5],
  },
  pre: {
    fontFamily: fontFamilies.monospace,
    overflowX: 'auto',
    code: {
      color: 'inherit',
    },
  },
  code: {
    fontFamily: fontFamilies.monospace,
    fontWeight: fontWeights.normal,
    fontSize: 'inherit',
  },
  '*[hidden]': {
    display: 'none !important',
  },
}
