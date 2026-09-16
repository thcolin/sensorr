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

// The job never compares against one release: it builds a synthetic pair, the best
// score and the smallest size across every owned release (ProcessMoviesTask.js:307-311
// and :329-334). Showing a delta against a single release would not match its verdict.
const baseline = (owned) => ({
  score: owned.length ? Math.max(...owned.map(({ score }) => score || 0)) : null,
  size: owned.length ? Math.min(...owned.map(({ size }) => size || 0)) : null,
  release: owned.reduce((best, release) => (best && best.score >= release.score) ? best : release, null),
})

// What the policy is able to assert, and nothing more. `prefer` only covers znab,
// resolution and language in practice, so an axis it says nothing about is reported
// as changed, never as gained.
const judge = (axis, from, to, policy) => {
  if (from === to) {
    return { state: 'same' }
  }

  if (has(policy?.avoid?.[axis], to)) {
    return { state: 'avoided', label: 'avoided' }
  }

  const required = policy?.require?.[axis]

  if (required?.length) {
    if (has(required, to) && !has(required, from)) {
      return { state: 'gained', label: 'required' }
    }

    if (!has(required, to) && has(required, from)) {
      return { state: 'lost', label: 'required' }
    }
  }

  const preferred = policy?.prefer?.[axis]

  if (preferred?.length) {
    const before = preferred.indexOf(from)
    const after = preferred.indexOf(to)

    if (after !== -1 && (before === -1 || after < before)) {
      return { state: 'gained', label: 'preferred' }
    }

    if (before !== -1 && (after === -1 || after > before)) {
      return { state: 'lost', label: 'preferred' }
    }
  }

  return { state: 'changed', label: 'changed' }
}

export const useProposalDiff = (owned, proposed, policy) => useMemo(() => {
  const base = baseline(owned)
  const left = base.release?.meta || null
  const right = proposed?.meta || null

  const rows = (left && right) ? AXES.map(axis => ({
    axis,
    from: left[axis],
    to: right[axis],
    ...judge(axis, left[axis], right[axis], policy),
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
const Value = ({ axis = '', value = null, ...props }) => (
  <span sx={Value.styles.element}>
    {!!logos[axis]?.[value] && logos[axis][value]}
    {(!logos[axis]?.[value] || axis === 'language') && <code>{value || '–'}</code>}
  </span>
)

Value.styles = {
  element: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    minWidth: 0,
    '>code': { variant: 'code.tag', fontSize: 6, whiteSpace: 'nowrap' },
    '>abbr': { fontSize: 3, textDecoration: 'none' },
    '>svg': { height: '1.25em', color: 'text' },
  },
}

const UIDiffRow = ({ axis = '', from = null, to = null, state = 'same', label = '', ...props }) => (
  <div sx={{ ...UIDiffRow.styles.element, ...(state === 'same' ? UIDiffRow.styles.same : {}) }}>
    <label>{axis}</label>
    <Value axis={axis} value={from} />
    <span sx={UIDiffRow.styles.arrow}>{state === 'same' ? '=' : '→'}</span>
    <Value axis={axis} value={to} />
    <em sx={{ ...UIDiffRow.styles.label, ...(UIDiffRow.styles as any)[state] }}>{label}</em>
  </div>
)

UIDiffRow.styles = {
  element: {
    display: 'grid',
    gridTemplateColumns: '6em minmax(0, 9em) 1.25em minmax(0, 9em) minmax(0, 1fr)',
    alignItems: 'center',
    gap: 8,
    paddingY: 10,
    fontSize: 6,
    '>label': {
      color: 'grayDarker',
      textTransform: 'capitalize',
    },
  },
  same: {
    opacity: 0.3,
  },
  arrow: {
    color: 'grayDarker',
    textAlign: 'center',
  },
  label: {
    fontStyle: 'normal',
    fontSize: 7,
    fontWeight: 'semibold',
    color: 'grayDarker',
  },
  gained: { color: 'primary' },
  lost: { color: 'warning' },
  avoided: { color: 'error' },
  changed: { color: 'grayDarker' },
}

const DiffRow = memo(UIDiffRow)

const UISizeRow = ({ from = null, to = null, delta = null, command = 'refine', ...props }) => {
  const wanted = command === 'shrink' ? 'down' : null
  const state = !delta ? 'same' : wanted === 'down' ? (delta < 0 ? 'gained' : 'avoided') : (delta < 0 ? 'gained' : 'lost')

  return (
    <div sx={{ ...UIDiffRow.styles.element, ...(delta ? {} : UIDiffRow.styles.same) }}>
      <label>Size</label>
      <span sx={Value.styles.element}><code>{typeof from === 'number' ? filesize.stringify(from) : '–'}</code></span>
      <span sx={UIDiffRow.styles.arrow}>{delta ? '→' : '='}</span>
      <span sx={Value.styles.element}><code>{typeof to === 'number' ? filesize.stringify(to) : '–'}</code></span>
      <em sx={{ ...UIDiffRow.styles.label, ...(UIDiffRow.styles as any)[state] }}>
        {delta ? `${delta > 0 ? '+' : '−'}${filesize.stringify(Math.abs(delta))}` : 'same'}
      </em>
    </div>
  )
}

const SizeRow = memo(UISizeRow)

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
              {!!diff.rows.length && (
                <div sx={UIProposal.styles.diff}>
                  {diff.rows.map(row => <DiffRow key={row.axis} {...row} />)}
                  <SizeRow from={diff.from?.size} to={proposal.size} delta={diff.size} command={command} />
                </div>
              )}
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
    flexDirection: 'column',
    paddingY: 8,
    borderTop: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'gray',
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
