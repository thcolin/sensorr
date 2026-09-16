import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  withControls,
  FilterStatistics,
  FilterStates,
  Sorting,
  Warning,
  Range,
  Checkbox,
  Icon,
  Picture,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { fields } from '@sensorr/tmdb'
import { compose, emojize, filesize, scrollToTop, useHistoryState, useResponsiveValue } from '@sensorr/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNavigate, useParams } from 'react-router-dom'
import { formatRelative } from 'date-fns'
import { useAPI, query as APIQuery } from '../../store/api'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { Proposal, Size, Transition, scoreReleases, useProposalDiff } from '../../components/Sensorr/Proposal'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import { EncodingFilter, ResolutionFilter, SourceFilter, DubFilter, LanguageFilter, FlagsFilter, ZNABFilter } from '../../components/Sensorr/Controls/Oleoo'
import Body from '../../layout/Body/Body'

const EMOJI = {
  'record': '📹',
  'refine': '✨',
  'shrink': '✂️',
}

// Library's release rules without the ⛔ group: `release_<tag>.avoid` is
// `$not: { $elemMatch }`, so it excludes a movie on the strength of the release
// already owned, which says nothing about the proposal.
const serializeRule = (key, values) => ({
  ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
})

// Fixed row height: the list is a scanning surface, not a reading one, and a fixed
// height frees the virtualizer from measuring 3371 rows.
const ROW_HEIGHT = 128

const UIProposalItem = ({ entity = null, metadata = null, selected = false, onSelect = null, ...props }) => {
  const releases = useMemo(() => scoreReleases(metadata?.releases, metadata?.policy), [metadata?.releases, metadata?.policy])
  const owned = useMemo(() => releases.filter(({ proposal }) => !proposal), [releases])
  const proposal = useMemo(() => releases.filter(({ proposal }) => proposal)[0] || null, [releases])
  const diff = useProposalDiff(owned, proposal, metadata?.policy)
  const regression = diff.changed.some(({ state }) => state === 'avoided' || state === 'lost')

  return (
    <button
      type='button'
      onClick={() => onSelect(entity?.id)}
      sx={{
        ...UIProposalItem.styles.element,
        ...(selected ? UIProposalItem.styles.selected : {}),
        ...(regression ? UIProposalItem.styles.regression : {}),
      }}
    >
      <span sx={UIProposalItem.styles.poster}>
        <Picture path={entity?.poster_path} size='w92' />
      </span>
      <span sx={UIProposalItem.styles.body}>
        <span sx={UIProposalItem.styles.title}>
          <strong>{entity?.title}</strong>
          <span>{EMOJI[proposal?.from]}</span>
        </span>
        <small sx={UIProposalItem.styles.about}>
          {[
            entity?.release_date && new Date(entity.release_date).getFullYear(),
            entity?.genres?.slice(0, 2).map(({ name }) => name).join(', '),
          ].filter(Boolean).join(' · ')}
        </small>
        <small sx={UIProposalItem.styles.diff}>
          {diff.changed.length ? (
            <>
              {diff.changed.slice(0, 3).map(({ axis, from, to }) => (
                <Transition key={axis} axis={axis} from={from} to={to} policy={metadata?.policy} compact={true} />
              ))}
              {diff.changed.length > 3 && <em>+{diff.changed.length - 3}</em>}
            </>
          ) : proposal ? (
            <em>nothing changes</em>
          ) : null}
          {!!diff.size && <Size from={diff.from?.size} to={proposal?.size} delta={diff.size} command={proposal?.from} compact={true} />}
        </small>
      </span>
    </button>
  )
}

UIProposalItem.styles = {
  element: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    height: `${ROW_HEIGHT}px`,
    paddingX: 8,
    paddingY: 9,
    textAlign: 'left',
    cursor: 'pointer',
    borderLeft: '0.25em solid transparent',
    borderBottom: '1px solid',
    borderBottomColor: 'gray',
    '&:hover': {
      backgroundColor: 'grayLightest',
    },
  },
  selected: {
    backgroundColor: 'grayLighter',
    borderLeftColor: 'primary',
  },
  regression: {
    borderLeftColor: 'error',
  },
  poster: {
    flexShrink: 0,
    display: 'flex',
    width: '3.5em',
    marginRight: 8,
    '>span': { width: '100%' },
  },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    '>strong': {
      minWidth: 0,
      fontSize: 5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
  about: {
    color: 'grayDarker',
    fontSize: 7,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  diff: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    overflow: 'hidden',
    maxHeight: '3.5em',
    '>em': {
      color: 'grayDarker',
      fontSize: 7,
      fontStyle: 'normal',
    },
  },
  foot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    color: 'grayDarker',
    fontSize: 7,
    '>code': {
      fontFamily: 'monospace',
      fontWeight: 'semibold',
    },
  },
}

const ProposalItem = withMovieMetadataContext({ enhanced: true })(UIProposalItem)

const UIProposals = ({ entities = {}, length = null, ready = true, error = null, onMore = null, ...props }) => {
  const listRef = useRef(null)
  const navigate = useNavigate()
  const { id } = useParams()
  // On a narrow screen the two panels cannot share the width: the list is the page,
  // and picking one swaps it for the detail. Same pattern as Settings.tsx:62,89.
  const mobile = useResponsiveValue([true, false])

  const rowVirtualizer = useVirtualizer({
    count: length || 0,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index) => entities[index]?.id ?? index,
    overscan: 6,
  })

  const items = rowVirtualizer.getVirtualItems()

  // One sticky heading driven by the topmost visible row, rather than heading rows
  // inserted in the virtualized flow. Same grouping as the Jobs sidebar
  // (Jobs.tsx:152-163), which the list follows when sorted by date.
  const heading = useMemo(() => {
    const entity = entities[items[0]?.index] as any
    const date = entity?.updated_at || entity?.refined_at || entity?.shrinked_at

    if (!date) {
      return null
    }

    const relative = formatRelative(new Date(date), new Date()).split(' ')[0]
    return ['today', 'yesterday'].includes(relative) ? relative : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }, [entities, items[0]?.index])

  useEffect(() => {
    if (ready && onMore && items.length) {
      onMore(items)
    }
  }, [ready, JSON.stringify(items.map(({ index }) => index))])

  const onSelect = useCallback((movie) => navigate(`/movie/proposals/${movie}`), [navigate])
  const active = useMemo(() => Object.values(entities).find((entity: any) => `${entity?.id}` === id) as any, [entities, id])

  // Landing straight on /movie/proposals opens the first one, so the right panel is
  // never empty while the queue is not. An id that no loaded page carries — a link
  // kept from another sort or another day — falls back to the first rather than
  // spinning forever, since the API has no route to fetch one movie.
  useEffect(() => {
    if (!ready || !entities[0]?.id) {
      return
    }

    if (mobile) {
      return
    }

    if (!id || (Object.keys(entities).length && !active)) {
      navigate(`/movie/proposals/${entities[0].id}`, { replace: true })
    }
  }, [id, ready, active, mobile, entities[0]?.id])

  if (error || (ready && !length)) {
    return (
      <Warning
        emoji='🛎️'
        title={error ? 'Error' : 'Nothing to treat'}
        subtitle={error?.message || error || 'No movie is waiting for a choice'}
      />
    )
  }

  return (
    <section sx={UIProposals.styles.element}>
      <aside ref={listRef} sx={{ ...UIProposals.styles.list, display: [id ? 'none' : 'block', 'block'] }}>
        {!!heading && <h6 sx={UIProposals.styles.heading}>{heading}</h6>}
        {!ready && !length ? (
          <div sx={UIProposals.styles.skeletons}>
            {Array(8).fill(null).map((foo, index) => <span key={index} />)}
          </div>
        ) : (
        <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
          {items.map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${ROW_HEIGHT}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {entities[virtualItem.index] ? (
                <ProposalItem
                  entity={entities[virtualItem.index]}
                  selected={`${entities[virtualItem.index]?.id}` === id}
                  onSelect={onSelect}
                />
              ) : (
                <div sx={UIProposals.styles.placeholder}><Icon value='spinner' /></div>
              )}
            </div>
          ))}
        </div>
        )}
      </aside>
      <div sx={{ ...UIProposals.styles.detail, display: [id ? 'flex' : 'none', 'flex'] }}>
        <Body>
          <button type='button' onClick={() => navigate('/movie/proposals')} sx={UIProposals.styles.back}>
            <Icon value='chevron' direction={true} width='0.625em' height='0.625em' />
            <span>{length} proposals</span>
          </button>
          {active ? (
            <Proposal entity={active} />
          ) : (
            <div sx={UIProposals.styles.placeholder}><Icon value='spinner' /></div>
          )}
        </Body>
      </div>
    </section>
  )
}

UIProposals.styles = {
  element: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: ['column', 'row'],
    overflow: 'hidden',
  },
  detail: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  list: {
    flexShrink: 0,
    minWidth: ['100%', '24em'],
    maxWidth: ['100%', '24em'],
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: 'grayLightest',
    borderRight: '1px solid',
    borderRightColor: 'grayLight',
  },
  heading: {
    position: 'sticky',
    top: '0px',
    paddingX: 4,
    paddingY: 6,
    margin: 12,
    backgroundColor: 'grayLighter',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    textTransform: 'capitalize',
    zIndex: 1,
  },
  skeletons: {
    display: 'flex',
    flexDirection: 'column',
    '>span': {
      height: `${ROW_HEIGHT}px`,
      borderBottom: '1px solid',
      borderBottomColor: 'gray',
      backgroundImage: (theme) => `linear-gradient(90deg, ${theme.rawColors.grayLightest} 0%, ${theme.rawColors.grayLighter} 50%, ${theme.rawColors.grayLightest} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'sensorr-proposals-shimmer 1.4s ease-in-out infinite',
    },
    '@keyframes sensorr-proposals-shimmer': {
      '0%': { backgroundPosition: '200% 0' },
      '100%': { backgroundPosition: '-200% 0' },
    },
  },
  back: {
    variant: 'button.reset',
    display: ['inline-flex', 'none'],
    alignItems: 'center',
    gap: 8,
    paddingX: 8,
    paddingY: 8,
    color: 'grayDarker',
    fontSize: 6,
    fontWeight: 'semibold',
    cursor: 'pointer',
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    opacity: 0.5,
  },
}

const Proposals = compose(
  withTitle('Proposals'),
  withFetchQuery(APIQuery.movies.getMovies({}), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: 'Proposals',
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content min-content', '1fr min-content min-content'],
        gridTemplateRows: 'auto',
        gap: '2em',
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
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head"
          "job"
          "policy"
          "state"
          "size"
          "znab"
          "language"
          "dub"
          "resolution"
          "source"
          "encoding"
          "flags"
        `,
      },
    },
    fields: {
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 }, gridArea: 'head' }}>
            <Warning
              emoji='🛎️'
              title='Proposals'
              subtitle={(
                <span>
                  Narrow down proposals waiting for your choice, use each rule tag according to your preferences
                  <br/>
                  <span sx={{ display: 'inline-block', marginTop: 4, marginBottom: 8 }}>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', backgroundColor: 'primaryDarkest', borderRadius: '2px', marginX: 8 }}>⭐ ACCEPT</code>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', border: '1px solid white', borderRadius: '2px', marginX: 8 }}>🔕 IGNORE</code>
                  </span>

                </span>
              )}
            />
          </div>
        ),
      },
      // Not rendered (absent from `gridTemplateAreas`) but still serialized, so
      // every request is scoped to movies carrying a pending proposal.
      proposal: {
        initial: true,
        serialize: () => ({ 'releases.proposal': true }),
        component: () => null,
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
            { label: emojize('✨', 'Refined'), value: 'refined_at' },
            { label: emojize('✂️', 'Shrinked'), value: 'shrinked_at' },
            { label: i18n.t('ui.sortings.popularity'), value: 'popularity' },
            { label: i18n.t('ui.sortings.primary_release_date'), value: 'release_date' },
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
      znab: { initial: [], component: withProps({ avoidable: false })(ZNABFilter), serialize: serializeRule },
      encoding: { initial: [], component: withProps({ avoidable: false })(EncodingFilter), serialize: serializeRule },
      resolution: { initial: [], component: withProps({ avoidable: false })(ResolutionFilter), serialize: serializeRule },
      source: { initial: [], component: withProps({ avoidable: false })(SourceFilter), serialize: serializeRule },
      dub: { initial: [], component: withProps({ avoidable: false })(DubFilter), serialize: serializeRule },
      language: { initial: [], component: withProps({ avoidable: false })(LanguageFilter), serialize: serializeRule },
      flags: { initial: [], component: withProps({ avoidable: false })(FlagsFilter), serialize: serializeRule },
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
)(UIProposals)

export default Proposals
