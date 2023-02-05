import {
  Entities,
  Sorting,
  FilterReleaseDate,
  FilterReleaseType,
  FilterGenres,
  FilterCompanies,
  FilterKeywords,
  FilterLanguages,
  FilterCertification,
  FilterRuntime,
  FilterVoteAverage,
  FilterVoteCount,
  withControls,
  Warning,
  Icon,
} from '@sensorr/ui'
import { compose, scrollToTop } from '@sensorr/utils'
import { fields, useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { Trans, useTranslation } from 'react-i18next'
import { MovieWithCredits } from '../../components/Movie/Movie'
import { withTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withHistoryState from '../../components/enhancers/withHistoryState'
import withFetchCalendarQuery from './withFetchCalendarQuery'

export const Calendar = compose(
  withProps({
    display: 'grid',
    child: MovieWithCredits,
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
  withControls({
    title: i18n.t('pages.calendar.title'),
    useStatistics,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content min-content', 'min-content 1fr min-content min-content'],
        gridTemplateRows: 'auto',
        gap: '3em',
        gridTemplateAreas: [
          `"primary_release_date results toggle sort_by"`,
          `"title primary_release_date results toggle sort_by"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head"
          "with_release_type"
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
      },
    },
    components: {
      toggle: ({ toggleOpen, fields, values, ...props }) => {
        const { t } = useTranslation()
        const active = Object.keys(values)
          .filter(key => !['sort_by', 'primary_release_date', 'with_release_type'].includes(key))
          .reduce((acc, key) => acc + (values[key] && (JSON.stringify(values[key]) !== JSON.stringify(fields[key]?.initial) && fields[key]?.serialize) ? 1 : 0), 0)

        return (
          <button
            {...props}
            sx={{
              variant: 'button.reset',
              display: 'flex',
              alignItems: 'center',
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
      },
    },
    fields: {
      // TODO: Should hide entity.popularity === 0
      sort_by: {
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
      },
      primary_release_date: {
        initial: new Date((new Date()).getFullYear(), (new Date()).getMonth(), 2),
        serialize: (key, raw) => ({
          [`${key}.gte`]: new Date(raw.getFullYear(), raw.getMonth(), 2).toISOString().substring(0, 10),
          [`${key}.lte`]: new Date(raw.getFullYear(), raw.getMonth() + 1, 1).toISOString().substring(0, 10),
        }),
        component: withProps({
          display: 'wheel',
          getOptions: (value) => [
            new Date(value.getFullYear(), value.getMonth() - 2, 2),
            new Date(value.getFullYear(), value.getMonth() - 1, 2),
            new Date(value.getFullYear(), value.getMonth(), 2),
            new Date(value.getFullYear(), value.getMonth() + 1, 2),
            new Date(value.getFullYear(), value.getMonth() + 2, 2),
          ],
        })(FilterReleaseDate)
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
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="🗓️"
              title="Calendar"
              subtitle={(
                <span>
                  Explore movies from followed persons in a calendar view, refinable with various filters like <strong>average rating</strong>, <strong>number of votes</strong>, <strong>genres</strong>, <strong>certifications</strong>, etc...
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
        initial: { values: [{ value: 99, label: 'Documentary' }], behavior: 'or' }, // Documentary -- sorry
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
    },
  }),
  withHistoryState(),
)(Entities)

export default Calendar
