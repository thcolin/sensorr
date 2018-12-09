import React, { Children } from 'react'
import { StyleSheet, css } from 'aphrodite'
import { TransitionGroup } from 'react-transition-group'
import { CloseIcon as Close, InfoIcon, CheckIcon, FlameIcon, AlertIcon } from 'react-toast-notifications/dist/icons'

const animations = {
  shrink: {
    from: {
      height: '100%',
    },
    to: {
      height: '0%',
    }
  },
}

const suits = StyleSheet.create({
  shrink: {
    animationName: animations.shrink,
  }
})

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    boxSizing: 'border-box',
    maxHeight: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
    padding: '0 1em',
    zIndex: 10,
  },
  toast: {
    width: '50vw',
    boxShadow: '0 0.25em 0.5em rgba(0, 0, 0, 0.175)',
    display: 'flex',
    marginBottom: '1em',
  },
  appearances: {
    success: {
      icon: CheckIcon,
      text: 'hsl(154, 100%, 30%)',
      fg: 'hsl(154, 99%, 40%)',
      bg: 'hsl(154, 100%, 99%)',
    },
    error: {
      icon: FlameIcon,
      text: 'hsl(12, 100%, 40%)',
      fg: 'hsl(12, 99%, 60%)',
      bg: 'hsl(12, 100%, 99%)',
    },
    warning: {
      icon: AlertIcon,
      text: 'hsl(33, 100%, 50%)',
      fg: 'hsl(40, 100%, 50%)',
      bg: 'hsl(48, 100%, 99%)',
    },
    info: {
      icon: InfoIcon,
      text: 'hsl(218, 20%, 40%)',
      fg: 'hsl(218, 100%, 60%)',
      bg: 'white',
    },
  },
  text: {
    position: 'absolute',
  },
  button: {
    cursor: 'pointer',
    flexShrink: 0,
    opacity: 0.5,
    padding: '0.5em',
    transition: 'opacity 150ms',
  },
  content: {
    flexGrow: 1,
    fontSize: '0.825em',
    lineHeight: 1.4,
    padding: '0.5em 0.75em',
  },
  icon: {
    flexShrink: 0,
    padding: '0.5em',
    position: 'relative',
    overflow: 'hidden',
    textAlign: 'center',
  },
  timeout: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    bottom: 0,
    height: 0,
    left: 0,
    position: 'absolute',
    width: '100%',
  },
  svg: {
    position: 'relative',
    zIndex: 1,
  },
}

export const ToastContainer = ({ children, autoDismissTimeout, transitionDuration, ...props }) => (
  <div
    {...props}
    style={{
      ...styles.container,
      pointerEvents: Children.count(children) ? 'auto' : 'none',
      ...(props.style || {})
    }}
  >
    <TransitionGroup component={null}>{children}</TransitionGroup>
  </div>
)

export const Toast = ({
  appearance,
  autoDismiss,
  autoDismissTimeout,
  children,
  onExited,
  onDismiss,
  placement,
  transitionDuration,
  transitionState,
}) => (
  <div
    style={{
      ...styles.toast,
      backgroundColor: styles.appearances[appearance].bg,
      color: styles.appearances[appearance].text,
      transition: `transform ${transitionDuration}ms cubic-bezier(0.2, 0, 0, 1)`,
      ...({
        entering: { transform: 'translate3d(-120%, 0, 0)' },
        entered: { transform: 'translate3d(0, 0, 0)' },
        exiting: { transform: 'translate3d(-120%, 0, 0)' },
        exited: { transform: 'translate3d(-120%, 0, 0)' },
      })[transitionState],
    }}
  >
    <div
      style={{
        ...styles.icon,
        backgroundColor: styles.appearances[appearance].fg,
        color: styles.appearances[appearance].bg,
      }}
    >
      <div
        className={css(suits.shrink)}
        style={{
          ...styles.timeout,
          animationTimingFunction: 'linear',
          animationDuration: `${autoDismissTimeout}ms`,
          opacity: autoDismiss ? 1 : 0,
        }}
      />
      {React.createElement(styles.appearances[appearance].icon, {
        style: styles.svg,
        fill: styles.appearances[appearance].bg,
      })}
    </div>
    <div style={styles.content}>{children}</div>
    {onDismiss ? (
      <div onClick={onDismiss} role="button" style={styles.button}>
        <Close />
      </div>
    ) : null}
  </div>
)
