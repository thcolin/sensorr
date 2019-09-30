import React from 'react'
import { keyframes } from '@emotion/core'

const bounce = keyframes`{
  0%, 100% {
    transform: scale(0.0) translateZ(0);
    -webkit-transform: scale(0.0);
  } 50% {
    transform: scale(1.0) translateZ(0);
    -webkit-transform: scale(1.0);
  }
}`

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
    opacity: 0.6,
    position: 'absolute',
    top: 0,
    left: 0,
    animation: `${bounce} 2.0s infinite ease-in-out`,
  },
  second: {
    animationDelay: '-1.0s',
  },
}

export default ({ color = '#333', ...props }) => (
  <div {...props} css={[styles.element, props.css]}>
    <div css={styles.circle} style={{ backgroundColor: color }}></div>
    <div css={[styles.circle, styles.second]}></div>
  </div>
)
