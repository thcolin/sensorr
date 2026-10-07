import { useEffect, useMemo, useState } from 'react'
import {
  Entities,
  withControls,
  withControlsArgs,
  FilterGenres,
  FilterStatistics,
  FilterStates,
  FilterReleaseDate,
  FilterPopularity,
  FilterVoteAverage,
  FilterVoteCount,
  FilterRuntime,
  Sorting,
  Warning,
  FilterBudget,
  FilterProposal,
  Option,
  Bulk,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { Trans } from 'react-i18next'
import { fields } from '@sensorr/tmdb'
import { compose, languages, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useLocation } from 'react-router-dom'
import { withTMDB } from '../../store/tmdb'
import { useAPI, query as APIQuery } from '../../store/api'
import { useSensorr } from '../../store/sensorr'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { useBulkContext } from '../../contexts/Bulk/Bulk'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { RELEASES_AREAS, ReleasesToggle, releasesFields } from '../../components/Sensorr/Controls/Releases'
import { untouched } from '../../components/Sensorr/Controls/serialize'
import { withBody } from '../../layout/withLayout'
import { saveAsListOf } from '../../components/Lists/SaveAsList'
import { FilterLists } from '../../components/Lists/FilterLists'
import { useListsAction } from '../../components/Lists/useCustomLists'
import { MOVIE_STATES, withSelection } from '../../components/enhancers/withBulk'

const SLICE = 50

const MovieWithCreditsAndReviewsAndBulk = withSelection(MovieWithCreditsAndReviews)

// The fields of the filters panel, a saved list serializes its values with them
export const FIELDS = {
  head_main: {
    initial: null,
    component: ({ ...props }) => (
      <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 }, gridArea: 'head_main' }}>
        <Warning
          emoji="📚"
          title={<Trans i18nKey='pages.library.title' />}
          subtitle={(
            <span>
              <Trans i18nKey='pages.library.head' components={[<strong />, <strong />, <strong />]} />
              <br/>
              <br/>
              <small><em><Trans i18nKey='pages.library.hint' components={[<code sx={{ variant: 'code.reset', backgroundColor: 'transparent', marginX: 6, fontStyle: 'normal' }} />]} /></em></small>
            </span>
          )}
        />
      </div>
    ),
  },
  // TODO: enhance, don't use a specific context, use fields system and give Child correct props (will save values inside route state)
  bulk: {
    initial: null,
    component: function BulkField({ total, statistics, ...props }) {
      const { setMovieMetadata } = useMoviesMetadataContext() as any
      const { selection, setSelection } = useBulkContext()
      const sensorr = useSensorr()
      const location = useLocation()
      const [sending, setSending] = useState(false)
      // `bulk` lists every id matching the filters, and arrives with the statistics, after the movies.
      const entities = statistics?.[0]?.entities
      const visible = useMemo(() => entities ? new Set(entities) : null, [entities])
      // A filter that hides a checked movie takes it out of the selection it acts on, and
      // nothing is acted on until the ids of the current filters are known.
      const selected = useMemo(() => visible ? (selection[location.key] || []).filter(id => visible.has(id)) : [], [selection, location.key, visible])

      // The metadata context already tells a failure in its toast.
      // Without a question, the action asked already
      const apply = async (key, value, question) => {
        if (question && !window.confirm(question)) {
          return
        }

        setSending(true)

        // Accepting a proposal downloads its release before the API writes: in slices, as Swaps does.
        const size = key === 'proposal' ? SLICE : selected.length

        for (let index = 0; index < selected.length; index += size) {
          await setMovieMetadata(selected.slice(index, index + size), key, value).catch(() => null)
        }

        setSending(false)
      }

      const lists = useListsAction('movie', apply, i18n.t('enhancers.bulk.movies', { count: selected.length }))

      return (
        <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '8em', fontVariantNumeric: 'tabular-nums' }}>
          <Option
            id='movies'
            type='checkbox'
            checked={selected.length !== 0}
            disabled={!entities && selected.length === 0}
            onChange={() => setSelection(selection => ({ ...selection, [location.key]: selected.length === 0 ? (entities || []) : [] }))}
          >
            {selected.length === 0 ? i18n.t('pages.library.selectAll') : i18n.t('pages.library.selected', { count: selected.length })}
          </Option>
          <Bulk
            count={selected.length}
            disabled={sending}
            actions={[
              {
                key: 'state',
                icon: '📚',
                label: i18n.t('enhancers.bulk.state'),
                options: MOVIE_STATES,
                onChange: ({ value, label }) => apply('state', value, i18n.t('enhancers.bulk.confirm', { selection: i18n.t('enhancers.bulk.movies', { count: selected.length }), state: label })),
              },
              {
                key: 'proposal',
                icon: '🛎️',
                label: i18n.t('state.proposal'),
                options: [
                  { value: true, label: i18n.t('pages.library.bulk.accept') },
                  { value: false, label: i18n.t('pages.library.bulk.refuse') },
                ],
                onChange: ({ value }) => apply('proposal', value, i18n.t('pages.library.bulk.confirmProposal', { accept: String(value), count: selected.length })),
              },
              {
                key: 'policy',
                icon: '🚨',
                label: i18n.t('pages.library.bulk.policy'),
                options: sensorr.policies.map(policy => ({ value: policy.name, label: policy.name })),
                onChange: ({ value }) => apply('policy', value, i18n.t('pages.library.bulk.confirmPolicy', { selection: i18n.t('enhancers.bulk.movies', { count: selected.length }), policy: value })),
              },
              ...['refine', 'shrink'].map(job => ({
                key: job,
                icon: { refine: '✨', shrink: '✂️' }[job],
                label: { refine: 'Refine', shrink: 'Shrink' }[job],
                options: [
                  { value: true, label: i18n.t('pages.library.bulk.enable') },
                  { value: false, label: i18n.t('pages.library.bulk.disable') },
                ],
                onChange: ({ value }) => apply(job, value, i18n.t('pages.library.bulk.confirmJob', { enable: String(value), job: { refine: 'Refine', shrink: 'Shrink' }[job], selection: i18n.t('enhancers.bulk.movies', { count: selected.length }) })),
              })),
              lists,
            ]}
          />
        </div>
      )
    }
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
        { label: i18n.t('ui.sortings.budget'), value: 'budget' },
      ]
    })(Sorting)
  },
  state: {
    ...fields.state,
    serialize: (key, raw) => raw?.length ? { [key]: raw.filter(value => !['proposal'].includes(value)).join('|') } : {},
    component: withProps({ type: 'movie' })(FilterStates),
  },
  policy: {
    initial: { values: [] },
    serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join('|') } : {},
    component: withProps({ label: 'ui.filters.policy' })(FilterStatistics),
  },
  proposal: {
    initial: { values: [] },
    serialize: (key, raw) => (!raw?.values?.length || raw?.values?.length === 2) ? {} : { 'releases.proposal': raw?.values[0] },
    component: FilterProposal,
  },
  requested_by: {
    initial: { values: [], behavior: 'or' },
    serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : {},
    component: withProps({ label: 'ui.filters.requested_by' })(FilterStatistics),
  },
  lists: {
    initial: { values: [], behavior: 'or' },
    serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : {},
    component: FilterLists,
  },
  genres: {
    ...fields.genres,
    initial: { values: [], behavior: 'or' },
    serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : {},
    component: compose(withProps({ display: 'checkbox' }), withTMDB())(FilterGenres),
  },
  original_languages: {
    ...fields.original_languages,
    initial: { values: [], behavior: 'or' },
    serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : {},
    component: withProps({ label: 'ui.filters.languages', labelize: (_id) => `${languages[_id]?.emoji || '🏳️'}  ${languages[_id]?.name || i18n.t('pages.library.unknownLanguage', { id: _id })}` })(FilterStatistics),
  },
  spoken_languages: {
    ...fields.spoken_languages,
    component: withProps({ label: 'ui.filters.spoken_languages', display: 'select', labelize: (_id) => `${languages[_id]?.emoji || '🏳️'}  ${languages[_id]?.name || i18n.t('pages.library.unknownLanguage', { id: _id })}` })(FilterStatistics),
  },
  production_companies: {
    ...fields.production_companies,
    component: withProps({ label: 'ui.filters.companies', display: 'select' })(FilterStatistics),
  },
  release_date: untouched({
    ...fields.release_date,
    component: FilterReleaseDate,
  }),
  popularity: untouched({
    ...fields.popularity,
    component: FilterPopularity,
  }),
  vote_average: untouched({
    ...fields.vote_average,
    component: FilterVoteAverage,
  }),
  vote_count: untouched({
    ...fields.vote_count,
    component: FilterVoteCount,
  }),
  budget: untouched({
    ...fields.budget,
    component: FilterBudget,
  }),
  runtime: untouched({
    ...fields.runtime,
    component: FilterRuntime,
  }),
  ...releasesFields({ noun: 'movies', jobs: ['sync', 'record', 'refine', 'shrink'] }),
}

// The filters panel, Settings › Lists opens it on a saved list too
export const CONTROLS: withControlsArgs = {
  title: i18n.t('pages.library.title'),
  hooks: {
    onChange: () => scrollToTop(),
  },
  layout: {
    nav: {
      display: 'grid',
      gridTemplateColumns: ['1fr min-content min-content min-content', '1fr min-content min-content min-content'],
      gridTemplateRows: 'auto',
      gap: '2em',
      gridTemplateAreas: [
        `"results bulk toggle sort_by"`,
        `"title results bulk toggle sort_by"`,
      ],
      '>h4': {
        display: ['none', 'block'],
      },
    },
    aside: [
      {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head_main"
          "state"
          "proposal"
          "policy"
          "toggle_sub_asides_0"
          "requested_by"
          "lists"
          "genres"
          "original_languages"
          "spoken_languages"
          "production_companies"
          "release_date"
          "popularity"
          "vote_average"
          "vote_count"
          "budget"
          "runtime"
        `,
      },
      {
        display: 'grid',
        backgroundColor: 'primaryDark',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: RELEASES_AREAS,
      }
    ],
  },
  components: {
    toggle_sub_asides_0: ReleasesToggle,
  },
  fields: FIELDS,
  footer: saveAsListOf('library', 'movie'),
  useStatistics: (entities, fields, state) => {
    const api = useAPI()
    const [statistics, setStatistics] = useState({})

    useEffect(() => {
      // The ids of the previous filters must not stand in for the current ones.
      setStatistics({})

      const controller = new AbortController()
      const { uri, params, init } = APIQuery.movies.getStatistics({ params: state, init: { signal: controller.signal } })

      api.fetch(uri, params, init)
        .then(setStatistics)
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn(e)
            setStatistics({})
          }
        })

      return () => controller.abort()
    }, [JSON.stringify(state)])

    return statistics
  },
}

const Library = compose(
  withTitle(i18n.t('pages.library.title')),
  withProps({
    id: 'library',
    display: 'grid',
    child: MovieWithCreditsAndReviewsAndBulk,
    empty: {
      emoji: '🍿',
      title: <Trans i18nKey='entities.empty.title' />,
      subtitle: (
        <span>
          <Trans i18nKey='entities.movies.empty.subtitle' components={[<em />, <em />, <em />]} />
        </span>
      ),
    },
  }),
  withFetchQuery(APIQuery.movies.getMovies({}), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls(CONTROLS),
  withPlacehodersHistoryState(),
  withBody(),
)(Entities)

export default Library
