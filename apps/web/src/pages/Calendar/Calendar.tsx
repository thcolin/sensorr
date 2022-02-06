import {
  Entities,
  FilterReleaseDate,
  Sorting,
  withControls,
} from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import i18n from '@sensorr/i18n'
import { MovieWithCredits } from '../../components/Movie/Movie'
import tmdb from '../../store/tmdb'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withHistoryState from '../../components/enhancers/withHistoryState'

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
  (WrappedComponent) => (props) => {
    const { metadata: persons, loading } = usePersonsMetadataContext() as any

    return (
      <WrappedComponent
        {...props}
        ready={!loading && (props.ready !== false)}
        error={(!loading && !Object.keys(persons).length) ? {
          emoji: '🧑‍🎤',
          title: "Try to follow some people first",
          subtitle: "Calendar is based on people you follow, check trending stars or look at casting from your favorite movies",
        } : null}
        query={{
          ...(loading ? {} : {
            params: {
              with_people: Object.keys(persons).join('|'),
            },
          }),
        }}
      />
    )
  },
  withFetchQuery({
    uri: 'discover/movie',
    params: {
      include_video: false,
      with_release_type: '3|2|1',
      without_genres: '99', // Documentary -- sorry
    },
  }, 1, tmdb, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.calendar.title'),
    hooks: {
      onChange: () => scrollToTop(),
    },
    useStatistics: () => ({}),
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr 0fr 0fr', '0fr 1fr 0fr 0fr'],
        gridTemplateRows: 'auto',
        gap: '3em',
        gridTemplateAreas: [
          `"primary_release_date results sort_by"`,
          `"title primary_release_date results sort_by"`,
        ],
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
            { label: i18n.t('ui.sortings.revenue'), value: 'revenue' },
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
    },
  }),
  withHistoryState(),
)(Entities)

export default Calendar
