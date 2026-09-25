import { createContext, forwardRef, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { CalendarMonthPicker, EpisodeStatus, EpisodeStatusOptions, Empty, Icon, Link, Picture, Warning, withControls } from '@sensorr/ui'
import { coverageLabel } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { compose, scrollToTop, useHistoryState, useResponsiveValue } from '@sensorr/utils'
import { useAPI, query as APIQuery } from '../../store/api'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import { withBody } from '../../layout/withLayout'
import { agendaDays, day, groupByDay, monthWeeks, weeksRange } from './agenda'

const STATISTICS = {}

// Height of an agenda line, which the date beside it takes to sit on the same axis
const ROW = '4em'

const withFollowedShows = () => (WrappedComponent) => {
  const withFollowedShows = ({ ...props }) => {
    const api = useAPI()
    const [shows, setShows] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
      const controller = new AbortController()
      const { uri, params, init } = APIQuery.shows.getShows({ params: { monitored: true, fields: 'id|name|poster_path', limit: '' }, init: { signal: controller.signal } })

      api.fetch(uri, params, init)
        .then(({ results }) => setShows(results.reduce((acc, show) => ({ ...acc, [show.id]: show }), {})))
        .catch(error => error.name !== 'AbortError' && setError(error))

      return () => controller.abort()
    }, [])

    return (
      <WrappedComponent
        {...props}
        shows={shows || {}}
        query={{ uri: 'episodes', params: { monitored_show: 'true' } }}
        ready={!!shows}
        error={error || ((shows && !Object.keys(shows).length) ? {
          emoji: '📺',
          title: 'Try to follow some shows first',
          subtitle: 'The calendar lists the episodes of the shows you follow, follow one from its page or from your library',
        } : null)}
      />
    )
  }

  withFollowedShows.displayName = `withFollowedShows(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withFollowedShows
}

const VIEWS = [{ value: 'agenda', label: 'Agenda' }, { value: 'month', label: 'Month' }]

// The month of the page, read and written in its history state above both views
const ControlsContext = createContext(null)

// The view lives in the query string so a reload keeps it, and a phone only has the agenda. Switching replaces
// the location, whose history state starts empty: the month goes along in the location state.
const useView = () => {
  const [params, setParams] = useSearchParams()
  const [controls] = useContext(ControlsContext) || []
  const mobile = useResponsiveValue([true, false])
  const view = (!mobile && params.get('view') === 'month') ? 'month' : 'agenda'

  const setView = useCallback((value: string) => setParams((params) => {
    if (value === 'month') {
      params.set('view', value)
    } else {
      params.delete('view')
    }

    return params
  }, { replace: true, state: { controls } }), [setParams, controls])

  return [view, setView] as const
}

const UIViewSwitch = ({ style }) => {
  const [view, setView] = useView()

  return (
    <div role='group' aria-label='View' style={style} sx={UIViewSwitch.styles.element}>
      {VIEWS.map(({ value, label }) => (
        <button key={value} type='button' aria-pressed={view === value} onClick={() => setView(value)}>
          {label}
        </button>
      ))}
    </div>
  )
}

// The months of the picker beside it: white when chosen, `primaryDarker` under the pointer
UIViewSwitch.styles = {
  element: {
    display: ['none', 'flex'],
    alignItems: 'center',
    gap: 10,
    '>button': {
      variant: 'button.reset',
      paddingX: 6,
      paddingY: 8,
      borderRadius: '0.25em',
      color: 'whitePure',
      cursor: 'pointer',
      transition: 'background-color 200ms ease-in-out, color 200ms ease-in-out',
      ':hover': {
        backgroundColor: 'primaryDarker',
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '2px',
      },
      '&[aria-pressed="true"]': {
        backgroundColor: 'whitePure',
        color: 'primary',
      },
    },
  },
}

const ViewSwitch = memo(UIViewSwitch)

const STEP = 50

// The agenda reads two streams out from today: the past newest first, the future oldest first
const STREAMS = {
  past: (today: Date) => ({ aired_before: day(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)), sort_by: 'air_date.desc' }),
  future: (today: Date) => ({ aired_after: day(today), sort_by: 'air_date.asc' }),
}

type Stream = keyof typeof STREAMS

const EMPTY = { episodes: [], page: 0, total: null, done: false, loading: false, failed: false }

const withAgenda = () => (WrappedComponent) => {
  const withAgenda = ({ ready, error, ...props }) => {
    const api = useAPI()
    const [today] = useState(() => new Date())
    const [streams, setStreams] = useState({ past: EMPTY, future: EMPTY })
    const [failure, setFailure] = useState(null)
    const state = useRef(streams)
    const controller = useRef<AbortController>(null)

    const update = useCallback((stream: Stream, patch: (current: typeof EMPTY) => Partial<typeof EMPTY>) => {
      state.current = { ...state.current, [stream]: { ...state.current[stream], ...patch(state.current[stream]) } }
      setStreams(state.current)
    }, [])

    const more = useCallback((stream: Stream) => {
      const current = state.current[stream]

      if (current.loading || current.done) {
        return
      }

      const page = current.page + 1
      const { signal } = controller.current
      const { uri, params, init } = APIQuery.episodes.getEpisodes({
        params: { monitored_show: 'true', limit: STEP, page, ...STREAMS[stream](today) },
        init: { signal },
      })

      update(stream, () => ({ loading: true, failed: false }))
      api.fetch(uri, params, init)
        .then(({ results, total_results, total_pages }) => !signal.aborted && update(stream, ({ episodes }) => ({
          episodes: [...episodes, ...results],
          page,
          total: total_results,
          done: !results.length || page >= total_pages,
          loading: false,
        })))
        .catch((error) => {
          if (signal.aborted) {
            return
          }

          update(stream, () => ({ loading: false, failed: true }))

          if (page === 1) {
            setFailure(error)
          } else {
            console.warn(error)
            toast.error('Error while fetching episodes')
          }
        })
    }, [api, today, update])

    useEffect(() => {
      controller.current = new AbortController()
      state.current = { past: EMPTY, future: EMPTY }
      setStreams(state.current)
      setFailure(null)
      more('past')
      more('future')

      return () => controller.current.abort()
    }, [more])

    return (
      <WrappedComponent
        {...props}
        today={day(today)}
        streams={streams}
        onMore={more}
        length={(streams.past.page && streams.future.page) ? streams.past.total + streams.future.total : null}
        ready={ready && !!streams.past.page && !!streams.future.page}
        error={error || failure}
      />
    )
  }

  withAgenda.displayName = `withAgenda(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withAgenda
}

const label = (date: Date, language: string) => date.toLocaleDateString(language, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
})

const UIAgenda = ({ shows, ready, error, today, streams, onMore }) => {
  const { i18n: { language } } = useTranslation()
  const days = useMemo(() => ready ? agendaDays(streams, shows, today) : [], [ready, streams, shows, today])
  const past = useRef<HTMLDivElement>(null)
  const future = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState({ past: false, future: false })
  const anchor = useRef<{ key: string, y: number }>(null)

  useEffect(() => {
    if (error && !error.subtitle) {
      console.warn(error)
    }
  }, [error])

  // Opens on today, then holds the first day in place while older days load above it
  useLayoutEffect(() => {
    const scroller = document.getElementById('body')

    if (!scroller || !days.length) {
      return
    }

    const offset = (key: string) => {
      const element = document.getElementById(`day-${key}`)
      return element ? element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop : null
    }

    if (!anchor.current) {
      scroller.scrollTop = offset(today)
    } else if (anchor.current.key !== days[0].key && offset(anchor.current.key) !== null) {
      scroller.scrollTop += offset(anchor.current.key) - anchor.current.y
    }

    anchor.current = { key: days[0].key, y: offset(days[0].key) }
  }, [days, today])

  useEffect(() => {
    const root = document.getElementById('body')

    // No sentinel when nothing airs at all
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
      <Warning
        emoji={error.emoji || '💢'}
        title={error.title || 'Sorry, unable to display episodes...'}
        subtitle={error.subtitle || 'The API did not answer the episodes request, try again or log in again'}
      />
    )
  }

  if (!ready) {
    return (
      <section sx={UIAgenda.styles.element} aria-label='Loading episodes' aria-busy={true}>
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

  if (!streams.past.total && !streams.future.total) {
    return (
      <Warning
        emoji='📅'
        title='No episode to list'
        subtitle='None of the shows you follow has an episode with an air date yet'
      />
    )
  }

  return (
    <section sx={UIAgenda.styles.element} aria-label='Episodes by day'>
      <Sentinel ref={past} stream='past' state={streams.past} onMore={onMore} />
      {days.map(({ key, date, entries }) => (
        <section key={key} id={`day-${key}`} sx={UIAgenda.styles.day} aria-labelledby={`day-${key}-date`}>
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
                  <li key={entry.episodes[0].id}>
                    <Line entry={entry} show={shows[entry.show_id]} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
      <Sentinel ref={future} stream='future' state={streams.future} onMore={onMore} />
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

const Agenda = memo(UIAgenda)

// Where a stream loads its next page: its height is kept while it has one, so the days do not jump
const UISentinel = ({ stream, state, onMore }, ref) => (
  <div ref={ref} data-stream={stream} sx={{ ...UISentinel.styles.element, ...(state.done ? { height: '0em' } : {}) }}>
    {state.loading && (
      <Icon value='spinner' />
    )}
    {state.failed && (
      <button type='button' sx={UISentinel.styles.retry} onClick={() => onMore(stream)}>
        Unable to load the {stream === 'past' ? 'previous' : 'next'} episodes, retry
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

const summarize = ({ show_id, status, episodes }, show) => {
  const [first] = episodes
  const code = coverageLabel(episodes.map(episode => ({ season: episode.season_number, episode: episode.episode_number })), 'episode')
  const name = show?.name || `Show ${show_id}`
  const title = episodes.length > 1 ? `${episodes.length} episodes` : first.name

  return {
    to: { pathname: `/tv/${show_id}`, hash: `#season-${first.season_number}` },
    code,
    name,
    title,
    label: [`${name} ${code}`, title, EpisodeStatusOptions[status]?.label].filter(Boolean).join(', '),
  }
}

const UILine = ({ entry, show }) => {
  const { to, code, name, title, label } = summarize(entry, show)

  return (
    <Link to={to} sx={UILine.styles.element} aria-label={label}>
      <span sx={UILine.styles.poster}>
        <Picture path={show?.poster_path} size='w92' empty={Empty.tv} />
      </span>
      <span sx={UILine.styles.body}>
        <strong title={name}>{name}</strong>
        <span>
          <code>{code}</code>
          {!!title && <span title={title}>{title}</span>}
        </span>
      </span>
      <EpisodeStatus value={entry.status} size='normal' compact={true} />
    </Link>
  )
}

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
    transition: 'background-color 200ms ease-in-out',
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

const Line = memo(UILine)

const UIMonth = ({ entities, shows, ready, error, controls }) => {
  const { i18n: { language } } = useTranslation()
  const month = controls?.values?.air_date
  const today = day(new Date())
  const weeks = useMemo(() => month ? monthWeeks(month) : [], [month])
  const days = useMemo(() => new Map(groupByDay(Object.values(entities || {}), shows).map(({ key, entries }) => [key, entries])), [entities, shows])

  useEffect(() => {
    if (error && !error.subtitle) {
      console.warn(error)
    }
  }, [error])

  if (error) {
    return (
      <Warning
        emoji={error.emoji || '💢'}
        title={error.title || 'Sorry, unable to display episodes...'}
        subtitle={error.subtitle || 'The API did not answer the episodes request, try again or log in again'}
      />
    )
  }

  return (
    <section sx={UIMonth.styles.element} aria-label='Episodes by day' aria-busy={!ready}>
      <div sx={UIMonth.styles.weekdays} aria-hidden={true}>
        {(weeks[0] || []).map(({ key, date }) => (
          <span key={key}>{date.toLocaleDateString(language, { weekday: 'short' })}</span>
        ))}
      </div>
      <ol sx={UIMonth.styles.grid}>
        {weeks.flat().map(({ key, date, outside }) => {
          const entries = (ready && days.get(key)) || []

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
                    <li key={entry.episodes[0].id}>
                      <Cell entry={entry} show={shows[entry.show_id]} />
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

UIMonth.styles = {
  element: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingX: 0,
    paddingY: 4,
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

const Month = memo(UIMonth)

const UICell = ({ entry, show }) => {
  const { to, code, name, label } = summarize(entry, show)

  return (
    <Link to={to} sx={UICell.styles.element} aria-label={label} title={label}>
      <span sx={UICell.styles.poster}>
        <Picture path={show?.poster_path} size='w92' empty={Empty.tv} />
      </span>
      <strong>{name}</strong>
      <code>{code}</code>
      {/* On the right, centered on the name and the code together */}
      <EpisodeStatus value={entry.status} size='normal' compact={true} />
    </Link>
  )
}

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
    transition: 'background-color 200ms ease-in-out',
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
    '>code': {
      gridColumn: 2,
      fontFamily: 'monospace',
      color: 'grayDarkest',
      fontVariantNumeric: 'tabular-nums',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
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

const Cell = memo(UICell)

const nav = (areas: string[]) => ({
  display: 'grid' as const,
  gridTemplateColumns: ['1fr min-content', 'min-content 1fr min-content min-content'],
  gridTemplateRows: 'auto',
  gap: '2em',
  gridTemplateAreas: areas,
  '>h4': {
    display: ['none', 'block'],
  },
})

const AgendaCalendar = compose(
  withFollowedShows(),
  withAgenda(),
  withControls({
    title: i18n.t('pages.calendar.title'),
    useStatistics: () => STATISTICS,
    layout: {
      nav: nav([`"title results"`, `"title . view results"`]),
    },
    components: {
      view: ViewSwitch,
    },
    fields: {},
  }),
  withBody(),
)(Agenda)

const MonthCalendar = compose(
  withFollowedShows(),
  withFetchQuery(APIQuery.episodes.getEpisodes({ params: { limit: '' } }), 1, useAPI, () => useContext(ControlsContext)),
  withControls({
    title: i18n.t('pages.calendar.title'),
    useStatistics: () => STATISTICS,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: nav([`"air_date results"`, `"title air_date view results"`]),
    },
    components: {
      view: ViewSwitch,
    },
    fields: {
      air_date: {
        initial: new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1),
        serialize: (key, raw) => weeksRange(raw),
        component: CalendarMonthPicker,
      },
    },
  }),
  withBody(),
)(Month)

const UICalendar = () => {
  const [view] = useView()
  const controls = useHistoryState('controls', { uri: '', params: {} })

  return (
    <ControlsContext.Provider value={controls}>
      {view === 'month' ? <MonthCalendar /> : <AgendaCalendar />}
    </ControlsContext.Provider>
  )
}

export const Calendar = withTitle(i18n.t('pages.shows.calendar.title'))(UICalendar)

export default Calendar
