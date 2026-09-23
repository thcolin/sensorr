// The proposal queue as data: what each proposal changes, which group it falls in,
// in which order it comes, and what a verdict writes on the movie. Kept free of any
// UI import so it can be tested on its own.

// oleoo axes compared between the owned release and the proposed one, in the order
// they read in a release name. `dub` is the audio codec, not the language.
export const AXES = ['resolution', 'source', 'encoding', 'dub', 'language']

export const GROUPS = ['record', 'refine', 'shrink', 'rest']

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

export const proposalDiff = (owned, proposed, policy) => {
  const base = baseline(owned)
  const left = base.release?.meta || null
  const right = proposed?.meta || null

  const rows = (left && right) ? AXES.map(axis => ({
    axis,
    from: left[axis],
    to: right[axis],
    ...transitionOf(axis, left[axis], right[axis], policy),
  })) : []

  return {
    rows,
    changed: rows.filter(({ state }) => state !== 'same'),
    size: (typeof base.size === 'number' && typeof proposed?.size === 'number') ? proposed.size - base.size : null,
    from: base.release,
    lightest: owned.reduce((lightest, release) => (lightest && (lightest.size || 0) <= (release.size || 0)) ? lightest : release, null),
  }
}

export const isPending = (release) => !!release?.proposal && typeof release?.choice !== 'boolean'

export const pendingOf = (releases) => (releases || []).find(isPending) || null

// A proposal as the queue sees it: the movie, what it owns, what is proposed, and the diff.
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

// The last group gathers what barely moves: same language, and a size that changes by
// less than the threshold. At 0 it keeps only proposals on which no axis changes at all.
export const groupOf = (item, threshold) => {
  if (item.owned.length) {
    const language = item.diff.rows.find(({ axis }) => axis === 'language')

    if (threshold === 0 ? (item.diff.rows.length && !item.diff.changed.length) : (language?.state === 'same' && Math.abs(item.diff.size || 0) < threshold)) {
      return 'rest'
    }
  }

  return GROUPS.includes(item.command) ? item.command : 'refine'
}

// A position in `prefer` is what the policy says about a value; an unlisted value comes
// after every listed one. `require` and `avoid` outweigh any rank.
const standing = (axis, value, policy) => {
  const preferred = policy?.prefer?.[axis] || []
  const level = levelOf(axis, value, policy)
  const rank = preferred.indexOf(value)

  return (level.kind === 'require' ? 1000 : level.kind === 'avoid' ? -1000 : 0) - (rank === -1 ? preferred.length : rank)
}

export const gainOf = (item) => {
  const to = item.proposal?.meta?.language
  const from = item.diff.from?.meta?.language

  return {
    language: standing('language', to, item.policy) - (item.owned.length ? standing('language', from, item.policy) : 0),
    space: -(item.owned.length ? (item.diff.size || 0) : (item.proposal?.size || 0)),
  }
}

// The date each job last processed the movie; the release itself carries none
// (ProcessMoviesTask.js:214-218).
export const PROCESSED_AT = {
  'record': 'updated_at',
  'refine': 'refined_at',
  'shrink': 'shrinked_at',
}

const timeOf = (item) => new Date(item.entity?.[PROCESSED_AT[item.command]] || item.entity?.updated_at || 0).getTime()

// Groups in their fixed order, each sorted by gain (language first, then space) or by
// date. A skipped proposal goes after every other one of its group, in skip order.
export const arrange = (items, { threshold, sort = 'gain', descending = true, skipped = {} }) => {
  const direction = descending ? 1 : -1
  const keyed = items.map(item => ({ item, group: groupOf(item, threshold), gain: gainOf(item), time: timeOf(item) }))

  return GROUPS.map(group => ({
    group,
    items: keyed
      .filter(entry => entry.group === group)
      .sort((a, b) => {
        const skip = (skipped[a.item.id] || 0) - (skipped[b.item.id] || 0)

        if (skip) {
          return skip
        }

        if (sort === 'gain') {
          return direction * ((b.gain.language - a.gain.language) || (b.gain.space - a.gain.space) || (b.time - a.time))
        }

        return direction * (b.time - a.time)
      })
      .map(({ item }) => item),
  }))
}

// What a verdict writes on the movie metadata. Accepting archives the movie, like
// `setMovieMetadata(id, 'proposal', …)` does; banning also lists the release title in
// `banned_releases`, the only list the jobs exclude on (policy.ts:149-161), which is what
// makes it differ from refusing.
export const decide = (metadata, releaseId, verdict: Verdict) => {
  const release = (metadata?.releases || []).find(({ id }) => id === releaseId)

  return {
    releases: (metadata?.releases || []).map(r => r.id === releaseId ? { ...r, choice: verdict === 'accept' } : r),
    ...(verdict === 'accept' ? { state: 'archived' } : {}),
    ...(verdict === 'ban' && release ? { banned_releases: [...new Set([...(metadata?.banned_releases || []), release.title])] } : {}),
  }
}
