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
} from '@sensorr/ui'
import { compose, emojize, scrollToTop, useHistoryState } from '@sensorr/utils'
import { fields, useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import Show from '../../components/Show/Show'
import { useTMDB, withTMDB } from '../../store/tmdb'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'

// The filters of the movies Discover that `discover/tv` also takes, people and release types aside
export const Discover = compose(
  withTitle('Discover shows'),
  withProps({
    display: 'grid',
    child: Show,
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
          "first_air_date"
          "vote_average"
          "vote_count"
          "with_companies"
          "with_keywords"
          "without_keywords"
          "with_original_language"
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
                  Discover shows with various filters like <strong>average rating</strong>, <strong>number of votes</strong>, <strong>genres</strong>, <strong>first air date</strong>, etc...
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
        component: withProps({ label: emojize('📅', 'First Air Date') })(FilterReleaseDate),
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
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(EntitiesHideable)

export default Discover
