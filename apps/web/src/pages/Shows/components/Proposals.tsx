import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Button, Icon } from '@sensorr/ui'
import { coverageLabel, swapOf } from '@sensorr/sensorr'
import { emojize, filesize } from '@sensorr/utils'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Release } from '../../../components/Sensorr/Release'
import { Transition } from '../../../components/Sensorr/Proposal'
import { ReleasesStyles, Swap } from '../../Details/components/Releases'
import { isPending, proposalDiff, scoreReleases, sizeStateOf } from '../../Proposals/queue'
import { DELAY, usePendingVerdict } from '../../Proposals/pending'
import { VERDICTS } from '../../Proposals/Card'
import { useShowPolicy } from './Actions'
import { fileMetaOf, fillsOf, ownedFilesOf } from './fills'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

// What the size pill does not say: the episodes it replaces, the ones it brings
const reachOf = (fills, swap) => {
  const partial = !!fills.missing.length && fills.missing.length < fills.total

  if (swap) {
    return [`replaces ${plural(swap.replaces, 'episode')}`, !!fills.missing.length && `fills ${fills.label}`].filter(Boolean).join(' · ')
  }

  return fills.total ? `fills ${partial ? fills.label : plural(fills.missing.length, 'episode')}` : null
}

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
        swap: release.swap ? swapOf(release.coverage || [], episodes) : null,
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

  // Laid out like a movie's releases block (../../Details/components/Releases.tsx), one titled group per proposal
  return (
    <section id='proposals' sx={ReleasesStyles.element} aria-label='Pending proposals'>
      <div>
        {rows.map(({ release, fills, swap, diff }, index) => {
          const reach = reachOf(fills, swap)
          const season = Math.min(...(release.coverage || []).map(({ season }) => season))

          return (
            <div key={release.id} role='group' aria-labelledby={`proposal-${release.id}`} sx={UIProposals.styles.proposal}>
              <div sx={UIProposals.styles.head}>
                <h2 id={`proposal-${release.id}`}>
                  {/* To the season it qualifies, opened alone and scrolled to (Seasons.tsx) */}
                  {Number.isFinite(season) ? (
                    <Link to={`#season-${season}`} title={`Go to the episodes of season ${season}`}>
                      {coverageLabel(release.coverage || [], release.level || undefined)}
                    </Link>
                  ) : coverageLabel(release.coverage || [], release.level || undefined)}
                </h2>
                {!!reach && <small title={fills.codes.join(' ')}>{reach}</small>}
              </div>
              <Release
                entity={release}
                proceed={proceedRelease}
                display={device === 'mobile' ? 'column' : 'row'}
                actions={false}
              />
              <Swap
                rows={diff.rows}
                policy={policy}
                shortcuts={index === 0}
                onGesture={verdict => answer(release, verdict)}
              >
                {/* The owned files of the covered episodes against the proposal, like a movie's size pill (Releases.tsx) */}
                {!!swap && typeof release.size === 'number' && (
                  <Transition
                    axis='size'
                    from={emojize('📦', filesize.stringify(swap.size))}
                    to={filesize.stringify(release.size)}
                    state={sizeStateOf(release.size - swap.size)}
                  />
                )}
              </Swap>
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
  proposal: {
    '&:not(:first-of-type)': {
      marginTop: 2,
    },
  },
  // At the release row's font size and inset (Release.tsx `wrapper`), so it spans the row and its divider
  head: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['center', 'baseline'],
    justifyContent: 'space-between',
    gap: [10, 4],
    fontSize: 6,
    paddingRight: [12, 0],
    paddingLeft: [12, 2],
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
    '>h2': {
      margin: 12,
      fontFamily: 'monospace',
      fontSize: 2,
      fontWeight: 'semibold',
      '>a': {
        color: 'inherit',
        textDecoration: 'none',
        ':hover': {
          textDecoration: 'underline',
          textUnderlineOffset: '0.25em',
        },
        ':focus-visible': {
          outline: '1px solid',
          outlineColor: 'grayDarkest',
          outlineOffset: '2px',
        },
      },
    },
    '>small': {
      fontSize: 4,
      lineHeight: 'body',
      color: 'grayDarkest',
      textAlign: ['center', 'right'],
      textWrap: 'balance',
    },
  },
}

export const Proposals = memo(UIProposals)
