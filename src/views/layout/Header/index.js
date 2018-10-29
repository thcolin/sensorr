import React from 'react'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundImage: `url(${require('ressources/header.jpg')})`,
    backgroundSize: 'cover',
    height: '10em',
    padding: '2em',
  },
  title: {
    color: theme.colors.white,
    fontSize: '4em',
    fontWeight: 800,
  }
}

export default ({ ...props}) => (
  <div style={styles.element}>
    <h1 style={styles.title}>Sensorr</h1>
  </div>
)
