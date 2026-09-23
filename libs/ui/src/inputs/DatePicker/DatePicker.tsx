import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addMonths, addYears, subMonths } from 'date-fns'
import { useTranslation } from 'react-i18next'
import nanobounce from 'nanobounce'

export interface DatePickerProps {
  label: string
  getOptions: (value: Date) => Date[]
  value: Date
  onChange: (value: Date) => void
  disabled?: boolean
}

const MIN_YEAR = 1900
const MAX_YEAR = new Date().getFullYear() + 7
const YEARS_PER_PAGE = 12

const clamp = (date: Date) => {
  if (date.getFullYear() < MIN_YEAR) {
    return new Date(MIN_YEAR, 0, 1)
  }

  if (date.getFullYear() > MAX_YEAR) {
    return new Date(MAX_YEAR, 11, 1)
  }

  return date
}

const UIDatePicker = ({ label, getOptions, value, onChange, disabled, ...props }: DatePickerProps) => {
  const { i18n } = useTranslation()
  const debounce = useMemo(() => nanobounce(400), [])
  const [state, setState] = useState(value)
  const [open, setOpen] = useState<{ top: number, left: number } | null>(null)
  const [page, setPage] = useState(0)
  const element = useRef<HTMLDivElement>(null)
  const year = useRef<HTMLButtonElement>(null)
  const months = useRef<HTMLDivElement>(null)
  const today = new Date()
  const current = state.getFullYear() === today.getFullYear() && state.getMonth() === today.getMonth()

  const handleDebounceChange = useCallback((value, direct = false) => {
    const clamped = clamp(value)
    setState(clamped)

    if (direct) {
      onChange(clamped)
      return
    }

    debounce(() => onChange(clamped))
  }, [debounce, onChange])

  useEffect(() => {
    setState(value)
  }, [value])

  useEffect(() => {
    const month = months.current?.children[state.getMonth()] as HTMLElement
    const container = months.current

    if (month && container && container.scrollWidth > container.clientWidth) {
      container.scrollTo({ left: month.offsetLeft - (container.clientWidth - month.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [state])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable) {
        return
      }

      if (e.key === 'Escape' && open) {
        setOpen(null)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const step = e.key === 'ArrowLeft' ? -1 : 1
        handleDebounceChange(e.shiftKey ? addYears(state, step) : addMonths(state, step))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, state, handleDebounceChange])

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (e) => {
      if (!element.current?.contains(e.target)) {
        setOpen(null)
      }
    }
    const close = () => setOpen(null)

    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', close)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // The controls nav scrolls horizontally and would clip an absolute popover
  const toggle = () => {
    const rect = year.current.getBoundingClientRect()
    setPage(Math.floor((state.getFullYear() - MIN_YEAR) / YEARS_PER_PAGE))
    setOpen(open ? null : { top: rect.bottom + 8, left: rect.left })
  }

  const first = MIN_YEAR + page * YEARS_PER_PAGE

  return (
    <div ref={element} sx={UIDatePicker.styles.element} aria-label={label} role='group'>
      <button
        type='button'
        aria-label='Previous month'
        onClick={() => handleDebounceChange(subMonths(state, 1))}
        disabled={disabled || (state.getFullYear() === MIN_YEAR && state.getMonth() === 0)}
        sx={UIDatePicker.styles.navigation}
      >
        ‹
      </button>
      <div sx={UIDatePicker.styles.year}>
        <button
          ref={year}
          type='button'
          aria-haspopup='dialog'
          aria-expanded={!!open}
          onClick={toggle}
          disabled={disabled}
        >
          {state.getFullYear()} ▾
        </button>
        {open && (
          <div role='dialog' aria-label='Year' sx={UIDatePicker.styles.popover} style={open}>
            <div sx={UIDatePicker.styles.pager}>
              <button
                type='button'
                aria-label='Previous years'
                onClick={() => setPage(page - 1)}
                disabled={first <= MIN_YEAR}
                sx={UIDatePicker.styles.navigation}
              >
                ‹
              </button>
              <span>{first} – {Math.min(first + YEARS_PER_PAGE - 1, MAX_YEAR)}</span>
              <button
                type='button'
                aria-label='Next years'
                onClick={() => setPage(page + 1)}
                disabled={first + YEARS_PER_PAGE > MAX_YEAR}
                sx={UIDatePicker.styles.navigation}
              >
                ›
              </button>
            </div>
            <div sx={UIDatePicker.styles.years}>
              {Array(YEARS_PER_PAGE)
                .fill(0)
                .map((_, index) => first + index)
                .filter(year => year <= MAX_YEAR)
                .map(year => (
                  <button
                    key={year}
                    type='button'
                    aria-pressed={state.getFullYear() === year}
                    onClick={() => {
                      handleDebounceChange(new Date(year, state.getMonth(), 1), true)
                      setOpen(null)
                    }}
                    sx={UIDatePicker.styles.month(state.getFullYear() === year)}
                  >
                    {year}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
      <div ref={months} sx={UIDatePicker.styles.container}>
        {Array(12)
          .fill(0)
          .map((_, index) => (
            <button
              key={index}
              type='button'
              aria-pressed={state.getMonth() === index}
              onClick={() => handleDebounceChange(new Date(state.getFullYear(), index, 1), true)}
              disabled={disabled}
              sx={UIDatePicker.styles.month(state.getMonth() === index)}
            >
              <span>
                {new Date(state.getFullYear(), index, 1).toLocaleString(i18n.language, {
                  month: 'short',
                })}
              </span>
            </button>
          ))}
      </div>
      <button
        type='button'
        aria-label='Next month'
        onClick={() => handleDebounceChange(addMonths(state, 1))}
        disabled={disabled || (state.getFullYear() === MAX_YEAR && state.getMonth() === 11)}
        sx={UIDatePicker.styles.navigation}
      >
        ›
      </button>
      <button
        type='button'
        onClick={() => handleDebounceChange(new Date(today.getFullYear(), today.getMonth(), 1), true)}
        disabled={disabled}
        sx={{ ...UIDatePicker.styles.month(false), flex: 'none', display: current ? ['none', 'block'] : 'block', visibility: current ? 'hidden' : 'visible' }}
      >
        Today
      </button>
    </div>
  )
}

UIDatePicker.styles = {
  element: {
    display: 'flex',
    alignItems: 'stretch',
    width: ['100vw', 'auto'],
    height: '100%',
    minWidth: 0,
    backgroundColor: 'primaryDark',
  },
  year: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: 'primaryDarker',
    '>button': {
      variant: 'button.reset',
      height: '100%',
      paddingX: 8,
      fontFamily: 'heading',
      fontSize: 2,
      fontWeight: 'bold',
      color: 'whitePure',
    },
  },
  popover: {
    position: 'fixed',
    zIndex: 6,
    width: '16em',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: 'primaryDark',
    color: 'whitePure',
  },
  pager: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'primaryDarker',
    fontFamily: 'heading',
    fontWeight: 'bold',
  },
  years: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    '>button': {
      minWidth: 'unset',
    },
  },
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    position: 'relative',
    minWidth: 0,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  navigation: {
    variant: 'button.reset',
    alignSelf: 'center',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '2em',
    width: '2em',
    borderRadius: '50%',
    marginX: 6,
    ':disabled': {
      opacity: 0.5,
    },
    ':hover:not(:disabled)': {
      backgroundColor: 'primaryDarkest',
    },
  },
  month: (selected: boolean) => ({
    variant: 'button.reset',
    flex: 1,
    border: 'none',
    fontSize: 5,
    paddingX: 8,
    paddingY: 6,
    overflow: 'hidden',
    minWidth: '4.5em',
    backgroundColor: selected ? 'whitePure' : 'transparent',
    color: selected ? 'primary' : 'whitePure',
    ':hover': {
      backgroundColor: selected ? 'whitePure' : 'primaryDarker',
    },
    ':disabled': {
      opacity: 0.5,
    },
  }),
}

export const DatePicker = memo(UIDatePicker)
