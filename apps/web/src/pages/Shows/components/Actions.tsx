import { memo, useMemo, useState } from 'react'
import { Button, Progress } from '@sensorr/ui'
import { entryPolicy, Policy, progressOf } from '@sensorr/sensorr'
import { filesize } from '@sensorr/utils'
import { useSensorr } from '../../../store/sensorr'
import { PolicyInput } from '../../Details/components/Metadata'
import { Toggle } from './Toggle'

// Specials are left out of the show's progress, as they are of its search
const UIShowActions = ({ entity, metadata, episodes, inLibrary, ready, addShow, setMetadata, ...props }) => {
  const sensorr = useSensorr()
  const [adding, setAdding] = useState(false)
  const policy = useMemo(() => new Policy(metadata?.policy || entryPolicy({ original_language: entity?.original_language }, metadata, sensorr.policies)?.name || '', sensorr.policies), [metadata?.policy, entity?.original_language, sensorr.policies])
  const progress = useMemo(() => progressOf((episodes || []).filter(({ season_number }) => season_number !== 0)), [episodes])
  const size = useMemo(() => (episodes || []).reduce((acc, { files }) => acc + (files || []).reduce((sum, file) => sum + (file.size || 0), 0), 0), [episodes])

  if (!inLibrary) {
    return (
      <div sx={UIShowActions.styles.element}>
        <Button
          variant='contain'
          color='primary'
          disabled={!ready || adding}
          aria-busy={adding}
          onClick={async () => {
            setAdding(true)
            await addShow().catch(() => null)
            setAdding(false)
          }}
        >
          {adding ? 'Adding...' : 'Add to library'}
        </Button>
        <small sx={UIShowActions.styles.help}>Follows every season but the specials, and the seasons to come</small>
      </div>
    )
  }

  return (
    <div sx={UIShowActions.styles.element}>
      <div sx={UIShowActions.styles.block}>
        <span>Follow</span>
        <Toggle
          id={`follow-${entity.id}`}
          checked={!!metadata?.monitored}
          disabled={!ready}
          onChange={value => setMetadata('monitored', value)}
        >
          <small sx={UIShowActions.styles.help}>
            {metadata?.monitored ? 'Sensorr searches the followed episodes' : 'Sensorr searches nothing for this show'}
          </small>
        </Toggle>
      </div>
      <div sx={UIShowActions.styles.block}>
        <span>Policy</span>
        <fieldset disabled={!ready} sx={UIShowActions.styles.fieldset}>
          <PolicyInput
            value={policy}
            onChange={value => setMetadata('policy', value).catch(() => null)}
          />
        </fieldset>
      </div>
      <div sx={UIShowActions.styles.block}>
        <span>Auto</span>
        <Toggle
          id={`auto-${entity.id}`}
          checked={metadata?.proposal_only === false}
          disabled={!ready}
          onChange={value => setMetadata('proposal_only', !value)}
        >
          <small sx={UIShowActions.styles.help}>
            {typeof metadata?.proposal_only !== 'boolean' ? 'Follows the job setting' : metadata.proposal_only ? 'Releases found wait for your answer' : 'Releases found download at once'}
          </small>
        </Toggle>
        {typeof metadata?.proposal_only === 'boolean' && (
          <button type='button' sx={UIShowActions.styles.reset} disabled={!ready} onClick={() => setMetadata('proposal_only', null).catch(() => null)}>
            Use the job setting
          </button>
        )}
      </div>
      <div sx={UIShowActions.styles.block}>
        <span>Episodes</span>
        <p sx={UIShowActions.styles.progress}>
          <code>{progress.owned}/{progress.aired}</code> aired owned, <code>{filesize.stringify(size)}</code>
        </p>
        <Progress value={progress.owned} max={progress.aired} title={`${progress.owned} of ${progress.aired} aired episodes owned`} />
      </div>
    </div>
  )
}

UIShowActions.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: ['17em', 'unset'],
    marginTop: ['2em', '4em'],
    marginBottom: ['1em', '2em'],
    textAlign: 'left',
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'gray',
    '&:last-of-type': {
      borderBottom: 'none',
    },
    '>span': {
      fontWeight: 'semibold',
      fontSize: 7,
      color: 'grayDarkest',
      marginBottom: 10,
    },
    '>label': {
      alignSelf: 'stretch',
    },
  },
  fieldset: {
    alignSelf: 'stretch',
    minWidth: 0,
    margin: 12,
    padding: 12,
    border: 'none',
    transition: 'opacity 200ms ease-in-out',
    ':disabled': {
      opacity: 0.5,
    },
  },
  help: {
    display: 'block',
    marginTop: 10,
    fontSize: 7,
    color: 'grayDarkest',
    lineHeight: 'body',
  },
  reset: {
    variant: 'button.reset',
    marginTop: 10,
    fontSize: 7,
    color: 'grayDarkest',
    textDecoration: 'underline',
    textUnderlineOffset: '0.25em',
    cursor: 'pointer',
    transition: 'color 200ms ease-in-out',
    ':hover:not(:disabled)': {
      color: 'text',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
  },
  progress: {
    margin: 12,
    marginBottom: 8,
    fontSize: 6,
    color: 'text',
    fontVariantNumeric: 'tabular-nums',
    '>code': {
      fontFamily: 'monospace',
    },
  },
}

export const ShowActions = memo(UIShowActions)
