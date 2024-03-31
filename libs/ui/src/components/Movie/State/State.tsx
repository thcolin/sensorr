import { memo } from 'react'
import { State as UIState, StateProps } from '../../../atoms/State/State'

export interface MovieStateProps extends Omit<StateProps, 'value' | 'options'> {
  value: 'loading' | 'ignored' | 'missing' | 'pinned' | 'wished' | 'archived'
}

export const MovieStateOptions = [
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
    emoji: '💊',
    label: 'Missing',
    value: 'missing',
    hide: true,
  },
  {
    emoji: '📍',
    label: 'Pinned',
    value: 'pinned',
  },
  {
    emoji: '🍿',
    label: 'Wished',
    value: 'wished',
  },
  {
    emoji: '📼',
    label: 'Archived',
    value: 'archived',
  },
]

const UIMovieState = ({
  ...props
}: MovieStateProps) => (
  <UIState {...props as any} options={MovieStateOptions} />
)

export const MovieState = memo(UIMovieState)
