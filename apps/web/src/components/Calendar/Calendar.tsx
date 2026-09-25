import { ReactNode, createContext, forwardRef, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { keyframes } from '@emotion/react'
import { ControlsSelect, Icon, Link, Picture, Warning } from '@sensorr/ui'
import { emojize, useResponsiveValue } from '@sensorr/utils'
import { dateOf, day, monthRange, monthWeeks, originOf } from './agenda'

// Height of a list line, which the date beside it takes to sit on the same axis
const ROW = '4em'

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const VIEWS = [
  { value: 'grid', label: emojize('🖼️', 'Grid') },
  { value: 'calendar', label: emojize('🗓️', 'Calendar'), desktop: true },
  { value: 'list', label: emojize('📋', 'List') },
]

// The history state of a calendar page, read and written above its views so the month and the filters survive a switch
export const ControlsContext = createContext(null)

// The view lives in the query string so a reload keeps it, and a phone has no room for the month grid. Switching
// replaces the location, whose history state starts empty: the controls go along in the location state.
export const useView = () => {
  const [params, setParams] = useSearchParams()
  const [controls] = useContext(ControlsContext) || []
  const desktop = useResponsiveValue([false, true])
  const options = useMemo(() => VIEWS.filter(view => desktop || !view.desktop), [desktop])
  const view = options.find(({ value }) => value === params.get('view'))?.value || 'grid'

  const setView = useCallback((value: string) => setParams((params) => {
    if (value === 'grid') {
      params.delete('view')
    } else {
      params.set('view', value)
    }

    return params
  }, { replace: true, state: { controls } }), [setParams, controls])

  return [view, setView, options] as const
}

const UIViewSelect = ({ style }) => {
  const [view, setView, options] = useView()

  return (
    <ControlsSelect id='view' value={view} options={options} onChange={setView} fixedWidth={true} style={style} />
  )
}

export const ViewSelect = memo(UIViewSelect)

type Day<T = any> = { key: string, date: Date, entries: T[] }

interface Failure {
  title: string
  subtitle: string
}

const UIFailure = ({ error, fallback }: { error: any, fallback: Failure }) => {
  useEffect(() => {
    if (error && !error.subtitle) {
      console.warn(error)
    }
  }, [error])

  return (
    <Warning emoji={error.emoji || '💢'} title={error.title || fallback.title} subtitle={error.subtitle || fallback.subtitle} />
  )
}

export interface EntryProps {
  to: any
  label: string
  poster: string
  empty: React.FC<any>
  name: string
  code?: string
  title?: string
  badge?: ReactNode
  dimmed?: boolean
}

const UILine = ({ to, label, poster, empty, name, code, title, badge, dimmed }: EntryProps) => (
  <Link to={to} sx={UILine.styles.element} style={dimmed ? { opacity: 0.125 } : undefined} aria-label={label}>
    <span sx={UILine.styles.poster}>
      <Picture path={poster} size='w92' empty={empty} />
    </span>
    <span sx={UILine.styles.body}>
      <strong title={name}>{name}</strong>
      <span>
        {!!code && <code>{code}</code>}
        {!!title && <span title={title}>{title}</span>}
      </span>
    </span>
    {badge}
  </Link>
)

// Square and one tonal step up under the pointer, as the rows of the seasons of a show
UILine.styles = {
  element: {
    variant: 'link.reset',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minHeight: ROW,
    paddingX: 8,
    paddingY: 8,
    color: 'text',
    transition: 'background-color 200ms ease-in-out, opacity 400ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLighter',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '-1px',
    },
  },
  poster: {
    flexShrink: 0,
    width: '2em',
    height: '3em',
    borderRadius: '0.25em',
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'baseline'],
    gap: [10, 4],
    '>strong': {
      flexShrink: 0,
      width: ['auto', '12em'],
      fontSize: 5,
      fontWeight: 'strong',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>span': {
      flex: 1,
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      minWidth: 0,
      fontSize: 6,
      '>code': {
        flexShrink: 0,
        fontFamily: 'monospace',
        color: 'grayDarkest',
        fontVariantNumeric: 'tabular-nums',
      },
      '>span': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
}

export const Line = memo(UILine)

const UICell = ({ to, label, poster, empty, name, code, title, badge, dimmed }: EntryProps) => (
  <Link to={to} sx={UICell.styles.element} style={dimmed ? { opacity: 0.125 } : undefined} aria-label={label} title={label}>
    <span sx={UICell.styles.poster}>
      <Picture path={poster} size='w92' empty={empty} />
    </span>
    <strong>{name}</strong>
    {code ? <code>{code}</code> : <small>{title}</small>}
    {/* On the right, centered on the name and the line under it together */}
    {badge}
  </Link>
)

UICell.styles = {
  element: {
    variant: 'link.reset',
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    gridTemplateRows: 'auto auto',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 11,
    paddingX: 9,
    paddingY: 10,
    fontSize: 6,
    color: 'text',
    transition: 'background-color 200ms ease-in-out, opacity 400ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLighter',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '-1px',
    },
    '>strong': {
      fontWeight: 'strong',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>code, >small': {
      gridColumn: 2,
      color: 'grayDarkest',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>code': {
      fontFamily: 'monospace',
      fontVariantNumeric: 'tabular-nums',
    },
    '>small': {
      fontSize: 'inherit',
    },
    '>[role="img"]': {
      gridColumn: 3,
      gridRow: '1 / span 2',
    },
  },
  poster: {
    gridRow: 'span 2',
    width: '2em',
    height: '3em',
    borderRadius: '0.25em',
    overflow: 'hidden',
  },
}

export const Cell = memo(UICell)

export interface MonthProps {
  month: Date
  days: Map<string, any[]>
  ready: boolean
  error?: any
  fallback: Failure
  label: string
  render: (entry: any) => ReactNode
  keyOf: (entry: any) => string | number
}

const UIMonth = ({ month, days, ready, error, fallback, label, render, keyOf }: MonthProps) => {
  const { i18n: { language } } = useTranslation()
  const today = day(new Date())
  const [key] = monthRange(month)
  const weeks = useMemo(() => monthWeeks(dateOf(key)), [key])

  // The month in view and where it comes from: a later one enters from the right, an earlier one from the left
  const [shown, setShown] = useState({ key, direction: null })

  if (shown.key !== key) {
    setShown({ key, direction: key > shown.key ? 'next' : 'previous' })
  }

  if (error) {
    return (
      <UIFailure error={error} fallback={fallback} />
    )
  }

  return (
    <section sx={UIMonth.styles.element} aria-label={label} aria-busy={!ready}>
      <div sx={UIMonth.styles.weekdays} aria-hidden={true}>
        {weeks[0].map(({ key, date }) => (
          <span key={key}>{date.toLocaleDateString(language, { weekday: 'short' })}</span>
        ))}
      </div>
      <ol key={shown.key} sx={UIMonth.styles.grid} data-direction={shown.direction}>
        {weeks.flat().map(({ key, date, outside }) => {
          const entries = days.get(key) || []

          return (
            <li
              key={key}
              sx={UIMonth.styles.cell}
              data-outside={outside}
              data-today={key === today}
              aria-label={date.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}
            >
              <time dateTime={key}>{date.getDate()}</time>
              {!!entries.length && (
                <ul>
                  {entries.map(entry => (
                    <li key={keyOf(entry)}>
                      {render(entry)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// The fade is done halfway, so the grid is in sight while it covers the last of the way
const MONTH = {
  next: keyframes`from { opacity: 0; transform: translateX(2.5rem); } 50% { opacity: 1; }`,
  previous: keyframes`from { opacity: 0; transform: translateX(-2.5rem); } 50% { opacity: 1; }`,
  fade: keyframes`from { opacity: 0; }`,
}

UIMonth.styles = {
  element: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingX: 0,
    paddingY: 4,
    overflowX: 'clip',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    '>span': {
      paddingX: 8,
      paddingY: 8,
      fontSize: 6,
      fontWeight: 'semibold',
      color: 'grayDarkest',
    },
  },
  // Every cell the same size, filling the screen when it can: a busy day scrolls inside its cell
  grid: {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gridAutoRows: 'minmax(8em, 1fr)',
    margin: 12,
    padding: 12,
    listStyleType: 'none',
    borderTop: '1px solid',
    borderLeft: '1px solid',
    borderColor: 'gray',
    // A new month slides a short way in from the side it comes from while it fades in, the weekdays above it stay
    '&[data-direction="next"]': {
      animation: `${MONTH.next} 250ms ${EASING} both`,
    },
    '&[data-direction="previous"]': {
      animation: `${MONTH.previous} 250ms ${EASING} both`,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&[data-direction]': {
        animationName: `${MONTH.fade}`,
      },
    },
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 0,
    minHeight: 0,
    padding: 10,
    borderRight: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'gray',
    '>time': {
      alignSelf: 'flex-start',
      minWidth: '1.75em',
      paddingX: 9,
      paddingY: 10,
      borderRadius: '2em',
      fontSize: 6,
      fontWeight: 'semibold',
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums',
    },
    // The entries of a month come after its grid: they fade in where they land instead of popping
    '>ul': {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 11,
      margin: 12,
      padding: 12,
      listStyleType: 'none',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'grayDark transparent',
      animation: `${MONTH.fade} 400ms ease-in-out both`,
    },
    '&[data-outside="true"]': {
      '>time, >ul': {
        opacity: 0.4,
      },
    },
    '&[data-today="true"] >time': {
      backgroundColor: 'text',
      color: 'white',
    },
  },
}

export const Month = memo(UIMonth)

export type Stream = 'past' | 'future'

// `partial` is a page still loading that already put its first days out
export const EMPTY = { items: [], page: 0, total: null, done: false, loading: false, failed: false, partial: false }

export type Streams = { past: typeof EMPTY, future: typeof EMPTY }

// The two streams of a list, read page by page out from its origin. A new key starts both over, and `null` waits.
// A page can put its first items out before it is done, through `emit`. The list opens once the future stream,
// which holds the origin, has something: the past loads above it.
export const useStreams = (
  key: string | null,
  fetchPage: (stream: Stream, page: number, signal: AbortSignal, emit: (items: any[]) => void) => Promise<{ items: any[], total?: number, done: boolean }>,
  noun: string,
) => {
  const [streams, setStreams] = useState({ key: null, past: EMPTY, future: EMPTY })
  const [failure, setFailure] = useState(null)
  const state = useRef(streams)
  const controller = useRef<AbortController>(null)
  const fetcher = useRef(fetchPage)
  fetcher.current = fetchPage

  const update = useCallback((stream: Stream, patch: (current: typeof EMPTY) => Partial<typeof EMPTY>) => {
    state.current = { ...state.current, [stream]: { ...state.current[stream], ...patch(state.current[stream]) } }
    setStreams(state.current)
  }, [])

  const more = useCallback((stream: Stream) => {
    const current = state.current[stream]

    if (!controller.current || current.loading || current.done) {
      return
    }

    const page = current.page + 1
    const { signal } = controller.current
    const before = current.items
    const emit = (items: any[]) => !signal.aborted && update(stream, () => ({ items: [...before, ...items], partial: true }))

    update(stream, () => ({ loading: true, failed: false }))
    fetcher.current(stream, page, signal, emit)
      .then(({ items, total = null, done }) => !signal.aborted && update(stream, () => ({
        items: [...before, ...items],
        page,
        total,
        done,
        loading: false,
        partial: false,
      })))
      .catch((error) => {
        if (signal.aborted) {
          return
        }

        update(stream, () => ({ items: before, loading: false, failed: true, partial: false }))

        if (page === 1) {
          setFailure(error)
        } else {
          console.warn(error)
          toast.error(`Error while fetching ${noun}`)
        }
      })
  }, [update, noun])

  useEffect(() => {
    if (key === null) {
      return
    }

    const current = new AbortController()
    controller.current = current
    state.current = { key, past: EMPTY, future: EMPTY }
    setStreams(state.current)
    setFailure(null)
    more('past')
    more('future')

    return () => current.abort()
  }, [key, more])

  return {
    streams: streams as Streams,
    more,
    failure,
    ready: streams.key === key && (!!streams.future.page || streams.future.partial),
  }
}

export interface AgendaProps {
  days: Day[]
  today: string
  origin: string
  streams: Streams
  onMore: (stream: Stream) => void
  onOrigin: (origin: string) => void
  month: Date
  onMonth: (month: Date) => void
  ready: boolean
  error?: any
  fallback: Failure
  empty: { emoji: string, title: string, subtitle: string }
  noun: string
  label: string
  render: (entry: any) => ReactNode
  keyOf: (entry: any) => string | number
}

const label = (date: Date, language: string) => date.toLocaleDateString(language, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
})

const scroller = () => document.getElementById('body')

// Where the content of a day starts, under the border it takes once another day comes above it
const offset = (key: string) => {
  const element = document.getElementById(`day-${key}`)
  const body = scroller()
  return (element && body) ? element.getBoundingClientRect().top + element.clientTop - body.getBoundingClientRect().top + body.scrollTop : null
}

const UIAgenda = ({ days, today, origin, streams, onMore, onOrigin, month, onMonth, ready, error, fallback, empty, noun, label: name, render, keyOf }: AgendaProps) => {
  const { i18n: { language } } = useTranslation()
  const past = useRef<HTMLDivElement>(null)
  const future = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState({ past: false, future: false })
  const anchor = useRef<{ origin: string, key: string, y: number, short: boolean }>(null)
  // The month the list last put in the picker: a picker on any other one is a jump
  const reported = useRef(monthRange(month)[0])

  // Opens on its origin, then holds the first day in place while older days load above it. A list still too short
  // to bring its origin to the top, as while the first days come in, tries again as the next ones land.
  useLayoutEffect(() => {
    const body = scroller()

    if (!body || !days.length) {
      return
    }

    let short = false

    if (anchor.current?.origin !== origin || anchor.current.short) {
      const target = days.find(({ key }) => key >= origin)
      const top = target ? offset(target.key) : body.scrollHeight
      body.scrollTop = top
      short = !!target && body.scrollTop < top - 1
    } else if (anchor.current.key !== days[0].key && offset(anchor.current.key) !== null) {
      body.scrollTop += offset(anchor.current.key) - anchor.current.y
    }

    anchor.current = { origin, key: days[0].key, y: offset(days[0].key), short }
  }, [days, origin])

  // A month picked out of what the list holds is scrolled to, any other one opens the list again on it
  useEffect(() => {
    const [key] = monthRange(month)

    if (key === reported.current) {
      return
    }

    reported.current = key
    const target = originOf(month, today)
    const low = streams.past.done ? '' : days[0]?.key
    const high = streams.future.done ? '￿' : days[days.length - 1]?.key

    if (!ready || !days.length || target < low || target > high) {
      onOrigin(target)
      return
    }

    const body = scroller()
    const next = days.find(({ key }) => key >= target)
    body.scrollTop = next ? offset(next.key) : body.scrollHeight
  }, [month])

  // The picker follows the month of the first day still in sight
  useEffect(() => {
    const body = scroller()

    if (!ready || !body) {
      return
    }

    let frame = null

    const follow = () => {
      frame = null
      const top = body.getBoundingClientRect().top + 1
      const section = Array.from(body.querySelectorAll<HTMLElement>('[data-day]')).find(element => element.getBoundingClientRect().bottom > top)
      const key = section && `${section.dataset.day.slice(0, 8)}01`

      if (key && key !== reported.current) {
        reported.current = key
        onMonth(dateOf(key))
      }
    }

    const onScroll = () => {
      frame = frame ?? requestAnimationFrame(follow)
    }

    body.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      body.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [ready, onMonth])

  useEffect(() => {
    const root = scroller()

    // No sentinel when nothing happens at all
    if (!ready || !root || !past.current || !future.current) {
      return
    }

    const observer = new IntersectionObserver((records) => setVisible(visible => records.reduce((acc, { target, isIntersecting }) => ({
      ...acc,
      [(target as HTMLElement).dataset.stream]: isIntersecting,
    }), visible)), { root, rootMargin: '100% 0px' })

    observer.observe(past.current)
    observer.observe(future.current)
    return () => observer.disconnect()
  }, [ready])

  useEffect(() => {
    if (ready) {
      (['past', 'future'] as Stream[])
        .filter(stream => visible[stream] && !streams[stream].loading && !streams[stream].done && !streams[stream].failed)
        .forEach(onMore)
    }
  }, [ready, visible, streams, onMore])

  if (error) {
    return (
      <UIFailure error={error} fallback={fallback} />
    )
  }

  if (!ready) {
    return (
      <section sx={UIAgenda.styles.element} aria-label={`Loading ${noun}`} aria-busy={true}>
        {PLACEHOLDERS.map((widths, index) => (
          <section key={index} sx={UIAgenda.styles.day}>
            <div sx={UIAgenda.styles.date}>
              <span sx={{ ...UIAgenda.styles.bar, width: '6em' }}>&nbsp;</span>
            </div>
            <ul sx={UIAgenda.styles.list}>
              {widths.map((width, index) => (
                <li key={index}>
                  <Placeholder width={width} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    )
  }

  if (!days.some(({ entries }) => entries.length) && streams.past.done && streams.future.done) {
    return (
      <Warning {...empty} />
    )
  }

  return (
    <section sx={UIAgenda.styles.element} aria-label={name}>
      <Sentinel ref={past} stream='past' state={streams.past} noun={noun} onMore={onMore} />
      {days.map(({ key, date, entries }) => (
        <section key={key} id={`day-${key}`} data-day={key} sx={UIAgenda.styles.day} aria-labelledby={`day-${key}-date`}>
          <h5 id={`day-${key}-date`} sx={{ ...UIAgenda.styles.date, ...(key < today ? UIAgenda.styles.past : {}) }}>
            <time dateTime={key}>{label(date, language)}</time>
          </h5>
          <div>
            {key === today && (
              <p sx={UIAgenda.styles.today}><span>Today</span></p>
            )}
            {!!entries.length && (
              <ul sx={UIAgenda.styles.list}>
                {entries.map(entry => (
                  <li key={keyOf(entry)}>
                    {render(entry)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
      <Sentinel ref={future} stream='future' state={streams.future} noun={noun} onMore={onMore} />
    </section>
  )
}

UIAgenda.styles = {
  element: {
    paddingX: [4, 0],
    paddingBottom: 4,
  },
  day: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', '11em minmax(0, 1fr)'],
    columnGap: 4,
    ':not(:first-of-type)': {
      borderTop: '1px solid',
      borderColor: 'grayDark',
    },
  },
  // Sticks to the top while its day scrolls by; on a phone it turns into the title above the day
  date: {
    position: 'sticky',
    top: '0em',
    zIndex: 1,
    alignSelf: 'start',
    display: 'flex',
    alignItems: 'center',
    height: ['auto', ROW],
    margin: 12,
    paddingX: 8,
    paddingY: [8, 12],
    backgroundColor: ['grayLightest', 'transparent'],
    borderBottom: ['1px solid', 'none'],
    borderColor: 'grayDark',
    whiteSpace: 'nowrap',
  },
  past: {
    color: 'grayDarkest',
  },
  today: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: ['auto', ROW],
    margin: 12,
    paddingX: 8,
    paddingY: [8, 12],
    '>span': {
      fontSize: 6,
      fontWeight: 'semibold',
    },
    '::after': {
      content: '""',
      flex: 1,
      height: '1px',
      backgroundColor: 'grayDarkest',
    },
  },
  list: {
    listStyleType: 'none',
    margin: 12,
    padding: 12,
    '>li:not(:last-of-type)': {
      borderBottom: '1px solid',
      borderColor: 'gray',
    },
  },
  bar: {
    display: 'inline-block',
    height: '1em',
    borderRadius: '0.25em',
    backgroundColor: 'grayLight',
  },
}

export const Agenda = memo(UIAgenda)

// Where a stream loads its next page: its height is kept while it has one, so the days do not jump
const UISentinel = ({ stream, state, noun, onMore }, ref) => (
  <div ref={ref} data-stream={stream} sx={{ ...UISentinel.styles.element, ...(state.done ? { height: '0em' } : {}) }}>
    {state.loading && (
      <Icon value='spinner' />
    )}
    {state.failed && (
      <button type='button' sx={UISentinel.styles.retry} onClick={() => onMore(stream)}>
        Unable to load the {stream === 'past' ? 'previous' : 'next'} {noun}, retry
      </button>
    )}
  </div>
)

UISentinel.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: ROW,
    overflow: 'hidden',
  },
  retry: {
    variant: 'button.reset',
    paddingX: 6,
    paddingY: 8,
    borderRadius: '0.25em',
    fontSize: 6,
    color: 'grayDarkest',
    cursor: 'pointer',
    transition: 'background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLighter',
    },
  },
}

const Sentinel = memo(forwardRef(UISentinel))

const PLACEHOLDERS: [string, string][][] = [[['40%', '25%'], ['55%', '35%']], [['30%', '45%']], [['50%', '20%'], ['35%', '40%'], ['45%', '30%']]]

const Placeholder = ({ width: [name, code] }: { width: [string, string] }) => (
  <span sx={{ ...UILine.styles.element, ':hover': {} }} aria-hidden={true}>
    <span sx={{ ...UILine.styles.poster, backgroundColor: 'grayLight' }} />
    <span sx={UILine.styles.body}>
      <strong><span sx={{ ...UIAgenda.styles.bar, width: name }}>&nbsp;</span></strong>
      <span><span sx={{ ...UIAgenda.styles.bar, width: code }}>&nbsp;</span></span>
    </span>
  </span>
)
