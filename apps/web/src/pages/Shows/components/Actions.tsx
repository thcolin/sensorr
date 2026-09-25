import { memo, useMemo, useState } from 'react'
import { Option } from '@sensorr/ui'
import { entryPolicy, Policy } from '@sensorr/sensorr'
import { useSensorr } from '../../../store/sensorr'
import { useConfigContext } from '../../../contexts/Config/Config'
import { MetadataStyles, OptionInput, PolicyInput } from '../../Details/components/Metadata'

const AUTO = [
  { value: null, label: 'Jobs' },
  { value: true, label: 'Ask' },
  { value: false, label: 'Auto' },
]

const UIShowActions = ({ entity, metadata, episodes, ready, removeShow, setMetadata, ...props }) => {
  const sensorr = useSensorr()
  const { config } = useConfigContext()
  const [pending, setPending] = useState({})
  const [removing, setRemoving] = useState(false)
  const policy = useMemo(() => new Policy(metadata?.policy || entryPolicy({ original_language: entity?.original_language }, metadata, sensorr.policies)?.name || '', sensorr.policies), [metadata?.policy, entity?.original_language, sensorr.policies])
  const jobs = useMemo(() => ['record', 'airing']
    .map(command => `${command}: ${config?.get(`jobs.${command}.shows.proposalOnly`) ? 'ask' : 'auto'}`)
    .join(' · '), [config])

  const auto = typeof metadata?.proposal_only === 'boolean' ? metadata.proposal_only : null
  const ids = {
    policy: `show-policy-${entity.id}`,
    auto: `show-auto-${entity.id}`,
    seasons: `show-new-seasons-${entity.id}`,
    library: `show-library-${entity.id}`,
  }

  const set = async (key, value) => {
    setPending(pending => ({ ...pending, [key]: true }))
    await setMetadata(key, value).catch(() => null)
    setPending(pending => ({ ...pending, [key]: false }))
  }

  return (
    <div>
      <div sx={MetadataStyles.container}>
        <div sx={{ ...MetadataStyles.block, flex: 0, minWidth: '12em', whiteSpace: ['wrap', 'nowrap'] }}>
          <span id={ids.policy}>Policy</span>
          <fieldset disabled={!ready} sx={UIShowActions.styles.fieldset} aria-labelledby={ids.policy}>
            <PolicyInput
              value={policy}
              onChange={value => set('policy', value)}
            />
          </fieldset>
          <small title='Sensorr will apply selected policy to sort and select the best release for each episode'>
            Sensorr will apply selected policy to sort and select the best release for each episode
          </small>
        </div>
        <div sx={{ ...MetadataStyles.block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
          <span id={ids.auto}>Auto</span>
          <div role='radiogroup' aria-labelledby={ids.auto} aria-describedby={`${ids.auto}-help`} sx={UIShowActions.styles.radios}>
            {AUTO.map(({ value, label }) => (
              <Option
                key={label}
                id={`${ids.auto}-${label.toLowerCase()}`}
                name={ids.auto}
                type='radio'
                checked={auto === value}
                disabled={!ready || !!pending['proposal_only']}
                onChange={() => set('proposal_only', value)}
              >
                <span>{label}</span>
              </Option>
            ))}
          </div>
          <small id={`${ids.auto}-help`}>
            {auto === null ? `As the jobs say, ${jobs}` : auto ? 'Releases found wait for your answer' : 'Releases found download at once'}
          </small>
        </div>
      </div>
      <div sx={MetadataStyles.container}>
        <div sx={{ ...MetadataStyles.block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
          <span id={ids.seasons}>Follow new seasons</span>
          <OptionInput
            id={ids.seasons}
            value={!!metadata?.monitor_new_seasons}
            disabled={!ready || !metadata?.monitored || !!pending['monitor_new_seasons']}
            onChange={value => set('monitor_new_seasons', value)}
            aria-labelledby={ids.seasons}
            aria-describedby={`keep-up-to-date-${ids.seasons}-help`}
          >
            {!metadata?.monitored ? 'Follow the show first' : metadata?.monitor_new_seasons ? 'Seasons to come are followed as they appear' : 'Seasons to come wait for you to follow them'}
          </OptionInput>
        </div>
        <div sx={{ ...MetadataStyles.block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
          <span id={ids.library}>Library</span>
          <button
            type='button'
            sx={UIShowActions.styles.remove}
            disabled={!ready || removing}
            aria-busy={removing}
            aria-describedby={`${ids.library}-help`}
            onClick={async () => {
              if (!confirm(`Do you want to remove "${entity?.name}" and its ${(episodes || []).length} episodes from the library ? Their files stay on disk`)) {
                return
              }

              setRemoving(true)
              await removeShow().catch(() => null)
              setRemoving(false)
            }}
          >
            {removing ? 'Removing...' : 'Remove from library'}
          </button>
          <small id={`${ids.library}-help`}>Sensorr forgets the show and its episodes, their files stay on disk</small>
        </div>
      </div>
    </div>
  )
}

UIShowActions.styles = {
  fieldset: {
    minWidth: 0,
    margin: 12,
    padding: 12,
    border: 'none',
    transition: 'opacity 200ms ease-in-out',
    ':disabled': {
      opacity: 0.5,
    },
  },
  radios: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: ['center', 'flex-start'],
    gap: 4,
    marginY: 10,
    '>label': {
      marginY: 12,
      color: 'gray-550',
      transition: 'color 200ms ease-in-out, opacity 200ms ease-in-out',
      ':has(input:checked)': {
        color: 'accentDark',
      },
      ':has(input:disabled)': {
        opacity: 0.5,
      },
      '>span': {
        fontSize: 6,
        color: 'text',
      },
    },
  },
  remove: {
    variant: 'button.reset',
    alignSelf: ['center', 'flex-start'],
    marginY: 10,
    fontSize: 6,
    color: 'grayDarkest',
    textDecoration: 'underline',
    textUnderlineOffset: '0.25em',
    cursor: 'pointer',
    transition: 'color 200ms ease-in-out',
    ':hover:not(:disabled)': {
      color: 'error',
    },
    ':disabled': {
      cursor: 'progress',
      opacity: 0.5,
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
  },
}

export const ShowActions = memo(UIShowActions)
