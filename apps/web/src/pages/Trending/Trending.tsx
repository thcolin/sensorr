import { Entities, withControls } from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { MovieWithCredits } from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withHistoryState from '../../components/enhancers/withHistoryState'

export const Trending = (resource) => compose(
  withProps({
    id: 'trending',
    display: 'grid',
    child: { movies: MovieWithCredits, persons: Person }[resource],
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
        emoji: '🧑‍🎤️',
        title: "Oh no, your request didn't return results",
        subtitle: (
          <span>
            Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
          </span>
        ),
      },
    }[resource],
    props: { movies: () => ({ focus: 'vote_average' }), persons: () => ({ focus: 'popularity' }) }[resource],
  }),
  withFetchQuery({ uri: { movies: 'trending/movie/day', persons: 'trending/person/day' }[resource] }, 1, useTMDB, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t({ movies: 'pages.trending.movies.title', persons: 'pages.trending.persons.title' }[resource]),
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
          `"results"`,
          `"title results"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
    },
    fields: {},
  }),
  withHistoryState(),
)(Entities)

export default Trending
