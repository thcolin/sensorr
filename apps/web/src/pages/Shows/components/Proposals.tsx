import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Icon } from '@sensorr/ui'
import { coverageLabel, swapOf } from '@sensorr/sensorr'
import { emojize, filesize } from '@sensorr/utils'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Release } from '../../../components/Sensorr/Release'
import { Transition } from '../../../components/Sensorr/Proposal'
import { Swap } from '../../Details/components/Releases'
import { isPending, proposalDiff, scoreReleases, sizeStateOf } from '../../Proposals/queue'
import { DELAY, usePendingVerdict } from '../../Proposals/pending'
import { VERDICTS } from '../../Proposals/Card'
import { useShowPolicy } from './Actions'
import { fileMetaOf, fillsOf, ownedFilesOf } from './fills'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

// What the size pill does not say: the episodes it replaces, the ones it brings
export const reachOf = (fills, swap) => {
  const partial = !!fills.missing.length && fills.missing.length < fills.total

  if (swap) {
    return [`replaces ${plural(swap.replaces, 'episode')}`, !!fills.missing.length && `fills ${fills.label}`].filter(Boolean).join(' · ')
  }

  return fills.total ? `fills ${partial ? fills.label : plural(fills.missing.length, 'episode')}` : null
}

// Where a proposal sits in the seasons block (Seasons.tsx): a single episode in its row, a single season atop
// its drawer, anything wider under "All seasons"
export const placeOf = ({ coverage = [], level = null }) => {
  const seasons = [...new Set(coverage.map(({ season }) => season))]

  if (seasons.length !== 1 || level === 'series') {
    return { season: null, episode: null }
  }

  return { season: seasons[0], episode: coverage.length === 1 && level !== 'season' ? coverage[0].episode : null }
}

const without = (object, key) => {
  const { [key]: removed, ...rest } = object
  return rest
}

// The pending proposals of a show, each one answered with an Undo delay. `episodes` is null until they load:
// before, a swap would read as replacing nothing
export const useProposals = ({ entity, metadata, episodes, proceedRelease, banRelease }) => {
  const policy = useShowPolicy(entity, metadata)
  const [decided, setDecided] = useState({})
  const keys = useRef(null)

  const rows = useMemo(() => {
    if (!episodes) {
      return []
    }

    const pending = (metadata?.releases || []).filter(isPending)
    const scored = scoreReleases(pending, policy)

    return pending.filter(release => !decided[release.id]).map(release => {
      const proposal = scored.find(({ id }) => id === release.id)
      const owned = policy.apply(ownedFilesOf(release, episodes).map(file => ({ ...file, meta: fileMetaOf(file) })), null)

      return {
        release: proposal,
        place: placeOf(release),
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
      <span sx={styles.pending}>
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

  keys.current = { rows, answer, undo, ban }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable || document.querySelector('[aria-modal="true"]')) {
        return
      }

      const key = e.key.toLowerCase()
      const verdict = { a: 'accept', r: 'refuse' }[key]

      if (verdict) {
        // The proposal whose buttons announce the keys: the first one shown, a closed drawer hides its own
        const id = document.querySelector('[data-proposal] [aria-keyshortcuts="A"]')?.closest('[data-proposal]')?.getAttribute('data-proposal')
        const row = keys.current.rows.find(({ release }) => String(release.id) === id)

        if (row) {
          e.preventDefault()
          keys.current.answer(row.release, verdict)
        }
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

  return { rows, policy, answer }
}

// A pending proposal laid out like a movie's (../../Details/components/Releases.tsx): its release row, the
// comparison centered under it, then its buttons. `reach` for a season or wider, an episode row says it already
const UIProposal = ({ row: { release, fills, swap, diff }, policy, answer, shortcuts = false, reach = false }) => {
  const { device } = useDeviceContext()
  const label = reach && reachOf(fills, swap)

  return (
    <div role='group' aria-label={`Pending proposal for ${coverageLabel(release.coverage || [], release.level || undefined)}`} data-proposal={release.id} sx={styles.proposal}>
      <Release entity={release} display={device === 'mobile' ? 'column' : 'row'} actions={false} />
      <Swap rows={diff.rows} policy={policy} shortcuts={shortcuts} onGesture={verdict => answer(release, verdict)}>
        {/* The owned files of the covered episodes against the proposal, like a movie's size pill (Releases.tsx) */}
        {!!swap && typeof release.size === 'number' && (
          <Transition
            axis='size'
            from={emojize('📦', filesize.stringify(swap.size))}
            to={filesize.stringify(release.size)}
            state={sizeStateOf(release.size - swap.size)}
          />
        )}
        {!!label && <small title={fills.codes.join(' ')} sx={styles.reach}>{label}</small>}
      </Swap>
    </div>
  )
}

export const Proposal = memo(UIProposal)

const styles = {
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
    paddingBottom: 4,
  },
  reach: {
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'grayDarkest',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
    textWrap: 'balance',
  },
}
