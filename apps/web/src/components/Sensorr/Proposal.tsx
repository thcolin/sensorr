import { memo, useMemo } from 'react'
import { transformMovieDetails } from '@sensorr/ui'
import { emojize, filesize } from '@sensorr/utils'
import { formatDistanceToNowStrict } from 'date-fns'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import Movie from '../Movie/Movie'
import { Metadata } from '../../pages/Details/components/Metadata'
import { Release, logos } from './Release'

const EMOJI = {
  'record': '📹',
  'refine': '✨',
  'shrink': '✂️',
}

// The release itself carries no date: the movie document keeps when each job last
// processed it (ProcessMoviesTask.js:214-218).
const PROCESSED_AT = {
  'record': 'updated_at',
  'refine': 'refined_at',
  'shrink': 'shrinked_at',
}

// oleoo axes compared between the owned release and the proposed one, in the order
// they read in a release name. `dub` is the audio codec, not the language.
const AXES = ['resolution', 'source', 'encoding', 'dub', 'language']

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

const UITransition = ({ axis = '', from = null, to = null, policy = null, compact = false, ...props }) => {
  const { state, separator, left, right } = useMemo(() => transitionOf(axis, from, to, policy), [axis, from, to, policy])
  const styles = compact ? UITransition.styles.compact : UITransition.styles.full

  if (state === 'same') {
    return (
      <span {...props} sx={{ ...UITransition.styles.element, ...styles.element, opacity: 0.3 }} title={`${axis}: ${to}`}>
        <span sx={{ ...UITransition.styles.side, ...styles.side }}>
          {to}{!compact && !!right.mark && <sup>{right.mark}</sup>}
        </span>
      </span>
    )
  }

  return (
    <span {...props} sx={{ ...UITransition.styles.element, ...styles.element }} title={`${axis}: ${from} ${separator} ${to}`}>
      <span sx={{ ...UITransition.styles.side, ...styles.side, ...UITransition.styles.before }}>
        {from || '–'}{!compact && !!left.mark && <sup>{left.mark}</sup>}
      </span>
      <span sx={{ ...UITransition.styles.separator, ...styles.separator }}>{separator}</span>
      <span sx={{ ...UITransition.styles.side, ...styles.side, ...(UITransition.styles as any)[state] }}>
        {to || '–'}{!compact && !!right.mark && <sup>{right.mark}</sup>}
      </span>
    </span>
  )
}

UITransition.styles = {
  element: {
    display: 'inline-flex',
    alignItems: 'stretch',
    maxWidth: '100%',
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'grayDark',
    overflow: 'hidden',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    lineHeight: 'normal',
    backgroundColor: 'gray',
    color: 'text',
  },
  side: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '>sup': {
      fontSize: 8,
      marginLeft: 11,
      opacity: 0.75,
    },
  },
  before: {
    backgroundColor: 'grayLight',
    opacity: 0.6,
  },
  separator: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'grayLight',
    color: 'grayDarker',
  },
  held: {
    backgroundColor: 'primary',
    color: 'whitePure',
    fontWeight: 'semibold',
  },
  broken: {
    backgroundColor: 'errorDarker',
    color: 'whitePure',
    fontWeight: 'semibold',
  },
  moved: {
    fontWeight: 'semibold',
  },
  quiet: {},
  full: {
    element: { fontSize: 5 },
    side: { paddingX: 8, paddingY: 10 },
    separator: { width: '1.5em', fontSize: 6 },
  },
  compact: {
    element: { fontSize: 7 },
    side: { paddingX: 10, paddingY: 11, maxWidth: '6em' },
    separator: { width: '1.25em', fontSize: 7 },
  },
}

export const Transition = memo(UITransition)

// The job never compares against one release: it builds a synthetic pair, the best
// score and the smallest size across every owned release (ProcessMoviesTask.js:307-311
// and :329-334). A delta against a single release would not match its verdict.
const baseline = (owned) => ({
  score: owned.length ? Math.max(...owned.map(({ score }) => score || 0)) : null,
  size: owned.length ? Math.min(...owned.map(({ size }) => size || 0)) : null,
  release: owned.reduce((best, release) => (best && best.score >= release.score) ? best : release, null),
})

export const useProposalDiff = (owned, proposed, policy) => useMemo(() => {
  const base = baseline(owned)
  const left = base.release?.meta || null
  const right = proposed?.meta || null

  const rows = (left && right) ? AXES.map(axis => ({
    axis,
    from: left[axis],
    to: right[axis],
    ...transitionOf(axis, left[axis], right[axis], policy),
  })) : []

  const required = Object.keys(policy?.require || {}).filter(axis => (policy.require[axis] || []).length)
  const missing = (meta) => required.filter(axis => meta && !has(policy.require[axis], meta[axis]))

  return {
    rows,
    changed: rows.filter(({ state }) => state !== 'same'),
    size: (typeof base.size === 'number' && typeof proposed?.size === 'number') ? proposed.size - base.size : null,
    from: base.release,
    others: Math.max(0, owned.length - 1),
    was: left ? missing(left) : [],
    now: right ? missing(right) : [],
  }
}, [owned, proposed, policy])

const UIVerdict = ({ was = [], now = [], changed = [], command = 'refine', compared = true, ...props }) => {
  const broken = now.length
  const fixed = !broken && compared && was.length

  return (
    <div sx={{ ...UIVerdict.styles.element, ...(broken ? UIVerdict.styles.broken : fixed ? UIVerdict.styles.fixed : {}) }}>
      <strong>
        {broken ? emojize('🚨', 'Breaks policy') :
          !compared ? emojize('📹', 'First download') :
          fixed ? emojize('✅', 'Meets policy') :
          emojize('🔒', 'Policy held')}
      </strong>
      <span>
        {broken ? `still missing ${now.join(', ')}` :
          !compared ? 'nothing owned yet, nothing to compare' :
          fixed ? `was missing ${was.join(', ')}` :
          changed.length ? `${changed.length} of ${AXES.length} axes change` :
          command === 'shrink' ? 'same release, smaller' : 'nothing changes but the score'}
      </span>
    </div>
  )
}

UIVerdict.styles = {
  element: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
    paddingY: 8,
    color: 'grayDarker',
    fontSize: 6,
    '>strong': {
      color: 'text',
      fontSize: 5,
    },
  },
  fixed: { '>strong': { color: 'primary', fontSize: 5 } },
  broken: { '>strong': { color: 'error', fontSize: 5 } },
}

const Verdict = memo(UIVerdict)

// Two composite language flags can look alike (MULTi-VFF against MULTi-VF2), so the
// value is always written out next to it. Source and encoding logos read on their own.
// Size is not an oleoo axis and the policy says nothing about it, so it keeps its own
// pill: the direction is factual, and `shrink` is the only job that promises it.
const UISize = ({ from = null, to = null, delta = null, command = 'refine', compact = false, ...props }) => {
  const styles = compact ? UITransition.styles.compact : UITransition.styles.full
  const state = !delta ? 'same' : command === 'shrink' ? (delta < 0 ? 'held' : 'broken') : 'moved'

  if (!delta) {
    return (
      <span {...props} sx={{ ...UITransition.styles.element, ...styles.element, opacity: 0.3 }} title='size: unchanged'>
        <span sx={{ ...UITransition.styles.side, ...styles.side }}>{typeof to === 'number' ? filesize.stringify(to) : '–'}</span>
      </span>
    )
  }

  return (
    <span {...props} sx={{ ...UITransition.styles.element, ...styles.element }} title={`size: ${filesize.stringify(from)} → ${filesize.stringify(to)}`}>
      <span sx={{ ...UITransition.styles.side, ...styles.side, ...UITransition.styles.before }}>
        {typeof from === 'number' ? filesize.stringify(from) : '–'}
      </span>
      <span sx={{ ...UITransition.styles.separator, ...styles.separator }}>{delta < 0 ? '↓' : '↑'}</span>
      <span sx={{ ...UITransition.styles.side, ...styles.side, ...(UITransition.styles as any)[state] }}>
        {typeof to === 'number' ? filesize.stringify(to) : '–'}
      </span>
    </span>
  )
}

export const Size = memo(UISize)

const UIProposal = ({ entity = null, metadata = null, setMetadata = null, proceedRelease = null, ...props }) => {
  const releases = useMemo(() => scoreReleases(metadata?.releases, metadata?.policy), [metadata?.releases, metadata?.policy])
  const owned = useMemo(() => releases.filter(({ proposal }) => !proposal), [releases])
  const proposals = useMemo(() => releases.filter(({ proposal }) => proposal), [releases])
  const proposal = proposals[0] || null
  const diff = useProposalDiff(owned, proposal, metadata?.policy)
  const command = proposal?.from || 'refine'
  const processed = entity?.[PROCESSED_AT[command]]
  const details = useMemo(() => transformMovieDetails(entity || {} as any), [entity])
  const meaningful = details.meaningful

  const ban = (release) => setMetadata('banned_releases', (metadata?.banned_releases || []).includes(release.title) ?
    (metadata?.banned_releases || []).filter(title => title !== release.title) :
    [...(metadata?.banned_releases || []), release.title]
  )

  return (
    <div sx={UIProposal.styles.element}>
      <div sx={UIProposal.styles.head}>
        <div sx={UIProposal.styles.aside}>
          <Movie entity={entity || {}} />
        </div>
        <div sx={UIProposal.styles.about}>
          <div sx={UIProposal.styles.line}>
            <h1 sx={UIProposal.styles.title}>{details.title}</h1>
            <aside>
              {emojize(EMOJI[command], command)}
              <small>#{proposal?.job}</small>
              {!!processed && <small>{formatDistanceToNowStrict(new Date(processed), { addSuffix: true })}</small>}
            </aside>
          </div>
          <h4 sx={UIProposal.styles.subtitle}>
            {entity?.original_title !== details.title && <strong>{entity?.original_title}</strong>}
            {!!details.year && <span>({details.year})</span>}
          </h4>
          <div sx={UIProposal.styles.meaningful}>
            {!!meaningful.directors && <meaningful.directors />}
            {!!meaningful.runtime && <meaningful.runtime />}
            {!!meaningful.genres && <meaningful.genres />}
            {!!meaningful.vote_average && <meaningful.vote_average />}
            {!!diff.others && <span>{emojize('📼', `${diff.others + 1} owned releases`)}</span>}
          </div>
          <details sx={UIProposal.styles.metadata}>
            <summary><span />{emojize('🚨', metadata?.policy?.name || 'default')}</summary>
            <div>
              <Metadata entity={entity || {}} metadata={metadata} setMetadata={setMetadata} help={false} />
            </div>
          </details>
          {!!proposal && (
            <>
              <Verdict was={diff.was} now={diff.now} changed={diff.changed} command={command} compared={!!diff.from} />
              <div sx={UIProposal.styles.diff}>
                {diff.rows.map(({ axis, from, to }) => (
                  <span key={axis} sx={UIProposal.styles.axis}>
                    <label>{axis}</label>
                    <Transition axis={axis} from={from} to={to} policy={metadata?.policy} />
                  </span>
                ))}
                <span sx={UIProposal.styles.axis}>
                  <label>size</label>
                  <Size from={diff.from?.size} to={proposal.size} delta={diff.size} command={command} />
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      {!!proposal && (
        <>
          <div sx={UIProposal.styles.releases}>
            {!!diff.from && (
              <>
                <label sx={UIProposal.styles.label}>Current</label>
                {owned.map(release => (
                  <div key={release.id} sx={UIProposal.styles.release}>
                    <Release entity={{ ...release, valid: true }} display='column' compact={true} />
                  </div>
                ))}
              </>
            )}
            <label sx={UIProposal.styles.label}>Proposed</label>
            {proposals.map(release => (
              <div key={release.id} sx={UIProposal.styles.release}>
                <Release
                  entity={{ ...release, valid: true }}
                  display='column'
                  proceed={proceedRelease}
                  banned={(metadata?.banned_releases || []).includes(release.title)}
                  ban={() => ban(release)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

UIProposal.styles = {
  element: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: '80em',
    display: 'flex',
    flexDirection: 'column',
    paddingX: [8, 2],
    paddingY: 4,
  },
  head: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['center', 'flex-start'],
    marginBottom: 4,
  },
  aside: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: [12, 2],
    marginBottom: [4, 12],
  },
  about: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    textAlign: ['center', 'left'],
  },
  line: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 4,
    '>aside': {
      display: 'inline-flex',
      alignItems: 'baseline',
      flexShrink: 0,
      color: 'grayDarker',
      fontSize: 7,
      whiteSpace: 'nowrap',
      '>small': {
        fontFamily: 'monospace',
        marginLeft: 8,
      },
    },
  },
  title: {
    margin: '0em',
    minWidth: 0,
    fontSize: '2em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  subtitle: {
    margin: '0em',
    marginTop: 10,
    fontSize: 4,
    fontWeight: 'normal',
    color: 'grayDarker',
    '>strong': {
      fontWeight: 'strong',
      marginRight: 8,
    },
  },
  meaningful: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: ['center', 'flex-start'],
    marginTop: 8,
    fontSize: 5,
    '>*': {
      marginRight: 4,
    },
  },
  metadata: {
    marginTop: 8,
    fontSize: 5,
    '>summary': {
      position: 'relative',
      lineHeight: 'space',
      '>span': {
        position: 'absolute',
        width: '1em',
        height: '100%',
        left: '0em',
        margin: '0em',
        cursor: 'pointer',
      },
    },
    '>div': {
      borderBottom: '1px solid',
      borderColor: 'grayLight',
    },
  },
  diff: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 6,
    paddingY: 4,
    borderTop: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'gray',
  },
  axis: {
    display: 'inline-flex',
    flexDirection: 'column',
    minWidth: 0,
    '>label': {
      color: 'grayDarker',
      fontSize: 8,
      fontWeight: 'semibold',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 11,
    },
  },
  releases: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 4,
  },
  label: {
    color: 'grayDarker',
    fontSize: 7,
    fontWeight: 'semibold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: 8,
  },
  release: {
    flexShrink: 0,
    '>div>div': {
      paddingX: 12,
      '>div': {
        paddingY: 8,
        // <Release display='column'> centers its own content (Release.tsx:295-302),
        // which leaves both names floating at different x. Anchor them left so the
        // two lines can be read as a pair.
        '>div': {
          alignItems: 'flex-start',
        },
      },
    },
  },
}

export const Proposal = memo(withMovieMetadataContext({ enhanced: true })(UIProposal))

export default Proposal
