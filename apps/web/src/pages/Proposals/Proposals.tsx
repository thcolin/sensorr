import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import Tippy from '@tippyjs/react'
import toast from 'react-hot-toast'
import { Button, Controls, Icon, Link, Sorting, Warning } from '@sensorr/ui'
import { Policy } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { compose, emojize, filesize, useHistoryState, useResponsiveValue } from '@sensorr/utils'
import { useAPI, query as APIQuery } from '../../store/api'
import { useSensorr } from '../../store/sensorr'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import { withBody } from '../../layout/withLayout'
import { Active, Compact, EMOJI, Gestures, GroupTitle, VERDICTS, useLoadDetails } from './Card'
import { GROUPS, Verdict, arrange, decide, itemOf } from './queue'

const MB = 1024 * 1024

const FIELDS = ['id', 'title', 'original_title', 'poster_path', 'release_date', 'genres', 'updated_at', 'refined_at', 'shrinked_at', 'releases', 'policy', 'banned_releases', 'state']

const THRESHOLDS = [0, 250 * MB, 500 * MB, 1024 * MB, 2048 * MB]

const DEFAULTS = {
  threshold: 500 * MB,
  sort_by: { value: 'gain', sort: true },
}

const LABELS = {
  record: 'record',
  refine: 'refine',
  shrink: 'shrink',
  rest: 'same language',
}

const DELAY = 5000

// The band and collapse durations of Card.tsx, after which the leaving card is dropped.
const LEAVE = 400

const GROUP_HEIGHT = 40
const COMPACT_HEIGHT = 80
const ACTIVE_HEIGHT = 360

const UIThreshold = ({ value, onChange, style = {}, ...props }) => (
  <div style={style} sx={UIThreshold.styles.element}>
    <label htmlFor='threshold'>Same size below</label>
    <div>
      <span>{value ? filesize.stringify(value) : 'nothing changes'}</span>
      <select id='threshold' value={value} onChange={e => onChange(Number(e.target.value))}>
        {THRESHOLDS.map(threshold => (
          <option key={threshold} value={threshold}>{threshold ? filesize.stringify(threshold) : 'nothing changes'}</option>
        ))}
      </select>
    </div>
  </div>
)

UIThreshold.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    marginY: 4,
    borderRadius: '0.25em',
    ':hover': {
      backgroundColor: 'accent',
    },
    '>label': {
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      marginLeft: 4,
      marginRight: 8,
    },
    '>div': {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      paddingX: 4,
      borderTopRightRadius: '0.25em',
      borderBottomRightRadius: '0.25em',
      ':hover': {
        backgroundColor: 'accentDark',
      },
      '>span': {
        fontFamily: 'monospace',
        fontSize: 4,
        fontWeight: 'semibold',
      },
      '>select': {
        variant: 'select.reset',
        position: 'absolute',
        width: '100%',
        right: '0px',
        opacity: 0,
        fontSize: 4,
      },
    },
  },
}

const fields = {
  threshold: {
    initial: DEFAULTS.threshold,
    serialize: () => ({}),
    component: UIThreshold,
  },
  sort_by: {
    initial: DEFAULTS.sort_by,
    serialize: () => ({}),
    component: withProps({
      options: [
        { label: emojize('💎', 'Gain'), value: 'gain' },
        { label: i18n.t('ui.sortings.updated_at'), value: 'updated_at' },
      ],
    })(Sorting),
  },
}

const layout = {
  nav: {
    display: 'grid',
    gridTemplateColumns: ['min-content min-content min-content', '1fr min-content min-content min-content'],
    gridTemplateRows: 'auto',
    gap: '2em',
    gridTemplateAreas: [
      `"results threshold sort_by"`,
      `"title results threshold sort_by"`,
    ],
    '>h4': {
      display: ['none', 'block'],
    },
  },
}

const online = {
  subscribe: (callback) => {
    window.addEventListener('online', callback)
    window.addEventListener('offline', callback)
    return () => {
      window.removeEventListener('online', callback)
      window.removeEventListener('offline', callback)
    }
  },
  get: () => navigator.onLine,
}

const omit = (object, ids) => Object.keys(object).filter(key => !ids.map(String).includes(key)).reduce((acc, key) => ({ ...acc, [key]: object[key] }), {})

const UIProposals = ({ entities = {}, ready = true, error = null, ...props }) => {
  const sensorr = useSensorr()
  const { metadata, setMovieMetadata } = useMoviesMetadataContext() as any
  const { ref: body } = useScrollPositionContext()
  const loadDetails = useLoadDetails()
  const mobile = useResponsiveValue([true, false])
  const connected = useSyncExternalStore(online.subscribe, online.get)
  const [values, setValues] = useHistoryState('proposals', DEFAULTS) as any
  const threshold = typeof values?.threshold === 'number' ? values.threshold : DEFAULTS.threshold
  const sort = values?.sort_by?.value || DEFAULTS.sort_by.value
  const descending = typeof values?.sort_by?.sort === 'boolean' ? values.sort_by.sort : DEFAULTS.sort_by.sort

  const [skipped, setSkipped] = useState({})
  const [decided, setDecided] = useState({})
  const [leaving, setLeaving] = useState({})
  const [collapsed, setCollapsed] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [session, setSession] = useState({ accept: 0, refuse: 0, ban: 0 })
  const pending = useRef(null)
  const lastIndex = useRef(0)
  const skips = useRef(0)

  // Keyed on the releases array, so a SSE change only recomputes the movies it touched.
  const policies = useMemo(() => new Map(), [sensorr.policies])
  const cache = useRef(new WeakMap())

  const items = useMemo(() => Object.values(entities).map((entity: any) => {
    const source = metadata[entity.id] || entity
    const releases = source.releases || []
    const cached = cache.current.get(releases)

    if (cached?.entity === entity && cached?.name === source.policy) {
      return cached.item
    }

    if (!policies.has(source.policy)) {
      policies.set(source.policy, new Policy(source.policy || '', sensorr.policies))
    }

    const item = { ...itemOf(entity, releases, policies.get(source.policy)), source }
    cache.current.set(releases, { entity, name: source.policy, item })
    return item
  }).filter(item => !!item.proposal), [entities, metadata, policies])

  const groups = useMemo(() => arrange(
    items.filter(item => !decided[item.id] || leaving[item.id]),
    { threshold, sort, descending, skipped },
  ), [items, decided, leaving, threshold, sort, descending, skipped])

  const rows = useMemo(() => groups.reduce((rows, { group, items }) => {
    const count = items.filter(item => !leaving[item.id]).length

    if (!items.length) {
      return rows
    }

    return [
      ...rows,
      { type: 'group', group, count },
      ...(collapsed[group] ? [] : items.map(item => ({ type: 'item', item, leaving: leaving[item.id] || null }))),
    ]
  }, []), [groups, collapsed, leaving])

  const queue = useMemo(() => rows.filter(row => row.type === 'item' && !row.leaving).map(row => row.item), [rows])
  const found = queue.findIndex(item => item.id === activeId)
  const activeIndex = found !== -1 ? found : Math.min(lastIndex.current, queue.length - 1)
  const active = queue[activeIndex] || null

  useEffect(() => {
    lastIndex.current = Math.max(0, activeIndex)
  }, [activeIndex])

  useEffect(() => {
    queue.slice(activeIndex, activeIndex + 3).forEach(item => loadDetails(item.id)?.catch(() => null))
  }, [queue, activeIndex])

  // Treated from another tab or by a job: the proposal left the metadata.
  const previous = useRef(null)
  useEffect(() => {
    const id = previous.current?.id

    if (id && !decided[id] && !items.some(item => item.id === id)) {
      toast(<span>{emojize('🛎️', `${previous.current.entity?.title} was treated elsewhere`)}</span>, { id: 'proposal-elsewhere' })
    }

    previous.current = active
  }, [items, active?.id])

  const send = useCallback(async ({ targets, verdict }) => {
    try {
      await Promise.all(targets.map(item => setMovieMetadata(item.id, null, () => decide(item.source, item.proposal.id, verdict))))
      setSession(session => ({ ...session, [verdict]: session[verdict] + targets.length }))
    } catch (e) {
      setDecided(decided => omit(decided, targets.map(({ id }) => id)))
      setActiveId(targets[0].id)
      toast.error(`Error while sending **${VERDICTS[verdict].label}** for ${targets.length > 1 ? `**${targets.length}** proposals` : `**${targets[0].entity?.title}**`}`)
    }
  }, [setMovieMetadata])

  const flush = useCallback(() => {
    const current = pending.current

    if (!current) {
      return
    }

    clearTimeout(current.timer)
    pending.current = null
    send(current)
  }, [send])

  const undo = useCallback(() => {
    const current = pending.current

    if (!current) {
      return
    }

    clearTimeout(current.timer)
    pending.current = null
    toast.dismiss('proposal-pending')
    setDecided(decided => omit(decided, current.targets.map(({ id }) => id)))
    setLeaving(leaving => omit(leaving, current.targets.map(({ id }) => id)))
    setActiveId(current.targets[0].id)
  }, [])

  // Leaving the page sends what is waiting rather than dropping it; closing the tab
  // asks first, so the request has time to leave.
  useEffect(() => () => flush(), [flush])

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (pending.current) {
        flush()
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [flush])

  const decideTargets = useCallback((targets, verdict: Verdict) => {
    if (!connected || !targets.length) {
      return
    }

    flush()

    const ids = targets.map(({ id }) => id)
    setDecided(decided => ({ ...decided, ...ids.reduce((acc, id) => ({ ...acc, [id]: verdict }), {}) }))

    if (targets.length === 1) {
      setLeaving(leaving => ({ ...leaving, [ids[0]]: verdict }))
      setTimeout(() => setLeaving(leaving => omit(leaving, ids)), LEAVE)
    }

    pending.current = { targets, verdict, timer: setTimeout(flush, DELAY) }

    const { emoji, label } = VERDICTS[verdict]
    const message = (
      <span sx={UIProposals.styles.toast}>
        <span>{emojize(emoji, label)} · {targets.length > 1 ? `${targets.length} proposals` : targets[0].entity?.title}</span>
        <Button variant='outline' color='gray' onClick={undo}>Undo<code>Z</code></Button>
      </span>
    )

    ;({ accept: toast.success, refuse: toast, ban: toast.error }[verdict] as any)(message, { id: 'proposal-pending', duration: DELAY })
  }, [connected, flush, undo])

  const onGesture = useCallback((gesture) => {
    if (!active) {
      return
    }

    if (gesture === 'skip') {
      setActiveId(queue[activeIndex + 1]?.id ?? null)
      setSkipped(skipped => ({ ...skipped, [active.id]: ++skips.current }))
      return
    }

    setActiveId(queue[activeIndex + 1]?.id ?? null)
    decideTargets([active], gesture)
  }, [active, activeIndex, queue, decideTargets])

  const onToggle = useCallback((group) => {
    if (!collapsed[group] && active && groups.find(({ items }) => items.includes(active))?.group === group) {
      const next = groups.slice(GROUPS.indexOf(group) + 1).find(({ group }) => !collapsed[group] && group)?.items.find(item => !leaving[item.id])
      setActiveId(next?.id ?? null)
    }

    setCollapsed(collapsed => ({ ...collapsed, [group]: !collapsed[group] }))
  }, [collapsed, active, groups, leaving])

  const keys = useRef(null)
  keys.current = { onGesture, undo }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable) {
        return
      }

      const gesture = { a: 'accept', r: 'refuse', b: 'ban', s: 'skip', arrowdown: 'skip' }[e.key.toLowerCase()]

      if (e.key.toLowerCase() === 'z') {
        e.preventDefault()
        keys.current.undo()
      } else if (gesture) {
        e.preventDefault()
        keys.current.onGesture(gesture)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const list = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const stickies = useMemo(() => rows.map((row, index) => row.type === 'group' ? index : null).filter(index => index !== null), [rows])
  const sticky = useRef(0)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => body.current,
    estimateSize: (index) => rows[index]?.type === 'group' ? GROUP_HEIGHT : rows[index]?.item === active ? ACTIVE_HEIGHT : COMPACT_HEIGHT,
    getItemKey: (index) => rows[index]?.type === 'group' ? `group-${rows[index].group}` : rows[index]?.item.id ?? index,
    overscan: 6,
    scrollMargin,
    scrollPaddingStart: GROUP_HEIGHT + (mobile ? 0 : 76),
    rangeExtractor: useCallback((range) => {
      sticky.current = [...stickies].reverse().find(index => range.startIndex >= index) ?? 0
      return [...new Set([sticky.current, ...defaultRangeExtractor(range)])].sort((a, b) => a - b)
    }, [stickies]),
  })

  // The list shares `#body` with the green bar above it, hence the scroll margin.
  useLayoutEffect(() => {
    if (!list.current || !body.current) {
      return
    }

    const compute = () => {
      const offset = list.current.getBoundingClientRect().top - body.current.getBoundingClientRect().top + body.current.scrollTop
      setScrollMargin((previous) => (Math.abs(previous - offset) > 1 ? offset : previous))
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(body.current)
    return () => observer.disconnect()
  }, [ready, rows.length > 0])

  useEffect(() => {
    const index = rows.findIndex(row => row.type === 'item' && row.item === active)

    if (index !== -1 && activeId === active?.id) {
      virtualizer.scrollToIndex(index, { align: 'auto' })
    }
  }, [activeId])

  const total = Object.values(session).reduce((sum: number, count: number) => sum + count, 0) as number

  if (error) {
    return (
      <Warning emoji='🚨' title='Error' subtitle={error?.message || `${error}`}>
        <Button variant='outline' color='gray' onClick={() => window.location.reload()}>Retry</Button>
      </Warning>
    )
  }

  const nav = (
    <Controls
      title='Proposals'
      layout={layout as any}
      fields={fields as any}
      values={{ threshold, sort_by: { value: sort, sort: descending } }}
      onChange={(next) => setValues({ ...values, ...next })}
      statistics={{}}
      loading={!ready}
      total={ready ? items.filter(item => !decided[item.id]).length : null}
    />
  )

  if (!ready) {
    return (
      <>
        {nav}
        <div sx={UIProposals.styles.skeletons}>
          <span data-group /><span data-active /><span /><span /><span /><span /><span data-group /><span data-group />
        </div>
      </>
    )
  }

  if (!rows.length) {
    return (
      <>
        {nav}
        {total ? (
          <Warning
            emoji='📼'
            title='All decided'
            subtitle={Object.keys(session).filter(verdict => session[verdict]).map(verdict => `${session[verdict]} ${VERDICTS[verdict].label.toLowerCase()}`).join(' · ')}
          />
        ) : (
          <Warning
            emoji='📭'
            title='Nothing to decide'
            subtitle={<span>Jobs with <code>proposalOnly</code> set wait here for a choice, see <Link to='/settings/jobs'>job settings</Link></span>}
          />
        )}
      </>
    )
  }

  return (
    <>
      {nav}
      <div ref={list} sx={UIProposals.styles.element}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
          {virtualizer.getVirtualItems().map((virtual) => {
            const row = rows[virtual.index]
            const stuck = row.type === 'group' && virtual.index === sticky.current

            return (
              <div
                key={virtual.key}
                data-index={virtual.index}
                ref={virtualizer.measureElement}
                sx={stuck ? UIProposals.styles.sticky : {}}
                style={stuck ? {} : {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtual.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                {row.type === 'group' ? (
                  <GroupTitle
                    group={row.group}
                    emoji={EMOJI[row.group] || '🟰'}
                    label={row.group === 'rest' ? (threshold ? `${LABELS.rest}, ±${filesize.stringify(threshold)}` : `${LABELS.rest}, nothing changes`) : LABELS[row.group]}
                    count={row.count}
                    open={!collapsed[row.group]}
                    onToggle={() => onToggle(row.group)}
                    menu={row.group === 'rest' ? (
                      <Tippy
                        interactive={true}
                        trigger='click'
                        placement='bottom'
                        appendTo={document.body}
                        content={(
                          <div sx={UIProposals.styles.menu}>
                            <Button variant='outline' color='gray' disabled={!connected} onClick={() => decideTargets(groups.find(({ group }) => group === 'rest').items.filter(item => !leaving[item.id]), 'refuse')}>
                              Refuse all {row.count}
                            </Button>
                            <Button variant='contain' color='primary' disabled={!connected} onClick={() => decideTargets(groups.find(({ group }) => group === 'rest').items.filter(item => !leaving[item.id]), 'accept')}>
                              Accept all {row.count}
                            </Button>
                          </div>
                        )}
                      >
                        <button type='button' data-menu={true} aria-label='Decide the whole group'>
                          <Icon value='more' width='1em' height='1em' />
                        </button>
                      </Tippy>
                    ) : null}
                  />
                ) : (row.leaving || row.item === active) ? (
                  <Active
                    item={row.item}
                    entity={row.item.entity}
                    leaving={row.leaving}
                    mobile={mobile}
                    disabled={!connected}
                    onGesture={onGesture}
                  />
                ) : (
                  <Compact item={row.item} onSelect={setActiveId} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {mobile && !!active && (
        <Gestures onGesture={onGesture} disabled={!connected} sx={UIProposals.styles.bar} />
      )}
    </>
  )
}

UIProposals.styles = {
  element: {
    flex: 1,
    width: '100%',
    maxWidth: '105em',
    alignSelf: 'center',
    paddingX: [8, 4],
    paddingY: 4,
  },
  sticky: {
    position: 'sticky',
    top: ['0px', '4.75rem'],
    zIndex: 2,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    fontSize: 5,
    '>button': {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 8,
      '>code': {
        fontFamily: 'monospace',
        opacity: 0.5,
      },
    },
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 8,
  },
  bar: {
    position: 'sticky',
    bottom: '0em',
    zIndex: 3,
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    paddingX: 8,
    paddingY: 8,
    backgroundColor: 'grayLighter',
    borderTop: '1px solid',
    borderColor: 'grayDark',
    '>button': {
      flex: 1,
      justifyContent: 'center',
      paddingX: 8,
    },
  },
  skeletons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
    width: '100%',
    maxWidth: '105em',
    alignSelf: 'center',
    paddingX: [8, 4],
    paddingY: 4,
    '>span': {
      height: `${COMPACT_HEIGHT}px`,
      backgroundImage: (theme) => `linear-gradient(90deg, ${theme.rawColors.grayLighter} 0%, ${theme.rawColors.grayLight} 50%, ${theme.rawColors.grayLighter} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'sensorr-proposals-shimmer 1.4s ease-in-out infinite',
      '&[data-group]': { height: `${GROUP_HEIGHT}px` },
      '&[data-active]': { height: `${ACTIVE_HEIGHT}px` },
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    },
    '@keyframes sensorr-proposals-shimmer': {
      '0%': { backgroundPosition: '200% 0' },
      '100%': { backgroundPosition: '-200% 0' },
    },
  },
}

const Proposals = compose(
  withTitle('Proposals'),
  withBody(),
  withFetchQuery(APIQuery.movies.getMovies({ params: { 'releases.proposal': true, limit: 10000, fields: FIELDS.join('|') } }), 1, useAPI, undefined, 10000),
)(UIProposals)

export default Proposals
