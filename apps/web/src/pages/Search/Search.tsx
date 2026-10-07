import { useCallback, useEffect, useMemo, useState } from 'react'
import nanobounce from 'nanobounce'
import { Entities, withControls } from '@sensorr/ui'
import { compose, scrollToTop } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { Trans } from 'react-i18next'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Person from '../../components/Person/Person'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery, { useControlsHistoryState } from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import withBulk from '../../components/enhancers/withBulk'

export const Search = (resource) => compose(
  withTitle(resource === 'shows' ? 'pages.shows.search.title' : { movies: 'pages.search.movies', persons: 'pages.search.persons' }[resource]),
  withProps({
    id: 'search',
    display: 'grid',
    child: { movies: MovieWithCreditsAndReviews, persons: Person, shows: Show }[resource],
    bulk: { movies: 'movie', shows: 'tv' }[resource] || null,
    extra: { shows: FOOTER_HEIGHT }[resource],
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
        subtitle: (
          <span>
            <Trans i18nKey='pages.search.empty.shows' components={[<em />]} />
          </span>
        ),
      },
    }[resource],
  }),
  withFetchQuery({ uri: { movies: 'search/movie', persons: 'search/person', shows: 'search/tv' }[resource] }, 1, useTMDB, useControlsHistoryState),
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
        component: function QueryField({ value = '', onChange, style, ...props }) {
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
  withBulk(),
)(Entities)

export default Search
