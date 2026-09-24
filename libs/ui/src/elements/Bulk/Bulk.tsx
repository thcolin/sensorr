import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeUI } from 'theme-ui'
import { ButtonProps } from '../../atoms/Button/Button'
import { Shadow } from '../../atoms/Shadow/Shadow'
import { Icon } from '../../atoms/Icon/Icon'

export interface BulkOption {
  value: any
  label: React.ReactNode
  icon?: React.ReactNode
}

export interface BulkAction {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  variant?: ButtonProps['variant']
  color?: ButtonProps['color']
  disabled?: boolean
  onClick?: () => void
  // An action with options opens over the whole bar and lists them; picking one calls `onChange`.
  options?: BulkOption[]
  onChange?: (option: BulkOption) => void
}

// The count and the way out of the selection live with the page's own select-all checkbox.
export interface BulkProps {
  count: number
  actions: BulkAction[]
  disabled?: boolean
}

// Same curve as the moves of the Swaps screen.
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const EXPAND = 200
const STAGGER = 30

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const inset = (from, radius = '2em') => from ? `inset(${from.top}px ${from.right}px ${from.bottom}px ${from.left}px round ${radius})` : `inset(0px round ${radius})`

const UIBulk = ({ count, actions, disabled = false }: BulkProps) => {
  const { theme } = useThemeUI()
  const [expanded, setExpanded] = useState(null)
  const [dimmed, setDimmed] = useState(false)
  const shown = useRef(count)
  const wrapper = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  // The box of the opening button inside the options, which can be wider than the bar.
  const from = useRef(null)
  const faded = useRef<Animation[]>([])
  const closing = useRef(false)
  const visible = count > 0

  // The bar leaves with the count it had, not with a zero.
  if (visible) {
    shown.current = count
  }

  const action = actions.find(({ key }) => key === expanded?.key)
  const segments = () => Array.from(row.current?.children || []) as HTMLElement[]

  const open = useCallback((key, e) => {
    if (!wrapper.current || wrapper.current.dataset.visible !== 'true') {
      return
    }

    setDimmed(true)
    setExpanded({ key, button: e.currentTarget.getBoundingClientRect() })
  }, [])

  const close = useCallback((then = null) => {
    const node = overlay.current

    if (!node || closing.current) {
      return
    }

    closing.current = true
    setDimmed(false)
    const done = () => {
      closing.current = false
      setExpanded(null)
      row.current?.querySelector<HTMLButtonElement>(`[data-key="${expanded?.key}"]`)?.focus()
      then?.()
    }

    faded.current.forEach(animation => animation.cancel())
    segments().forEach(segment => segment.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' }))
    node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-out', fill: 'forwards' }).finished.then(done)
  }, [expanded])

  useLayoutEffect(() => {
    const node = overlay.current

    if (!expanded || !node) {
      return
    }

    const box = node.getBoundingClientRect()
    const { button } = expanded
    from.current = { top: button.top - box.top, right: box.right - button.right, bottom: box.bottom - button.bottom, left: button.left - box.left }
    node.querySelector<HTMLButtonElement>('[data-option]')?.focus({ preventScroll: true })

    if (reduced()) {
      node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 })
      return
    }

    const label = node.querySelector('[data-label]') as HTMLElement
    faded.current = segments().map(segment => segment.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: 'ease-out', fill: 'forwards' }))
    node.animate([{ clipPath: inset(from.current) }, { clipPath: inset(null) }], { duration: EXPAND, easing: EASING })
    label.animate([{ transform: `translateX(${from.current.left - label.offsetLeft}px)` }, { transform: 'none' }], { duration: EXPAND, easing: EASING })
    Array.from(node.querySelectorAll('[data-option], [data-cancel]')).forEach((option: HTMLElement, index) => option.animate(
      [{ opacity: 0, transform: 'translateX(-0.25em)' }, { opacity: 1, transform: 'none' }],
      { duration: 150, delay: 150 + index * STAGGER, easing: 'ease-out', fill: 'backwards' },
    ))
  }, [expanded?.key])

  useEffect(() => {
    if (!expanded) {
      return
    }

    // Captured, so a page that listens to Escape (the Swaps card) does not close as well.
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [expanded, close])

  // A selection emptied from elsewhere folds the options away with the bar.
  useEffect(() => {
    if (!visible) {
      faded.current.forEach(animation => animation.cancel())
      setExpanded(null)
      setDimmed(false)
    }
  }, [visible])

  const onScroll = useCallback(() => {
    const node = row.current

    if (node) {
      node.dataset.start = String(node.scrollLeft > 1)
      node.dataset.end = String(node.scrollLeft + node.clientWidth < node.scrollWidth - 1)
    }
  }, [])

  useLayoutEffect(onScroll, [actions.length, visible, onScroll])

  return createPortal(
    <>
      <button
        type='button'
        tabIndex={-1}
        aria-hidden={true}
        sx={UIBulk.styles.dim}
        style={{
          zIndex: dimmed && visible ? 6 : -1,
          opacity: dimmed && visible ? 1 : 0,
          transition: `opacity 400ms ease, z-index ${dimmed && visible ? '0ms' : '400ms'} linear`,
        }}
        onClick={() => close()}
      >
        <Shadow palette={{ backgroundColor: (theme.rawColors as any).gray } as any} fade={0.1} />
      </button>
      <div
        ref={wrapper}
        sx={UIBulk.styles.element}
        data-bulk={true}
        data-visible={visible}
        aria-hidden={!visible}
        {...(!visible ? { inert: '' } : {})}
      >
        <div ref={row} sx={UIBulk.styles.row} onScroll={onScroll} role='toolbar' aria-label={`${shown.current} selected`}>
          {actions.map(({ key, label, icon = null, variant = 'outline', color = 'gray', disabled: off = false, onClick, options }) => (
            <button
              key={key}
              type='button'
              sx={UIBulk.styles.segment}
              data-key={key}
              data-variant={variant}
              data-color={color}
              disabled={disabled || off}
              aria-expanded={options ? expanded?.key === key : undefined}
              onClick={options ? (e) => open(key, e) : onClick}
            >
              {!!icon && <span data-icon={true} aria-hidden={true}>{icon}</span>}
              {label}
              {!!options && <Icon value='chevron' direction={true} width='0.625em' height='0.625em' />}
            </button>
          ))}
        </div>
        {!!action && (
          <div ref={overlay} sx={UIBulk.styles.overlay} role='group' aria-label={typeof action.label === 'string' ? action.label : undefined}>
            <strong data-label={true}>
              {!!action.icon && <span data-icon={true} aria-hidden={true}>{action.icon}</span>}
              {action.label}
            </strong>
            <span>
              {action.options.map((option, index) => (
                <button key={index} type='button' sx={UIBulk.styles.segment} data-option={true} disabled={disabled} onClick={() => close(() => action.onChange?.(option))}>
                  {!!option.icon && <span data-icon={true} aria-hidden={true}>{option.icon}</span>}
                  {option.label}
                </button>
              ))}
            </span>
            <button type='button' sx={UIBulk.styles.segment} data-cancel={true} onClick={() => close()} aria-label='Cancel' title='Cancel (Esc)'>
              <Icon value='clear' active={true} width='1em' height='1em' />
            </button>
          </div>
        )}
      </div>
    </>,
    document.body,
  )
}

// The line of the strip under the controls bar of Swaps, drawn on half the height of the bar.
const SEPARATOR = 'hsla(0, 0%, 0%, 0.12)'

const separated = {
  position: 'relative',
  '::before': {
    content: '""',
    position: 'absolute',
    left: '0px',
    top: '25%',
    bottom: '25%',
    width: '1px',
    backgroundColor: SEPARATOR,
  },
}

// A PWA on a phone draws its navigation at the bottom (Navigation.tsx): the bar sits over it.
const BOTTOM = {
  bottom: 'calc(1em + env(safe-area-inset-bottom))',
  '@media (display-mode: standalone) and (max-width: 767px)': {
    bottom: 'calc(3.5em + env(safe-area-inset-bottom))',
  },
}

UIBulk.styles = {
  element: {
    position: 'fixed',
    left: '50%',
    zIndex: 6,
    display: 'flex',
    maxWidth: 'calc(100vw - 2em)',
    color: 'whitePure',
    // The size of the controls bar (Nav.tsx).
    fontSize: 5,
    transform: 'translate3d(-50%, 0, 0)',
    transition: `transform ${EXPAND}ms ${EASING}, visibility 0ms`,
    ...BOTTOM,
    '&[data-visible=false]': {
      transform: 'translate3d(-50%, calc(100% + 1em + env(safe-area-inset-bottom) + 3em), 0)',
      visibility: 'hidden',
      transition: `transform ${EXPAND}ms ${EASING}, visibility 0ms ${EXPAND}ms`,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'opacity 150ms ease-out, visibility 0ms',
      '&[data-visible=false]': {
        transform: 'translate3d(-50%, 0, 0)',
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 150ms ease-out, visibility 0ms 150ms',
      },
    },
  },
  // A pill, against the Pill-Is-A-State rule of DESIGN.md: the exception is written there.
  row: {
    display: 'flex',
    minWidth: 0,
    backgroundColor: 'primary',
    borderRadius: '2em',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    '>button + button': separated,
    '>button:first-of-type': {
      paddingLeft: 0,
    },
    '>button:last-of-type': {
      paddingRight: 0,
    },
    '&[data-start=true]': {
      maskImage: 'linear-gradient(to right, transparent, black 2em)',
    },
    '&[data-end=true]': {
      maskImage: 'linear-gradient(to left, transparent, black 2em)',
    },
    '&[data-start=true][data-end=true]': {
      maskImage: 'linear-gradient(to right, transparent, black 2em, black calc(100% - 2em), transparent)',
    },
  },
  segment: {
    variant: 'button.reset',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minWidth: '8em',
    height: '3em',
    paddingX: 1,
    fontFamily: 'body',
    fontWeight: 'body',
    whiteSpace: 'nowrap',
    color: 'whitePure',
    cursor: 'pointer',
    transition: 'color 200ms ease-in-out, background-color 200ms ease-in-out',
    ':hover:not(:disabled)': {
      gap: 7,
      backgroundColor: 'primaryDark',
    },
    ':active:not(:disabled)': {
      backgroundColor: 'primaryDarker',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'whitePure',
      outlineOffset: '-4px',
      borderRadius: '2em',
    },
    ':disabled': {
      color: 'hsla(0, 0%, 100%, 0.5)',
      cursor: 'default',
    },
    // The white of the label, at the size of the decisions of a swap row (Card.tsx).
    '[data-icon]': {
      display: 'inline-flex',
      svg: {
        width: '1.125em',
        height: '1.125em',
        color: 'whitePure',
      },
    },
  },
  overlay: {
    position: 'absolute',
    top: '0px',
    bottom: '0px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'max-content',
    minWidth: '100%',
    maxWidth: 'calc(100vw - 2em)',
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden',
    backgroundColor: 'primary',
    borderRadius: '2em',
    clipPath: inset(null),
    // A level down takes the green of Library's releases pane, as the label of its values.
    '>strong': {
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      backgroundColor: 'primaryDark',
      paddingLeft: 0,
      paddingRight: 1,
      fontFamily: 'body',
      fontWeight: 'body',
      whiteSpace: 'nowrap',
    },
    '>span': {
      flex: 1,
      display: 'flex',
      minWidth: 0,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      '::-webkit-scrollbar': {
        display: 'none',
      },
      // A label then its values, as Sort by and its choice in the controls bar.
      '>button': {
        flex: '1 0 auto',
        fontWeight: 'semibold',
        ':hover:not(:disabled)': {
          backgroundColor: 'primaryDarker',
        },
      },
      '>button + button': separated,
    },
    '>button': {
      minWidth: 'auto',
      width: '3em',
      backgroundColor: 'primaryDark',
      paddingX: 12,
      svg: {
        color: 'whitePure',
        opacity: 0.5,
        transition: 'opacity 200ms ease-in-out',
      },
      ':hover:not(:disabled)': {
        backgroundColor: 'primaryDarker',
      },
      ':hover:not(:disabled) svg, :focus-visible svg': {
        opacity: 1,
      },
    },
  },
  dim: {
    variant: 'button.reset',
    position: 'fixed',
    inset: '0px',
    cursor: 'default',
    '>div': {
      inset: '0px',
    },
  },
}

export const Bulk = memo(UIBulk)
