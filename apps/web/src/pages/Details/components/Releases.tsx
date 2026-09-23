import { memo, useMemo } from 'react'
import { Policy } from '@sensorr/sensorr'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Release } from '../../../components/Sensorr/Release'
import { Transition } from '../../../components/Sensorr/Proposal'
import { Gestures } from '../../../components/Sensorr/Gestures'
import { filesize } from '@sensorr/utils'
import { isPending, proposalDiff, scoreReleases, sizeStateOf } from '../../Proposals/queue'

const UIReleases = ({ movie, metadata, removeRelease, proceedRelease, entities, ready, ...props }) => {
  const { device } = useDeviceContext()
  const policy = useMemo(() => metadata?.policy && new Policy({ ...metadata.policy, sorting: 'size', descending: false }), [metadata?.policy])
  const releases = useMemo(() => {
    if (!policy) {
      return []
    }

    return policy.apply(entities).sort((a, b) => a.proposal ? 1 : b.proposal ? -1 : 0)
  }, [policy, entities])

  // Each pending proposal gets the Swaps screen's comparison under the list, then its buttons.
  // Scored the way the Swaps screen scores them, so both pages show the same pills.
  const swaps = useMemo(() => {
    const scored = scoreReleases(entities, policy)
    const owned = scored.filter(release => !release.proposal)
    return scored.filter(isPending).map(release => ({ release, diff: proposalDiff(owned, release, policy) }))
  }, [entities, policy])

  const statistics = useMemo(() => ({
    lowest: {
      score: (releases.filter(release => release.valid).sort((a, b) => b.score - a.score).pop() || { score: 0 }).score,
      size: (releases.filter(release => release.valid).sort((a, b) => b.size - a.size).pop() || { size: 0 }).size,
    },
    highest: {
      score: (releases.filter(release => release.valid).sort((a, b) => a.score - b.score).pop() || { score: 0 }).score,
      size: (releases.filter(release => release.valid).sort((a, b) => a.size - b.size).pop() || { size: 0 }).size,
    },
  }), [releases])

  return (
    <div sx={UIReleases.styles.element}>
      {!!releases.length && (
        <div sx={{ '>div': { opacity: ready ? 1 : 0, transition: 'opacity 400ms ease-in-out' } }}>
          {releases.map((release, i) => (
            <Release
              key={i}
              entity={{ ...release, valid: true, from: release.from || 'record' }}
              statistics={statistics}
              proceed={proceedRelease}
              remove={removeRelease}
              compact={!release.proposal}
              display={device === 'mobile' ? 'column' : 'row'}
              actions={false}
            />
          ))}
          {swaps.map(({ release, diff }) => (
            <div key={release.id} sx={UIReleases.styles.swap}>
              {(!!diff.rows.length || typeof diff.size === 'number') && (
                <div sx={UIReleases.styles.pills}>
                  {diff.rows.map(({ axis, from, to }) => (
                    <Transition key={axis} axis={axis} from={from} to={to} policy={policy} />
                  ))}
                  {typeof diff.size === 'number' && (
                    <Transition
                      axis='size'
                      from={filesize.stringify((release.size || 0) - diff.size)}
                      to={filesize.stringify(release.size || 0)}
                      state={sizeStateOf(diff.size)}
                    />
                  )}
                </div>
              )}
              <Gestures onGesture={(verdict) => proceedRelease(release, verdict === 'accept')} shortcuts={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

UIReleases.styles = {
  element: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    marginY: 4,
    '>div': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'grayLighter',
      paddingX: [8, '4em'],
      paddingY: '1.5em',
      marginBottom: '1em',
      overflow: 'hidden',
      '>div': {
        width: '100%',
        maxWidth: '96rem',
      },
    },
  },
  swap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
  },
  pills: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 7,
    rowGap: 8,
    paddingY: 8,
  },
}

export const Releases = memo(UIReleases)
