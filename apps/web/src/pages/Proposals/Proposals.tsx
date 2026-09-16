import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  withControls,
  FilterStatistics,
  FilterStates,
  Sorting,
  Warning,
  Range,
  Checkbox,
  Icon,
} from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { fields } from '@sensorr/tmdb'
import { compose, emojize, scrollToTop, useHistoryState, useResponsiveValue } from '@sensorr/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAPI, query as APIQuery } from '../../store/api'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { Proposal } from '../../components/Sensorr/Proposal'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import { EncodingFilter, ResolutionFilter, SourceFilter, DubFilter, LanguageFilter, FlagsFilter, ZNABFilter } from '../../components/Sensorr/Controls/Oleoo'
import { withBody } from '../../layout/withLayout'

// Same shape as `Library`'s release rules: three groups (prefer / avoid / ignore)
// serialized into the `release_<tag>.prefer|avoid` params the API already filters on
// (movies.service.ts:216-232).
const serializeRule = (key, values) => ({
  ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
  ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
})

// Rough per-row height seed for the virtualizer, replaced by `measureElement` as
// soon as a row is on screen. Driven by the release count, which sets the height.
const estimateProposalHeight = (entity: any, mobile: boolean) => {
  const releases = entity?.releases?.length || 2

  return mobile ? Math.max(420, 260 + releases * 110) : Math.max(300, 200 + releases * 90)
}

const UIProposals = ({ entities = {}, length = null, ready = true, error = null, onMore = null, ...props }) => {
  const listRef = useRef(null)
  const mobile = useResponsiveValue([true, false])
  const { metadata } = useMoviesMetadataContext() as any
  const [scrollMargin, setScrollMargin] = useState(0)

  const rowVirtualizer = useVirtualizer({
    count: length || 0,
    getScrollElement: () => document.getElementById('body'),
    estimateSize: (index) => estimateProposalHeight(entities[index], mobile),
    getItemKey: (index) => entities[index]?.id ?? index,
    overscan: 4,
    scrollMargin,
  })

  const items = rowVirtualizer.getVirtualItems()

  // The green nav scrolls inside the same container as the list, so the list does
  // not start at offset 0. Same mechanism as ProcessMovies.tsx:105-128.
  useLayoutEffect(() => {
    const list = listRef.current
    const scroller = document.getElementById('body')

    if (!list || !scroller) {
      return
    }

    const compute = () => {
      const offset = list.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
      setScrollMargin((previous) => (Math.abs(previous - offset) > 1 ? offset : previous))
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(scroller)

    return () => observer.disconnect()
  }, [length])

  useEffect(() => {
    if (ready && onMore && items.length) {
      onMore(items)
    }
  }, [ready, JSON.stringify(items.map(({ index }) => index))])

  // Once a proposal is answered, bring the next undecided one under the eyes
  // instead of leaving the treated row filling the screen.
  const treated = useMemo(() => Object.keys(entities).filter(index => (metadata[entities[index]?.id]?.releases || [])
    .some(({ proposal, choice }) => proposal && typeof choice === 'boolean')
  ), [entities, metadata])

  const previous = useRef(treated.length)

  useEffect(() => {
    if (treated.length > previous.current) {
      const next = Object.keys(entities)
        .map(index => Number(index))
        .sort((a, b) => a - b)
        .find(index => !treated.includes(String(index)) && index > Math.max(...treated.map(Number)))

      if (typeof next === 'number') {
        rowVirtualizer.scrollToIndex(next, { align: 'start' })
      }
    }

    previous.current = treated.length
  }, [treated.length])

  if (error || (ready && !length)) {
    return (
      <Warning
        emoji='🛎️'
        title={error ? 'Error' : 'Nothing to treat'}
        subtitle={error?.message || error || (
          <span>
            Proposals show up here once a <code>refine</code> or <code>shrink</code> job runs with <strong>proposalOnly</strong> enabled.
          </span>
        )}
      />
    )
  }

  return (
    <div sx={UIProposals.styles.element}>
      <div ref={listRef} style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {items.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
            }}
          >
            {entities[virtualItem.index] ? (
              <Proposal entity={entities[virtualItem.index]} />
            ) : (
              <div sx={UIProposals.styles.placeholder}>
                <Icon value='spinner' />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

UIProposals.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingY: 4,
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '18em',
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
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', backgroundColor: 'error', borderRadius: '2px', marginX: 8 }}>⛔ FILTER</code>
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
      znab: { initial: [], component: ZNABFilter, serialize: serializeRule },
      encoding: { initial: [], component: EncodingFilter, serialize: serializeRule },
      resolution: { initial: [], component: ResolutionFilter, serialize: serializeRule },
      source: { initial: [], component: SourceFilter, serialize: serializeRule },
      dub: { initial: [], component: DubFilter, serialize: serializeRule },
      language: { initial: [], component: LanguageFilter, serialize: serializeRule },
      flags: { initial: [], component: FlagsFilter, serialize: serializeRule },
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
  withBody(),
)(UIProposals)

export default Proposals
