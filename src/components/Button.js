import React from 'react'
import theme from 'theme'

const styles = {
  element: {
    ...theme.resets.button,
    padding: '1em 1.5em',
  },
  looks: [
    {
      backgroundColor: 'white',
      color: theme.colors.primary,
      border: '0.125em solid white',
      borderRadius: '0.25em',
      fontWeight: 600,
    },
    {
      backgroundColor: 'transparent',
      color: 'white',
      border: '0.125em solid white',
      borderRadius: '0.25em',
      fontWeight: 600,
    },
  ],
}

const Button = ({ look = 0, ...props }) => (
  <button {...props} css={[styles.element, styles.looks[look], props.css]} />
)

export default Button
