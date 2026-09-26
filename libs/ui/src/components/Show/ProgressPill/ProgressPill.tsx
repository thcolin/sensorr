import { memo } from 'react'
import { TransitionPill, TransitionPillProps } from '../../../atoms/TransitionPill/TransitionPill'

export interface ProgressPillProps extends Omit<TransitionPillProps, 'from' | 'to' | 'state' | 'neutral'> {
  owned: number
  aired: number
  // The series still airs, so its aired count will grow
  airing?: boolean
  // Sensorr follows the series: an airing one it does not follow draws its aired side as a violet ring
  followed?: boolean
  // Appended to the title after the counts, like "next episode on 29/09"
  detail?: string
}

// The owned episodes over the aired ones, in the pill of a proposal's comparison. The aired side says the diffusion,
// violet while the series airs, and the owned side takes its tint once it covers every aired episode: green when ended.
// Airing and not followed, the aired side is a violet ring and the owned side stays gray.
const UIProgressPill = ({ owned, aired, airing = false, followed = true, detail, compact = true, ...props }: ProgressPillProps) => {
  const caught = aired > 0 && owned >= aired
  const label = [`${owned} of ${aired} aired episodes owned`, detail].filter(Boolean).join(' · ')

  return (
    <TransitionPill
      role='img'
      aria-label={label}
      {...props}
      from={owned}
      to={aired}
      state={airing ? (followed ? 'airing' : 'unfollowed') : caught ? 'held' : 'quiet'}
      neutral={{ from: !caught }}
      compact={compact}
      title={label}
    />
  )
}

export const ProgressPill = memo(UIProgressPill)
