import { memo, useMemo, useState } from 'react'
import { coverageLabel } from '@sensorr/sensorr'
import { emojize } from '@sensorr/utils'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Gestures } from '../../../components/Sensorr/Gestures'
import { Release } from '../../../components/Sensorr/Release'
import { isPending } from '../../Proposals/queue'
import { fillsOf } from './fills'

const UIProposals = ({ metadata, episodes, proceedRelease, ...props }) => {
  const { device } = useDeviceContext()
  const pending = useMemo(() => (metadata?.releases || []).filter(isPending), [metadata?.releases])
  const [sending, setSending] = useState({})

  if (!pending.length) {
    return null
  }

  return (
    <section sx={UIProposals.styles.element} aria-labelledby='pending-proposals'>
      <div>
        <h2 id='pending-proposals' sx={UIProposals.styles.title}>{emojize('🛎️', 'Pending proposals')}</h2>
        {pending.map(release => {
          const fills = fillsOf(release.coverage || [], episodes, release.level)

          return (
            <div key={release.id} sx={UIProposals.styles.row}>
              <div sx={UIProposals.styles.coverage}>
                <strong>{coverageLabel(release.coverage || [], release.level || undefined)}</strong>
                {!!fills.total && (
                  <small title={fills.codes.join(' ')}>
                    fills {fills.missing.length} of {fills.total}{!!fills.missing.length && fills.missing.length < fills.total && ` · ${fills.label}`}
                  </small>
                )}
              </div>
              <div sx={UIProposals.styles.release}>
                <Release
                  entity={{ ...release, valid: true }}
                  proceed={proceedRelease}
                  display={device === 'mobile' ? 'column' : 'row'}
                  actions={false}
                />
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
          )
        })}
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
    fontSize: 3,
  },
  row: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'center'],
    gap: [8, 4],
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'gray',
    '&:last-of-type': {
      borderBottom: 'none',
    },
  },
  coverage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: ['center', 'flex-start'],
    gap: 10,
    flexShrink: 0,
    width: ['auto', '14em'],
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
    '>strong': {
      fontSize: 4,
      fontWeight: 'semibold',
      color: 'text',
    },
    '>small': {
      maxWidth: '100%',
      fontSize: 6,
      lineHeight: 'body',
      color: 'grayDarkest',
    },
  },
  release: {
    flex: 1,
    minWidth: 0,
    // The release row draws its own divider, the proposal row already has one
    '>div>div>div>div': {
      borderBottom: 'none',
    },
  },
}

export const Proposals = memo(UIProposals)
