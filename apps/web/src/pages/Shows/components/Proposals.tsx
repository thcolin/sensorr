import { memo, useMemo, useState } from 'react'
import { coverageLabel } from '@sensorr/sensorr'
import { emojize, filesize } from '@sensorr/utils'
import { Gestures } from '../../../components/Sensorr/Gestures'
import { isPending } from '../../Proposals/queue'

const UIProposals = ({ metadata, episodes, proceedRelease, ...props }) => {
  const pending = useMemo(() => (metadata?.releases || []).filter(isPending), [metadata?.releases])
  const [sending, setSending] = useState({})

  if (!pending.length) {
    return null
  }

  return (
    <section sx={UIProposals.styles.element} aria-labelledby='pending-proposals'>
      <div>
        <h4 id='pending-proposals' sx={UIProposals.styles.title}>{emojize('🛎️', 'Pending proposals')}</h4>
        {pending.map(release => (
          <div key={release.id} sx={UIProposals.styles.row}>
            <div sx={UIProposals.styles.release}>
              <strong>{coverageLabel(release.coverage || [], episodes || [])}</strong>
              <code title={[release.title, release.znab].filter(Boolean).join(' - ')}>{release.title}</code>
              <span>{filesize.stringify(release.size || 0)}</span>
            </div>
            <Gestures
              shortcuts={false}
              disabled={!!sending[release.id]}
              onGesture={async (verdict) => {
                setSending(sending => ({ ...sending, [release.id]: true }))
                await proceedRelease(release, verdict === 'accept').catch(() => null)
                setSending(sending => ({ ...sending, [release.id]: false }))
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

UIProposals.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'grayLighter',
    borderTop: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    paddingX: [4, '5em'],
    paddingY: '1.5em',
    marginY: 4,
    '>div': {
      width: '100%',
      maxWidth: '95em',
    },
  },
  title: {
    margin: 12,
    marginBottom: 6,
  },
  row: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'center'],
    gap: 6,
    paddingY: 6,
    paddingX: 8,
    borderBottom: '1px solid',
    borderColor: 'gray',
    transition: 'background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLight',
    },
    '&:last-of-type': {
      borderBottom: 'none',
    },
  },
  release: {
    flex: 1,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    minWidth: 0,
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
    '>strong': {
      flexShrink: 0,
      fontSize: 5,
      fontWeight: 'semibold',
      color: 'text',
    },
    '>code': {
      flex: 1,
      minWidth: 0,
      fontSize: 6,
      color: 'grayDarkest',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>span': {
      flexShrink: 0,
      fontSize: 6,
      color: 'text',
    },
  },
}

export const Proposals = memo(UIProposals)
