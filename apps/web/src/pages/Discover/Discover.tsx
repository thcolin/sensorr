import {
  Sorting,
  FilterPeople,
  FilterCrew,
  FilterCast,
  FilterGenres,
  FilterCompanies,
  FilterKeywords,
  FilterLanguages,
  FilterReleaseType,
  FilterCertification,
  FilterReleaseDate,
  FilterRuntime,
  FilterVoteAverage,
  FilterVoteCount,
  withControls,
  Warning,
  Option,
} from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { fields, utils, useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useTMDB, withTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'

// The fields of the filters panel, a saved list serializes its values with them
export const FIELDS = {
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
              Discover movies with various filters about movies like <strong>average rating</strong>, <strong>number of votes</strong>, <strong>genres</strong>, <strong>certifications</strong>, etc...
              <br/>
              <small><em>Combine filters to discover new movies !</em></small>
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
        { label: i18n.t('ui.sortings.primary_release_date'), value: 'primary_release_date' },
        { label: i18n.t('ui.sortings.revenue'), value: 'revenue' },
        { label: i18n.t('ui.sortings.vote_average'), value: 'vote_average' },
        { label: i18n.t('ui.sortings.vote_count'), value: 'vote_count' },
      ]
    })(Sorting)
  },
  with_people: {
    ...fields.people,
    component: withTMDB()(FilterPeople),
  },
  with_crew: {
    ...fields.crew,
    component: withTMDB()(FilterCrew),
  },
  with_cast: {
    ...fields.cast,
    component: withTMDB()(FilterCast),
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
    statistics: null,
    component: compose(
      withProps({
        display: 'select',
        label: <span>{i18n.t('ui.filters.genres')} <small>({i18n.t('without')})</small></span>,
      }),
      withTMDB()
    )(FilterGenres),
  },
  primary_release_date: {
    ...fields.release_date,
    component: FilterReleaseDate,
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
  hide_unknown: {
    initial: true,
    serialize: () => ({}),
    filter: true,
    component: ({ value, onChange, style }) => (
      <div style={style}>
        <Option
          id='hide_unknown'
          type='checkbox'
          checked={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        >
          <span sx={{ fontWeight: 'semibold' }}>{i18n.t('ui.filters.unknown')}</span>
          <small sx={{ marginLeft: 10 }}><code>({i18n.t('ui.filters.unknownRule')})</code></small>
        </Option>
      </div>
    ),
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
    // Not `eroticism` nor `sex comedy`, which also tag movies with an audience
    initial: {
      values: [
        { value: 155477, label: 'softcore' },
        { value: 159551, label: 'pink film' },
        { value: 10053, label: 'sexploitation' },
        { value: 195222, label: 'nunsploitation' },
        { value: 445, label: 'pornography' },
        { value: 5593, label: 'pornographic video' },
        { value: 238355, label: 'gay pornography' },
        { value: 195997, label: 'adult filmmaking' },
        { value: 198385, label: 'hentai' },
        { value: 190370, label: 'erotic movie' },
        { value: 343572, label: 'erotic film' },
      ],
      behavior: 'or',
    },
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
  },
  with_release_type: {
    ...fields.release_type,
    component: FilterReleaseType,
    props: { menuPlacement: 'top' },
  },
  certification: {
    ...fields.certification,
    component: FilterCertification,
    props: { menuPlacement: 'top' },
  },
}

export const Discover = compose(
  withTitle(i18n.t('pages.discover.title')),
  withProps({
    display: 'grid',
    child: MovieWithCreditsAndReviews,
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  }),
  withFetchQuery({
    uri: 'discover/movie',
    filters: {
      hide_unknown: (value) => value ? (movie) => !utils.isUnknown(movie) : null,
    },
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
          "with_people"
          "with_crew"
          "with_cast"
          "with_genres"
          "without_genres"
          "primary_release_date"
          "vote_average"
          "vote_count"
          "hide_unknown"
          "with_companies"
          "with_keywords"
          "without_keywords"
          "with_original_language"
          "with_runtime"
          "with_release_type"
          "certification"
        `,
      },
    },
    fields: FIELDS,
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(EntitiesHideable)

export default Discover
