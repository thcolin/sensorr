import {
  Sorting,
  FilterGenres,
  FilterCompanies,
  FilterKeywords,
  FilterLanguages,
  FilterReleaseDate,
  FilterRuntime,
  FilterVoteAverage,
  FilterVoteCount,
  withControls,
  Warning,
  Option,
  Checkbox,
  Select,
} from '@sensorr/ui'
import { useEffect, useState } from 'react'
import { compose, countries, emojize, scrollToTop, useHistoryState } from '@sensorr/utils'
import { fields, useFieldsComputedStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { useTMDB, withTMDB } from '../../store/tmdb'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useAPI, query as APIQuery } from '../../store/api'
import { networks } from '../../components/Show/fields'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'

// `discover/tv` takes a status and a type by their index in TMDB's lists
const STATUSES = [
  { value: 0, label: emojize('📡', 'Returning Series') },
  { value: 2, label: emojize('🏗️', 'In Production') },
  { value: 1, label: emojize('📅', 'Planned') },
  { value: 5, label: emojize('🧪', 'Pilot') },
  { value: 3, label: emojize('🏁', 'Ended') },
  { value: 4, label: emojize('🪦', 'Canceled') },
]

const TYPES = [
  { value: 4, label: emojize('🎬', 'Scripted') },
  { value: 2, label: emojize('📕', 'Miniseries') },
  { value: 0, label: emojize('🌍', 'Documentary') },
  { value: 3, label: emojize('🎥', 'Reality') },
  { value: 5, label: emojize('🎙️', 'Talk Show') },
  { value: 1, label: emojize('📰', 'News') },
  { value: 6, label: emojize('📼', 'Video') },
]

const oneOf = (label, options) => ({
  initial: { values: [] },
  serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join('|') } : {},
  component: ({ statistics, ...props }) => (
    <Checkbox
      {...props as any}
      label={label}
      options={options}
      value={props.value.values}
      onChange={values => props.onChange({ ...props.value, values })}
    />
  ),
})

const FilterCountries = ({ value, onChange, statistics, ...props }) => (
  <Select
    label={i18n.t('ui.filters.origin_country')}
    menuPlacement='auto'
    {...props as any}
    options={Object.keys(countries).map(value => ({ value, label: `${countries[value].emoji}  ${countries[value].name}` }))}
    value={value.values}
    onChange={values => onChange({ ...value, values })}
    behavior={value.behavior}
    onBehavior={behavior => onChange({ ...value, behavior })}
    multi={true}
    closeMenuOnSelect={true}
    isSearchable={true}
    isClearable={false}
    defaultOptions={true}
  />
)

// TMDB searches no network by name: the networks to pick from are those of the library, with their id
const useStatistics = (entities, fields) => {
  const api = useAPI()
  const statistics = useFieldsComputedStatistics(entities, fields)
  const [library, setLibrary] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const { uri, params, init } = APIQuery.shows.getStatistics({ init: { signal: controller.signal } })

    api.fetch(uri, params, init)
      .then(({ networks }) => setLibrary(networks))
      .catch((e) => e.name !== 'AbortError' && console.warn(e))

    return () => controller.abort()
  }, [])

  return { ...statistics, with_networks: library }
}

// The filters of the movies Discover that `discover/tv` also takes, people and release types aside, and its own
export const Discover = compose(
  withTitle(i18n.t('pages.shows.discover.title')),
  withProps({
    display: 'grid',
    child: Show,
    extra: FOOTER_HEIGHT,
    useMetadataContext: useShowsMetadataContext,
    props: () => ({ focus: 'vote_average' }),
    empty: {
      emoji: '📺',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>crime</em> shows that first aired in the <em>2000s</em> ?
        </span>
      ),
    },
  }),
  withFetchQuery({
    uri: 'discover/tv',
  }, 1, useTMDB, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.discover.title'),
    useStatistics,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content min-content', '1fr min-content min-content min-content'],
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: [
          `"results hide_library toggle sort_by"`,
          `"title results hide_library toggle sort_by"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head"
          "with_genres"
          "without_genres"
          "with_type"
          "with_status"
          "first_air_date"
          "vote_average"
          "vote_count"
          "with_networks"
          "with_companies"
          "with_keywords"
          "without_keywords"
          "with_original_language"
          "with_origin_country"
          "with_runtime"
        `,
      },
    },
    fields: {
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
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="🌐"
              title="Discover"
              subtitle={(
                <span>
                  Discover shows with various filters like <strong>genres</strong>, <strong>networks</strong>, <strong>type</strong>, <strong>first air date</strong>, etc...
                  <br/>
                  <small><em>Combine filters to discover new shows !</em></small>
                </span>
              )}
            />
          </div>
        ),
      },
      sort_by: {
        initial: {
          value: 'popularity',
          sort: true,
        },
        serialize: (key, raw) => ({ [key]: `${raw.value}.${{ true: 'desc', false: 'asc' }[raw.sort]}` }),
        component: withProps({
          label: i18n.t('ui.sorting'),
          options: [
            { label: i18n.t('ui.sortings.popularity'), value: 'popularity' },
            { label: i18n.t('ui.sortings.first_air_date'), value: 'first_air_date' },
            { label: i18n.t('ui.sortings.name'), value: 'name' },
            { label: i18n.t('ui.sortings.vote_average'), value: 'vote_average' },
            { label: i18n.t('ui.sortings.vote_count'), value: 'vote_count' },
          ]
        })(Sorting)
      },
      with_genres: {
        ...fields.genres,
        statistics: null,
        component: compose(
          withProps({ display: 'select', type: 'tv' }),
          withTMDB()
        )(FilterGenres),
      },
      without_genres: {
        ...fields.genres,
        // Talk and news shows fill the first screen of a popularity sort
        initial: { values: [{ value: 10767, label: 'Talk' }, { value: 10763, label: 'News' }], behavior: 'or' },
        statistics: null,
        component: compose(
          withProps({
            display: 'select',
            type: 'tv',
            label: <span>{i18n.t('ui.filters.genres')} <small>({i18n.t('without')})</small></span>,
          }),
          withTMDB()
        )(FilterGenres),
      },
      first_air_date: {
        ...fields.release_date,
        statistics: (entities, field) => fields.release_date.statistics(entities.map(entity => ({ release_date: entity.first_air_date })), field),
        component: withProps({ label: i18n.t('ui.sortings.first_air_date') })(FilterReleaseDate),
      },
      vote_average: {
        ...fields.vote_average,
        component: FilterVoteAverage,
      },
      vote_count: {
        ...fields.vote_count,
        initial: [0, 15000],
        component: FilterVoteCount,
      },
      with_runtime: {
        ...fields.episode_runtime,
        statistics: null,
        component: withProps({ field: 'episode_runtime', label: i18n.t('ui.filters.episode_runtime') })(FilterRuntime),
      },
      with_type: oneOf(i18n.t('ui.filters.type'), TYPES),
      with_status: oneOf(i18n.t('ui.filters.status'), STATUSES),
      with_networks: networks,
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
      with_origin_country: {
        ...fields.original_language,
        component: FilterCountries,
        props: { menuPlacement: 'top' },
      },
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(EntitiesHideable)

export default Discover
