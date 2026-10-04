import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Entities,
  withControls,
  withControlsArgs,
  FilterGenres,
  FilterStatistics,
  FilterProposal,
  FilterStates,
  FilterReleaseDate,
  FilterPopularity,
  FilterVoteAverage,
  FilterVoteCount,
  FilterRuntime,
  Sorting,
  Warning,
  Option,
  Bulk,
  ShowStateOptions,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { fields } from '@sensorr/tmdb'
import { compose, languages, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useLocation } from 'react-router-dom'
import { withTMDB } from '../../store/tmdb'
import { useAPI, query as APIQuery } from '../../store/api'
import { useSensorr } from '../../store/sensorr'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useBulkContext } from '../../contexts/Bulk/Bulk'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { status, type, networks, origin_country, number_of_seasons, untouched } from '../../components/Show/fields'
import { RELEASES_AREAS, ReleasesToggle, releasesFields } from '../../components/Sensorr/Controls/Releases'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { saveAsListOf } from '../../components/Lists/SaveAsList'
import { FilterLists } from '../../components/Lists/FilterLists'
import { useListsAction } from '../../components/Lists/useCustomLists'

const FOLLOWED = ShowStateOptions.find(({ value }) => value === 'followed')
const UNFOLLOWED = ShowStateOptions.find(({ value }) => value === 'unfollowed')

const shows = (count) => `${count} ${count === 1 ? 'show' : 'shows'}`

const ShowWithBulk = ({ entity, ...props }) => {
  const { selection, setSelection } = useBulkContext()
  const location = useLocation()

  return (
    <Show
      {...props as any}
      entity={entity}
      selected={entity?.id ? !!selection[location.key]?.includes(entity.id) : null}
      selectedVisible={selection[location.key]?.length > 0}
      onSelectedChange={(id) => setSelection(selection => ({
        ...selection,
        [location.key]: selection[location.key]?.includes(id) ? selection[location.key]?.filter(v => v !== id) : [...(selection[location.key] || []), id],
      }))}
    />
  )
}

// The fields of the filters panel, a saved list serializes its values with them
export const FIELDS = {
  head_main: {
    initial: null,
    component: ({ ...props }) => (
      <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 }, gridArea: 'head_main' }}>
        <Warning
          emoji="📚"
          title="Library"
          subtitle={(
            <span>
              Explore shows from your library with various filters about shows like <strong>state</strong>, <strong>genres</strong>, <strong>networks</strong>, <strong>first air date</strong>, etc...
            </span>
          )}
        />
      </div>
    ),
  },
  bulk: {
    initial: null,
    component: function BulkField({ total, statistics, ...props }) {
      const { setShowMetadata } = useShowsMetadataContext() as any
      const { selection, setSelection } = useBulkContext()
      const sensorr = useSensorr()
      const location = useLocation()
      const [sending, setSending] = useState(false)
      const entities = statistics?.[0]?.entities
      const visible = useMemo(() => entities ? new Set(entities) : null, [entities])
      // A filter that hides a checked show takes it out of the selection it acts on, and
      // nothing is acted on until the ids of the current filters are known.
      const selected = useMemo(() => visible ? (selection[location.key] || []).filter(id => visible.has(id)) : [], [selection, location.key, visible])

      // The metadata context already tells a failure in its toast.
      // Without a question, the action asked already
      const apply = async (key, value, question) => {
        if (question && !window.confirm(question)) {
          return
        }

        setSending(true)
        await setShowMetadata(selected, key, value).catch(() => null)
        setSending(false)
      }

      const lists = useListsAction('tv', apply, shows(selected.length))

      return (
        <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '8em', fontVariantNumeric: 'tabular-nums' }}>
          <Option
            id='shows'
            type='checkbox'
            checked={selected.length !== 0}
            disabled={!entities && selected.length === 0}
            onChange={() => setSelection(selection => ({ ...selection, [location.key]: selected.length === 0 ? (entities || []) : [] }))}
          >
            {selected.length === 0 ? 'Select All' : `${selected.length} Selected`}
          </Option>
          <Bulk
            count={selected.length}
            disabled={sending}
            actions={[
              {
                key: 'monitored',
                icon: '📚',
                label: 'State',
                options: [
                  { value: true, icon: FOLLOWED.emoji, label: FOLLOWED.label },
                  { value: false, icon: UNFOLLOWED.emoji, label: UNFOLLOWED.label },
                ],
                onChange: ({ value, label }) => apply('monitored', value, `Do you want to change the state of ${shows(selected.length)} to "${label}"?`),
              },
              {
                key: 'policy',
                icon: '🚨',
                label: 'Policy',
                options: sensorr.policies.map(policy => ({ value: policy.name, label: policy.name })),
                onChange: ({ value }) => apply('policy', value, `Do you want to change the policy of ${shows(selected.length)} to ${value}?`),
              },
              lists,
            ]}
          />
        </div>
      )
    }
  },
  sort_by: {
    initial: {
      value: 'refreshed_at',
      sort: true,
    },
    serialize: (key, raw) => ({ [key]: `${raw.value}.${{ true: 'desc', false: 'asc' }[raw.sort]}` }),
    component: withProps({
      label: i18n.t('ui.sorting'),
      options: [
        { label: i18n.t('ui.sortings.refreshed_at'), value: 'refreshed_at' },
        { label: i18n.t('ui.sortings.popularity'), value: 'popularity' },
        { label: i18n.t('ui.sortings.first_air_date'), value: 'first_air_date' },
        { label: i18n.t('ui.sortings.last_air_date'), value: 'last_air_date' },
        { label: i18n.t('ui.sortings.vote_average'), value: 'vote_average' },
        { label: i18n.t('ui.sortings.vote_count'), value: 'vote_count' },
        { label: i18n.t('ui.sortings.name'), value: 'name', sort: false },
      ]
    })(Sorting)
  },
  // Named as the movie's, a show's state is its `monitored` flag
  state: {
    initial: [],
    serialize: (key, raw) => raw?.length === 1 ? { monitored: `${raw[0] === 'followed'}` } : {},
    component: withProps({ type: 'show' })(FilterStates),
  },
  status,
  proposal: {
    initial: { values: [] },
    serialize: (key, raw) => (!raw?.values?.length || raw?.values?.length === 2) ? {} : { 'releases.proposal': raw?.values[0] },
    component: FilterProposal,
  },
  policy: {
    initial: { values: [] },
    serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join('|') } : {},
    component: withProps({ label: 'ui.filters.policy' })(FilterStatistics),
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
    component: compose(withProps({ display: 'checkbox', type: 'tv' }), withTMDB())(FilterGenres),
  },
  type,
  networks,
  original_languages: {
    ...fields.original_languages,
    initial: { values: [], behavior: 'or' },
    serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : {},
    component: withProps({ label: 'ui.filters.languages', labelize: (_id) => `${languages[_id]?.emoji || '🏳️'}  ${languages[_id]?.name || `Unknwon (${_id})`}` })(FilterStatistics),
  },
  origin_country,
  first_air_date: untouched({
    ...fields.release_date,
    component: withProps({ label: i18n.t('ui.filters.first_air_date') })(FilterReleaseDate),
  }),
  number_of_seasons,
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
  episode_run_time: untouched({
    ...fields.episode_runtime,
    component: withProps({ field: 'episode_runtime', label: i18n.t('ui.filters.episode_runtime') })(FilterRuntime),
  }),
  ...releasesFields({ noun: 'shows', jobs: ['record', 'airing'] }),
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
          "status"
          "proposal"
          "policy"
          "toggle_sub_asides_0"
          "requested_by"
          "lists"
          "genres"
          "type"
          "networks"
          "original_languages"
          "origin_country"
          "first_air_date"
          "number_of_seasons"
          "popularity"
          "vote_average"
          "vote_count"
          "episode_run_time"
        `,
      },
      {
        display: 'grid',
        backgroundColor: 'primaryDark',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: RELEASES_AREAS,
      },
    ],
  },
  components: {
    toggle_sub_asides_0: ReleasesToggle,
  },
  fields: FIELDS,
  footer: saveAsListOf('library', 'tv'),
  useStatistics: (entities, fields, state) => {
    const api = useAPI()
    const [counts, setCounts] = useState({})
    const [bulk, setBulk] = useState(null)

    useEffect(() => {
      const controller = new AbortController()
      const { sort_by, ...filters } = state as any
      const { uri, params, init } = APIQuery.shows.getStatistics({ params: filters, init: { signal: controller.signal } })

      api.fetch(uri, params, init)
        .then(setCounts)
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn(e)
            toast.error('Error while loading library statistics')
          }
        })

      return () => controller.abort()
    }, [JSON.stringify(state)])

    useEffect(() => {
      // The ids of the previous filters must not stand in for the current ones.
      setBulk(null)

      const controller = new AbortController()
      const { sort_by, ...filters } = state as any
      const matching = APIQuery.shows.getShows({ params: { ...filters, fields: 'id', limit: '' }, init: { signal: controller.signal } })

      api.fetch(matching.uri, matching.params, matching.init)
        .then(({ results: ids }) => setBulk([{ entities: ids.map(({ id }) => id) }]))
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn(e)
            toast.error('Error while loading library statistics')
          }
        })

      return () => controller.abort()
    }, [JSON.stringify(state)])

    return useMemo(() => ({ ...counts, ...(bulk ? { bulk } : {}) }), [counts, bulk])
  },
}

const Library = compose(
  withTitle(i18n.t('pages.shows.library.title')),
  withProps({
    id: 'shows-library',
    display: 'grid',
    child: ShowWithBulk,
    extra: FOOTER_HEIGHT,
    empty: {
      emoji: '📺',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          No show of your library matches these filters, try with fewer of them
        </span>
      ),
    },
  }),
  withFetchQuery(APIQuery.shows.getShows({ params: { progress: true } }), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls(CONTROLS),
  withPlacehodersHistoryState(),
  withBody(),
)(Entities)

export default Library
