import { memo } from 'react'
import { State as UIState, StateProps } from '../../../atoms/State/State'

export interface PersonStateProps extends Omit<StateProps, 'value' | 'options'> {
  value: 'loading' | 'ignored' | 'followed'
}

export const PersonStateOptions = [
  {
    emoji: '⌛',
    label: 'Loading',
    value: 'loading',
    hide: true,
  },
  {
    emoji: '🔕',
    label: 'Ignored',
    value: 'ignored',
  },
  {
    emoji: '🔔',
    label: 'Followed',
    value: 'followed',
  },
]

const UIPersonState = ({
  ...props
}: PersonStateProps) => (
  <UIState {...props} options={PersonStateOptions} />
)

export const PersonState = memo(UIPersonState)
