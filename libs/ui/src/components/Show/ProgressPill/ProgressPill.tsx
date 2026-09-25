import { memo } from 'react'
import { TransitionPill, TransitionPillProps } from '../../../atoms/TransitionPill/TransitionPill'

export interface ProgressPillProps extends Omit<TransitionPillProps, 'from' | 'to' | 'state'> {
  owned: number
  aired: number
}

// The owned episodes over the aired ones, in the pill of a proposal's comparison: green once every aired episode is owned
const UIProgressPill = ({ owned, aired, compact = true, ...props }: ProgressPillProps) => (
  <TransitionPill
    {...props}
    from={owned}
    to={aired}
    state={aired > 0 && owned >= aired ? 'held' : 'quiet'}
    compact={compact}
    title={`${owned} of ${aired} aired episodes owned`}
  />
)

export const ProgressPill = memo(UIProgressPill)
