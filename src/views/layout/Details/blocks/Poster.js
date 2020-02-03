import React from 'react'

const Poster = ({ playing, children, ...props }) => (
  <div
    css={Poster.styles.element}
    style={{
      transition: 'margin 400ms ease-in-out',
      ...(playing ? { marginTop: 0 } : {}),
    }}
  >
    {children}
  </div>
)

Poster.styles = {
  element: {
    fontSize: '1.5em',
    margin: '-8em 0 1em 0',
  },
}

export default Poster
