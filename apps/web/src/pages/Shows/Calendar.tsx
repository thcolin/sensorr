import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AbstractEntity, Badge, CalendarMonthPicker, Empty, Entities, EpisodeStatus, EpisodeStatusOptions, transformShowDetails, useControlsState, withControls } from '@sensorr/ui'
import { coverageLabel } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useAPI, query as APIQuery } from '../../store/api'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { Agenda, Cell, ControlsContext, Line, Month, Stream, ViewSelect, useStreams, useView } from '../../components/Calendar/Calendar'
import { dateOf, day, monthRange, originOf } from '../../components/Calendar/agenda'
import { agendaDays, groupByDay, weeksRange } from './agenda'

const STATISTICS = {}

const FALLBACK = {
  title: 'Sorry, unable to display episodes...',
  subtitle: 'The API did not answer the episodes request, try again or log in again',
}

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

const entry = (entry, show) => ({
  ...summarize(entry, show),
  poster: show?.poster_path,
  empty: Empty.tv,
  badge: <EpisodeStatus value={entry.status} size='normal' compact={true} />,
})

const keyOf = (entry) => entry.episodes[0].id

// The month of the picker, a `Date` once the history state is read back
const monthOf = (controls) => (controls?.values?.air_date instanceof Date) ? controls.values.air_date : new Date()

const AIR_DATE = {
  initial: new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1),
  component: CalendarMonthPicker,
}

// Beside the month, the count and the view, as on the Theatres bar
const nav = {
  display: 'grid' as const,
  gridTemplateColumns: ['1fr min-content min-content', 'min-content 1fr min-content min-content'],
  gridTemplateRows: 'auto',
  gap: '2em',
  gridTemplateAreas: [`"air_date results view"`, `"title air_date results view"`],
  '>h4': {
    display: ['none', 'block'],
  },
}

const controls = (fields, hooks = {}) => withControls({
  title: i18n.t('pages.calendar.title'),
  useStatistics: () => STATISTICS,
  hooks,
  layout: { nav },
  components: { view: ViewSelect },
  fields: { air_date: { ...AIR_DATE, ...fields } },
})

// An episode card on the model of a movie of the calendar: its day on the left, its status on the right
const episodeDetails = (entity) => {
  if (!entity?.show_id) {
    return transformShowDetails(entity || {})
  }

  const { code, name, title } = summarize(entity, entity.show)

  return {
    ...transformShowDetails(entity.show || {}),
    id: entity.id,
    title: name,
    caption: title,
    poster: entity.show?.poster_path,
    meaningful: {
      year: () => <span sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{code}</span>,
    },
  }
}

const episodeLink = (entity) => entity?.show_id ? { to: summarize(entity, entity.show).to } : {}

const UIEpisodeCard = ({ entity, ...props }) => {
  const badges = useMemo(() => !entity?.show_id ? {} : {
    focus: {
      component: Badge,
      props: { emoji: '📅', label: dateOf(entity.key).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }), compact: true, size: 'small' },
    },
    state: {
      component: EpisodeStatus,
      props: { value: entity.status, compact: true },
    },
  }, [entity?.id, entity?.status])

  return (
    <AbstractEntity {...props as any} entity={entity} transformDetails={episodeDetails} link={episodeLink} badges={badges} />
  )
}

// The episodes of the month in one card per show, day and status, in the order they air. The month comes whole
// (`limit: ''`): no `onMore`, or the grid asks for a next page at its 20th card and gets the same month again
const withEpisodeCards = () => (WrappedComponent) => {
  const withEpisodeCards = ({ entities, shows, onMore, ...props }) => {
    const cards = useMemo(() => groupByDay(Object.values(entities || {}), shows)
      .flatMap(({ key, entries }) => entries.map(entry => ({ ...entry, key, id: keyOf(entry), show: shows[entry.show_id] }))), [entities, shows])

    return (
      <WrappedComponent {...props} entities={cards} length={props.ready ? cards.length : null} />
    )
  }

  withEpisodeCards.displayName = `withEpisodeCards(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withEpisodeCards
}

const GridCalendar = compose(
  withProps({
    id: 'shows-calendar',
    display: 'grid',
    child: UIEpisodeCard,
    empty: {
      emoji: '📅',
      title: 'No episode this month',
      subtitle: 'None of the shows you follow has an episode airing this month, try another one',
    },
  }),
  withFollowedShows(),
  withFetchQuery(APIQuery.episodes.getEpisodes({ params: { limit: '' } }), 1, useAPI, () => useContext(ControlsContext)),
  withEpisodeCards(),
  controls({
    serialize: (key, raw) => {
      const [aired_after, aired_before] = monthRange(raw)
      return { aired_after, aired_before }
    },
  }, { onChange: () => scrollToTop() }),
  withPlacehodersHistoryState(),
  withBody(),
)(Entities)

const UIShowsMonth = ({ entities, shows, ready, error, controls }) => {
  const days = useMemo(() => new Map(groupByDay(Object.values(entities || {}), shows).map(({ key, entries }) => [key, entries])), [entities, shows])
  const render = useCallback((value) => <Cell {...entry(value, shows[value.show_id])} />, [shows])

  return (
    <Month
      month={monthOf(controls)}
      days={days}
      ready={ready}
      error={error}
      fallback={FALLBACK}
      label='Episodes by day'
      render={render}
      keyOf={keyOf}
    />
  )
}

const MonthCalendar = compose(
  withFollowedShows(),
  withFetchQuery(APIQuery.episodes.getEpisodes({ params: { limit: '' } }), 1, useAPI, () => useContext(ControlsContext)),
  controls({ serialize: (key, raw) => weeksRange(raw) }, { onChange: () => scrollToTop() }),
  withBody(),
)(UIShowsMonth)

const STEP = 50

// The list reads two streams out from its origin: the past newest first, the future oldest first
const STREAMS = {
  past: (origin: string) => {
    const date = dateOf(origin)
    return { aired_before: day(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)), sort_by: 'air_date.desc' }
  },
  future: (origin: string) => ({ aired_after: origin, sort_by: 'air_date.asc' }),
}

const withShowsAgenda = () => (WrappedComponent) => {
  const withShowsAgenda = ({ ready, error, shows, ...props }) => {
    const api = useAPI()
    const context = useContext(ControlsContext)
    const [, controls] = useControlsState(() => context)
    const [today] = useState(() => day(new Date()))
    const [origin, setOrigin] = useState(() => originOf(context?.[0]?.air_date, today))

    const fetchPage = useCallback((stream: Stream, page: number, signal: AbortSignal) => {
      const { uri, params, init } = APIQuery.episodes.getEpisodes({
        params: { monitored_show: 'true', limit: STEP, page, ...STREAMS[stream](origin) },
        init: { signal },
      })

      return api.fetch(uri, params, init).then(({ results, total_results, total_pages }) => ({
        items: results,
        total: total_results,
        done: !results.length || page >= total_pages,
      }))
    }, [api, origin])

    const { streams, more, ready: loaded, failure } = useStreams(origin, fetchPage, 'episodes')
    const days = useMemo(() => (ready && loaded) ? agendaDays(streams, shows, today, origin) : [], [ready, loaded, streams, shows, today, origin])
    const setMonth = context?.[1]
    const onMonth = useCallback((month: Date) => setMonth(values => ({ ...values, air_date: month })), [setMonth])

    return (
      <WrappedComponent
        {...props}
        shows={shows}
        controls={controls}
        days={days}
        today={today}
        origin={origin}
        streams={streams}
        onMore={more}
        onOrigin={setOrigin}
        onMonth={onMonth}
        length={(streams.past.page && streams.future.page) ? streams.past.total + streams.future.total : null}
        ready={ready && loaded}
        error={error || failure}
      />
    )
  }

  withShowsAgenda.displayName = `withShowsAgenda(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withShowsAgenda
}

const UIShowsAgenda = ({ shows, controls, ...props }) => {
  const render = useCallback((value) => <Line {...entry(value, shows[value.show_id])} />, [shows])

  return (
    <Agenda
      {...props as any}
      month={monthOf(controls)}
      fallback={FALLBACK}
      empty={{
        emoji: '📅',
        title: 'No episode to list',
        subtitle: 'None of the shows you follow has an episode with an air date yet',
      }}
      noun='episodes'
      label='Episodes by day'
      render={render}
      keyOf={keyOf}
    />
  )
}

const ListCalendar = compose(
  withFollowedShows(),
  withShowsAgenda(),
  controls({ serialize: () => ({}) }),
  withBody(),
)(UIShowsAgenda)

const UICalendar = () => {
  const [view] = useView()
  const controls = useHistoryState('controls', { uri: '', params: {} })

  return (
    <ControlsContext.Provider value={controls}>
      {view === 'calendar' ? <MonthCalendar /> : view === 'list' ? <ListCalendar /> : <GridCalendar />}
    </ControlsContext.Provider>
  )
}

export const Calendar = withTitle(i18n.t('pages.shows.calendar.title'))(UICalendar)

export default Calendar
