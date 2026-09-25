import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Entities,
  withControls,
  FilterStatistics,
  FilterProposal,
  Sorting,
  Warning,
  Checkbox,
  Option,
  Bulk,
  ShowStateOptions,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { STATUS_GROUPS } from '@sensorr/sensorr'
import { compose, emojize, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useLocation } from 'react-router-dom'
import { useAPI, query as APIQuery } from '../../store/api'
import { useSensorr } from '../../store/sensorr'
import { useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { useBulkContext } from '../../contexts/Bulk/Bulk'
import Show from '../../components/Show/Show'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'

const FOLLOWED = ShowStateOptions.find(({ value }) => value === 'followed')
const UNFOLLOWED = ShowStateOptions.find(({ value }) => value === 'unfollowed')

const shows = (count) => `${count} ${count === 1 ? 'show' : 'shows'}`

const countsOf = (values) => Object.entries(values.reduce((acc, value) => ({ ...acc, [value]: (acc[value] || 0) + 1 }), {}))
  .map(([_id, count]) => ({ _id, count }))

const OneOf = ({ label, options, statistics, ...props }) => (
  <Checkbox
    {...props as any}
    label={label}
    options={options.map(option => ({ ...option, count: statistics?.find(({ _id }) => _id === option.value)?.count || 0 }))}
    value={props.value.values}
    onChange={values => props.onChange({ ...props.value, values })}
  />
)

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

const Library = compose(
  withTitle(i18n.t('pages.shows.library.title')),
  withProps({
    id: 'shows-library',
    display: 'grid',
    child: ShowWithBulk,
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
  withControls({
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
      aside: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head_main"
          "monitored"
          "status"
          "proposal"
          "policy"
          "requested_by"
        `,
      },
    },
    fields: {
      head_main: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 }, gridArea: 'head_main' }}>
            <Warning
              emoji="📚"
              title="Library"
              subtitle={(
                <span>
                  Explore shows from your library with filters on whether you <strong>follow</strong> them, whether they still <strong>air</strong>, their pending <strong>proposals</strong>, their <strong>policy</strong>, and who <strong>requested</strong> them
                </span>
              )}
            />
          </div>
        ),
      },
      bulk: {
        initial: null,
        component: ({ total, statistics, ...props }) => {
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
          const apply = async (key, value, question) => {
            if (!confirm(question)) {
              return
            }

            setSending(true)
            await setShowMetadata(selected, key, value).catch(() => null)
            setSending(false)
          }

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
                    icon: FOLLOWED.emoji,
                    label: 'Follow',
                    options: [
                      { value: true, icon: FOLLOWED.emoji, label: 'Follow' },
                      { value: false, icon: UNFOLLOWED.emoji, label: 'Unfollow' },
                    ],
                    onChange: ({ value }) => apply('monitored', value, `Do you want to ${value ? 'follow' : 'unfollow'} ${shows(selected.length)}?`),
                  },
                  {
                    key: 'policy',
                    icon: '🚨',
                    label: 'Policy',
                    options: sensorr.policies.map(policy => ({ value: policy.name, label: policy.name })),
                    onChange: ({ value }) => apply('policy', value, `Do you want to change the policy of ${shows(selected.length)} to ${value}?`),
                  },
                  {
                    key: 'proposal_only',
                    icon: '🤖',
                    label: 'Auto',
                    options: [
                      { value: false, label: 'Download' },
                      { value: true, label: 'Propose' },
                      { value: null, label: 'Job setting' },
                    ],
                    onChange: ({ value }) => apply('proposal_only', value, value === null ?
                      `Do you want ${shows(selected.length)} to follow the job setting again?` :
                      `Do you want ${shows(selected.length)} to ${value ? 'only propose' : 'download'} the releases found?`
                    ),
                  },
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
            { label: i18n.t('ui.sortings.name'), value: 'name' },
            { label: i18n.t('ui.sortings.first_air_date'), value: 'first_air_date' },
          ]
        })(Sorting)
      },
      monitored: {
        initial: { values: [] },
        serialize: (key, raw) => raw?.values?.length === 1 ? { [key]: `${raw.values[0] === 'followed'}` } : {},
        component: withProps({
          label: emojize(FOLLOWED.emoji, 'Follow'),
          options: [FOLLOWED, UNFOLLOWED].map(({ value, emoji, label }) => ({ value, label: emojize(emoji, label) })),
        })(OneOf),
      },
      status: {
        initial: { values: [] },
        serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.flatMap(value => STATUS_GROUPS[value]).join('|') } : {},
        component: withProps({
          label: emojize('🚦', 'Status'),
          options: [
            { value: 'airing', label: emojize('📡', 'Airing') },
            { value: 'upcoming', label: emojize('📅', 'Upcoming') },
            { value: 'ended', label: emojize('🏁', 'Ended') },
          ],
        })(OneOf),
      },
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
    },
    useStatistics: (entities, fields, state) => {
      const api = useAPI()

      const [counts, setCounts] = useState({})
      const [bulk, setBulk] = useState(null)

      // The counts are over the whole library, whatever the filters, so they load once.
      useEffect(() => {
        const controller = new AbortController()
        const all = APIQuery.shows.getShows({ params: { fields: 'id|monitored|status|policy|requested_by', limit: '' }, init: { signal: controller.signal } })

        api.fetch(all.uri, all.params, all.init)
          .then(({ results: shows }) => setCounts({
            monitored: countsOf(shows.map(({ monitored }) => monitored ? 'followed' : 'unfollowed')),
            status: countsOf(shows.map(({ status }) => Object.keys(STATUS_GROUPS).find(group => STATUS_GROUPS[group].includes(status))).filter(Boolean)),
            policy: countsOf(shows.map(({ policy }) => policy).filter(Boolean)),
            requested_by: countsOf(shows.flatMap(({ requested_by }) => requested_by || [])),
          }))
          .catch((e) => {
            if (e.name !== 'AbortError') {
              console.warn(e)
              toast.error('Error while loading library statistics')
            }
          })

        return () => controller.abort()
      }, [])

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
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(Entities)

export default Library
