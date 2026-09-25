import { useCallback, useContext, useMemo, useState } from 'react'
import {
  Sorting,
  CalendarMonthPicker,
  FilterReleaseType,
  FilterGenres,
  FilterCompanies,
  FilterKeywords,
  FilterLanguages,
  FilterCertification,
  FilterRuntime,
  FilterVoteAverage,
  FilterVoteCount,
  FilterKnownForDepartment,
  withControls,
  useControlsState,
  Warning,
  Icon,
  Option,
  Badge,
  Empty,
  MovieStateOptions,
} from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { fields, useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { Trans, useTranslation } from 'react-i18next'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useTMDB, withTMDB } from '../../store/tmdb'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { Agenda, Cell, ControlsContext, Line, Month, Stream, ViewSelect, useStreams, useView } from '../../components/Calendar/Calendar'
import { dateOf, day, monthRange, monthWeeks, originOf, withToday } from '../../components/Calendar/agenda'
import withFetchCalendarQuery, { fetchCalendar, refine } from './withFetchCalendarQuery'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'

const STATISTICS = {}

const FALLBACK = {
  title: 'Sorry, unable to display movies...',
  subtitle: 'TMDB did not answer the calendar requests, try again later',
}

const NOBODY = {
  emoji: '⭐️',
  title: "Try to follow some people first",
  subtitle: "Calendar is based on people you follow, check trending stars or look at casting from your favorite movies",
}

const FIELDS = {
  // TODO: Should hide entity.popularity === 0
  hide_library: {
    initial: false,
    hideFromFiltersCount: true,
    serialize: () => ({}),
    component: ({ value, onChange, ...props }) => (
      <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '8em' }}>
        <Option
          id='hide_library'
          type='checkbox'
          checked={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        >
          Hide Library
        </Option>
      </div>
    ),
  },
  with_release_type: {
    ...fields.release_type,
    initial: {
      values: [
        // { value: 1, label: 'Premiere' },
        // { value: 2, label: 'Theatrical (limited)' },
        { value: 3, label: 'Theatrical' }
      ], behavior: 'or' },
    component: FilterReleaseType,
  },
  with_credits_departments: {
    initial: ['Acting', 'Directing', 'Writing'],
    serialize: (key, raw) => raw?.length ? { [key]: raw.join('|') } : {},
    component: withProps({ label: i18n.t('ui.filters.credits') })(FilterKnownForDepartment),
  },
  head: {
    initial: null,
    component: ({ ...props }) => (
      <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
        <Warning
          emoji="🗓️"
          title="Calendar"
          subtitle={(
            <span>
              Explore movies from followed persons in a calendar view, refinable with various filters like <strong>credits</strong>, <strong>average rating</strong>, <strong>number of votes</strong>, <strong>genres</strong>, <strong>certifications</strong>, etc...
              <br/>
              <small><em>Follow more people to enhance your calendar !</em></small>
            </span>
          )}
        />
      </div>
    ),
  },
  with_genres: {
    ...fields.genres,
    statistics: null,
    component: compose(
      withProps({ display: 'select' }),
      withTMDB()
    )(FilterGenres),
  },
  without_genres: {
    ...fields.genres,
    initial: { values: [{ value: 99, label: 'Documentary' }, { value: 10770, label: 'TV Movie' }], behavior: 'or' }, // Documentary -- sorry
    statistics: null,
    component: compose(
      withProps({
        display: 'select',
        label: <span>{i18n.t('ui.filters.genres')} <small>({i18n.t('without')})</small></span>,
      }),
      withTMDB()
    )(FilterGenres),
  },
  vote_average: {
    ...fields.vote_average,
    component: FilterVoteAverage,
  },
  vote_count: {
    ...fields.vote_count,
    component: FilterVoteCount,
  },
  with_runtime: {
    ...fields.runtime,
    component: FilterRuntime,
  },
  with_companies: {
    ...fields.companies,
    component: withTMDB()(FilterCompanies),
  },
  with_keywords: {
    ...fields.keywords,
    component: withTMDB()(FilterKeywords),
  },
  without_keywords: {
    ...fields.keywords,
    component: compose(
      withProps({
        label: <span>{i18n.t('ui.filters.keywords')} <small>({i18n.t('without')})</small></span>,
      }),
      withTMDB(),
    )(FilterKeywords),
  },
  with_original_language: {
    ...fields.original_language,
    component: FilterLanguages,
    props: { menuPlacement: 'top' },
  },
  certification: {
    ...fields.certification,
    component: FilterCertification,
    props: { menuPlacement: 'top' },
  },
}

const SORT_BY = {
  initial: {
    value: 'primary_release_date',
    sort: false,
  },
  serialize: (key, raw) => ({ [key]: `${raw.value}.${{ true: 'desc', false: 'asc' }[raw.sort]}` }),
  component: withProps({
    label: i18n.t('ui.sorting'),
    options: [
      { label: i18n.t('ui.sortings.popularity'), value: 'popularity' },
      { label: i18n.t('ui.sortings.primary_release_date'), value: 'primary_release_date' },
      { label: i18n.t('ui.sortings.vote_average'), value: 'vote_average' },
      { label: i18n.t('ui.sortings.vote_count'), value: 'vote_count' },
    ]
  })(Sorting)
}

const PRIMARY_RELEASE_DATE = {
  initial: new Date((new Date()).getFullYear(), (new Date()).getMonth(), 2),
  serialize: (key, raw) => ({
    [`${key}.gte`]: new Date(raw.getFullYear(), raw.getMonth(), 2).toISOString().substring(0, 10),
    [`${key}.lte`]: new Date(raw.getFullYear(), raw.getMonth() + 1, 1).toISOString().substring(0, 10),
  }),
  component: withProps({
    getOptions: (value) => [
      new Date(value.getFullYear(), value.getMonth() - 2, 2),
      new Date(value.getFullYear(), value.getMonth() - 1, 2),
      new Date(value.getFullYear(), value.getMonth(), 2),
      new Date(value.getFullYear(), value.getMonth() + 1, 2),
      new Date(value.getFullYear(), value.getMonth() + 2, 2),
    ],
  })(CalendarMonthPicker)
}

const ASIDE = {
  display: 'grid' as const,
  gridTemplateColumns: 'minmax(0, 1fr)',
  gridTemplateRows: 'auto',
  gap: '2em',
  gridTemplateAreas: `
    "head"
    "with_release_type"
    "with_credits_departments"
    "with_genres"
    "without_genres"
    "vote_average"
    "vote_count"
    "with_companies"
    "with_keywords"
    "without_keywords"
    "with_original_language"
    "with_runtime"
    "certification"
  `,
}

const Toggle = ({ toggleOpen, fields, values, ...props }) => {
  const { t } = useTranslation()
  const active = Object.keys(values)
    .filter(key => !['sort_by', 'primary_release_date', 'with_release_type', 'hide_library'].includes(key))
    .reduce((acc, key) => acc + (values[key] && (JSON.stringify(values[key]) !== JSON.stringify(fields[key]?.initial) && fields[key]?.serialize) ? 1 : 0), 0)

  return (
    <button
      {...props}
      sx={{
        variant: 'button.reset',
        display: 'flex',
        alignItems: 'center',
        marginY: 4,
        paddingX: 2,
        borderRadius: '0.25em',
        ':hover': {
          backgroundColor: 'accent',
        },
        ':active': {
          backgroundColor: 'accentDark',
        },
        '>svg': {
          height: '1em',
          marginLeft: 6,
        },
      }}
      type='button'
      onClick={toggleOpen}
    >
      <Trans t={t} i18nKey='ui.controls.toggle' values={{ active }} components={[<span style={{ whiteSpace: 'pre' }} />, <strong />]} />
      <Icon value='filters' />
    </button>
  )
}

// The bar of the Theatres page: the view beside the library toggle, the sort only where the order is not the date
const nav = (areas: string[]) => ({
  display: 'grid' as const,
  gridTemplateColumns: [
    `1fr ${'min-content '.repeat(areas[0].split(' ').length - 1).trim()}`,
    `min-content 1fr ${'min-content '.repeat(areas[1].split(' ').length - 2).trim()}`,
  ],
  gridTemplateRows: 'auto',
  gap: '2em',
  gridTemplateAreas: areas,
  '>h4': {
    display: ['none', 'block'],
  },
})

const controls = ({ release, sort = false, hooks = {}, useStatistics }) => withControls({
  title: i18n.t('pages.calendar.title'),
  useStatistics,
  hooks,
  layout: {
    nav: nav(sort ? [
      `"primary_release_date results hide_library view toggle sort_by"`,
      `"title primary_release_date results hide_library view toggle sort_by"`,
    ] : [
      `"primary_release_date results hide_library view toggle"`,
      `"title primary_release_date results hide_library view toggle"`,
    ]),
    aside: ASIDE,
  },
  components: {
    toggle: Toggle,
    view: ViewSelect,
  },
  fields: {
    ...FIELDS,
    primary_release_date: release,
    ...(sort ? { sort_by: SORT_BY } : {}),
  },
})

const GridCalendar = compose(
  withProps({
    display: 'grid',
    child: MovieWithCreditsAndReviews,
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: "Try to follow more people, check trending stars or look at casting from your favorite movies",
    },
    props: ({ entity, ...props }) => ({
      focus: 'release_date_full',
    }),
  }),
  withFetchCalendarQuery(),
  controls({ release: PRIMARY_RELEASE_DATE, sort: true, hooks: { onChange: () => scrollToTop() }, useStatistics }),
  withPlacehodersHistoryState(),
  withBody(),
)(EntitiesHideable)

// The movies of each day, the most popular first
const byDay = (movies: any[]) => [
  ...[...new Map(movies.map(movie => [movie.id, movie])).values()]
    .filter(movie => !!movie.release_date)
    .reduce((acc, movie) => acc.set(movie.release_date, [...(acc.get(movie.release_date) || []), movie]), new Map<string, any[]>())
    .entries(),
]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, entries]) => ({ key, date: dateOf(key), entries: entries.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)) }))

const monthOf = (controls) => (controls?.values?.primary_release_date instanceof Date) ? controls.values.primary_release_date : new Date()

const keyOf = (movie) => movie.id

// A movie of a day, with its state as the card shows it and faded like the grid when the library is hidden
const UIMovieEntry = ({ entity, as: Entry, hideLibrary }) => {
  const { loading, metadata: { [entity.id]: metadata = null } } = useMoviesMetadataContext() as any
  const state = MovieStateOptions.find(({ value }) => value === metadata?.state)
  const genres = (entity.genres || []).map(({ name }) => name).join(', ')

  return (
    <Entry
      to={`/movie/${entity.id}`}
      label={[entity.title, genres, state?.label].filter(Boolean).join(', ')}
      poster={entity.poster_path}
      empty={Empty.movie}
      name={entity.title}
      title={genres}
      badge={(state && !state.hide) ? <Badge role='img' aria-label={state.label} title={state.label} emoji={state.emoji} size='normal' compact={true} /> : null}
      dimmed={!loading && hideLibrary && !!metadata && metadata.state !== 'ignored'}
    />
  )
}

const useRender = (Entry, controls) => {
  const hideLibrary = !!controls?.values?.hide_library
  return useCallback((entity) => <UIMovieEntry entity={entity} as={Entry} hideLibrary={hideLibrary} />, [Entry, hideLibrary])
}

const UIMoviesMonth = ({ entities, ready, error, controls }) => {
  const days = useMemo(() => new Map(byDay(Object.values(entities || {})).map(({ key, entries }) => [key, entries])), [entities])
  const render = useRender(Cell, controls)

  return (
    <Month
      month={monthOf(controls)}
      days={days}
      ready={ready}
      error={error}
      fallback={FALLBACK}
      label='Movies by day'
      render={render}
      keyOf={keyOf}
    />
  )
}

const MonthCalendar = compose(
  withFetchCalendarQuery(),
  controls({
    release: {
      ...PRIMARY_RELEASE_DATE,
      serialize: (key, raw) => {
        const weeks = monthWeeks(raw)
        return { [`${key}.gte`]: weeks[0][0].key, [`${key}.lte`]: weeks[weeks.length - 1][6].key }
      },
    },
    hooks: { onChange: () => scrollToTop() },
    useStatistics,
  }),
  withBody(),
)(UIMoviesMonth)

// The months the list can reach, as the picker does
const FIRST = new Date(1900, 0, 1)
const LAST = new Date(new Date().getFullYear() + 7, 11, 1)

// The list reads a month a page, out from the month of its origin: the past from the month before, the future from it
const withMoviesAgenda = () => (WrappedComponent) => {
  const withMoviesAgenda = ({ ...props }) => {
    const tmdb = useTMDB()
    const persons = usePersonsMetadataContext() as any
    const context = useContext(ControlsContext)
    const [query, controls] = useControlsState(() => context, ({ uri, ...params }) => ({ ready: true, params }))
    const [today] = useState(() => day(new Date()))
    const [origin, setOrigin] = useState(() => originOf(context?.[0]?.primary_release_date, today))
    const filters = JSON.stringify(query?.params || {})
    const nobody = !persons.loading && !Object.keys(persons.metadata).length
    const key = (query?.ready && !persons.loading && !nobody) ? `${origin} ${filters}` : null

    const fetchPage = useCallback(async (stream: Stream, page: number, signal: AbortSignal) => {
      const { with_release_type, with_credits_departments, ...params } = JSON.parse(filters)
      const start = dateOf(origin)
      const month = new Date(start.getFullYear(), start.getMonth() + (stream === 'past' ? -page : page - 1), 1)
      const [gte, lte] = monthRange(month)
      const fetched = await fetchCalendar(tmdb, persons.metadata, { ...params, 'primary_release_date.gte': gte, 'primary_release_date.lte': lte }, () => signal.aborted)

      return {
        items: refine(fetched, { with_release_type, with_credits_departments }).entities,
        done: stream === 'past' ? month <= FIRST : month >= LAST,
      }
    }, [tmdb, persons.metadata, origin, filters])

    const { streams, more, ready, failure } = useStreams(key, fetchPage, 'movies')
    const days = useMemo(() => ready ? withToday(byDay([...streams.past.items, ...streams.future.items]), today, origin, streams) : [], [ready, streams, today, origin])
    const setValues = context?.[1]
    const onMonth = useCallback((month: Date) => setValues(values => ({ ...values, primary_release_date: month })), [setValues])

    return (
      <WrappedComponent
        {...props}
        controls={controls}
        days={days}
        today={today}
        origin={origin}
        streams={streams}
        onMore={more}
        onOrigin={setOrigin}
        onMonth={onMonth}
        length={null}
        ready={ready}
        error={nobody ? NOBODY : failure}
      />
    )
  }

  withMoviesAgenda.displayName = `withMoviesAgenda(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withMoviesAgenda
}

const UIMoviesAgenda = ({ controls, ...props }) => {
  const render = useRender(Line, controls)

  return (
    <Agenda
      {...props as any}
      month={monthOf(controls)}
      fallback={FALLBACK}
      empty={{
        emoji: '🍿',
        title: 'No movie to list',
        subtitle: 'None of the people you follow has a movie matching these filters',
      }}
      noun='movies'
      label='Movies by day'
      render={render}
      keyOf={keyOf}
    />
  )
}

const ListCalendar = compose(
  withMoviesAgenda(),
  controls({ release: { ...PRIMARY_RELEASE_DATE, serialize: () => ({}) }, useStatistics: () => STATISTICS }),
  withBody(),
)(UIMoviesAgenda)

const UICalendar = () => {
  const [view] = useView()
  const controls = useHistoryState('controls', { uri: '', params: {} })

  return (
    <ControlsContext.Provider value={controls}>
      {view === 'calendar' ? <MonthCalendar /> : view === 'list' ? <ListCalendar /> : <GridCalendar />}
    </ControlsContext.Provider>
  )
}

export const Calendar = withTitle(i18n.t('pages.calendar.title'))(UICalendar)

export default Calendar
