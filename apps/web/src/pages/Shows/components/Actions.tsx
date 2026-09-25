import { memo, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Option } from '@sensorr/ui'
import { entryPolicy, Policy } from '@sensorr/sensorr'
import { useSensorr } from '../../../store/sensorr'
import { useConfigContext } from '../../../contexts/Config/Config'
import { MetadataStyles, OptionInput, PolicyInput } from '../../Details/components/Metadata'

const DOWNLOADS = [
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
        <span id={ids.auto}>Downloads</span>
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
  const [pending, setPending] = useState(false)
  const id = `show-new-seasons-${entity.id}`

  const set = async (value) => {
    setPending(true)
    await setMetadata('monitor_new_seasons', value).catch(() => failed('monitor_new_seasons'))
    setPending(false)
  }

  return (
    <div>
      <ShowSettings entity={entity} metadata={metadata} ready={ready} setMetadata={setMetadata} />
      <div sx={MetadataStyles.container}>
        <div sx={{ ...block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
          <span id={id}>Follow new seasons</span>
          <OptionInput
            id={id}
            value={!!metadata?.monitor_new_seasons}
            disabled={!ready || !metadata?.monitored || pending}
            onChange={set}
            aria-labelledby={id}
            aria-describedby={`keep-up-to-date-${id}-help`}
          >
            {!metadata?.monitored ? 'Follow the show first' : metadata?.monitor_new_seasons ? 'Seasons to come are followed as they appear' : 'Seasons to come wait for you to follow them'}
          </OptionInput>
        </div>
      </div>
    </div>
  )
}

export const ShowActions = memo(UIShowActions)

// Below the seasons, away from the settings a show gets once
const UIShowRemove = ({ entity, episodes, ready, removeShow, ...props }) => {
  const [removing, setRemoving] = useState(false)
  const id = `show-library-${entity.id}`

  return (
    <section sx={UIShowRemove.styles.element} aria-labelledby={id}>
      <div sx={{ ...block, '&:first-of-type': { paddingX: 8 } }}>
        <span id={id}>Library</span>
        <button
          type='button'
          sx={UIShowRemove.styles.remove}
          disabled={!ready || removing}
          aria-busy={removing}
          aria-describedby={`${id}-help`}
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
        <small id={`${id}-help`}>Sensorr forgets the show and its episodes, their files stay on disk</small>
      </div>
    </section>
  )
}

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

UIShowRemove.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    paddingX: [4, '5em'],
    marginY: 4,
    textAlign: ['center', 'left'],
    '>div': {
      width: '100%',
      maxWidth: '95em',
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

export const ShowRemove = memo(UIShowRemove)
