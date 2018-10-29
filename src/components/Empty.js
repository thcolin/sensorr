import React from 'react'
import theme from 'theme'

const styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4em',
  },
  emoji: {
    fontSize: '5em',
  },
  title: {
    padding: '1em 0',
    color: theme.colors.secondary,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: theme.colors.secondary,
  }
}

export default ({ ...props }) => (
  <div style={styles.element}>
    <h1 style={styles.emoji}>👻</h1>
    <h2 style={styles.title}>Bouhouuu ! I'm the scary empty ghost !</h2>
    <p style={styles.subtitle}>Sorry, no results.</p>
  </div>
)
