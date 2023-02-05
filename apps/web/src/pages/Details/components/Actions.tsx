import { memo, useMemo } from 'react'
import { Badge, PersonState, MovieState, Icon } from '@sensorr/ui'
import { Policy } from '@sensorr/sensorr'
import { Metadata } from './Metadata'
import { useSensorr } from '../../../store/sensorr'
import { Sensorr } from '../../../components/Sensorr'
import { Release } from '../../../components/Sensorr/Release'

const UIActions = ({ behavior, ready, entity, state, setState, metadata, setMetadata, proceedRelease, removeRelease, ...props }) => {
  return (
    <div sx={UIActions.styles.element}>
      <span>
        <ul>
          {behavior === 'movie' && (
            <li>
              <MovieState value={ready ? state : 'loading'} onChange={setState} compact={false} size='normal' color='theme' />
            </li>
          )}
          {behavior === 'person' && (
            <li>
              <PersonState value={ready ? state : 'loading'} onChange={setState} compact={false} size='normal' color='theme' />
            </li>
          )}
          {ready && state !== 'loading' && ['movie'].includes(behavior) && ( // TODO: Should add 'collection' behavior
            <>
              {state !== 'ignored' && (
                <li>
                  <button
                    onClick={() => setMetadata('cared', metadata.cared === false)}
                    sx={{ variant: 'button.reset', opacity: metadata.cared === false ? 0.5 : 1 }}
                  >
                    <Badge
                      emoji='🚑'
                      label={metadata.cared === false ? 'Non-Cared' : 'Cared'}
                      compact={false}
                      size='normal'
                      color='theme'
                      title={`Doctor jobs ${metadata.cared === false ? 'will not' : 'will'} search for a better release`}
                    />
                  </button>
                </li>
              )}
              {!!metadata?.plex_url && (
                <li>
                  <a href={metadata?.plex_url} target='_blank' rel='noopener noreferrer' sx={{ variant: 'link.reset' }}>
                    <Badge
                      emoji={<Icon value='plex' />}
                      label='Plex'
                      compact={false}
                      size='normal'
                      color='theme'
                      title="Plex library link to movie"
                    />
                  </a>
                </li>
              )}
              {state !== 'ignored' && (
                <li>
                  <Metadata
                    entity={ready ? entity : {}}
                    loading={!ready || state === 'loading'}
                    metadata={metadata}
                    onChange={setMetadata}
                    button={(
                      <Badge
                        emoji='💬'
                        label='Query'
                        compact={false}
                        size='normal'
                        color='theme'
                        title="Edit movie Sensorr query"
                      />
                    )}
                  />
                </li>
              )}
              {state !== 'ignored' && (
                <li>
                  <PolicySelect
                    value={metadata?.policy}
                    onChange={value => setMetadata('policy', value)}
                  />
                </li>
              )}
              <li>
                <Sensorr
                  entity={ready ? entity : {}}
                  loading={!ready || state === 'loading'}
                  metadata={metadata}
                  // onChange={setMetadata}
                  // onChange={(key, value) => console.log('Details/Sensorr.onChange', [key, value])}
                  button={(
                    <Badge
                      emoji='🎟'
                      label='Releases'
                      compact={false}
                      size='normal'
                      color='theme'
                      title="Search releases of this movie"
                    />
                  )}
                />
              </li>
            </>
          )}
        </ul>
      </span>
      {!!(metadata?.releases || []).length && (
        <Releases
          movie={entity}
          metadata={metadata}
          proceedRelease={proceedRelease}
          removeRelease={removeRelease}
          entities={metadata.releases}
        />
      )}
    </div>
  )
}

UIActions.styles = {
  element: {
    '>span': {
      display: 'block',
      overflowX: 'auto',
      '>ul': {
        display: 'inline-flex',
        flexDirection: 'row',
        justifyContent: ['center', 'flex-start'],
        listStyle: 'none',
        margin: 12,
        padding: 12,
        '>li': {
          margin: 12,
          marginX: 8,
          ':first-child': {
            marginLeft: 12,
          },
          ':last-child': {
            marginRight: 12,
          },
        },
      },
    },
    '>div': {
      marginY: 5,
    },
  }
}

export const Actions = memo(UIActions)

const UIPolicySelect = ({ value, onChange, ...props }) => {
  const sensorr = useSensorr()

  return (
    <label htmlFor='policy' title={`"${value.name}" Policy`} sx={UIPolicySelect.styles.element}>
      <Badge emoji='🚧' label={`"${value.name}"`} compact={false} size='normal' color='theme' />
      <select
        id='policy'
        value={value.name}
        onChange={e => onChange(e.currentTarget.value)}
      >
        {sensorr.policies.map(policy => (
          <option key={policy.name} value={policy.name}>
            {(policy.name || '').charAt(0).toUpperCase()}{(policy.name || '').slice(1)}
          </option>
        ))}
      </select>
    </label>
  )
}

UIPolicySelect.styles = {
  element: {
    display: 'block',
    position: 'relative',
    '>select': {
      variant: 'select.reset',
      position: 'absolute',
      opacity: 0,
      top: '0em',
      left: '0em',
      height: '100%',
      width: '100%',
      '>option': {
        textTransform: 'capitalize',
      },
    },
  },
}

const PolicySelect = memo(UIPolicySelect)

const UIReleases = ({ movie, metadata, removeRelease, proceedRelease, entities, ...props }) => {
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
    <div>
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
  )
}

const Releases = memo(UIReleases)
