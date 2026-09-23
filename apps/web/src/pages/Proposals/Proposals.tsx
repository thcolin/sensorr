import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import Tippy from '@tippyjs/react'
import toast from 'react-hot-toast'
import { Button, Controls, Icon, Link, Range, Slider, Sorting, Warning } from '@sensorr/ui'
import { Global } from 'theme-ui'
import { Policy } from '@sensorr/sensorr'
import { compose, emojize, filesize, useHistoryState, useResponsiveValue } from '@sensorr/utils'
import { useAPI, query as APIQuery } from '../../store/api'
import { useSensorr } from '../../store/sensorr'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import { withBody } from '../../layout/withLayout'
import { Active, Compact, EMOJI, GroupPlaceholder, GroupTitle, Overdue, Placeholder, VERDICTS, delta, morph, useLoadDetails } from './Card'
import { Gestures } from '../../components/Sensorr/Gestures'
import { SensorrSingleton } from '../../components/Sensorr'
import { DubFilter, EncodingFilter, FlagsFilter, LanguageFilter, ResolutionFilter, SourceFilter, ZNABFilter } from '../../components/Sensorr/Controls/Oleoo'
import { FILTERS, GROUPS, SIZE_MAX, Verdict, arrange, balanceOf, decide, isOverdue, itemOf, matches } from './queue'

const MB = 1024 * 1024

const FIELDS = ['id', 'title', 'original_title', 'poster_path', 'release_date', 'genres', 'updated_at', 'refined_at', 'shrinked_at', 'releases', 'policy', 'banned_releases', 'state']

const THRESHOLDS = [0, 250 * MB, 500 * MB, 1024 * MB, 2048 * MB]

const SIDES = {
  current: { emoji: '📀', title: 'Current release', subtitle: 'Keep the swaps where at least one owned release matches these rules' },
  proposed: { emoji: '💿', title: 'Proposed release', subtitle: 'Keep the swaps whose proposed release matches these rules' },
}

const DEFAULTS = {
  threshold: 500 * MB,
  sort_by: { value: 'time', sort: true },
  ...Object.keys(SIDES).reduce((acc, side) => ({
    ...acc,
    [`${side}_size`]: [0, SIZE_MAX],
    ...FILTERS.reduce((acc, filter) => ({ ...acc, [`${side}_${filter}`]: [] }), {}),
  }), {}),
}

const LABELS = {
  refine: 'refine',
  shrink: 'shrink',
  rest: 'ignored',
  overdue: 'overdue',
}

const DELAY = 5000

// The verdict band slides in for 150ms (Card.tsx) and stays a moment before the card goes.
const LEAVE = 250

// How long a card waits for its movie before opening without it, so it opens at its height.
const PRELOAD = 300

const GROUP_HEIGHT = 40
// Card.tsx gives the compact row a third line on a phone.
const COMPACT_HEIGHT = [108, 88]
const ACTIVE_HEIGHT = 300

// Title then pill widths, in em, for the rows drawn while the queue loads: enough to fill a screen.
const SHAPES = [[9, 6.5, 6.5], [7, 11.5, 5.5, 9], [11, 9, 6], [16, 9, 6, 5.5], [8, 9, 5.5, 5.5], [10, 11.5, 6.5, 6.5], [9.5, 6.5], [11.5, 9, 7], [6.5, 11.5, 6], [13, 9, 6.5]]

// A proposal that frees less disk space than this goes to the ignored group; one that grows keeps its group.
const UIThreshold = ({ value, onChange, style = {}, ...props }) => {
  const index = Math.max(0, THRESHOLDS.indexOf(value))
  const [draft, setDraft] = useState(index)

  useEffect(() => setDraft(index), [index])

  return (
    <div style={style} sx={UIThreshold.styles.element} title='A proposal that frees less disk space than this is ignored'>
      <label id='threshold-label'>Ignore below (gain)</label>
      <div>
        <Slider
          aria-labelledby='threshold-label'
          value={draft}
          min={0}
          max={THRESHOLDS.length - 1}
          step={1}
          marks={true}
          onChange={(e, next) => setDraft(next as number)}
          onChangeCommitted={(e, next) => onChange(THRESHOLDS[next as number])}
          getAriaValueText={(next) => THRESHOLDS[next] ? filesize.stringify(THRESHOLDS[next]) : 'no change'}
        />
      </div>
      <code>{THRESHOLDS[draft] ? filesize.stringify(THRESHOLDS[draft]) : 'no change'}</code>
    </div>
  )
}

UIThreshold.styles = {
  // On a phone the label wraps and the slider narrows, so the value stays on screen.
  element: {
    display: 'flex',
    alignItems: 'center',
    gap: [8, 4],
    height: '100%',
    whiteSpace: 'nowrap',
    '>label': {
      whiteSpace: ['normal', 'nowrap'],
      maxWidth: ['6.5em', 'none'],
      lineHeight: ['heading', 'inherit'],
    },
    '>div': {
      display: 'flex',
      alignItems: 'center',
      width: ['5em', '8em'],
      paddingX: 8,
    },
    '>code': {
      minWidth: ['0em', '5.5em'],
      fontFamily: 'monospace',
      fontSize: 4,
      fontWeight: 'semibold',
    },
  },
}

// The disk now, then what each command moves: a lighter group eats into it before the
// tick, a heavier one runs past it. Same stroke as the slider next to it.
const UIBalance = ({ balance, compact = false, style = {}, ...props }) => {
  const commands = ['refine', 'shrink'].filter(command => balance[command])
  const frees = commands.filter(command => balance[command] < 0)
  const takes = commands.filter(command => balance[command] > 0)
  const freed = frees.reduce((sum, command) => sum - balance[command], 0)
  const max = balance.now + takes.reduce((sum, command) => sum + balance[command], 0)
  const width = (bytes) => `${(100 * bytes / max).toFixed(2)}%`

  if (!balance.now) {
    return null
  }

  return (
    <div style={style} sx={{ ...UIBalance.styles.element, ...(props.inline ? UIBalance.styles.inline : {}) }} title={`The Plex files of these movies weigh ${filesize.stringify(balance.now)}, and ${filesize.stringify(balance.after)} once every swap is accepted`}>
      <div sx={UIBalance.styles.meter}>
        <div sx={{ ...UIBalance.styles.rail, height: compact ? '0.25em' : '0.5em' }}>
          <i sx={UIBalance.styles.kept} style={{ width: width(balance.now - freed) }} />
          {frees.map(command => <i key={command} sx={UIBalance.styles.frees} style={{ width: width(-balance[command]) }} />)}
          {takes.map(command => <i key={command} sx={UIBalance.styles.takes} style={{ width: width(balance[command]) }} />)}
        </div>
        <span sx={UIBalance.styles.tick} style={{ left: width(balance.now) }} />
        {!compact && (
          <>
            <small sx={{ ...UIBalance.styles.label, bottom: 'calc(100% + 0.75em)' }} style={{ right: `calc(100% - ${width(balance.now)})` }}>
              now <code>{filesize.stringify(balance.now)}</code>
            </small>
            <small sx={{ ...UIBalance.styles.label, top: 'calc(100% + 0.75em)', right: '0%' }}>
              after <code>{filesize.stringify(balance.after)}</code>
            </small>
          </>
        )}
      </div>
      <span sx={UIBalance.styles.chips}>
        {commands.map(command => (
          <span key={command} sx={UIBalance.styles.chip}>
            <i sx={balance[command] < 0 ? UIBalance.styles.frees : UIBalance.styles.takes} />
            {command} <code>{delta(balance[command])}</code>
          </span>
        ))}
      </span>
    </div>
  )
}

const FREES = 'hsla(0, 0%, 100%, 0.45)'
const TAKES = 'repeating-linear-gradient(-45deg, hsla(0, 0%, 100%, 1) 0 2px, hsla(0, 0%, 100%, 0.18) 2px 5px)'

UIBalance.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    maxWidth: '36em',
    whiteSpace: 'nowrap',
  },
  // In the bar on a desktop; a phone gives it a strip of its own under the bar.
  inline: {
    display: ['none', 'flex'],
  },
  meter: {
    position: 'relative',
    flex: 1,
    minWidth: '6em',
  },
  rail: {
    display: 'flex',
    borderRadius: '1em',
    overflow: 'hidden',
    backgroundColor: 'hsla(0, 0%, 0%, 0.16)',
    '>i': {
      height: '100%',
    },
    '>i+i': {
      marginLeft: '2px',
    },
  },
  kept: {
    backgroundColor: 'whitePure',
  },
  frees: {
    background: FREES,
    minWidth: '4px',
  },
  takes: {
    background: TAKES,
  },
  // A gap in the primary green on both sides, so the tick reads over any fill.
  tick: {
    position: 'absolute',
    top: '-0.375em',
    bottom: '-0.375em',
    width: '2px',
    marginLeft: '-1px',
    borderRadius: '1px',
    backgroundColor: 'whitePure',
    boxShadow: theme => `0 0 0 2px ${theme.rawColors.primary}`,
  },
  label: {
    position: 'absolute',
    fontSize: 7,
    lineHeight: 1,
    '>code': {
      fontFamily: 'monospace',
      fontWeight: 'semibold',
    },
  },
  chips: {
    display: 'flex',
    gap: 8,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    paddingX: 8,
    paddingY: 10,
    borderRadius: '2em',
    backgroundColor: 'hsla(0, 0%, 0%, 0.16)',
    fontSize: 6,
    '>i': {
      width: '1.4em',
      height: '0.6em',
      borderRadius: '1em',
    },
    '>code': {
      fontFamily: 'monospace',
      fontWeight: 'semibold',
    },
  },
}

const SizeFilter = ({ ...props }) => (
  <Range
    {...props as any}
    min={0}
    max={SIZE_MAX}
    marks={[...Array(SIZE_MAX).fill(true).map((foo, value) => ({ value }))]}
    data={null}
    label={emojize('📦', 'Size')}
    labelize={(value) => `${value} GB`}
    value={props.value || [0, SIZE_MAX]}
    step={null}
  />
)

const COMPONENTS = {
  znab: ZNABFilter,
  resolution: ResolutionFilter,
  source: SourceFilter,
  encoding: EncodingFilter,
  dub: DubFilter,
  language: LanguageFilter,
  flags: FlagsFilter,
}

const fields = {
  threshold: {
    initial: DEFAULTS.threshold,
    serialize: () => ({}),
    hideFromFiltersCount: true,
    component: UIThreshold,
  },
  sort_by: {
    initial: DEFAULTS.sort_by,
    serialize: () => ({}),
    // Sorting drops `style`, which carries the grid area.
    component: ({ style, ...props }) => (
      <div style={style} sx={{ display: 'grid', height: '100%' }}>
        <Sorting
          {...props as any}
          options={[
            { label: emojize('📅', 'Processed'), value: 'time' },
            { label: emojize('📦', 'Space freed'), value: 'gain' },
          ]}
        />
      </div>
    ),
  },
  ...Object.keys(SIDES).reduce((acc, side) => ({
    ...acc,
    [`head_${side}`]: {
      initial: null,
      component: () => (
        <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 }, gridArea: `head_${side}` }}>
          <Warning emoji={SIDES[side].emoji} title={SIDES[side].title} subtitle={SIDES[side].subtitle} />
        </div>
      ),
    },
    [`${side}_size`]: {
      initial: DEFAULTS[`${side}_size`],
      serialize: () => ({}),
      component: SizeFilter,
    },
    ...FILTERS.reduce((acc, filter) => ({
      ...acc,
      [`${side}_${filter}`]: {
        initial: [],
        serialize: () => ({}),
        component: COMPONENTS[filter],
      },
    }), {}),
  }), {}),
}

const rows = ['head', 'size', ...FILTERS]
const area = (row, side) => row === 'head' ? `head_${side}` : `${side}_${row}`

const layout = {
  nav: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr) min-content', 'min-content minmax(0, 1fr) min-content min-content min-content min-content'],
    gridTemplateRows: 'auto',
    gap: ['1em', '2em'],
    // A phone has no room for the slider and the sorting in the bar: they move to the top of the filters.
    gridTemplateAreas: [
      `"results toggle"`,
      `"title balance results threshold toggle sort_by"`,
    ],
    '>h4': {
      display: ['none', 'block'],
    },
  },
  // Both sides open as one pane, each filter of the current release facing its proposed
  // counterpart on a darker half; a phone stacks them.
  aside: {
    display: 'grid',
    width: ['100vw', '50em'],
    background: [null, 'linear-gradient(to right, var(--theme-ui-colors-primary) 50%, var(--theme-ui-colors-primaryDark) 50%)'],
    gridTemplateColumns: ['minmax(0, 1fr)', 'minmax(0, 1fr) minmax(0, 1fr)'],
    gridTemplateRows: 'auto',
    gap: '2em',
    gridTemplateAreas: [
      ['sort_by', 'threshold', ...rows.map(row => area(row, 'current')), ...rows.map(row => area(row, 'proposed'))].map(name => `"${name}"`).join(' '),
      rows.map(row => `"${area(row, 'current')} ${area(row, 'proposed')}"`).join(' '),
    ],
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

// The card moves at the pace of the route changes (libs/theme modules.css); its own
// content shows as the row's edge uncovers it, and a decided card folds away upward as
// the rows below take its place.
const MORPH = {
  // A poster mounted by the move fades in from grey on its own; its image is already
  // decoded (Card.tsx), so it shows at once and the move carries the change.
  'html[data-morphing] [data-morph-poster] *': {
    transition: 'none !important',
  },
  // The 2:3 box of the poster in both forms: Movie's box with its badges drawn over it,
  // and the row's picture. The frame around Movie's box is wider, so it is not the one.
  'div[data-morph-poster] > div > div:first-child, span[data-morph-poster] > span:first-child': {
    viewTransitionName: 'var(--morph-poster, none)',
    viewTransitionClass: 'poster',
  },
  '::view-transition-group(*)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // A pseudo-element takes the class of the new state: `card` is the row opening,
  // `closing` the one that was open. In both, what only the full card draws goes first
  // or comes last, so the row's edge moves with the elements it carries.
  '::view-transition-image-pair(*.card), ::view-transition-image-pair(*.closing), ::view-transition-image-pair(*.row)': {
    overflow: 'hidden',
  },
  '::view-transition-old(*.card), ::view-transition-old(*.closing)': {
    animation: '150ms ease-out both sensorr-morph-out',
  },
  '::view-transition-new(*.card)': {
    animation: '250ms ease-out both sensorr-morph-in',
  },
  '::view-transition-new(*.closing)': {
    animation: '250ms ease-out 150ms both sensorr-morph-in',
  },
  '::view-transition-old(*.row):only-child, ::view-transition-old(*.card):only-child': {
    animation: '300ms cubic-bezier(0.4, 0, 0.2, 1) both sensorr-morph-fold',
  },
  '@keyframes sensorr-morph-out': { to: { opacity: 0 } },
  '@keyframes sensorr-morph-in': { from: { opacity: 0 } },
  '@keyframes sensorr-morph-fold': { to: { opacity: 0, clipPath: 'inset(0 0 100% 0)' } },
  '@media (prefers-reduced-motion: reduce)': {
    '::view-transition-group(*)': { animation: 'none' },
    '::view-transition-old(*), ::view-transition-new(*)': { animationDuration: '150ms', animationDelay: '0s' },
  },
}

const omit = (object, ids) => Object.keys(object).filter(key => !ids.map(String).includes(key)).reduce((acc, key) => ({ ...acc, [key]: object[key] }), {})

const UIProposals = ({ entities = {}, ready = true, error = null, ...props }) => {
  const api = useAPI()
  const sensorr = useSensorr()
  const { metadata, setMovieMetadata } = useMoviesMetadataContext() as any
  const { ref: body } = useScrollPositionContext()
  const loadDetails = useLoadDetails()
  const mobile = useResponsiveValue([true, false])
  const connected = useSyncExternalStore(online.subscribe, online.get)
  const [stored, setValues] = useHistoryState('proposals', DEFAULTS) as any
  const values = useMemo(() => ({ ...DEFAULTS, ...stored }), [stored])
  const threshold = typeof values.threshold === 'number' ? values.threshold : DEFAULTS.threshold

  const [skipped, setSkipped] = useState({})
  const [decided, setDecided] = useState({})
  const [leaving, setLeaving] = useState({})
  const [collapsed, setCollapsed] = useState({ rest: true, overdue: true })
  const [activeId, setActiveId] = useState(null)
  const [focus, setFocus] = useState([])
  const [session, setSession] = useState({ accept: 0, refuse: 0, ban: 0, retry: 0, drop: 0 })
  const [overdue, setOverdue] = useState([])
  const toggleSensorr = useRef(null)
  const pending = useRef(null)
  const keys = useRef(null)
  const decidedRef = useRef({})
  const lastIndex = useRef(0)
  const skips = useRef(0)

  // An overdue swap is no longer a proposal, so its movie is fetched on its own.
  useEffect(() => {
    const { uri, params, init } = APIQuery.movies.getMovies({ params: { 'releases.overdue': true, limit: 1000, fields: FIELDS.join('|') } })

    api.fetch(uri, params, init)
      .then(res => setOverdue(res.results || []))
      .catch((error) => {
        console.warn(error)
        toast.error('Error while loading the overdue swaps')
      })
  }, [])

  // Keyed on the releases array, so a SSE change only recomputes the movies it touched.
  const policies = useMemo(() => new Map(), [sensorr.policies])
  const cache = useRef(new WeakMap())

  const all = useMemo(() => [...Object.values(entities), ...overdue].map((entity: any) => {
    const source = metadata[entity.id] || entity
    const releases = source.releases || []
    const cached = cache.current.get(releases)

    if (!policies.has(source.policy)) {
      policies.set(source.policy, new Policy(source.policy || '', sensorr.policies))
    }

    if (cached?.entity === entity && cached?.policy === policies.get(source.policy)) {
      return cached.item
    }

    const item = { ...itemOf(entity, releases, policies.get(source.policy)), source }
    cache.current.set(releases, { entity, policy: policies.get(source.policy), item })
    return item
  }).filter((item, index, all) => !!item.proposal && item.command !== 'record' && all.findIndex(({ id }) => id === item.id) === index), [entities, overdue, metadata, policies])

  const items = useMemo(() => all.filter(item => matches(item, values)), [all, values])

  const groups = useMemo(() => arrange(
    items.filter(item => !decided[item.id] || leaving[item.id]),
    { threshold, skipped, sort_by: values.sort_by },
  ), [items, decided, leaving, threshold, skipped, values.sort_by])

  const balance = useMemo(() => balanceOf(items.filter(item => !decided[item.id])), [items, decided])
  const Balance = useCallback(({ style }) => <UIBalance balance={balance} style={style} inline={true} />, [balance])

  const rows = useMemo(() => groups.reduce((rows, { group, items }) => {
    const count = items.filter(item => !leaving[item.id]).length

    if (!items.length) {
      return rows
    }

    return [
      ...rows,
      { type: 'group', group, count },
      ...(collapsed[group] ? [] : items.map(item => ({ type: 'item', group, item, leaving: leaving[item.id] || null }))),
    ]
  }, []), [groups, collapsed, leaving])

  // An overdue swap never opens into a card, so the keyboard skips it.
  const queue = useMemo(() => rows.filter(row => row.type === 'item' && !row.leaving && row.group !== 'overdue').map(row => row.item), [rows])
  const found = queue.findIndex(item => item.id === activeId)
  // `null` means every card is closed; an id that left the queue falls back to its neighbour.
  const activeIndex = activeId === null ? -1 : found !== -1 ? found : Math.min(lastIndex.current, queue.length - 1)
  // The decided card keeps the place until it leaves: the next one opens as it goes.
  const active = leaving[activeId] ? null : queue[activeIndex] || null

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

  // The release picked in the drawer takes the place of the overdue swap, as a swap of the
  // same command, so that it replaces what Plex has once it lands.
  const search = useCallback((e, item) => toggleSensorr.current?.(e, item.entity, (release) => setMovieMetadata(item.id, 'releases', (current) => [
    ...((current?.releases ? current : item.source).releases || []).filter(({ id }) => id !== item.proposal.id),
    { ...release, from: item.command, job: 'manual', proposal: true, choice: true },
  ])), [setMovieMetadata])

  // The latest metadata is what gets written, so a release added or a ban set meanwhile
  // survives; the loaded document stands in until the metadata context has the movie.
  const send = useCallback(async ({ targets, verdict }) => {
    const results = await Promise.allSettled(targets.map(item => setMovieMetadata(item.id, null, (current) => decide(current?.releases ? current : item.source, item.proposal.id, verdict))))
    const failed = targets.filter((item, index) => results[index].status === 'rejected')

    // Sent or not, the metadata now says where each movie stands: `decided` only covered the wait.
    decidedRef.current = omit(decidedRef.current, targets.map(({ id }) => id))
    setDecided(decided => omit(decided, targets.map(({ id }) => id)))
    setSession(session => ({ ...session, [verdict]: session[verdict] + targets.length - failed.length }))

    if (failed.length && verdict === 'retry') {
      toast.error((
        <span sx={UIProposals.styles.toast}>
          <span>Retry failed for <strong>{failed[0].entity?.title}</strong>, the indexer may no longer have its .torrent</span>
          <span>
            <Button variant='outline' color='gray' onClick={(e) => { toast.dismiss('proposal-retry'); search(e, failed[0]) }}>Search</Button>
          </span>
        </span>
      ), { id: 'proposal-retry' })
    } else if (failed.length) {
      if (!isOverdue(failed[0].proposal)) {
        setActiveId(failed[0].id)
      }

      toast.error(`Error while sending **${VERDICTS[verdict].label}** for ${failed.length > 1 ? `**${failed.length}** proposals` : `**${failed[0].entity?.title}**`}`)
    }
  }, [setMovieMetadata, search])

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
    decidedRef.current = omit(decidedRef.current, current.targets.map(({ id }) => id))
    setDecided(decided => omit(decided, current.targets.map(({ id }) => id)))
    keys.current.morph(() => {
      setLeaving(leaving => omit(leaving, current.targets.map(({ id }) => id)))
      setActiveId(current.targets[0].id)
    }, current.targets[0].id)
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

  const notify = useCallback((targets, verdict: Verdict) => {
    const { emoji, label } = VERDICTS[verdict]
    const message = (
      <span sx={UIProposals.styles.toast}>
        <span>{emojize(emoji, label)} · {targets.length > 1 ? `${targets.length} proposals` : targets[0].entity?.title}</span>
        <span>
          {verdict === 'refuse' && <Button variant='outline' color='primary' onClick={() => keys.current.ban()} aria-keyshortcuts='B'>Ban</Button>}
          <Button variant='outline' color='gray' onClick={undo} aria-keyshortcuts='Z'>Undo</Button>
        </span>
      </span>
    )

    ;({ accept: toast.success, refuse: toast, ban: toast.error, retry: toast, drop: toast }[verdict] as any)(message, { id: 'proposal-pending', duration: DELAY })
  }, [undo])

  // `next` is the card to open once this one has left, when it was the open one.
  const decideTargets = useCallback((candidates, verdict: Verdict, next = undefined) => {
    const targets = candidates.filter(({ id }) => !decidedRef.current[id])

    if (!connected || !targets.length) {
      return
    }

    flush()

    const ids = targets.map(({ id }) => id)
    decidedRef.current = { ...decidedRef.current, ...ids.reduce((acc, id) => ({ ...acc, [id]: verdict }), {}) }
    setDecided(decided => ({ ...decided, ...ids.reduce((acc, id) => ({ ...acc, [id]: verdict }), {}) }))

    if (targets.length === 1) {
      setLeaving(leaving => ({ ...leaving, [ids[0]]: verdict }))
      setTimeout(() => keys.current.morph(() => {
        setLeaving(leaving => omit(leaving, ids))

        if (next !== undefined) {
          setActiveId(next)
        }
      }, next), LEAVE)
    }

    pending.current = { targets, verdict, timer: setTimeout(flush, DELAY) }
    notify(targets, verdict)
  }, [connected, flush, notify])

  // A refusal still waiting to be sent turns into a ban, as in the notifications.
  const ban = useCallback(() => {
    const current = pending.current

    if (!current || current.verdict !== 'refuse') {
      return
    }

    clearTimeout(current.timer)
    const ids = current.targets.map(({ id }) => id)
    decidedRef.current = { ...decidedRef.current, ...ids.reduce((acc, id) => ({ ...acc, [id]: 'ban' }), {}) }
    setDecided(decided => ({ ...decided, ...ids.reduce((acc, id) => ({ ...acc, [id]: 'ban' }), {}) }))
    pending.current = { ...current, verdict: 'ban', timer: setTimeout(flush, DELAY) }
    notify(current.targets, 'ban')
  }, [flush, notify])

  const onGesture = useCallback((gesture) => {
    if (!active) {
      return
    }

    if (gesture !== 'skip' && !connected) {
      return
    }

    if (gesture === 'skip') {
      keys.current.morph(() => {
        setActiveId(queue[activeIndex + 1]?.id ?? null)
        setSkipped(skipped => ({ ...skipped, [active.id]: ++skips.current }))
      }, queue[activeIndex + 1]?.id)
      return
    }

    decideTargets([active], gesture, queue[activeIndex + 1]?.id ?? null)
  }, [active, activeIndex, queue, decideTargets, connected])

  const onToggle = useCallback((group) => {
    if (!collapsed[group] && active && groups.find(({ items }) => items.includes(active))?.group === group) {
      const next = groups.slice(GROUPS.indexOf(group) + 1).find(({ group, items }) => !collapsed[group] && items.some(item => !leaving[item.id]))?.items.find(item => !leaving[item.id])
      setActiveId(next?.id ?? null)
    }

    setCollapsed(collapsed => ({ ...collapsed, [group]: !collapsed[group] }))
  }, [collapsed, active, groups, leaving])

  keys.current = { ...keys.current, onGesture, undo, ban, close: () => keys.current.morph(() => setActiveId(null)) }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable || document.querySelector('[data-proposals-menu]')) {
        return
      }

      const gesture = { a: 'accept', r: 'refuse', s: 'skip', arrowdown: 'skip' }[e.key.toLowerCase()]

      if (e.key === 'Escape') {
        keys.current.close()
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault()
        keys.current.undo()
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        keys.current.ban()
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
  // The rows on screen when a move starts, kept mounted until it ends: the browser drops
  // the whole transition as soon as one element it captured leaves the DOM.
  const kept = useRef(null)
  const moving = useRef(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => body.current,
    estimateSize: (index) => rows[index]?.type === 'group' ? GROUP_HEIGHT : rows[index]?.item === active ? ACTIVE_HEIGHT : COMPACT_HEIGHT[mobile ? 0 : 1],
    getItemKey: (index) => rows[index]?.type === 'group' ? `group-${rows[index].group}` : rows[index]?.item.id ?? index,
    overscan: 6,
    scrollMargin,
    scrollPaddingStart: GROUP_HEIGHT + (mobile ? 0 : 76),
    rangeExtractor: useCallback((range) => {
      sticky.current = [...stickies].reverse().find(index => range.startIndex >= index) ?? 0
      return [...new Set([sticky.current, ...defaultRangeExtractor(range), ...(kept.current || [])])].filter(index => index < range.count).sort((a, b) => a - b)
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

  // A card taller than the screen, as on a phone, shows from its top rather than its end.
  const reveal = () => {
    const index = rows.findIndex(row => row.type === 'item' && row.item === active)

    if (index !== -1 && activeId === active?.id) {
      const tall = (virtualizer.measurementsCache[index]?.size || 0) > (body.current?.clientHeight || 0) - virtualizer.options.scrollPaddingStart
      virtualizer.scrollToIndex(index, { align: tall ? 'start' : 'auto' })
    }
  }

  // A move already scrolled while the page was frozen; scrolling again under it would
  // shift every row once the snapshots are dropped.
  useEffect(() => {
    if (!document.documentElement.dataset.morphing) {
      reveal()
    }
  }, [activeId])

  // Every change of the open card goes through here. The browser snapshots the list,
  // React renders the new state synchronously, the rows are measured and scrolled to
  // at their real height, and each element both forms draw moves from its old place.
  // The CSS of the moves is the Global block of the render below.
  // Only the rows that change form name their poster, title, size… for the move: every
  // named element is one more snapshot, and the other rows only need to slide.
  keys.current.morph = (update, target = null) => {
    flushSync(() => setFocus([activeId, target].filter(id => id !== null && id !== undefined)))

    const apply = () => {
      flushSync(update)
      // `measureElement` answers from its cache when no ResizeObserver entry comes with the
      // call, so the rows are sized from the DOM: the capture must see them in place.
      flushSync(() => list.current?.querySelectorAll('[data-index]').forEach((node: HTMLElement) => virtualizer.resizeItem(Number(node.dataset.index), node.offsetHeight)))
      keys.current.reveal()
    }

    if (!(document as any).startViewTransition) {
      apply()
      return
    }

    // Named for the length of the move only, so the rows slide under the controls bar and
    // the toasts instead of over them. Named for good, they would leave `#main` in a route change.
    const layers = Array.from(document.querySelectorAll('#body > nav, #_rht_toaster')) as HTMLElement[]
    layers.forEach((layer, index) => { layer.style.viewTransitionName = `swap-layer-${index}` })
    document.documentElement.dataset.morphing = 'true'
    kept.current = [...new Set([...(kept.current || []), ...virtualizer.getVirtualItems().map(({ index }) => index)])]

    // A click during a move starts the next one, which skips this one: its end must not
    // undo what the next one has just set up.
    const transition = (document as any).startViewTransition(apply)
    moving.current = transition
    transition.finished.finally(() => {
      if (moving.current !== transition) {
        return
      }

      moving.current = null
      kept.current = null
      layers.forEach((layer) => { layer.style.viewTransitionName = '' })
      delete document.documentElement.dataset.morphing
    })
  }

  keys.current.reveal = reveal

  // The pointer reaches a row a few hundred milliseconds before its chevron is clicked.
  const prefetch = useCallback((id) => loadDetails(id)?.catch(() => null), [])

  const select = useCallback((id) => {
    Promise.race([loadDetails(id)?.catch(() => null), new Promise(resolve => setTimeout(resolve, PRELOAD))])
      .then(() => keys.current.morph(() => setActiveId(id), id))
  }, [])

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
      title='Swaps'
      components={{ balance: Balance }}
      layout={layout as any}
      fields={fields as any}
      values={values}
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
        <div sx={UIProposals.styles.element} aria-busy={true}>
          <GroupPlaceholder />
          {SHAPES.map((shape, i) => <Placeholder key={i} shape={shape} />)}
        </div>
      </>
    )
  }

  if (!rows.length) {
    return (
      <>
        {nav}
        {(all.length && !items.length) ? (
          <Warning emoji='🔍' title='No match' subtitle='No swap matches the release filters' />
        ) : total ? (
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
      <Global styles={MORPH} />
      {nav}
      {mobile && !!balance.now && (
        <div sx={UIProposals.styles.balance}>
          <UIBalance balance={balance} compact={true} />
        </div>
      )}
      <div ref={list} sx={UIProposals.styles.element}>
        <div style={{ height: virtualizer.getTotalSize(), flexShrink: 0, position: 'relative', width: '100%' }}>
          {virtualizer.getVirtualItems().map((virtual) => {
            const row = rows[virtual.index]
            const stuck = row.type === 'group' && virtual.index === sticky.current

            return (
              <div
                key={virtual.key}
                data-index={virtual.index}
                ref={virtualizer.measureElement}
                sx={stuck ? UIProposals.styles.sticky : {}}
                style={stuck ? morph('row', virtual.key, 'group') : {
                  ...morph('row', virtual.key, row.type === 'group' ? 'group' : (row.item === active || row.item.id === activeId) ? 'card' : focus.includes(row.item.id) ? 'closing' : 'row'),
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
                    emoji={EMOJI[row.group] || '💤'}
                    label={row.group === 'rest' ? (threshold ? `${LABELS.rest} (<${filesize.stringify(threshold)})` : `${LABELS.rest} (no change)`) : LABELS[row.group]}
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
                          <div sx={UIProposals.styles.menu} data-proposals-menu={true}>
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
                ) : row.group === 'overdue' ? (
                  <Overdue item={row.item} threshold={threshold} leaving={row.leaving} onGesture={(gesture) => decideTargets([row.item], gesture)} onSearch={(e) => search(e, row.item)} disabled={!connected} />
                ) : (row.item === active || (row.leaving && row.item.id === activeId)) ? (
                  <Active
                    item={row.item}
                    entity={row.item.entity}
                    threshold={threshold}
                    leaving={row.leaving}
                    mobile={mobile}
                    disabled={!connected}
                    onGesture={onGesture}
                    onClose={row.leaving ? null : keys.current.close}
                  />
                ) : (
                  <Compact item={row.item} threshold={threshold} leaving={row.leaving} morphing={focus.includes(row.item.id)} onSelect={select} onHover={prefetch} onDecide={(verdict) => decideTargets([row.item], verdict)} disabled={!connected} />
                )}
              </div>
            )
          })}
        </div>
        <Warning
          emoji='📼'
          title="You've reached the end of the tape"
          subtitle={(
            <span>
              Be kind, <em>rewind</em>, and let the next <em>refine</em> or <em>shrink</em> job record some more swaps.
            </span>
          )}
        />
      </div>
      {mobile && !!active && (
        <Gestures onGesture={onGesture} disabled={!connected} sx={UIProposals.styles.bar} />
      )}
      <SensorrSingleton setToggle={fn => toggleSensorr.current = fn} />
    </>
  )
}

UIProposals.styles = {
  balance: {
    display: 'flex',
    alignItems: 'center',
    height: '3em',
    paddingX: 6,
    backgroundColor: 'primary',
    borderTop: '1px solid',
    borderColor: 'hsla(0, 0%, 0%, 0.12)',
    color: 'whitePure',
    fontSize: 5,
    '>div': {
      flex: 1,
      maxWidth: 'none',
    },
  },
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    paddingX: [8, '0px'],
    // Flush with the controls bar, where the sticky group title lands once scrolled.
    paddingBottom: 4,
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
    '>span:last-of-type': {
      display: 'flex',
      gap: 8,
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
}

const Proposals = compose(
  withTitle('Swaps'),
  withBody(),
  withFetchQuery(APIQuery.movies.getMovies({ params: { 'releases.proposal': true, limit: 10000, fields: FIELDS.join('|') } }), 1, useAPI, undefined, 10000),
)(UIProposals)

export default Proposals
