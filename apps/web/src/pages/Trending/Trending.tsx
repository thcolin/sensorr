import { useMemo } from 'react'
import { Entities, withControls, Option } from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'

const EntitiesHideable = ({ controls, child: Child, ...props }) => {
  const HideableChild = useMemo(() => (props) => {
    const { loading, metadata: { [props.entity?.id]: metadata = null } } = useMoviesMetadataContext() as any

    return (
      <Child
        {...props}
        opacity={(!loading && controls.values.hide_library && metadata && metadata?.state !== 'ignored') ? 0.125 : 1}
      />
    )
  }, [controls.values.hide_library, Child])

  return (
    <Entities {...props as any} child={HideableChild} />
  )
}

export const Trending = (resource) => compose(
  withProps({
    id: 'trending',
    display: 'grid',
    child: { movies: MovieWithCreditsAndReviews, persons: Person }[resource],
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
    }[resource],
    props: { movies: () => ({ focus: 'vote_average' }), persons: () => ({ focus: 'popularity' }) }[resource],
  }),
  withFetchQuery({ uri: { movies: 'trending/movie/day', persons: 'trending/person/day' }[resource] }, 1, useTMDB, () => [
    ...useHistoryState('controls', { uri: '', params: {} }),
    ['hide_library']
  ] as any),
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
        serialize: (key, raw) => ({ [key]: raw }),
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
)(EntitiesHideable)

export default Trending
