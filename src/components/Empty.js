import React from 'react'
import PropTypes from 'prop-types'
import theme from 'theme'

const styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4em',
    color: theme.colors.secondary,
  },
  emoji: {
    fontSize: '5em',
    margin: 0,
  },
  title: {
    padding: '1em 0',
    margin: 0,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  subtitle: {
    padding: 0,
    margin: 0,
  }
}

const Empty = ({ emoji, title, subtitle, ...props }) => (
  <div {...props} css={[styles.element, props.css]}>
    <h1 css={styles.emoji}>{emoji}</h1>
    <h2 css={styles.title}>{title}</h2>
    <p css={styles.subtitle}>{subtitle}</p>
  </div>
)

Empty.propTypes = {
  emoji: PropTypes.string,
  title: PropTypes.node,
  subtitle: PropTypes.node,
}

Empty.defaultProps = {
  emoji: '👻',
  title: "Bouhouuu ! I'm the scary empty ghost !",
  subtitle: 'Sorry, no results.',
}

export default Empty
