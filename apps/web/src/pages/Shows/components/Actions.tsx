import { memo, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { entryPolicy, Policy } from '@sensorr/sensorr'
import { useSensorr } from '../../../store/sensorr'
import { MetadataStyles, OptionInput, PolicyInput, QueryInput, termsValuesOf } from '../../Details/components/Metadata'

export const useShowPolicy = (entity, metadata) => {
  const sensorr = useSensorr()
  return useMemo(() => new Policy(metadata?.policy || entryPolicy({ original_language: entity?.original_language }, metadata, sensorr.policies)?.name || '', sensorr.policies), [metadata?.policy, entity?.original_language, sensorr.policies])
}

// `setShowMetadata` toasts a policy change, and nothing for the other fields of a single show
const failed = (key) => key !== 'policy' && toast.error('Error while updating show metadata')

// A field is pending from its write to its answer, its control disabled meanwhile
const usePendingMetadata = (setMetadata) => {
  const [pending, setPending] = useState({})

  const set = async (key, value) => {
    setPending(pending => ({ ...pending, [key]: true }))
    await setMetadata(key, value).catch(() => failed(key))
    setPending(pending => ({ ...pending, [key]: false }))
  }

  return { pending, set }
}

const UIShowSettings = ({ entity, metadata, ready, setMetadata, help = true, children = null }) => {
  const sensorr = useSensorr()
  const { pending, set } = usePendingMetadata(setMetadata)
  const policy = useShowPolicy(entity, metadata)
  const query = useMemo(() => sensorr.getShowQuery(entity, metadata?.query), [entity?.id, entity?.query, metadata?.query])
  const years = query.years.map(Number)

  // `getShowQuery` keeps a saved query only when its titles, terms and years are all set
  const setQuery = (changes) => set('query', { titles: query.titles, terms: query.terms, years: query.years, ...changes })

  const ids = {
    terms: `show-terms-${entity?.id}`,
    years: `show-years-${entity?.id}`,
    policy: `show-policy-${entity?.id}`,
  }

  const helps = {
    terms: 'Sensorr will search for all selected terms on configured indexers',
    years: 'Sensorr will filter releases with a year outside this range',
    policy: 'Sensorr will apply selected policy to sort and select the best release',
  }

  return (
    <div sx={UIShowSettings.styles.container}>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.wide, ...MetadataStyles.line }}>
        <span id={ids.terms}>Terms</span>
        <fieldset disabled={!ready || !!pending['query']} sx={UIShowSettings.styles.fieldset} aria-labelledby={ids.terms}>
          <QueryInput
            value={termsValuesOf(query)}
            onChange={values => setQuery({ terms: values.filter(({ disabled }) => !disabled).map(({ value }) => value) })}
          />
        </fieldset>
        {help && <small title={helps.terms}>{helps.terms}</small>}
      </div>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.column }}>
        <span id={ids.years}>Years</span>
        <fieldset disabled={!ready || !!pending['query']} sx={UIShowSettings.styles.fieldset} aria-labelledby={ids.years}>
          <YearsInput
            value={years.length ? [Math.min(...years), Math.max(...years)] : [null, null]}
            onChange={([from, to]) => setQuery({ years: Array.from({ length: to - from + 1 }, (_, index) => `${from + index}`) })}
          />
        </fieldset>
        {help && <small title={helps.years}>{helps.years}</small>}
      </div>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.column }}>
        <span id={ids.policy}>Policy</span>
        <fieldset disabled={!ready || !!pending['policy']} sx={UIShowSettings.styles.fieldset} aria-labelledby={ids.policy}>
          <PolicyInput
            value={policy}
            onChange={value => set('policy', value)}
          />
        </fieldset>
        {help && <small title={helps.policy}>{helps.policy}</small>}
      </div>
      {children}
    </div>
  )
}

export const ShowSettings = memo(UIShowSettings)

// A year is kept on blur or Enter once both bounds read as years in order, the last saved range otherwise
const UIYearsInput = ({ value, onChange }) => {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value[0], value[1]])

  const commit = () => {
    const [from, to] = draft.map(Number)

    if (from >= 1000 && to <= 9999 && from <= to && (from !== value[0] || to !== value[1])) {
      onChange([from, to])
    } else {
      setDraft(value)
    }
  }

  return (
    <div sx={UIYearsInput.styles.element}>
      {['From', 'To'].map((label, index) => [
        index > 0 && <span key='to' aria-hidden='true'>–</span>,
        <input
          key={label}
          type='text'
          inputMode='numeric'
          maxLength={4}
          aria-label={label}
          value={draft[index] ?? ''}
          onChange={e => setDraft(draft.map((year, i) => i === index ? e.currentTarget.value.replace(/\D/g, '') : year))}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
        />,
      ])}
    </div>
  )
}

UIYearsInput.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginY: 10,
    paddingY: '5px',
    paddingX: 9,
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'gray-500',
    transition: 'border-color 200ms ease-in-out',
    ':focus-within': {
      borderColor: 'accent',
    },
    '>input': {
      variant: 'input.reset',
      width: '4ch',
      padding: 10,
      fontSize: 6,
      fontWeight: 'semibold',
      fontVariantNumeric: 'tabular-nums',
      color: 'text',
      textAlign: 'center',
      cursor: 'text',
    },
    '>span': {
      fontSize: 6,
      color: 'gray-500',
    },
  },
}

const YearsInput = memo(UIYearsInput)

const UIShowActions = ({ entity, metadata, ready, setMetadata, ...props }) => {
  const { pending, set } = usePendingMetadata(setMetadata)
  const ids = {
    monitored: `show-monitored-${entity.id}`,
    monitor_new_seasons: `show-new-seasons-${entity.id}`,
  }

  return (
    <ShowSettings entity={entity} metadata={metadata} ready={ready} setMetadata={setMetadata}>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.line, ...MetadataStyles.option }}>
        <span>Follow episodes</span>
        <OptionInput
          id={ids.monitored}
          value={!!metadata?.monitored}
          disabled={!ready || !!pending['monitored']}
          onChange={value => set('monitored', value)}
          aria-labelledby={`keep-up-to-date-${ids.monitored}-help`}
        >
          {metadata?.monitored ? 'Sensorr searches the followed episodes' : 'Sensorr searches none of its episodes'}
        </OptionInput>
      </div>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.line, ...MetadataStyles.option, gridColumn: ['auto', '2 / -1'] }}>
        <span>Follow new seasons</span>
        <OptionInput
          id={ids.monitor_new_seasons}
          value={!!metadata?.monitor_new_seasons}
          disabled={!ready || !metadata?.monitored || !!pending['monitor_new_seasons']}
          onChange={value => set('monitor_new_seasons', value)}
          aria-labelledby={`keep-up-to-date-${ids.monitor_new_seasons}-help`}
        >
          {!metadata?.monitored ? 'Follow the show first' : metadata?.monitor_new_seasons ? 'Seasons to come are followed as they appear' : 'Seasons to come wait for you to follow them'}
        </OptionInput>
      </div>
    </ShowSettings>
  )
}

export const ShowActions = memo(UIShowActions)

UIShowSettings.styles = {
  // The movie grid, with helps that wrap under their control instead of ending on an ellipsis
  container: {
    ...MetadataStyles.container,
    small: {
      whiteSpace: 'normal',
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
}
