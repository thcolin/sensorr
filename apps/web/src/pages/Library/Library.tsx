import { useCallback, useEffect, useState } from 'react'
import {
  Entities,
  withControls,
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
  Range,
  Button,
  Checkbox,
  Option,
  Select,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { fields } from '@sensorr/tmdb'
import { compose, emojize, languages, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useThemeUI } from 'theme-ui'
import { useLocation } from 'react-router-dom'
import { withTMDB } from '../../store/tmdb'
import { useAPI, query as APIQuery } from '../../store/api'
import { useSensorr } from '../../store/sensorr'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { useBulkContext } from '../../contexts/Bulk/Bulk'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { EncodingFilter, ResolutionFilter, SourceFilter, DubFilter, LanguageFilter, FlagsFilter, ZNABFilter } from '../../components/Sensorr/Controls/Oleoo'
import { withBody } from '../../layout/withLayout'

const MovieWithCreditsAndReviewsAndBulk = ({ entity, ...props }) => {
  const { selection, setSelection } = useBulkContext()
  const location = useLocation()

  return (
    <MovieWithCreditsAndReviews
      {...props as any}
      entity={entity}
      selected={!!selection[location.key]?.includes(entity?.id)}
      selectedVisible={selection[location.key]?.length > 0}
      onSelectedChange={(id) => setSelection(selection => ({
        ...selection,
        [location.key]: selection[location.key]?.includes(id) ? selection[location.key]?.filter(v => v !== id) : [...(selection[location.key] || []), id],
      }))}
    />
  )
}

const Library = compose(
  withProps({
    id: 'library',
    display: 'grid',
    child: MovieWithCreditsAndReviewsAndBulk,
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
        gap: '2em',
        gridTemplateAreas: [
          `"results toggle sort_by"`,
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
          gridTemplateAreas: `
            "head_release"
            "job"
            "size"
            "znab"
            "encoding"
            "resolution"
            "source"
            "dub"
            "language"
            "flags"
          `,
        }
      ],
    },
    components: {
      toggle_sub_asides_0: ({ toggleOpen, ...props }) => (
        <div
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gridArea: 'toggle_sub_asides_0',
          }}
        >
          <label
            sx={{
              display: 'inline-flex',
              paddingBottom: 4,
              alignItems: 'center',
              fontWeight: 'semibold',
              '>*:first-of-type': {
                flex: 1,
              },
            }}
          >
            <span>
              {emojize('📀', 'Releases')}
            </span>
          </label>
          <Button {...props} variant='contain' color='primaryDark' type='button' onClick={toggleOpen}>
            Show <strong>Releases</strong> filters
          </Button>
        </div>
      )
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
      head_release: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 }, gridArea: 'head_release' }}>
            <Warning
              emoji="📀"
              title="Releases"
              subtitle={(
                <span>
                  Narrow your movies search with releases filters, use each rule tag according to your preferences
                  <br/>
                  <span sx={{ display: 'inline-block', marginTop: 4, marginBottom: 8 }}>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', backgroundColor: 'primaryDarkest', borderRadius: '2px', marginX: 8 }}>⭐ ACCEPT</code>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', backgroundColor: 'error', borderRadius: '2px', marginX: 8 }}>⛔ FILTER</code>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', border: '1px solid white', borderRadius: '2px', marginX: 8 }}>🔕 IGNORE</code>
                  </span>
                </span>
              )}
            />
          </div>
        ),
      },
      // TODO: enhance, don't use a specific context, use fields system and give Child correct props (will save values inside route state)
      bulk: {
        initial: null,
        component: ({ total, statistics, ...props }) => {
          const { theme } = useThemeUI()
          const { setMovieMetadata } = useMoviesMetadataContext() as any
          const { selection, setSelection } = useBulkContext()
          const sensorr = useSensorr()
          const location = useLocation()

          const handleCallback = useCallback(({ value, label }) => {
            switch (value) {
              case 'state-ignored':
                if (confirm(`Do you want to change ${selection[location.key]?.length || 0} movies state to "ignored" ?`)) {
                  setMovieMetadata(selection[location.key], 'state', 'ignored')
                }
              break;
              case 'state-wished':
                if (confirm(`Do you want to change ${selection[location.key]?.length || 0} movies state to "wished" ?`)) {
                  setMovieMetadata(selection[location.key], 'state', 'wished')
                }
              break;
              case 'state-pinned':
                if (confirm(`Do you want to change ${selection[location.key]?.length || 0} movies state to "pinned" ?`)) {
                  setMovieMetadata(selection[location.key], 'state', 'pinned')
                }
              break;
              case 'state-archived':
                if (confirm(`Do you want to change ${selection[location.key]?.length || 0} movies state to "archived" ?`)) {
                  setMovieMetadata(selection[location.key], 'state', 'archived')
                }
              break;
              case 'proposal-accept':
                if (confirm(`Do you want to accept all ${selection[location.key]?.length || 0} movies proposal ?`)) {
                  setMovieMetadata(selection[location.key], 'proposal', true)
                }
              break;
              case 'proposal-refuse':
                if (confirm(`Do you want to refuse all ${selection[location.key]?.length || 0} movies proposal ?`)) {
                  setMovieMetadata(selection[location.key], 'proposal', false)
                }
              break;
              case 'policy':
                if (confirm(`Do you want to change ${selection[location.key]?.length || 0} movies policies to ${label} ?`)) {
                  setMovieMetadata(selection[location.key], 'policy', label)
                }
              break;
              case 'refine-enable':
                if (confirm(`Do you want to enable refine job for ${selection[location.key]?.length || 0} movies ?`)) {
                  setMovieMetadata(selection[location.key], 'refine', true)
                }
              break;
              case 'refine-disable':
                if (confirm(`Do you want to disable refine job for ${selection[location.key]?.length || 0} movies ?`)) {
                  setMovieMetadata(selection[location.key], 'refine', false)
                }
              break;
              case 'shrink-enable':
                if (confirm(`Do you want to enable shrink job for ${selection[location.key]?.length || 0} movies ?`)) {
                  setMovieMetadata(selection[location.key], 'shrink', true)
                }
              break;
              case 'shrink-disable':
                if (confirm(`Do you want to disable shrink job for ${selection[location.key]?.length || 0} movies ?`)) {
                  setMovieMetadata(selection[location.key], 'shrink', false)
                }
              break;
            }
          }, [selection[location.key]])

          return (
            <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '8em' }}>
              <Option
                id='movies'
                type='checkbox'
                checked={(selection[location.key]?.length || 0) !== 0}
                onChange={() => {
                  if ((selection[location.key]?.length || 0) === 0) {
                    setSelection(selection => ({ ...selection, [location.key]: (statistics[0]?.entities || []) }))
                  } else {
                    setSelection(selection => ({ ...selection, [location.key]: [] }))
                  }
                }}
              >
                {(selection[location.key]?.length || 0) === 0 ? 'Select All' : (selection[location.key]?.length || 0) === (statistics[0]?.entities || [])?.length ? 'Unselect All' : `${selection[location.key]?.length || 0} Selected`}
              </Option>
              {!!(selection[location.key]?.length || 0) && (
                <Select
                  options={[
                    {
                      label: emojize('📚', 'Change states'),
                      options: [
                        { value: 'state-ignored', label: emojize('🔕', `Ignored`) },
                        { value: 'state-wished', label: emojize('🍿', `Wished`) },
                        { value: 'state-pinned', label: emojize('📍', `Pinned`) },
                        { value: 'state-archived', label: emojize('📼', `Archived`) },
                      ],
                    },
                    {
                      label: emojize('🛎️', 'Handle proposal'),
                      options: [
                        { value: 'proposal-accept', label: `Accept` },
                        { value: 'proposal-refuse', label: `Refuse` },
                      ],
                    },
                    {
                      label: emojize('🚨', 'Change policies'),
                      options: sensorr.policies.map(policy => ({ value: `policy`, label: policy.name })),
                    },
                    {
                      label: emojize('✨', 'Refine'),
                      options: [
                        { value: 'refine-enable', label: `Enable` },
                        { value: 'refine-disable', label: `Disable` },
                      ],
                    },
                    {
                      label: emojize('✂️', 'Shrink'),
                      options: [
                        { value: 'shrink-enable', label: `Enable` },
                        { value: 'shrink-disable', label: `Disable` },
                      ],
                    },
                  ]}
                  value={null}
                  onChange={handleCallback}
                  multi={false}
                  closeMenuOnSelect={true}
                  isSearchable={false}
                  isClearable={false}
                  defaultOptions={false}
                  menuPlacement='bottom'
                  menuPosition='fixed'
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      '>div:first-of-type': {
                        display: 'flex',
                        padding: '0em',
                        '>input': {
                          left: 0,
                          margin: '2px',
                          padding: '2px 0',
                          transform: 'unset',
                        },
                      }
                    }),
                    menu: (style) => ({
                      ...style,
                      color: theme.colors.primary,
                      width: '15em',
                    }),
                    groupHeading: (style) => ({
                      ...style,
                      fontFamily: (theme.fonts as any).heading,
                      fontWeight: (theme.fontWeights as any).semibold,
                      textTransform: 'capitalize',
                      fontSize: '1em',
                      paddingTop: '0.5em',
                      paddingBottom: '0.5em',
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                    }),
                    option: (style, props) => ({
                      ...style,
                      backgroundColor: props.isFocused ? theme.colors.primaryLightest : props.isSelected ? theme.colors.accent : 'white',
                      color: props.isSelected ? 'white' : theme.colors.primary,
                      fontSize: '0.875em',
                      cursor: 'pointer',
                      ':active': {
                        backgroundColor: theme.colors.primaryLightest,
                      },
                    }),
                  }}
                />
              )}
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
        component: withProps({ label: 'ui.filters.languages', labelize: (_id) => `${languages[_id]?.emoji || '🏳️'}  ${languages[_id]?.name || `Unknwon (${_id})`}` })(FilterStatistics),
      },
      spoken_languages: {
        ...fields.spoken_languages,
        component: withProps({ label: 'ui.filters.spoken_languages', display: 'select', labelize: (_id) => `${languages[_id]?.emoji || '🏳️'}  ${languages[_id]?.name || `Unknwon (${_id})`}` })(FilterStatistics),
      },
      production_companies: {
        ...fields.production_companies,
        component: withProps({ label: 'ui.filters.companies', display: 'select' })(FilterStatistics),
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
      vote_count: {
        ...fields.vote_count,
        component: FilterVoteCount,
      },
      budget: {
        ...fields.budget,
        component: FilterBudget,
      },
      runtime: {
        ...fields.runtime,
        component: FilterRuntime,
      },
      size: {
        initial: [0, 50],
        serialize: (key, raw) => {
          if (raw[0] === 0 && raw[1] === 50) {
            return {}
          }

          return Array.isArray(raw) ? { [`release_size.gte`]: raw[0], ...(raw[1] === 50 ? {} : { [`release_size.lte`]: raw[1] }) } : {}
        },
        component: ({ ...props }) => (
          <Range
            {...props as any}
            min={0}
            max={50}
            marks={[...Array(50).fill(true).map((foo, value) => ({ value }))]}
            data={null}
            label={i18n.t('ui.filters.size')}
            labelize={(value) => `${value} GB`}
            value={props.value || [0, 50]}
            step={null}
          />
        )
      },
      job: {
        initial: { values: [] },
        serialize: (key, raw) => !raw?.values?.length ? {} : { 'release_from': raw?.values.join('|') },
        component: ({ ...props }) => (
          <Checkbox
            {...props as any}
            label={i18n.t('ui.filters.job')}
            options={[
              {
                value: 'sync',
                label: emojize('🔗', 'Sync'),
              },
              {
                value: 'record',
                label: emojize('📹', 'Record'),
              },
              {
                value: 'refine',
                label: emojize('✨', 'Refine'),
              },
              {
                value: 'shrink',
                label: emojize('✂️', 'Shrink'),
              },
            ]}
            value={props.value.values}
            onChange={values => props.onChange({ ...props.value, values })}
          />
        )
      },
      znab: {
        initial: [],
        component: ZNABFilter,
        serialize: (key, values) => ({
            ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
            ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
          }),
      },
      encoding: {
        initial: [],
        component: EncodingFilter,
        serialize: (key, values) => ({
          ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
          ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
        }),
      },
      resolution: {
        initial: [],
        component: ResolutionFilter,
        serialize: (key, values) => ({
          ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
          ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
        }),
      },
      source: {
        initial: [],
        component: SourceFilter,
        serialize: (key, values) => ({
          ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
          ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
        }),
      },
      dub: {
        initial: [],
        component: DubFilter,
        serialize: (key, values) => ({
          ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
          ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
        }),
      },
      language: {
        initial: [],
        component: LanguageFilter,
        serialize: (key, values) => ({
          ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
          ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
        }),
      },
      flags: {
        initial: [],
        component: FlagsFilter,
        serialize: (key, values) => ({
          ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
          ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
        }),
      },
    },
    useStatistics: (entities, fields, state) => {
      const api = useAPI()
      const [statistics, setStatistics] = useState({})

      useEffect(() => {
        const cb = async () => {
          const { uri, params, init } = APIQuery.movies.getStatistics({ params: state })

          try {
            setStatistics(await api.fetch(uri, params, init))
          } catch (e) {
            console.warn(e)
            setStatistics({})
          }
        }

        cb()
      }, [JSON.stringify(state)])

      return statistics
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(Entities)

export default Library
