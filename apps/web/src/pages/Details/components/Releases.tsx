import { memo, useMemo } from 'react'
import { Policy } from '@sensorr/sensorr'
import { Release } from '../../../components/Sensorr/Release'

const UIReleases = ({ movie, metadata, removeRelease, proceedRelease, entities, ready, ...props }) => {
  const policy = useMemo(() => metadata?.policy && new Policy({ ...metadata.policy, sorting: 'size', descending: false }), [metadata?.policy])
  const releases = useMemo(() => {
    if (!policy) {
      return []
    }

    return policy.apply(entities).sort((a, b) => a.proposal ? 1 : b.proposal ? -1 : 0)
  }, [policy, entities])

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
            />
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
    '>div': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'grayLighter',
      paddingX: '4em',
      paddingY: '1.5em',
      marginBottom: '1em',
      overflow: 'hidden',
      '>div': {
        width: '100%',
        maxWidth: '96rem',
      },
    },
  },
}

export const Releases = memo(UIReleases)
