import { memo, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Option } from '@sensorr/ui'
import { entryPolicy, Policy } from '@sensorr/sensorr'
import { useSensorr } from '../../../store/sensorr'
import { useConfigContext } from '../../../contexts/Config/Config'
import { MetadataStyles, OptionInput, PolicyInput } from '../../Details/components/Metadata'

export const DOWNLOADS = [
  { value: null, key: 'jobs', label: 'As jobs' },
  { value: true, key: 'ask', label: 'Ask first' },
  { value: false, key: 'auto', label: 'At once' },
]

// The fields of Details' Metadata, with labels that read at 60% instead of 40% lightness
const block = {
  ...MetadataStyles.block,
  '>span': { ...MetadataStyles.block['>span'], color: 'grayDarkest' },
  '>small': { ...MetadataStyles.block['>small'], color: 'grayDarkest' },
}

export const useShowPolicy = (entity, metadata) => {
  const sensorr = useSensorr()
  return useMemo(() => new Policy(metadata?.policy || entryPolicy({ original_language: entity?.original_language }, metadata, sensorr.policies)?.name || '', sensorr.policies), [metadata?.policy, entity?.original_language, sensorr.policies])
}

// `setShowMetadata` toasts a policy change, and nothing for the other fields of a single show
const failed = (key) => key !== 'policy' && toast.error('Error while updating show metadata')

// What decides the release a job picks for this show, also shown beside a show record in /jobs
const UIShowSettings = ({ entity, metadata, ready, setMetadata, help = true }) => {
  const { config } = useConfigContext()
  const [pending, setPending] = useState({})
  const policy = useShowPolicy(entity, metadata)
  const jobs = useMemo(() => ['record', 'airing']
    .map(command => `${command}: ${config?.get(`jobs.${command}.shows.proposalOnly`) ? 'ask first' : 'at once'}`)
    .join(' · '), [config])

  const auto = typeof metadata?.proposal_only === 'boolean' ? metadata.proposal_only : null
  const ids = {
    policy: `show-policy-${entity?.id}`,
    auto: `show-auto-${entity?.id}`,
  }

  const set = async (key, value) => {
    setPending(pending => ({ ...pending, [key]: true }))
    await setMetadata(key, value).catch(() => failed(key))
    setPending(pending => ({ ...pending, [key]: false }))
  }

  return (
    <div sx={MetadataStyles.container}>
      <div sx={{ ...block, ...UIShowSettings.styles.policy }}>
        <span id={ids.policy}>Policy</span>
        <fieldset disabled={!ready} sx={UIShowSettings.styles.fieldset} aria-labelledby={ids.policy}>
          <PolicyInput
            value={policy}
            onChange={value => set('policy', value)}
          />
        </fieldset>
        {help && (
          <small>Sensorr will apply selected policy to sort and select the best release for each episode</small>
        )}
      </div>
      <div sx={{ ...block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
        <span id={ids.auto}>Auto</span>
        <div role='radiogroup' aria-labelledby={ids.auto} aria-describedby={help ? `${ids.auto}-help` : undefined} sx={UIShowSettings.styles.radios}>
          {DOWNLOADS.map(({ value, key, label }) => (
            <Option
              key={key}
              id={`${ids.auto}-${key}`}
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
        {help && (
          <small id={`${ids.auto}-help`}>
            {auto === null ? `As the jobs say, ${jobs}` : auto ? 'Releases found wait for your answer' : 'Releases found download at once'}
          </small>
        )}
      </div>
    </div>
  )
}

export const ShowSettings = memo(UIShowSettings)

const UIShowActions = ({ entity, metadata, ready, setMetadata, ...props }) => {
  const [pending, setPending] = useState({})
  const ids = {
    monitored: `show-follow-${entity.id}`,
    monitor_new_seasons: `show-new-seasons-${entity.id}`,
  }

  const set = async (key, value) => {
    setPending(pending => ({ ...pending, [key]: true }))
    await setMetadata(key, value).catch(() => failed(key))
    setPending(pending => ({ ...pending, [key]: false }))
  }

  return (
    <div>
      <ShowSettings entity={entity} metadata={metadata} ready={ready} setMetadata={setMetadata} />
      <div sx={MetadataStyles.container}>
        <div sx={{ ...block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
          <span id={ids.monitored}>Follow</span>
          <OptionInput
            id={ids.monitored}
            value={!!metadata?.monitored}
            disabled={!ready || !!pending['monitored']}
            onChange={value => set('monitored', value)}
            aria-labelledby={ids.monitored}
            aria-describedby={`keep-up-to-date-${ids.monitored}-help`}
          >
            {metadata?.monitored ? 'Sensorr searches the followed episodes' : 'Sensorr searches none of its episodes'}
          </OptionInput>
        </div>
        <div sx={{ ...block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
          <span id={ids.monitor_new_seasons}>Follow new seasons</span>
          <OptionInput
            id={ids.monitor_new_seasons}
            value={!!metadata?.monitor_new_seasons}
            disabled={!ready || !metadata?.monitored || !!pending['monitor_new_seasons']}
            onChange={value => set('monitor_new_seasons', value)}
            aria-labelledby={ids.monitor_new_seasons}
            aria-describedby={`keep-up-to-date-${ids.monitor_new_seasons}-help`}
          >
            {!metadata?.monitored ? 'Follow the show first' : metadata?.monitor_new_seasons ? 'Seasons to come are followed as they appear' : 'Seasons to come wait for you to follow them'}
          </OptionInput>
        </div>
      </div>
    </div>
  )
}

export const ShowActions = memo(UIShowActions)

UIShowSettings.styles = {
  // Its help wraps under the select instead of ending on an ellipsis
  policy: {
    flex: 0,
    minWidth: '12em',
    '>small': {
      ...block['>small'],
      whiteSpace: 'normal',
      lineHeight: 'body',
    },
  },
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
      color: 'grayDarkest',
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
}
