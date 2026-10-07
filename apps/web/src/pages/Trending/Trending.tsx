import { withControls, Option } from '@sensorr/ui'
import { compose, scrollToTop } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { Trans } from 'react-i18next'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery, { useControlsHistoryState } from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'
import withBulk from '../../components/enhancers/withBulk'

export const Trending = (resource) => compose(
  withTitle(resource === 'shows' ? 'pages.shows.trending.title' : { movies: 'pages.trending.movies.document', persons: 'pages.trending.persons.document' }[resource]),
  withProps({
    id: 'trending',
    display: 'grid',
    child: { movies: MovieWithCreditsAndReviews, persons: Person, shows: Show }[resource],
    bulk: { movies: 'movie', shows: 'tv' }[resource] || null,
    extra: { shows: FOOTER_HEIGHT }[resource],
    useMetadataContext: { shows: useShowsMetadataContext }[resource],
    empty: {
      movies: {
        emoji: '🍿',
        title: <Trans i18nKey='entities.empty.title' />,
        subtitle: (
          <span>
            <Trans i18nKey='entities.movies.empty.subtitle' components={[<em />, <em />, <em />]} />
          </span>
        ),
      },
      persons: {
        emoji: '⭐️',
        title: <Trans i18nKey='entities.empty.title' />,
        subtitle: (
          <span>
            <Trans i18nKey='entities.movies.empty.subtitle' components={[<em />, <em />, <em />]} />
          </span>
        ),
      },
      shows: {
        emoji: '📺',
        title: <Trans i18nKey='entities.empty.title' />,
        subtitle: <Trans i18nKey='pages.trending.shows.empty' />,
      },
    }[resource],
    props: { movies: () => ({ focus: 'vote_average' }), persons: () => ({ focus: 'popularity' }), shows: () => ({ focus: 'vote_average' }) }[resource],
  }),
  withFetchQuery({ uri: { movies: 'trending/movie/day', persons: 'trending/person/day', shows: 'trending/tv/day' }[resource] }, 1, useTMDB, useControlsHistoryState),
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
              <Trans i18nKey='pages.hideLibrary' />
            </Option>
          </div>
        ),
      },
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
  withBulk(),
)(EntitiesHideable)

export default Trending
