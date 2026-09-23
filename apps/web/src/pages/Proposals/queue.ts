// Free of any UI import, so that queue.spec.ts runs without the app around it.

// oleoo axes compared between the owned release and the proposed one, in the order
// they read in a release name. `dub` is the audio codec, not the language.
export const AXES = ['resolution', 'source', 'encoding', 'dub', 'language']

// A `record` proposal has no owned release to swap; it is decided from the notifications.
export const GROUPS = ['refine', 'shrink', 'rest']

export type Verdict = 'accept' | 'refuse' | 'ban'

// Releases stored on the movie document carry no score: it is recomputed from the
// movie policy, exactly like the job does before comparing (ProcessMoviesTask.js:307).
export const scoreReleases = (releases, policy) => (typeof policy?.apply === 'function' ?
  policy.apply((releases || []).map(({ meta, ...release }) => ({ ...release, title: release.original })), null) :
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
  size: owned.length ? Math.min(...owned.map(({ size }) => size || 0)) : null,
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

  return {
    rows,
    changed: rows.filter(({ state }) => state !== 'same'),
    size: (typeof base.size === 'number' && typeof proposed?.size === 'number') ? proposed.size - base.size : null,
    from: base.release,
    lightest: owned.reduce((lightest, release) => (lightest && (lightest.size || 0) <= (release.size || 0)) ? lightest : release, null),
  }
}

export const isPending = (release) => !!release?.proposal && typeof release?.choice !== 'boolean'

export const itemOf = (entity, releases, policy) => {
  const scored = scoreReleases(releases, policy)
  const owned = scored.filter(({ proposal }) => !proposal)
  const proposal = scored.find(isPending) || null

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
export const groupOf = (item, threshold) => {
  if (item.owned.length) {
    const language = item.diff.rows.find(({ axis }) => axis === 'language')

    if (threshold === 0 ? (item.diff.rows.length && !item.diff.changed.length) : (language?.state === 'same' && Math.abs(item.diff.size || 0) < threshold)) {
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

// Newest first, always: the date the job last processed the movie.
export const arrange = (items, { threshold, skipped = {} }) => {
  const keyed = items.map(item => ({ item, group: groupOf(item, threshold), time: timeOf(item) }))

  return GROUPS.map(group => ({
    group,
    items: keyed
      .filter(entry => entry.group === group)
      .sort((a, b) => {
        const skip = (skipped[a.item.id] || 0) - (skipped[b.item.id] || 0)

        if (skip) {
          return skip
        }

        return b.time - a.time
      })
      .map(({ item }) => item),
  }))
}

// Banning lists the title in `banned_releases`, the only list the jobs exclude on
// (policy.ts:149-161): a refused release can be proposed again, a banned one cannot.
export const decide = (metadata, releaseId, verdict: Verdict) => {
  const release = (metadata?.releases || []).find(({ id }) => id === releaseId)

  return {
    releases: (metadata?.releases || []).map(r => (r.proposal && r.id === releaseId) ? { ...r, choice: verdict === 'accept' } : r),
    ...(verdict === 'accept' ? { state: 'archived' } : {}),
    ...(verdict === 'ban' && release ? { banned_releases: [...new Set([...(metadata?.banned_releases || []), release.title])] } : {}),
  }
}
