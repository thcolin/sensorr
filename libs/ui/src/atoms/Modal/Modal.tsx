import { memo, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeUI } from 'theme-ui'
import { Shadow } from '../Shadow/Shadow'
import { Icon } from '../Icon/Icon'
import i18n from '@sensorr/i18n'

export interface ModalProps {
  title: React.ReactNode
  open: boolean
  close: () => void
  width?: string | string[]
  background?: string
  head?: string
  border?: string
  children: React.ReactNode
}

const FOCUSABLES = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]'

// Above the Pane and its shadow (7 and 8), under the toasts
const UIModal = ({ title, open, close, width = '36em', background = 'grayLightest', head = 'primary', border = 'grayDark', children }: ModalProps) => {
  const { theme } = useThemeUI()
  const id = useId()
  const dialog = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(open)

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement
      setShown(true)
      return
    }

    const timeout = setTimeout(() => setShown(false), 400)
    opener.current?.focus()
    return () => clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    // A child that takes the keyboard itself asks for the focus with `data-autofocus`
    if (open && shown) {
      (dialog.current?.querySelector<HTMLElement>('[data-autofocus]') || dialog.current)?.focus()
    }
  }, [open, shown])

  // A key an open select or input already used is not a request to close
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.stopPropagation()
      close()
      return
    }

    if (e.key !== 'Tab') {
      return
    }

    const focusables = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLES)).filter(element => element.tabIndex >= 0)
    const [first, last] = [focusables[0], focusables[focusables.length - 1]]

    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  if (!shown) {
    return null
  }

  return createPortal((
    <div sx={UIModal.styles.element} data-open={open}>
      <button type='button' tabIndex={-1} aria-hidden={true} sx={UIModal.styles.shadow} onClick={close}>
        <Shadow palette={{ backgroundColor: theme.rawColors.gray }} fade={0.1} />
      </button>
      <div
        ref={dialog}
        role='dialog'
        aria-modal={true}
        aria-labelledby={id}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        sx={{ ...UIModal.styles.dialog, width, backgroundColor: background, borderColor: border }}
      >
        <div sx={{ ...UIModal.styles.head, backgroundColor: head }}>
          <h3 id={id}>{title}</h3>
          <button type='button' onClick={close} aria-label={i18n.t('ui.close')}>
            <Icon value='clear' active={true} height='1.25em' width='1.25em' />
          </button>
        </div>
        <div sx={UIModal.styles.body}>
          {children}
        </div>
      </div>
    </div>
  ), document.body)
}

UIModal.styles = {
  element: {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
    zIndex: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    '>*': {
      transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1), transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    '&[data-open="false"]': {
      pointerEvents: 'none',
      '>*': {
        opacity: 0,
      },
      '>[role="dialog"]': {
        transform: 'translate3d(0px, 0.5em, 0px)',
      },
    },
    '@starting-style': {
      '>*': {
        opacity: 0,
      },
      '>[role="dialog"]': {
        transform: 'translate3d(0px, 0.5em, 0px)',
      },
    },
  },
  shadow: {
    variant: 'button.reset',
    position: 'absolute',
    top: '0px',
    left: '0px',
    height: '100%',
    width: '100%',
    cursor: 'default',
    '>div': {
      top: '0px',
      left: '0px',
    },
  },
  dialog: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    maxHeight: '80vh',
    borderRadius: '0.375em',
    border: '1px solid',
    overflow: 'hidden',
    color: 'text',
    ':focus': {
      outline: 'none',
    },
  },
  head: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 2,
    '>h3': {
      variant: 'heading.default',
      margin: 12,
      fontSize: 2,
      lineHeight: 1.3,
      color: 'whitePure',
    },
    '>button': {
      variant: 'button.reset',
      display: 'flex',
      color: 'whitePure',
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '2px',
      },
    },
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
}

export const Modal = memo(UIModal)
