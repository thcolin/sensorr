import React from 'react'
import Color from 'color'

const Shadow = ({ palette, fade = 0.3, ...props }) => (
  <div
    {...props}
    css={[Shadow.styles.element, props.css]}
    style={{
      transition: 'background-color 400ms ease-in-out',
      backgroundColor: Color(palette.backgroundColor).fade(fade).rgb().string(),
      ...(props.style || {}),
    }}
  />
)

Shadow.styles = {
  element: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
}

export default Shadow
