import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeUI } from 'theme-ui'
import { Button, ButtonProps } from '../../atoms/Button/Button'
import { Shadow } from '../../atoms/Shadow/Shadow'
import { Icon } from '../../atoms/Icon/Icon'

export interface BulkOption {
  value: any
  label: React.ReactNode
}

export interface BulkAction {
  key: string
  label: React.ReactNode
  variant?: ButtonProps['variant']
  color?: ButtonProps['color']
  disabled?: boolean
  onClick?: () => void
  // An action with options opens over the whole bar and lists them; picking one calls `onChange`.
  options?: BulkOption[]
  onChange?: (option: BulkOption) => void
}

export interface BulkProps {
  count: number
  actions: BulkAction[]
  onClear: () => void
  disabled?: boolean
}

// Same curve as the moves of the Swaps screen.
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const EXPAND = 200
const STAGGER = 30

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The rows of an action are clipped out of the whole bar, from the box of the button that opened them.
const inset = (from, radius = '0.25em') => from ? `inset(${from.top}px ${from.right}px ${from.bottom}px ${from.left}px round ${radius})` : `inset(0px round ${radius})`

const UIBulk = ({ count, actions, onClear, disabled = false }: BulkProps) => {
  const { theme } = useThemeUI()
  const [expanded, setExpanded] = useState(null)
  const [dimmed, setDimmed] = useState(false)
  const shown = useRef(count)
  const wrapper = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  const visible = count > 0

  // The bar leaves with the count it had, not with a zero.
  if (visible) {
    shown.current = count
  }

  const action = actions.find(({ key }) => key === expanded?.key)

  const open = useCallback((key, e) => {
    const box = wrapper.current.getBoundingClientRect()
    const button = e.currentTarget.getBoundingClientRect()

    setDimmed(true)
    setExpanded({
      key,
      from: { top: button.top - box.top, right: box.right - button.right, bottom: box.bottom - button.bottom, left: button.left - box.left },
    })
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

    if (reduced()) {
      node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).finished.then(done)
      return
    }

    const options = Array.from(node.querySelectorAll('[data-option], [data-cancel]')) as HTMLElement[]
    options.forEach(option => option.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, fill: 'forwards' }))
    node.animate([{ clipPath: inset(null) }, { clipPath: inset(expanded.from) }], { duration: EXPAND, delay: 100, easing: EASING, fill: 'forwards' }).finished.then(done)
  }, [expanded])

  // The label slides from where its button was to the start of the bar, then the options come in.
  useLayoutEffect(() => {
    const node = overlay.current

    if (!expanded || !node) {
      return
    }

    node.querySelector<HTMLButtonElement>('[data-option]')?.focus({ preventScroll: true })

    if (reduced()) {
      node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 })
      return
    }

    const label = node.querySelector('[data-label]') as HTMLElement
    node.animate([{ clipPath: inset(expanded.from) }, { clipPath: inset(null) }], { duration: EXPAND, easing: EASING })
    label.animate([{ transform: `translateX(${expanded.from.left - label.offsetLeft}px)` }, { transform: 'none' }], { duration: EXPAND, easing: EASING })
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
      setExpanded(null)
      setDimmed(false)
    }
  }, [visible])

  // On a phone the row scrolls sideways, and fades on the side that has more.
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
          opacity: dimmed ? 1 : 0,
          visibility: dimmed ? 'visible' : 'hidden',
          transition: `opacity 200ms ease-out, visibility 0ms ${dimmed ? 0 : 200}ms`,
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
        <div ref={row} sx={UIBulk.styles.row} onScroll={onScroll} role='toolbar' aria-label='Selection'>
          <Button type='button' variant='outline' color='gray' onClick={onClear} aria-label={`Clear the selection of ${shown.current}`} title='Clear the selection'>
            <span><code>{shown.current.toLocaleString('en')}</code> selected</span>
            <Icon value='clear' width='1em' height='1em' />
          </Button>
          {actions.map(({ key, label, variant = 'outline', color = 'gray', disabled: off = false, onClick, options }) => (
            <Button
              key={key}
              type='button'
              variant={variant}
              color={color}
              data-key={key}
              data-variant={variant}
              disabled={disabled || off}
              aria-expanded={options ? expanded?.key === key : undefined}
              onClick={options ? (e) => open(key, e) : onClick}
            >
              {label}
              {!!options && <Icon value='chevron' direction={true} width='0.625em' height='0.625em' />}
            </Button>
          ))}
        </div>
        {!!action && (
          <div ref={overlay} sx={UIBulk.styles.overlay} role='group' aria-label={typeof action.label === 'string' ? action.label : undefined}>
            <strong data-label={true}>{action.label}</strong>
            <span>
              {action.options.map((option, index) => (
                <Button
                  key={index}
                  type='button'
                  variant='outline'
                  color='gray'
                  data-option={true}
                  disabled={disabled}
                  onClick={() => close(() => action.onChange?.(option))}
                >
                  {option.label}
                </Button>
              ))}
            </span>
            <Button type='button' variant='outline' color='gray' data-cancel={true} onClick={() => close()} title='Cancel (Esc)'>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </>,
    document.body,
  )
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
    maxWidth: 'calc(100vw - 2em)',
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
    button: {
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      margin: 12,
      whiteSpace: 'nowrap',
      ':focus-visible': {
        outline: '1px solid',
        outlineColor: 'grayDarkest',
        outlineOffset: '2px',
      },
    },
    // Each button floats on its own, over posters as over rows: an outline gets the surface of the toasts.
    'button[data-variant=outline]:not([data-option]):not([data-cancel])': {
      backgroundColor: 'gray',
    },
    code: {
      fontFamily: 'monospace',
      fontWeight: 'semibold',
    },
  },
  row: {
    display: 'flex',
    gap: 8,
    // Room for the focus outline, which the scroller would otherwise cut.
    padding: 10,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
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
  overlay: {
    position: 'absolute',
    inset: '0px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingX: 6,
    backgroundColor: 'gray',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
    clipPath: inset(null),
    '>strong': {
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      paddingRight: 6,
      borderRight: '1px solid',
      borderColor: 'grayDark',
      fontFamily: 'heading',
      fontWeight: 'heading',
      whiteSpace: 'nowrap',
    },
    '>span': {
      flex: 1,
      display: 'flex',
      gap: 8,
      minWidth: 0,
      paddingY: 10,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      '::-webkit-scrollbar': {
        display: 'none',
      },
    },
    button: {
      paddingY: 8,
    },
  },
  dim: {
    variant: 'button.reset',
    position: 'fixed',
    inset: '0px',
    zIndex: 6,
    cursor: 'default',
  },
}

export const Bulk = memo(UIBulk)
