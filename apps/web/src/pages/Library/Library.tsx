import { useEffect, useState } from 'react'
import {
  Entities,
  withControls,
  FilterGenres,
  FilterStates,
  FilterReleaseDate,
  FilterPopularity,
  FilterVoteAverage,
  FilterRuntime,
  Sorting,
  Warning,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { fields } from '@sensorr/tmdb'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { MovieWithCredits } from '../../components/Movie/Movie'
import { withTMDB } from '../../store/tmdb'
import { useAPI, query as APIQuery } from '../../store/api'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withHistoryState from '../../components/enhancers/withHistoryState'

const Library = compose(
  withProps({
    id: 'library',
    display: 'grid',
    child: MovieWithCredits,
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
  withFetchQuery(APIQuery.movies.getMovies({}), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.library.title'),
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content min-content', '1fr min-content min-content min-content'],
        gridTemplateRows: 'auto',
        gap: '3em',
        gridTemplateAreas: [
          `"results toggle sort_by"`,
          `"title results toggle sort_by"`,
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
          "state"
          "genres"
          "release_date"
          "popularity"
          "vote_average"
          "runtime"
        `,
      },
    },
    fields: {
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="📚"
              title="Library"
              subtitle={(
                <span>
                  Explore movies from your library with various filters about movies like <strong>state</strong>, <strong>genres</strong>, <strong>release date</strong>, etc...
                  <br/>
                  <br/>
                  <small><em>Complete your library by changing movie <code sx={{ variant: 'code.reset', backgroundColor: 'transparent', marginX: 6, fontStyle: 'normal' }}>🔕 Ignored</code> state from anywhere in Sensorr !</em></small>
                </span>
              )}
            />
          </div>
        ),
      },
      sort_by: {
        initial: {
          value: 'updated_at',
          sort: true,
        },
        serialize: (key, raw) => ({ [key]: `${raw.value}.${{ true: 'desc', false: 'asc' }[raw.sort]}` }),
        component: withProps({
          label: i18n.t('ui.sorting'),
          options: [
            { label: i18n.t('ui.sortings.updated_at'), value: 'updated_at' },
            { label: i18n.t('ui.sortings.popularity'), value: 'popularity' },
            { label: i18n.t('ui.sortings.primary_release_date'), value: 'release_date' },
            { label: i18n.t('ui.sortings.revenue'), value: 'revenue' },
            { label: i18n.t('ui.sortings.vote_average'), value: 'vote_average' },
            { label: i18n.t('ui.sortings.vote_count'), value: 'vote_count' },
          ]
        })(Sorting)
      },
      state: {
        ...fields.state,
        serialize: (key, raw) => raw?.length ? { [key]: raw.filter(value => !['proposal'].includes(value)).join('|'), ...(raw.includes('proposal') ? { 'releases.proposal': true } : {}) } : {},
        component: withProps({
          type: 'movie',
          additionalOptions: [
            {
              emoji: '🛎️',
              label: 'Proposal',
              value: 'proposal',
            },
          ],
        })(FilterStates),
      },
      genres: {
        ...fields.genres,
        initial: { values: [], behavior: 'or' },
        serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : {},
        component: compose(withProps({ display: 'checkbox' }), withTMDB())(FilterGenres),
      },
      release_date: {
        ...fields.release_date,
        component: FilterReleaseDate,
      },
      popularity: {
        ...fields.popularity,
        component: FilterPopularity,
      },
      vote_average: {
        ...fields.vote_average,
        component: FilterVoteAverage,
      },
      runtime: {
        ...fields.runtime,
        component: FilterRuntime,
      },
    },
    useStatistics: () => {
      const api = useAPI()
      const [statistics, setStatistics] = useState({})

      useEffect(() => {
        const cb = async () => {
          const { uri, params, init } = APIQuery.movies.getStatistics({})

          try {
            setStatistics(await api.fetch(uri, params, init))
          } catch (e) {
            console.warn(e)
            setStatistics({})
          }
        }

        cb()
      }, [])

      return statistics
    },
  }),
  withHistoryState(),
)(Entities)

export default Library
