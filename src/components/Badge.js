import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.shadows.grey,
    cursor: 'pointer',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
  },
  compact: {
    true: {
      borderRadius: '5em',
      padding: '1em',
      margin: '0.5em 0',
    },
    false: {
      borderRadius: '50%',
      padding: '0.5em',
      height: '2em',
      width: '2em',
    },
  },
  emoji: {

  },
  label: {
    margin: '0 0 0 0.75em',
    fontWeight: 800,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
}

export default class Badge extends PureComponent {
  static propTypes = {
    emoji: PropTypes.string.isRequired,
    label: PropTypes.node,
  }

  static defaultProps = {
    label: null,
  }

  render() {
    const { emoji, label, ...props } = this.props

    return (
      <span {...props} css={[styles.element, styles.compact[!!label], props.css]}>
        <span css={styles.emoji}>{emoji}</span>
        {!!label && <span css={styles.label}>{label}</span>}
      </span>
    )
  }
}
