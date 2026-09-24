// Free of any UI import, so that queue.spec.ts runs without the app around it.

import { scoredTitle } from '@sensorr/sensorr'

// oleoo axes compared between the owned release and the proposed one, in the order
// they read in a release name. `dub` is the audio codec, not the language.
export const AXES = ['resolution', 'source', 'encoding', 'dub', 'language']

// A `record` proposal has no owned release to swap; it is decided from the notifications.
// A `report` one answers a friend who reported the movie from Plex, so it comes first.
// `overdue` holds the accepted swaps that never landed on Plex (apps/cli/src/utils/swaps.js).
export const GROUPS = ['report', 'refine', 'shrink', 'rest', 'overdue']

export type Verdict = 'accept' | 'refuse' | 'ban' | 'retry' | 'drop' | 'replace'

// Releases stored on the movie document carry no score: it is recomputed from the
// movie policy, exactly like the job does before comparing (ProcessMoviesTask.js:307).
export const scoreReleases = (releases, policy) => (typeof policy?.apply === 'function' ?
  policy.apply((releases || []).map(({ meta, ...release }) => ({ ...release, title: scoredTitle(release) })), null) :
  (releases || [])
)

const has = (list, value) => (list || []).includes(value)

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹'

// What the policy says about one value, and nothing more. `require` and `avoid` are
// sets; `prefer` is an ordered list whose position is the score (policy.ts:330-353).
export const levelOf = (axis, value, policy) => {
  if (!value) {
    return { kind: null }
  }

  if (has(policy?.avoid?.[axis], value)) {
    return { kind: 'avoid', mark: '!' }
  }

  const preferred = policy?.prefer?.[axis] || []
  const rank = preferred.indexOf(value)

  if (has(policy?.require?.[axis], value)) {
    return { kind: 'require', mark: '*', rank: rank === -1 ? null : rank + 1, total: preferred.length }
  }

  if (rank !== -1) {
    return { kind: 'prefer', mark: SUPERSCRIPT[Math.min(9, rank + 1)], rank: rank + 1, total: preferred.length }
  }

  return { kind: null }
}

// The three states the colour is allowed to assert, and the one it is not. `prefer`
// covers only znab, resolution and language in the configured policies, so an axis
// none of the three volets mentions stays grey and says so with a tilde.
export const transitionOf = (axis, from, to, policy) => {
  const left = levelOf(axis, from, policy)
  const right = levelOf(axis, to, policy)

  if (from === to) {
    return { state: 'same', separator: '=', left, right }
  }

  if (right.kind === 'avoid' || (left.kind === 'require' && right.kind !== 'require')) {
    return { state: 'broken', separator: '→', left, right: { ...right, mark: right.mark || '!' } }
  }

  if (right.kind === 'require') {
    return { state: 'held', separator: '→', left, right }
  }

  if (!left.kind && !right.kind) {
    return { state: 'quiet', separator: '~', left, right }
  }

  return { state: 'moved', separator: '→', left, right }
}

// The job never compares against one release: it builds a synthetic pair, the best
// score and the smallest size across every owned release (ProcessMoviesTask.js:307-311
// and :329-334). A delta against a single release would not match its verdict.
const baseline = (owned) => ({
  size: (owned.length && owned.every(({ size }) => typeof size === 'number')) ? Math.min(...owned.map(({ size }) => size)) : null,
  release: owned.reduce((best, release) => (best && best.score >= release.score) ? best : release, null),
})

// What the policy holds first, then what it breaks, then what it has no opinion on.
const IMPACT = ['held', 'broken', 'moved', 'quiet', 'same']

export const proposalDiff = (owned, proposed, policy) => {
  const base = baseline(owned)
  const left = base.release?.meta || null
  const right = proposed?.meta || null

  const rows = (left && right) ? AXES.map(axis => ({
    axis,
    from: left[axis],
    to: right[axis],
    ...transitionOf(axis, left[axis], right[axis], policy),
  })).sort((a, b) => IMPACT.indexOf(a.state) - IMPACT.indexOf(b.state)) : []

  const changed = rows.filter(({ state }) => state !== 'same')
  const language = rows.find(({ axis }) => axis === 'language')

  return {
    rows,
    changed,
    // A list row reads the language first even when it stays: keeping VOSTFR or MULTi decides too.
    listed: language ? [language, ...changed.filter(({ axis }) => axis !== 'language')] : changed,
    size: (typeof base.size === 'number' && typeof proposed?.size === 'number') ? proposed.size - base.size : null,
    from: base.release,
    lightest: owned.reduce((lightest, release) => (lightest && (lightest.size || 0) <= (release.size || 0)) ? lightest : release, null),
  }
}

// The size never has a policy: lighter holds, heavier breaks, and a move under the
// threshold says nothing.
export const sizeStateOf = (delta, threshold = 0) => Math.abs(delta || 0) < (threshold || 1) ? 'quiet' : delta < 0 ? 'held' : 'broken'

export const isPending = (release) => !!release?.proposal && typeof release?.choice !== 'boolean'

export const isOverdue = (release) => release?.overdue === true

export const itemOf = (entity, releases, policy) => {
  const scored = scoreReleases(releases, policy)
  const owned = scored.filter(release => !release.proposal && !isOverdue(release))
  const proposal = scored.find(isPending) || scored.find(isOverdue) || null

  return {
    id: entity.id,
    entity,
    command: proposal?.from,
    owned,
    proposal,
    policy,
    diff: proposalDiff(owned, proposal, policy),
  }
}

// At a threshold of 0 the last group keeps only the proposals on which no axis changes.
// Above it, it keeps every proposal that frees less space than the threshold, one that
// grows included, whatever else it changes. A proposal of unknown size keeps its group.
export const groupOf = (item, threshold) => {
  if (isOverdue(item.proposal)) {
    return 'overdue'
  }

  if (item.command === 'report') {
    return 'report'
  }

  if (item.owned.length) {
    const size = item.diff.size

    if (threshold === 0 ? (item.diff.rows.length && !item.diff.changed.length) : (typeof size === 'number' && -size < threshold)) {
      return 'rest'
    }
  }

  return GROUPS.includes(item.command) ? item.command : 'refine'
}

// The date each job last processed the movie; the release itself carries none
// (ProcessMoviesTask.js:214-218).
export const PROCESSED_AT = {
  'refine': 'refined_at',
  'shrink': 'shrinked_at',
}

const timeOf = (item) => new Date(item.entity?.[PROCESSED_AT[item.command]] || item.entity?.updated_at || 0).getTime()

// `time` is the date the job last processed the movie, `gain` the space the swap frees;
// `sort` true puts the newest or the biggest gain first.
export const SORTS = {
  time: (item) => timeOf(item),
  gain: (item) => -(item.diff.size || 0),
}

export const arrange = (items, { threshold, skipped = {}, sort_by = { value: 'time', sort: true } }) => {
  const key = SORTS[sort_by.value] || SORTS.time
  const direction = sort_by.sort ? 1 : -1
  const keyed = items.map(item => ({ item, group: groupOf(item, threshold), key: key(item) }))

  return GROUPS.map(group => ({
    group,
    items: keyed
      .filter(entry => entry.group === group)
      .sort((a, b) => {
        const skip = (skipped[a.item.id] || 0) - (skipped[b.item.id] || 0)

        if (skip) {
          return skip
        }

        return direction * (b.key - a.key)
      })
      .map(({ item }) => item),
  }))
}

// The release filters of Library (Controls/Oleoo.tsx): 📀 `current` keeps a swap whose
// owned release carries one of the values, 💿 `proposed` one whose proposed release does.
// A size range is in GB, and its top mark means no upper bound.
export const FILTERS = ['znab', 'resolution', 'source', 'encoding', 'dub', 'language', 'flags']

export const SIZE_MAX = 50

const GB = 1024 ** 3

const carries = (release, filter, values) => values.some(value => [].concat(release?.meta?.[filter]).includes(value))

const fits = (release, range) => {
  const [min, max] = range || [0, SIZE_MAX]
  const size = (release?.size || 0) / GB

  return size >= min && (max >= SIZE_MAX || size <= max)
}

const valuesOf = (values, filter, group) => (values[filter] || []).filter(rule => rule.group === group).map(({ value }) => value)

const matchesRelease = (release, values, side) => fits(release, values[`${side}_size`]) && FILTERS.every(filter => {
  const rules = valuesOf(values, filter, side)
  return !rules.length || carries(release, filter, rules)
})

// The current side passes when one owned release matches every filter, as the release
// filters of Library.
export const matches = (item, values) => (
  (item.owned.length ? item.owned : [null]).some(release => matchesRelease(release, values, 'current')) &&
  matchesRelease(item.proposal, values, 'proposed')
)

// What the disk would weigh once every swap is accepted. Only the Plex files exist on
// disk (`from: 'sync'`, sync.js): an older release Sensorr recorded is history, not a file.
export const balanceOf = (items) => items.reduce((balance, item) => {
  const files = item.owned.filter(({ from }) => from === 'sync')

  if (!files.length || typeof item.proposal?.size !== 'number' || isOverdue(item.proposal)) {
    return balance
  }

  const now = files.reduce((sum, { size }) => sum + (size || 0), 0)
  const group = item.command === 'shrink' ? 'shrink' : 'refine'

  return {
    ...balance,
    now: balance.now + now,
    after: balance.after + item.proposal.size,
    [group]: balance[group] + item.proposal.size - now,
  }
}, { now: 0, after: 0, refine: 0, shrink: 0 })

// Banning lists the title in `banned_releases`, the only list the jobs exclude on
// (policy.ts:149-161): a refused release can be proposed again, a banned one cannot.
// An overdue swap is retried by accepting it again, and dropped by removing it: the movie
// keeps the version it has on Plex, and `refine` may propose another one.
// A swap is replaced by refusing the proposal and accepting `pick`, the release chosen
// in the drawer, in the same write: the job's log is marked as treated. The API handles
// releases in order, so the pick is downloaded before the refusal deletes the cached one.
export const decide = (metadata, releaseId, verdict: Verdict, pick = null) => {
  const release = (metadata?.releases || []).find(({ id }) => id === releaseId)

  if (verdict === 'replace' && pick && pick.id !== releaseId) {
    const refused = decide(metadata, releaseId, 'refuse').releases
    return {
      releases: [...refused.filter(({ id }) => id !== releaseId), pick, ...refused.filter(({ id }) => id === releaseId)],
      state: 'archived',
    }
  }

  if (verdict === 'retry') {
    const again = ({ overdue, ...release }) => ({ ...release, proposal: true, choice: true })
    return { releases: (metadata?.releases || []).map(r => r.id === releaseId ? again(r) : r) }
  }

  if (verdict === 'drop') {
    return { releases: (metadata?.releases || []).filter(r => r.id !== releaseId) }
  }

  return {
    releases: (metadata?.releases || []).map(r => (r.proposal && r.id === releaseId) ? { ...r, choice: ['accept', 'replace'].includes(verdict) } : r),
    ...(['accept', 'replace'].includes(verdict) ? { state: 'archived' } : {}),
    ...(verdict === 'ban' && release ? { banned_releases: [...new Set([...(metadata?.banned_releases || []), release.title])] } : {}),
  }
}
