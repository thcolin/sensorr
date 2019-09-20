import React from 'react'

const styles = {
  element: {
    width: '2.5rem',
    height: '2.5rem',
    position: 'relative',
    margin: '0 auto',
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#333',
    opacity: 0.6,
    position: 'absolute',
    top: 0,
    left: 0,
    animation: 'bounce 2.0s infinite ease-in-out',
  },
  second: {
    animationDelay: '-1.0s',
  },
}

export default ({ ...props }) => (
  <div {...props} css={[styles.element, props.css]}>
    <div css={styles.circle}></div>
    <div css={[styles.circle, styles.second]}></div>
  </div>
)
