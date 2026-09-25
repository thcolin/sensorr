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

export const useShowPolicy = (entity, metadata) => {
  const sensorr = useSensorr()
  return useMemo(() => new Policy(metadata?.policy || entryPolicy({ original_language: entity?.original_language }, metadata, sensorr.policies)?.name || '', sensorr.policies), [metadata?.policy, entity?.original_language, sensorr.policies])
}

// `setShowMetadata` toasts a policy change, and nothing for the other fields of a single show
const failed = (key) => key !== 'policy' && toast.error('Error while updating show metadata')

const UIShowSettings = ({ entity, metadata, ready, setMetadata, help = true, children = null }) => {
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

  const helps = {
    policy: 'Sensorr will apply selected policy to sort and select the best release',
    auto: auto === null ? `As the jobs say, ${jobs}` : auto ? 'Releases found wait for your answer' : 'Releases found download at once',
  }

  return (
    <div sx={UIShowSettings.styles.container}>
      <div sx={MetadataStyles.block}>
        <span id={ids.policy}>Policy</span>
        <fieldset disabled={!ready} sx={UIShowSettings.styles.fieldset} aria-labelledby={ids.policy}>
          <PolicyInput
            value={policy}
            onChange={value => set('policy', value)}
          />
        </fieldset>
        {help && <small title={helps.policy}>{helps.policy}</small>}
      </div>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.wide }}>
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
        {help && <small id={`${ids.auto}-help`} title={helps.auto}>{helps.auto}</small>}
      </div>
      {children}
    </div>
  )
}

export const ShowSettings = memo(UIShowSettings)

const UIShowActions = ({ entity, metadata, ready, setMetadata, ...props }) => {
  const [pending, setPending] = useState({})
  const ids = {
    follow: `show-follow-${entity.id}`,
    monitored: `show-monitored-${entity.id}`,
    monitor_new_seasons: `show-new-seasons-${entity.id}`,
  }

  const set = async (key, value) => {
    setPending(pending => ({ ...pending, [key]: true }))
    await setMetadata(key, value).catch(() => failed(key))
    setPending(pending => ({ ...pending, [key]: false }))
  }

  const titles = {
    monitored: metadata?.monitored ? 'Sensorr searches the followed episodes' : 'Sensorr searches none of its episodes',
    monitor_new_seasons: metadata?.monitor_new_seasons ? 'Seasons to come are followed as they appear' : 'Seasons to come wait for you to follow them',
  }

  return (
    <ShowSettings entity={entity} metadata={metadata} ready={ready} setMetadata={setMetadata}>
      <div role='group' aria-labelledby={ids.follow} sx={{ ...MetadataStyles.block, ...MetadataStyles.option }}>
        <span id={ids.follow}>Follow</span>
        <div title={titles.monitored} sx={UIShowSettings.styles.follow}>
          <OptionInput
            id={ids.monitored}
            value={!!metadata?.monitored}
            disabled={!ready || !!pending['monitored']}
            onChange={value => set('monitored', value)}
            aria-labelledby={`keep-up-to-date-${ids.monitored}-help`}
          >
            Followed episodes
          </OptionInput>
        </div>
        <div title={titles.monitor_new_seasons} sx={UIShowSettings.styles.follow}>
          <OptionInput
            id={ids.monitor_new_seasons}
            value={!!metadata?.monitor_new_seasons}
            disabled={!ready || !metadata?.monitored || !!pending['monitor_new_seasons']}
            onChange={value => set('monitor_new_seasons', value)}
            aria-labelledby={`keep-up-to-date-${ids.monitor_new_seasons}-help`}
          >
            {metadata?.monitored ? 'New seasons as they appear' : 'Follow the show first'}
          </OptionInput>
        </div>
      </div>
    </ShowSettings>
  )
}

export const ShowActions = memo(UIShowActions)

UIShowSettings.styles = {
  // One row of content-wide columns, Policy first, stacked on mobile; each column spans the
  // label, control and help rows of a subgrid, so the controls and the helps line up across columns
  container: {
    display: ['flex', 'grid'],
    flexDirection: 'column',
    gridTemplateColumns: '12em minmax(0, max-content) max-content',
    columnGap: 0,
    '>div': {
      display: ['flex', 'grid'],
      gridRow: 'span 3',
      gridTemplateRows: 'subgrid',
      alignItems: ['stretch', 'center'],
    },
  },
  // Centered on mobile like the radios, so each box stays next to its label
  follow: {
    display: 'flex',
    justifyContent: ['center', 'flex-start'],
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
    flex: 1,
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
