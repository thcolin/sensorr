import { withControls, Option } from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import Show from '../../components/Show/Show'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'

export const Trending = (resource) => compose(
  withTitle(resource === 'shows' ? i18n.t('pages.shows.trending.title') : `${i18n.t({ movies: 'pages.trending.movies.title', persons: 'pages.trending.persons.title' }[resource])} ${resource}`),
  withProps({
    id: 'trending',
    display: 'grid',
    child: { movies: MovieWithCreditsAndReviews, persons: Person, shows: Show }[resource],
    useMetadataContext: { shows: useShowsMetadataContext }[resource],
    empty: {
      movies: {
        emoji: '🍿',
        title: "Oh no, your request didn't return results",
        subtitle: (
          <span>
            Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
          </span>
        ),
      },
      persons: {
        emoji: '⭐️',
        title: "Oh no, your request didn't return results",
        subtitle: (
          <span>
            Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
          </span>
        ),
      },
      shows: {
        emoji: '📺',
        title: "Oh no, your request didn't return results",
        subtitle: 'themoviedb.org lists no trending show today, try again later',
      },
    }[resource],
    props: { movies: () => ({ focus: 'vote_average' }), persons: () => ({ focus: 'popularity' }), shows: () => ({ focus: 'vote_average' }) }[resource],
  }),
  withFetchQuery({ uri: { movies: 'trending/movie/day', persons: 'trending/person/day', shows: 'trending/tv/day' }[resource] }, 1, useTMDB, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t({ movies: 'pages.trending.movies.title', persons: 'pages.trending.persons.title', shows: 'pages.trending.shows.title' }[resource]),
    useStatistics,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateColumns: ['1fr', '1fr min-content'],
        gridTemplateAreas: [
          `"results hide_library"`,
          `"title results hide_library"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
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
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(EntitiesHideable)

export default Trending
