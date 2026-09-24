import { useEffect, useMemo, useState } from 'react'
import {
  Entities,
  withControls,
  FilterGenres,
  FilterStatistics,
  FilterReleaseDate,
  FilterPopularity,
  FilterVoteAverage,
  FilterRuntime,
  Sorting,
  Warning,
  Option,
  ControlsToggleButton,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { fields } from '@sensorr/tmdb'
import { compose, emojize, scrollToTop, useHistoryState } from '@sensorr/utils'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show from '../../components/Show/Show'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { withTMDB } from '../../store/tmdb'
import { useAPI, query as APIQuery } from '../../store/api'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'

const Movie = ({ ...props }) => (
  <MovieWithCreditsAndReviews {...props as any} />
)

const UNFULFILLED = 'pinned|missing|ignored'

// A requested show arrives outside the library, `ignored`: following it from its poster adds it, as from its page.
// It follows the guests and "Unfulfilled" filters, the others are movie fields.
const RequestsEntities = ({ controls, ...props }) => {
  const api = useAPI()
  const { loading, metadata } = useShowsMetadataContext() as any
  const [shows, setShows] = useState(null)
  const [error, setError] = useState(null)
  const unfulfilled = (controls?.values?.state ?? UNFULFILLED) === UNFULFILLED
  const guests = controls?.values?.requested_by
  const params = useMemo(() => ({
    state: unfulfilled ? 'ignored' : 'ignored|wished|archived',
    ...(guests?.values?.length ? { requested_by: guests.values.join({ or: '|', and: ',' }[guests.behavior]) } : { 'requested_by.gte': 1 }),
  }), [unfulfilled, JSON.stringify(guests)])

  useEffect(() => {
    const controller = new AbortController()
    const { uri, params: query, init } = APIQuery.shows.getShows({ params, init: { signal: controller.signal } })

    setShows(null)
    setError(null)
    api.fetch(uri, { ...query, limit: '' }, init)
      .then(({ results }) => setShows(results))
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.warn(e)
          setError(e)
        }
      })

    return () => controller.abort()
  }, [params])

  // Followed or removed since the listing, a show leaves the unfulfilled ones at once
  const listed = useMemo(() => (shows || []).filter(show => loading || !unfulfilled || metadata[show.id]?.state === 'ignored'), [shows, loading, unfulfilled, metadata])

  return (
    <>
      {(!!shows || !!error) && (
        <Entities
          id='requests-shows'
          entities={listed}
          length={listed.length}
          error={error}
          label={emojize('📺', 'Shows')}
          display='row'
          hide={!error}
          empty={{ emoji: '📺', title: 'No show requests', subtitle: 'Your guests have not asked for a show yet' }}
          child={Show as any}
        />
      )}
      <Entities {...props as any} controls={controls} {...((listed.length || error) ? { label: emojize('🎞️', 'Movies') } : {})} />
    </>
  )
}

const Requests = compose(
  withTitle(i18n.t('pages.requests.title')),
  withProps({
    id: 'requests',
    display: 'grid',
    child: Movie,
    empty: {
      emoji: '🍻',
      title: "No requests found",
      subtitle: (
        <span>
          Expand your search criteria or invite some more guests to sync their Plex Watchlist with your Sensorr !
        </span>
      ),
    },
  }),
  withFetchQuery(APIQuery.movies.getMovies({}), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.requests.title'),
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content min-content min-content', '1fr min-content min-content min-content min-content'],
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: [
          `"results state toggle sort_by"`,
          `"title results state toggle sort_by"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head"
          "requested_by"
          "genres"
          "release_date"
          "popularity"
          "vote_average"
          "runtime"
        `,
      },
    },
    components: {
      toggle: withProps({
        translateKey: 'ui.controls.more',
      })(ControlsToggleButton),
    },
    fields: {
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="🍻"
              title="Requests"
              subtitle={(
                <span>
                  Explore your guests requested movies and shows
                  <br/>
                  <br/>
                  <small><em>Change each requested movie state to <code sx={{ variant: 'code.reset', backgroundColor: 'transparent', marginX: 6, fontStyle: 'normal' }}>🍿 Wished</code> if you want to accept it, or <code sx={{ variant: 'code.reset', backgroundColor: 'transparent', marginX: 6, fontStyle: 'normal' }}>🔕 Ignored</code> if you want to refuse it</em></small>
                  <br/>
                  <small><em>Change a requested show to <code sx={{ variant: 'code.reset', backgroundColor: 'transparent', marginX: 6, fontStyle: 'normal' }}>🔔 Followed</code> to add it to your library</em></small>
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
        initial: 'pinned|missing|ignored',
        hideFromFiltersCount: true,
        serialize: (key, raw) => ({ [key]: raw }),
        component: ({ ...props }) => (
          <Option
            id='unfulfilled'
            type='checkbox'
            checked={props.value === 'pinned|missing|ignored'}
            onChange={(e: any) => props.onChange(e.target.checked ? 'pinned|missing|ignored' : 'archived|wished|pinned|missing|ignored')}
          >
            Unfulfilled
          </Option>
        ),
      },
      requested_by: {
        initial: { values: [], behavior: 'or' },
        serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : { [`${key}.gte`]: 1 },
        component: withProps({ label: 'ui.filters.requested_by' })(FilterStatistics),
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
          const { uri, params, init } = APIQuery.movies.getStatistics({ params: { context: 'requests' } })

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
  withPlacehodersHistoryState(),
  withBody(),
)(RequestsEntities)

export default Requests
