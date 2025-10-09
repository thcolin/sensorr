import { useCallback, useEffect, useMemo, useState } from 'react'
import nanobounce from 'nanobounce'
import { Entities, withControls } from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'

export const Search = (resource) => compose(
  withProps({
    id: 'search',
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
  }),
  withFetchQuery({ uri: { movies: 'search/movie', persons: 'search/person' }[resource] }, 1, useTMDB, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.search.title'),
    useStatistics,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateColumns: ['1fr min-content', 'min-content 1fr min-content'],
        gridTemplateAreas: [
          `"query results"`,
          `"title query results"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
    },
    fields: {
      query: {
        initial: '',
        serialize: (key, raw) => ({ [key]: raw }),
        component: ({ value = '', onChange, style, ...props }) => {
          const debounce = useMemo(() => nanobounce(400), [])
          const [temp, setTemp] = useState(value)

          useEffect(() => {
            setTemp(value)
          }, [value])

          return (
            <div sx={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                type='text'
                value={temp}
                onChange={(e) => {
                  const value = e.target.value

                  setTemp(value)
                  debounce(() => onChange(value))
                }}
                sx={{
                  variant: 'input.reset',
                  height: '100%',
                  width: '100%',
                  marginX: [12, 4],
                  maxWidth: '60rem',
                  fontSize: 4,
                  textAlign: 'center',
                  backgroundColor: 'accent',
                }}
              />
            </div>
          )
        },
      },
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(Entities)

export default Search
