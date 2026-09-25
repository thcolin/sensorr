import { memo, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { coverageLabel } from '@sensorr/sensorr'
import { emojize, filesize } from '@sensorr/utils'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Gestures } from '../../../components/Sensorr/Gestures'
import { Release } from '../../../components/Sensorr/Release'
import { Transition } from '../../../components/Sensorr/Proposal'
import { isPending, proposalDiff, scoreReleases } from '../../Proposals/queue'
import { useShowPolicy } from './Actions'
import { fileMetaOf, fillsOf, ownedFilesOf } from './fills'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

const UIProposals = ({ entity, metadata, episodes, proceedRelease, ...props }) => {
  const { device } = useDeviceContext()
  const policy = useShowPolicy(entity, metadata)
  const [sending, setSending] = useState({})

  // Scored by the show's policy, as the Swaps screen scores a movie's releases, in the order they were stored
  const rows = useMemo(() => {
    const pending = (metadata?.releases || []).filter(isPending)
    const scored = scoreReleases(pending, policy)

    return pending.map(release => {
      const proposal = scored.find(({ id }) => id === release.id)
      const owned = policy.apply(ownedFilesOf(release, episodes).map(file => ({ ...file, meta: fileMetaOf(file) })), null)

      return {
        release: proposal,
        fills: fillsOf(release.coverage || [], episodes, release.level),
        diff: proposalDiff(owned, proposal, policy),
      }
    })
  }, [metadata?.releases, episodes, policy])

  const answer = async (release, verdict) => {
    setSending(sending => ({ ...sending, [release.id]: true }))

    try {
      await proceedRelease(release, verdict === 'accept')
    } catch {
      toast.error('Error while answering the proposal')
    }

    setSending(sending => ({ ...sending, [release.id]: false }))
  }

  // A and R answer the first proposal, as they answer the one on top of the Swaps queue
  const first = useRef(null)
  first.current = rows[0] && !sending[rows[0].release.id] ? (verdict) => answer(rows[0].release, verdict) : null

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable || document.querySelector('[aria-modal="true"]')) {
        return
      }

      const verdict = { a: 'accept', r: 'refuse' }[e.key.toLowerCase()]

      if (verdict && first.current) {
        e.preventDefault()
        first.current(verdict)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!rows.length) {
    return null
  }

  return (
    <section sx={UIProposals.styles.element} aria-labelledby='pending-proposals'>
      <div>
        <h2 id='pending-proposals' sx={UIProposals.styles.title}>{emojize('🛎️', 'Pending proposals')}</h2>
        {rows.map(({ release, fills, diff }, index) => {
          const brings = fills.total ? plural(fills.missing.length, 'episode') : null

          return (
            <div key={release.id} sx={UIProposals.styles.row}>
              <div sx={UIProposals.styles.coverage}>
                <strong>{coverageLabel(release.coverage || [], release.level || undefined)}</strong>
                {(typeof release.size === 'number' || !!brings) && (
                  <small title={fills.codes.join(' ')}>
                    {[typeof release.size === 'number' && filesize.stringify(release.size), brings && `for ${brings}`].filter(Boolean).join(' ')}
                    {!!fills.missing.length && fills.missing.length < fills.total && ` · ${fills.label}`}
                  </small>
                )}
              </div>
              <div sx={UIProposals.styles.release}>
                <Release
                  entity={release}
                  proceed={proceedRelease}
                  display={device === 'mobile' ? 'column' : 'row'}
                  actions={false}
                />
                {!!diff.listed.length && (
                  <div sx={UIProposals.styles.pills}>
                    {diff.listed.map(({ axis, from, to }) => (
                      <Transition key={axis} axis={axis} from={from} to={to} policy={policy} compact={true} />
                    ))}
                  </div>
                )}
              </div>
              <Gestures
                shortcuts={index === 0}
                disabled={!!sending[release.id]}
                onGesture={verdict => answer(release, verdict)}
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
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: ['center', 'flex-start'],
    gap: 8,
    paddingX: [12, 2],
    paddingBottom: 8,
  },
}

export const Proposals = memo(UIProposals)
