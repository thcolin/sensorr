import { memo, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { entryPolicy, Policy } from '@sensorr/sensorr'
import { useSensorr } from '../../../store/sensorr'
import { useShowsMetadataContext } from '../../../contexts/ShowsMetadata/ShowsMetadata'
import { ListsInput, MetadataStyles, OptionInput, PolicyInput, QueryInput, termsValuesOf } from '../../Details/components/Metadata'

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

const UIShowSettings = ({ entity, metadata, ready, setMetadata, help = true, lists = null, children = null }) => {
  const sensorr = useSensorr()
  const { pending, set } = usePendingMetadata(setMetadata)
  const policy = useShowPolicy(entity, metadata)
  const query = useMemo(() => sensorr.getShowQuery(entity, metadata?.query), [entity?.id, entity?.query, metadata?.query])
  const years = query.years.map(Number)

  // Only the field changed is saved: the others keep following TMDB, the years a new season adds among them
  const setQuery = (changes) => set('query', { ...metadata?.query, ...changes })

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
    <div sx={lists ? { ...MetadataStyles.container, ...MetadataStyles.listed } : MetadataStyles.container}>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.wide, ...MetadataStyles.line }}>
        <span id={ids.terms}>Terms</span>
        <fieldset disabled={!ready || !!pending['query']} sx={MetadataStyles.fieldset} aria-labelledby={ids.terms}>
          <QueryInput
            aria-labelledby={ids.terms}
            value={termsValuesOf(query)}
            onChange={values => setQuery({ terms: values.filter(({ disabled }) => !disabled).map(({ value }) => value) })}
          />
        </fieldset>
        {help && <small title={helps.terms}>{helps.terms}</small>}
      </div>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.column }}>
        <span id={ids.years}>Years</span>
        <fieldset disabled={!ready || !!pending['query']} sx={MetadataStyles.fieldset} aria-labelledby={ids.years}>
          <YearsInput
            value={years.length ? [Math.min(...years), Math.max(...years)] : [null, null]}
            onChange={([from, to]) => setQuery({ years: Array.from({ length: to - from + 1 }, (_, index) => `${from + index}`) })}
          />
        </fieldset>
        {help && <small title={helps.years}>{helps.years}</small>}
      </div>
      {lists}
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.column }}>
        <span id={ids.policy}>Policy</span>
        <fieldset disabled={!ready || !!pending['policy']} sx={MetadataStyles.fieldset} aria-labelledby={ids.policy}>
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

const isRange = ([from, to]) => from >= 1900 && to <= new Date().getFullYear() + 10 && from <= to

// A range is kept once focus leaves both bounds, so each can be typed before the other; a wrong one stays shown
const UIYearsInput = ({ value, onChange }) => {
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    setDraft(value)
    setInvalid(false)
  }, [value[0], value[1]])

  const commit = () => {
    const [from, to] = draft.map(year => year ? Number(year) : null)

    if (from === value[0] && to === value[1]) {
      setInvalid(false)
    } else if (isRange([from, to])) {
      onChange([from, to])
    } else {
      setInvalid(true)
    }
  }

  return (
    <div
      sx={UIYearsInput.styles.element}
      data-invalid={invalid || undefined}
      onBlur={e => !e.currentTarget.contains(e.relatedTarget) && commit()}
    >
      {['From', 'To'].map((label, index) => [
        index > 0 && <span key='to' aria-hidden='true'>–</span>,
        <input
          key={label}
          type='text'
          inputMode='numeric'
          maxLength={4}
          placeholder='YYYY'
          aria-label={label}
          aria-invalid={invalid}
          value={draft[index] ?? ''}
          onChange={e => setDraft(draft.map((year, i) => i === index ? e.currentTarget.value.replace(/\D/g, '') : year))}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              commit()
            } else if (e.key === 'Escape') {
              setDraft(value)
              setInvalid(false)
            }
          }}
        />,
      ])}
    </div>
  )
}

// Bounds fill the box, so a tap anywhere in it lands in one, and meet at the dash
UIYearsInput.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginY: 10,
    padding: 10,
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'gray-500',
    transition: 'border-color 100ms ease-in-out',
    ':focus-within': {
      borderColor: 'grayDarkest',
    },
    '&[data-invalid]': {
      borderColor: 'error',
    },
    '>input': {
      variant: 'input.reset',
      flex: 1,
      minWidth: 0,
      paddingY: 9,
      paddingX: 12,
      fontFamily: 'body',
      fontSize: 6,
      fontWeight: 'semibold',
      fontVariantNumeric: 'tabular-nums',
      color: 'text',
      cursor: 'text',
      ':first-of-type': {
        textAlign: 'right',
      },
      '::placeholder': {
        color: 'gray-500',
        fontWeight: 'normal',
      },
    },
    '>span': {
      fontSize: 6,
      color: 'gray-500',
    },
  },
}

const YearsInput = memo(UIYearsInput)

// `setShowLists` writes a show Sensorr does not keep yet, as `ignored`
const ShowListsInput = ({ entity, metadata, ready = true }) => {
  const { setShowLists } = useShowsMetadataContext() as any

  return <ListsInput media='tv' value={metadata?.lists} disabled={!ready} onChange={(lists) => setShowLists(entity.id, () => lists)} />
}

// A show outside the library: its lists only
export const ShowLists = memo(({ entity, metadata }: { entity: any, metadata: any }) => (
  <div sx={{ ...MetadataStyles.container, ...MetadataStyles.listed }}>
    <ShowListsInput entity={entity} metadata={metadata} />
  </div>
))

const UIShowActions = ({ entity, metadata, ready, setMetadata, ...props }) => {
  const { pending, set } = usePendingMetadata(setMetadata)
  const ids = {
    monitored: `show-monitored-${entity.id}`,
    monitor_new_seasons: `show-new-seasons-${entity.id}`,
  }

  const labelled = (id) => ({
    'aria-labelledby': `${id}-label`,
    'aria-describedby': `keep-up-to-date-${id}-help`,
  })

  return (
    <ShowSettings
      entity={entity}
      metadata={metadata}
      ready={ready}
      setMetadata={setMetadata}
      lists={<ShowListsInput entity={entity} metadata={metadata} ready={ready} />}
    >
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.line, ...MetadataStyles.option }}>
        <span id={`${ids.monitored}-label`}>Follow episodes</span>
        <OptionInput
          id={ids.monitored}
          value={!!metadata?.monitored}
          disabled={!ready || !!pending['monitored']}
          onChange={value => set('monitored', value)}
          {...labelled(ids.monitored)}
        >
          {metadata?.monitored ? 'Sensorr searches the followed episodes' : 'Sensorr searches none of its episodes'}
        </OptionInput>
      </div>
      <div sx={{ ...MetadataStyles.block, ...MetadataStyles.line, ...MetadataStyles.option, gridColumn: ['auto', '2 / -1'] }}>
        <span id={`${ids.monitor_new_seasons}-label`}>Follow new seasons</span>
        <OptionInput
          id={ids.monitor_new_seasons}
          value={!!metadata?.monitor_new_seasons}
          disabled={!ready || !metadata?.monitored || !!pending['monitor_new_seasons']}
          onChange={value => set('monitor_new_seasons', value)}
          {...labelled(ids.monitor_new_seasons)}
        >
          {!metadata?.monitored ? 'Follow episodes first' : metadata?.monitor_new_seasons ? 'Seasons to come are followed as they appear' : 'Seasons to come wait for you to follow them'}
        </OptionInput>
      </div>
    </ShowSettings>
  )
}

export const ShowActions = memo(UIShowActions)
