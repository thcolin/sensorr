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
  Option,
  Badge,
  Empty,
  MovieStateOptions,
  reveal,
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
import { Agenda, Cell, ControlsContext, Line, Month, Stream, Toggle, ViewSelect, useStreams, useView } from '../../components/Calendar/Calendar'
import { dateOf, day, monthRange, monthWeeks, originOf, withToday } from '../../components/Calendar/agenda'
import withFetchCalendarQuery, { NOBODY, discoverCalendar, refine, summarizeCalendar } from './withFetchCalendarQuery'
import { refinementsOf } from './refine'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'
import withBulk from '../../components/enhancers/withBulk'

const STATISTICS = {}

const fallbackOf = (t) => ({
  title: t('pages.calendar.fallback.title'),
  subtitle: t('pages.calendar.fallback.subtitle'),
})

const ORDERS = [3, 5, 10, 20, null]

const FilterCredits = ({ value, onChange, ...props }: any) => (
  <FilterKnownForDepartment
    {...props}
    label={i18n.t('ui.filters.credits')}
    value={value?.values}
    onChange={(values) => onChange({ ...value, values })}
    badge={{
      label: i18n.t('pages.calendar.credits.label', { order: value?.order || 0 }),
      title: i18n.t('pages.calendar.credits.title', { order: value?.order || 0 }),
      onClick: () => onChange({ ...value, order: ORDERS[(ORDERS.indexOf(value?.order) + 1) % ORDERS.length] }),
      disabled: !value?.values?.includes('Acting'),
    }}
  />
)

const FIELDS = {
  // TODO: Should hide entity.popularity === 0
  hide_library: {
    initial: false,
    hideFromFiltersCount: true,
    serialize: () => ({}),
    component: ({ value, onChange, style }) => (
      <div style={style} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '8em' }}>
        <Option
          id='hide_library'
          type='checkbox'
          checked={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        >
          <Trans i18nKey='pages.hideLibrary' />
        </Option>
      </div>
    ),
  },
  with_release_type: {
    ...fields.release_type,
    // Read when the panel draws, so its chip speaks the language of the page
    get initial() {
      return {
        values: [
          // { value: 1, label: 'Premiere' },
          // { value: 2, label: 'Theatrical (limited)' },
          { value: 3, label: i18n.t('tmdb.release_type.theatrical') }
        ], behavior: 'or' }
    },
    component: FilterReleaseType,
  },
  with_credits_departments: {
    initial: { values: ['Acting', 'Directing', 'Writing'], order: 10 },
    serialize: (key, raw) => ({
      ...(raw?.values?.length ? { [key]: raw.values.join('|') } : {}),
      ...(raw?.order ? { with_credits_order: raw.order } : {}),
    }),
    component: FilterCredits,
  },
  head: {
    initial: null,
    component: ({ ...props }) => (
      <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
        <Warning
          emoji="🗓️"
          title={<Trans i18nKey='pages.calendar.title' />}
          subtitle={(
            <span>
              <Trans i18nKey='pages.calendar.head' components={[<strong />, <strong />, <strong />, <strong />, <strong />]} />
              <br/>
              <small><em><Trans i18nKey='pages.calendar.hint' /></em></small>
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
    // Documentary -- sorry. Read when the panel draws, so its chips speak the language of the page
    get initial() {
      return { values: [{ value: 99, label: i18n.t('person.genres.documentary') }, { value: 10770, label: i18n.t('person.genres.tvMovie') }], behavior: 'or' }
    },
    statistics: null,
    component: compose(
      withProps({
        display: 'select',
        get label() { return <span>{i18n.t('ui.filters.genres')} <small>({i18n.t('without')})</small></span> },
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
    initial: [40, 240],
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
        get label() { return <span>{i18n.t('ui.filters.keywords')} <small>({i18n.t('without')})</small></span> },
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
    get label() { return i18n.t('ui.sorting') },
    options: [
      { get label() { return i18n.t('ui.sortings.popularity') }, value: 'popularity' },
      { get label() { return i18n.t('ui.sortings.primary_release_date') }, value: 'primary_release_date' },
      { get label() { return i18n.t('ui.sortings.vote_average') }, value: 'vote_average' },
      { get label() { return i18n.t('ui.sortings.vote_count') }, value: 'vote_count' },
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

// The bar of the Theatres page: the view beside the library toggle, the sort only where the order is not the date
const nav = (areas: string) => ({
  display: 'grid' as const,
  gridTemplateColumns: [
    '1fr min-content',
    `min-content 1fr ${'min-content '.repeat(areas.split(' ').length - 2).trim()}`,
  ],
  gridTemplateRows: 'auto',
  gap: '2em',
  gridTemplateAreas: [`"results toggle"`, areas],
  '>h4': {
    display: ['none', 'block'],
  },
})

const STRIP = {
  display: 'grid' as const,
  gridTemplateColumns: 'minmax(0, 1fr) min-content',
  gap: '0em 2em',
  gridTemplateAreas: [`"primary_release_date primary_release_date" "hide_library view"`, ''],
}

const controls = ({ release, sort = false, hooks = {}, useStatistics }) => withControls({
  get title() { return i18n.t('pages.calendar.title') },
  useStatistics,
  hooks,
  layout: {
    nav: nav(sort
      ? `"title primary_release_date results hide_library view toggle sort_by"`
      : `"title primary_release_date results hide_library view toggle"`),
    strip: STRIP,
    aside: sort ? { ...ASIDE, gridTemplateAreas: [`"sort_by" ${ASIDE.gridTemplateAreas}`, ASIDE.gridTemplateAreas] } : ASIDE,
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
    bulk: 'movie',
    empty: {
      emoji: '🍿',
      title: <Trans i18nKey='entities.empty.title' />,
      subtitle: <Trans i18nKey='pages.calendar.empty' />,
    },
    props: ({ entity, ...props }) => ({
      focus: 'release_date_full',
    }),
  }),
  withFetchCalendarQuery(),
  controls({ release: PRIMARY_RELEASE_DATE, sort: true, hooks: { onChange: () => scrollToTop() }, useStatistics }),
  withPlacehodersHistoryState(),
  withBody(),
  withBulk(),
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
      badge={(state && !state.hide) ? <Badge role='img' aria-label={state.label} title={state.label} emoji={state.emoji} size='normal' compact={true} sx={reveal} /> : null}
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
  const { t } = useTranslation()

  return (
    <Month
      month={monthOf(controls)}
      days={days}
      ready={ready}
      error={error}
      fallback={fallbackOf(t)}
      label={t('pages.calendar.label')}
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

// A page of the list is a month, cut at the origin: the future reads from it to the end of its month, the past from
// the first of that month to the day before, then both go on a month a page
const pageRange = (origin: string, stream: Stream, page: number) => {
  const start = dateOf(origin)
  const cut = start.getDate() > 1
  const month = new Date(start.getFullYear(), start.getMonth() + (stream === 'future' ? page - 1 : cut ? 1 - page : -page), 1)
  const [first, last] = monthRange(month)

  return {
    month,
    gte: (stream === 'future' && page === 1) ? origin : first,
    lte: (stream === 'past' && cut && page === 1) ? day(new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1)) : last,
  }
}

// The movies of a page go out a day at a time, from the origin outwards, once every movie of the day is summarized.
// The pages keep every movie with its summary, and the refinements judge them as they show, without fetching again.
const withMoviesAgenda = () => (WrappedComponent) => {
  const WithMoviesAgenda = ({ ...props }) => {
    const tmdb = useTMDB()
    const persons = usePersonsMetadataContext() as any
    const context = useContext(ControlsContext)
    const [query, controls] = useControlsState(() => context, ({ uri, ...params }) => ({ ready: true, params }))
    const [today] = useState(() => day(new Date()))
    const [origin, setOrigin] = useState(() => originOf(context?.[0]?.primary_release_date, today))
    const [params, judged] = refinementsOf(query?.params || {})
    const filters = JSON.stringify(params)
    const refinements = useMemo(() => judged, [JSON.stringify(judged)])
    const nobody = !persons.loading && !Object.keys(persons.metadata).length
    const key = (query?.ready && !persons.loading && !nobody) ? `${origin} ${filters}` : null

    const fetchPage = useCallback(async (stream: Stream, page: number, signal: AbortSignal, emit: (items: any[]) => void) => {
      const params = JSON.parse(filters)
      const { month, gte, lte } = pageRange(origin, stream, page)
      const discovered = await discoverCalendar(tmdb, persons.metadata, { ...params, 'primary_release_date.gte': gte, 'primary_release_date.lte': lte }, signal)
      const entities = [...discovered].sort((a, b) => (stream === 'past' ? -1 : 1) * (a.release_date || '').localeCompare(b.release_date || ''))
      let shown = 0

      const summaries = await summarizeCalendar(tmdb, entities, persons.metadata, signal, (summaries) => {
        let judged = 0

        while (judged < entities.length && entities[judged].id in summaries) {
          judged++
        }

        const count = judged === entities.length ? judged : entities.findIndex(({ release_date }) => release_date === entities[judged].release_date)

        if (count > shown) {
          shown = count
          emit(entities.slice(0, count).map(entity => ({ ...entity, summary: summaries[entity.id] })))
        }
      })

      return {
        items: entities.map(entity => ({ ...entity, summary: summaries[entity.id] })),
        shown: refine({ entities, summaries }, refinements).entities,
        done: stream === 'past' ? month <= FIRST : month >= LAST,
      }
    }, [tmdb, persons.metadata, origin, filters, refinements])

    const { streams, more, ready, failure } = useStreams(key, fetchPage, i18n.t('pages.calendar.noun'))
    const days = useMemo(() => {
      if (!ready) {
        return []
      }

      const entities = [...streams.past.items, ...streams.future.items]
      const summaries = Object.fromEntries(entities.map(({ id, summary }) => [id, summary]))
      return withToday(byDay(refine({ entities, summaries }, refinements).entities), today, origin, streams)
    }, [ready, streams, today, origin, refinements])
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

  WithMoviesAgenda.displayName = `withMoviesAgenda(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithMoviesAgenda
}

const UIMoviesAgenda = ({ controls, ...props }) => {
  const render = useRender(Line, controls)
  const { t } = useTranslation()

  return (
    <Agenda
      {...props as any}
      month={monthOf(controls)}
      fallback={fallbackOf(t)}
      empty={{
        emoji: '🍿',
        title: t('pages.calendar.list.empty.title'),
        subtitle: t('pages.calendar.list.empty.subtitle'),
      }}
      noun={t('pages.calendar.noun')}
      label={t('pages.calendar.label')}
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

export const Calendar = withTitle('pages.calendar.title')(UICalendar)

export default Calendar
