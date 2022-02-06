import {
  Entities,
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
} from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { fields, useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { MovieWithCreditsDelayed } from '../../components/Movie/Movie'
import tmdb, { withTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withHistoryState from '../../components/enhancers/withHistoryState'

export const Discover = compose(
  withProps({
    display: 'grid',
    child: MovieWithCreditsDelayed, // TODO: Should improve
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
  }, 1, tmdb, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.discover.title'),
    useStatistics,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr 0fr 0fr', '1fr 0fr 0fr 0fr'],
        gridTemplateRows: 'auto',
        gap: '3em',
        gridTemplateAreas: [
          `"results toggle sort_by"`,
          `"title results toggle sort_by"`,
        ],
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: '1fr',
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
    fields: {
      // hide_library: {
      //   // TODO: entity.state will not exist atm, how to handle it ?
      // },
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
    },
  }),
  withHistoryState(100000),
)(Entities)

export default Discover
