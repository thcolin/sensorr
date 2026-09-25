import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Icon } from '@sensorr/ui'
import { coverageLabel } from '@sensorr/sensorr'
import { emojize, filesize } from '@sensorr/utils'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Gestures } from '../../../components/Sensorr/Gestures'
import { Release } from '../../../components/Sensorr/Release'
import { Transition } from '../../../components/Sensorr/Proposal'
import { isPending, proposalDiff, scoreReleases } from '../../Proposals/queue'
import { DELAY, usePendingVerdict } from '../../Proposals/pending'
import { VERDICTS } from '../../Proposals/Card'
import { useShowPolicy } from './Actions'
import { fileMetaOf, fillsOf, ownedFilesOf } from './fills'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

const without = (object, key) => {
  const { [key]: removed, ...rest } = object
  return rest
}

const UIProposals = ({ entity, metadata, episodes, proceedRelease, banRelease, ...props }) => {
  const { device } = useDeviceContext()
  const policy = useShowPolicy(entity, metadata)
  const [decided, setDecided] = useState({})
  const keys = useRef(null)

  const rows = useMemo(() => {
    const pending = (metadata?.releases || []).filter(isPending)
    const scored = scoreReleases(pending, policy)

    return pending.filter(release => !decided[release.id]).map(release => {
      const proposal = scored.find(({ id }) => id === release.id)
      const owned = policy.apply(ownedFilesOf(release, episodes).map(file => ({ ...file, meta: fileMetaOf(file) })), null)

      return {
        release: proposal,
        fills: fillsOf(release.coverage || [], episodes, release.level),
        diff: proposalDiff(owned, proposal, policy),
      }
    })
  }, [metadata?.releases, episodes, policy, decided])

  const send = useCallback(async ({ release, verdict }) => {
    try {
      if (verdict === 'ban') {
        await banRelease(release)
      }

      await proceedRelease(release, verdict === 'accept')
    } catch {
      toast.error(`Error while sending **${VERDICTS[verdict].label}** for **${coverageLabel(release.coverage || [], release.level || undefined)}**`)
    }

    setDecided(decided => without(decided, release.id))
  }, [proceedRelease, banRelease])

  const onUndo = useCallback(({ release }) => setDecided(decided => without(decided, release.id)), [])
  const { pending, hold, flush, undo } = usePendingVerdict({ send, onUndo })

  const notify = useCallback((release, verdict) => {
    const { emoji, icon, label, color } = VERDICTS[verdict] as any
    const message = (
      <span sx={UIProposals.styles.pending}>
        <span>
          <span>{entity?.name}</span>
          <small>{coverageLabel(release.coverage || [], release.level || undefined)}</small>
        </span>
        <code>{release.title}</code>
      </span>
    )
    const actions = (
      <>
        <Button variant='outline' color='gray' onClick={undo} aria-keyshortcuts='Z'>Undo</Button>
        {verdict === 'refuse' && <Button variant='outline' color='error' onClick={() => keys.current.ban()} aria-keyshortcuts='B'>Ban</Button>}
      </>
    )

    ;({ accept: toast.success, refuse: toast.error, ban: toast.error }[verdict] as any)(message, { id: 'proposal-pending', duration: DELAY, actions, countdown: true, title: label, icon: icon ? <span sx={{ display: 'flex', svg: { color } }}><Icon value={icon} active={true} width='1.25em' height='1.25em' /></span> : emoji })
  }, [undo, entity?.name])

  const answer = useCallback((release, verdict) => {
    flush()
    setDecided(decided => ({ ...decided, [release.id]: verdict }))
    hold({ release, verdict })
    notify(release, verdict)
  }, [flush, hold, notify])

  const ban = useCallback(() => {
    const current = pending.current

    if (!current || current.verdict !== 'refuse') {
      return
    }

    setDecided(decided => ({ ...decided, [current.release.id]: 'ban' }))
    hold({ ...current, verdict: 'ban' })
    notify(current.release, 'ban')
  }, [hold, notify])

  keys.current = {
    first: rows[0] ? (verdict) => answer(rows[0].release, verdict) : null,
    undo,
    ban,
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable || document.querySelector('[aria-modal="true"]')) {
        return
      }

      const key = e.key.toLowerCase()
      const verdict = { a: 'accept', r: 'refuse' }[key]

      if (verdict && keys.current.first) {
        e.preventDefault()
        keys.current.first(verdict)
      } else if (key === 'z' && pending.current) {
        e.preventDefault()
        keys.current.undo()
      } else if (key === 'b' && pending.current?.verdict === 'refuse') {
        e.preventDefault()
        keys.current.ban()
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
  pending: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 10,
    width: '22em',
    maxWidth: '100%',
    '>span': {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      '>span': {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      '>small': {
        flexShrink: 0,
        color: 'grayDarker',
        fontFamily: 'monospace',
        fontSize: 6,
      },
    },
    '>code': {
      fontSize: 6,
      color: 'grayDarkest',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
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
