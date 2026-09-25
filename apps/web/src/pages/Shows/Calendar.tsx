import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarMonthPicker, EpisodeStatus, EpisodeStatusOptions, Empty, Link, Picture, Warning, withControls } from '@sensorr/ui'
import { coverageLabel } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useAPI, query as APIQuery } from '../../store/api'
import { useDeviceContext } from '../../contexts/Device/Device'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import { withBody } from '../../layout/withLayout'
import { day, groupByDay, monthRange } from './agenda'

const STATISTICS = {}

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

const UIAgenda = ({ entities, shows, ready, error, controls, ...props }) => {
  const { i18n: { language } } = useTranslation()
  const { device } = useDeviceContext()
  const month = controls?.values?.air_date
  const today = day(new Date())
  const current = !!month && day(month).slice(0, 7) === today.slice(0, 7)
  const anchor = useRef<HTMLElement>(null)
  const anchored = useRef(false)

  const days = useMemo(() => groupByDay(Object.values(entities || {}), shows), [entities, shows])

  const list = useMemo(() => (current && !days.some(({ key }) => key === today))
    ? [...days, { key: today, date: new Date(`${today}T00:00:00`), entries: [] }].sort((a, b) => a.key.localeCompare(b.key))
    : days, [days, current, today])

  useEffect(() => {
    if (error && !error.subtitle) {
      console.warn(error)
    }
  }, [error])

  useEffect(() => {
    if (!current) {
      anchored.current = false
      return
    }

    if (ready && !anchored.current && anchor.current) {
      anchor.current.scrollIntoView({ block: 'start' })
      anchored.current = true
    }
  }, [current, ready, list])

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
        <div>
          <section sx={UIAgenda.styles.day}>
            <div sx={UIAgenda.styles.head}>
              <span sx={{ ...UIAgenda.styles.bar, width: '12em' }}>&nbsp;</span>
            </div>
            <ul sx={UIAgenda.styles.list}>
              {PLACEHOLDERS.map((width, index) => (
                <li key={index}>
                  <Placeholder width={width} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    )
  }

  if (!days.length) {
    return (
      <Warning
        emoji='📅'
        title='No episode this month'
        subtitle={`None of the shows you follow airs an episode in ${month ? month.toLocaleString('en', { month: 'long', year: 'numeric' }) : 'this month'}`}
      />
    )
  }

  return (
    <section sx={UIAgenda.styles.element} aria-label='Episodes by day'>
      <div>
        {list.map(({ key, date, entries }) => (
          <section
            key={key}
            ref={key === today ? anchor : null}
            sx={UIAgenda.styles.day}
            aria-labelledby={`day-${key}`}
          >
            <h5 id={`day-${key}`} sx={{ ...UIAgenda.styles.head, ...(key < today ? UIAgenda.styles.past : {}) }}>
              <time dateTime={key}>{date.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}</time>
              {key === today && <small>Today</small>}
            </h5>
            {entries.length ? (
              <ul sx={UIAgenda.styles.list}>
                {entries.map(entry => (
                  <li key={entry.episodes[0].id}>
                    <Line entry={entry} show={shows[entry.show_id]} compact={device === 'mobile'} />
                  </li>
                ))}
              </ul>
            ) : (
              <p sx={UIAgenda.styles.empty}>No episode airs today</p>
            )}
          </section>
        ))}
      </div>
    </section>
  )
}

UIAgenda.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    paddingX: [4, '5em'],
    marginY: 4,
    '>div': {
      width: '100%',
      maxWidth: '35em',
    },
  },
  day: {
    scrollMarginTop: 4,
    ':not(:first-of-type)': {
      marginTop: 4,
    },
  },
  head: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    margin: 12,
    paddingX: 8,
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    '>small': {
      fontSize: 6,
      fontWeight: 'semibold',
      color: 'grayDarkest',
    },
  },
  past: {
    color: 'grayDarkest',
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
  empty: {
    margin: 12,
    paddingX: 8,
    paddingY: 4,
    fontSize: 6,
    color: 'grayDarkest',
  },
  bar: {
    display: 'inline-block',
    height: '1em',
    borderRadius: '0.25em',
    backgroundColor: 'grayLight',
  },
}

const Agenda = memo(UIAgenda)

const PLACEHOLDERS: [string, string][] = [['40%', '25%'], ['55%', '35%'], ['30%', '45%'], ['50%', '20%'], ['35%', '40%'], ['45%', '30%']]

const Placeholder = ({ width: [name, code] }: { width: [string, string] }) => (
  <span sx={{ ...UILine.styles.element, ':hover': {} }} aria-hidden={true}>
    <span sx={{ ...UILine.styles.poster, backgroundColor: 'grayLight' }} />
    <span sx={UILine.styles.body}>
      <strong><span sx={{ ...UIAgenda.styles.bar, width: name }}>&nbsp;</span></strong>
      <span><span sx={{ ...UIAgenda.styles.bar, width: code }}>&nbsp;</span></span>
    </span>
  </span>
)

const UILine = ({ entry: { show_id, status, episodes }, show, compact }) => {
  const [first] = episodes
  const code = coverageLabel(episodes.map(episode => ({ season: episode.season_number, episode: episode.episode_number })), 'episode')
  const name = show?.name || `Show ${show_id}`
  const title = episodes.length > 1 ? `${episodes.length} episodes` : first.name

  return (
    <Link
      to={{ pathname: `/tv/${show_id}`, hash: `#season-${first.season_number}` }}
      sx={UILine.styles.element}
      aria-label={[`${name} ${code}`, title, EpisodeStatusOptions[status]?.label].filter(Boolean).join(', ')}
    >
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
      <EpisodeStatus value={status} size='normal' compact={compact} />
    </Link>
  )
}

UILine.styles = {
  element: {
    variant: 'link.reset',
    display: 'flex',
    alignItems: 'center',
    gap: [6, 4],
    paddingX: 8,
    paddingY: 8,
    color: 'text',
    borderRadius: '0.75em',
    transition: 'background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'gray',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '-1px',
    },
  },
  poster: {
    flexShrink: 0,
    width: '3em',
    height: '4.5em',
    borderRadius: '0.25em',
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    '>strong': {
      fontSize: 5,
      fontWeight: 'strong',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>span': {
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

export const Calendar = compose(
  withTitle(i18n.t('pages.shows.calendar.title')),
  withFollowedShows(),
  withFetchQuery(APIQuery.episodes.getEpisodes({ params: { limit: '' } }), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.calendar.title'),
    useStatistics: () => STATISTICS,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content', 'min-content 1fr min-content'],
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: [
          `"air_date results"`,
          `"title air_date results"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
    },
    fields: {
      air_date: {
        initial: new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1),
        serialize: (key, raw) => monthRange(raw),
        component: CalendarMonthPicker,
      },
    },
  }),
  withBody(),
)(Agenda)

export default Calendar
