import { memo, useMemo } from 'react'
import { emojize, filesize } from '@sensorr/utils'
import { formatDistanceToNowStrict } from 'date-fns'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import Movie from '../Movie/Movie'
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

// Releases stored on the movie document carry no score: it is recomputed from the
// movie policy, exactly like the job does before comparing (ProcessMoviesTask.js:307).
export const scoreReleases = (releases, policy) => (typeof policy?.apply === 'function' ?
  policy.apply((releases || []).map(({ meta, ...release }) => ({ ...release, title: release.original })), null) :
  (releases || [])
)

// `refine` and `shrink` compare the candidate against a synthetic pair built from
// every owned release (ProcessMoviesTask.js:307-311), which is not a real release.
// The best scored one is the closest thing to show side by side.
const pickOwned = (releases) => releases.reduce((best, release) => (best && best.score >= release.score) ? best : release, null)

const Gain = ({ value = null, unit = 'size', wanted = 'up', ...props }) => {
  if (!value) {
    return null
  }

  return (
    <code {...props} sx={{ ...Gain.styles.element, color: (wanted === 'down' ? value < 0 : value > 0) ? 'primary' : 'warning' }}>
      {value > 0 ? '+' : '−'}{unit === 'size' ? filesize.stringify(Math.abs(value)) : Math.abs(value)}
    </code>
  )
}

Gain.styles = {
  element: {
    variant: 'code.tag',
    backgroundColor: 'transparent',
    paddingX: 12,
    fontSize: 6,
    fontWeight: 'semibold',
  },
}

// Only the oleoo values that differ are shown: the untouched ones are already
// visible on both <Release> below, and repeating them would ask for attention.
const Shift = ({ from = null, to = null, logo = null, ...props }) => {
  if (!from || !to || from === to) {
    return null
  }

  return (
    <code {...props} sx={Shift.styles.element}>
      <span sx={Shift.styles.side}>{logo?.[from] || from}</span>
      <span sx={Shift.styles.arrow}>→</span>
      <span sx={Shift.styles.side}>{logo?.[to] || to}</span>
    </code>
  )
}

Shift.styles = {
  element: {
    variant: 'code.tag',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 6,
    fontWeight: 'semibold',
  },
  side: {
    display: 'inline-flex',
    alignItems: 'center',
    '>abbr': {
      fontSize: 3,
      textDecoration: 'none',
    },
  },
  arrow: {
    color: 'grayDarker',
    marginX: 8,
  },
}

const UIProposal = ({ entity = null, metadata = null, setMetadata = null, proceedRelease = null, ...props }) => {
  const releases = useMemo(() => scoreReleases(metadata?.releases, metadata?.policy), [metadata?.releases, metadata?.policy])
  const owned = useMemo(() => releases.filter(({ proposal }) => !proposal), [releases])
  const proposals = useMemo(() => releases.filter(({ proposal }) => proposal), [releases])
  const current = useMemo(() => pickOwned(owned), [owned])
  const treated = !!proposals.length && proposals.every(({ choice }) => typeof choice === 'boolean')

  return (
    <div sx={UIProposal.styles.element}>
      <div sx={{ ...UIProposal.styles.proposal, ...(treated ? UIProposal.styles.treated : {}) }}>
        <div sx={UIProposal.styles.movie}>
          <Movie entity={entity || {}} />
        </div>
        <div sx={UIProposal.styles.body}>
          <h5 sx={UIProposal.styles.title}>{entity?.title}</h5>
          {!treated && !!current && (
            <>
              <label sx={UIProposal.styles.label}>Current</label>
              <div sx={UIProposal.styles.release}>
                <Release entity={{ ...current, valid: true }} display='column' compact={true} />
              </div>
            </>
          )}
          {proposals.map((release) => (
            <div key={release.id}>
              <div sx={UIProposal.styles.gains}>
                <span sx={UIProposal.styles.job}>
                  {emojize(EMOJI[release.from], release.from)}
                  <small>#{release.job}</small>
                  {!!entity?.[PROCESSED_AT[release.from]] && (
                    <small>{formatDistanceToNowStrict(new Date(entity[PROCESSED_AT[release.from]]), { addSuffix: true })}</small>
                  )}
                </span>
                <Shift from={current?.meta?.language} to={release?.meta?.language} logo={logos.language} />
                <Shift from={current?.meta?.resolution} to={release?.meta?.resolution} />
                <Shift from={current?.meta?.source} to={release?.meta?.source} />
                <Gain value={current?.size ? release.size - current.size : null} unit='size' wanted={release.from === 'shrink' ? 'down' : 'up'} />
                <Gain value={current?.score ? release.score - current.score : null} unit='score' wanted='up' />
              </div>
              <div sx={UIProposal.styles.release}>
                <Release
                  entity={{ ...release, valid: true }}
                  display='column'
                  proceed={proceedRelease}
                  banned={(metadata?.banned_releases || []).includes(release.title)}
                  ban={() => setMetadata('banned_releases', (metadata?.banned_releases || []).includes(release.title) ?
                    (metadata?.banned_releases || []).filter(title => title !== release.title) :
                    [...(metadata?.banned_releases || []), release.title]
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

UIProposal.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingX: [8, '4em'],
    paddingBottom: 4,
  },
  proposal: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['center', 'unset'],
    width: '100%',
    maxWidth: '96rem',
    paddingY: 4,
    paddingX: [4, 2],
    backgroundColor: 'grayLighter',
    overflow: 'hidden',
    transition: 'opacity 400ms ease-in-out',
  },
  treated: {
    opacity: 0.4,
  },
  movie: {
    display: 'flex',
    maxWidth: '100%',
    marginRight: [12, 4],
    marginBottom: [4, 12],
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  title: {
    fontSize: 4,
    marginBottom: 8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  label: {
    color: 'grayDarker',
    fontSize: 7,
    fontWeight: 'semibold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  gains: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  job: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'grayDarker',
    fontSize: 7,
    whiteSpace: 'nowrap',
    '>small': {
      fontFamily: 'monospace',
      marginLeft: 8,
    },
  },
  release: {
    flexShrink: 0,
    '>div>div': {
      paddingX: 12,
      '>div': {
        paddingY: 8,
      },
    },
  },
}

export const Proposal = memo(withMovieMetadataContext({ enhanced: true })(UIProposal))

export default Proposal
