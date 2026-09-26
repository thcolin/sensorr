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
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { status, statusGroupOf } from '../../components/Show/fields'
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

const code = { variant: 'code.reset', backgroundColor: 'transparent', marginX: 6, fontStyle: 'normal' }

const Head = ({ children }) => (
  <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
    <Warning emoji="🍻" title="Requests" subtitle={children} />
  </div>
)

const requested_by = {
  initial: { values: [], behavior: 'or' },
  serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : { [`${key}.gte`]: 1 },
  component: withProps({ label: 'ui.filters.requested_by' })(FilterStatistics),
}

const layout = (aside: string[]) => ({
  nav: {
    display: 'grid' as const,
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
    display: 'grid' as const,
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: 'auto',
    gap: '2em',
    gridTemplateAreas: aside.map(area => `"${area}"`).join(' '),
  },
})

const components = {
  toggle: withProps({
    translateKey: 'ui.controls.more',
  })(ControlsToggleButton),
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
    layout: layout(['head', 'requested_by', 'genres', 'release_date', 'popularity', 'vote_average', 'runtime']),
    components,
    fields: {
      head: {
        initial: null,
        component: () => (
          <Head>
            <span>
              Explore your guests requested movies
              <br/>
              <br/>
              <small><em>Change each requested movie state to <code sx={code}>🍿 Wished</code> if you want to accept it, or <code sx={code}>🔕 Ignored</code> if you want to refuse it</em></small>
            </span>
          </Head>
        ),
      },
      sort_by: {
        initial: {
          value: 'requested_at',
          sort: true,
        },
        serialize: (key, raw) => ({ [key]: `${raw.value}.${{ true: 'desc', false: 'asc' }[raw.sort]}` }),
        component: withProps({
          label: i18n.t('ui.sorting'),
          options: [
            { label: i18n.t('ui.sortings.requested_at'), value: 'requested_at' },
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
      requested_by,
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
)(Entities)

export default Requests

const SHOWS_UNFULFILLED = 'ignored'
const SHOWS_ALL = 'ignored|wished|archived'

const countsOf = (values) => Object.entries(values.reduce((acc, value) => ({ ...acc, [value]: (acc[value] || 0) + 1 }), {}))
  .map(([_id, count]) => ({ _id, count }))

// Every requested show comes in one page, so the one followed from its badge leaves the unfulfilled grid at once
const withUnfulfilledShows = () => (WrappedComponent) => {
  const withUnfulfilledShows = ({ entities, length, onMore, ...props }: any) => {
    const { loading, metadata } = useShowsMetadataContext() as any
    const unfulfilled = (props.controls?.values?.state ?? SHOWS_UNFULFILLED) === SHOWS_UNFULFILLED
    const listed = useMemo(() => Object.values(entities || {}).filter((show: any) => loading || !unfulfilled || metadata[show.id]?.state === 'ignored'), [entities, loading, unfulfilled, metadata])

    return <WrappedComponent {...props} entities={listed} length={props.ready ? listed.length : length} />
  }

  return withUnfulfilledShows
}

export const ShowsRequests = compose(
  withTitle(i18n.t('pages.shows.requests.title')),
  withProps({
    id: 'shows-requests',
    display: 'grid',
    child: Show,
    extra: FOOTER_HEIGHT,
    empty: {
      emoji: '🍻',
      title: 'No requests found',
      subtitle: (
        <span>
          Expand your search criteria or invite some more guests to sync their Plex Watchlist with your Sensorr !
        </span>
      ),
    },
  }),
  withFetchQuery(APIQuery.shows.getShows({ params: { limit: '', progress: 'true' } }), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withUnfulfilledShows(),
  withControls({
    title: i18n.t('pages.requests.title'),
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: layout(['head', 'status', 'requested_by']),
    components,
    fields: {
      head: {
        initial: null,
        component: () => (
          <Head>
            <span>
              Explore your guests requested shows
              <br/>
              <br/>
              <small><em>Change a requested show to <code sx={code}>📺 Followed</code> to add it to your library</em></small>
            </span>
          </Head>
        ),
      },
      sort_by: {
        initial: {
          value: 'requested_at',
          sort: true,
        },
        serialize: (key, raw) => ({ [key]: `${raw.value}.${{ true: 'desc', false: 'asc' }[raw.sort]}` }),
        component: withProps({
          label: i18n.t('ui.sorting'),
          options: [
            { label: i18n.t('ui.sortings.requested_at'), value: 'requested_at' },
            { label: i18n.t('ui.sortings.refreshed_at'), value: 'refreshed_at' },
            { label: i18n.t('ui.sortings.popularity'), value: 'popularity' },
            { label: i18n.t('ui.sortings.first_air_date'), value: 'first_air_date' },
            { label: i18n.t('ui.sortings.vote_average'), value: 'vote_average' },
            { label: i18n.t('ui.sortings.vote_count'), value: 'vote_count' },
            { label: i18n.t('ui.sortings.name'), value: 'name', sort: false },
          ]
        })(Sorting)
      },
      // "Unfulfilled" is a show not added yet
      state: {
        initial: SHOWS_UNFULFILLED,
        hideFromFiltersCount: true,
        serialize: (key, raw) => ({ [key]: raw }),
        component: ({ ...props }) => (
          <Option
            id='unfulfilled'
            type='checkbox'
            checked={props.value === SHOWS_UNFULFILLED}
            onChange={(e: any) => props.onChange(e.target.checked ? SHOWS_UNFULFILLED : SHOWS_ALL)}
          >
            Unfulfilled
          </Option>
        ),
      },
      status,
      requested_by,
    },
    useStatistics: () => {
      const api = useAPI()
      const [statistics, setStatistics] = useState({})

      useEffect(() => {
        const controller = new AbortController()
        const { uri, params, init } = APIQuery.shows.getShows({ params: { state: SHOWS_ALL, 'requested_by.gte': 1, fields: 'id|status|requested_by', limit: '' }, init: { signal: controller.signal } })

        api.fetch(uri, params, init)
          .then(({ results }) => setStatistics({
            status: countsOf(results.map(show => statusGroupOf(show.status)).filter(Boolean)),
            requested_by: countsOf(results.flatMap(show => show.requested_by || [])),
          }))
          .catch((e) => {
            if (e.name !== 'AbortError') {
              console.warn(e)
              setStatistics({})
            }
          })

        return () => controller.abort()
      }, [])

      return statistics
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(Entities)
