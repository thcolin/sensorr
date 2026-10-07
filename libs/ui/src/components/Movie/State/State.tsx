import { memo } from 'react'
import { State as UIState, StateProps } from '../../../atoms/State/State'
import i18n from '@sensorr/i18n'

export interface MovieStateProps extends Omit<StateProps, 'value' | 'options'> {
  value: 'loading' | 'ignored' | 'missing' | 'pinned' | 'wished' | 'archived'
}

export const MovieStateOptions = [
  {
    emoji: '⌛',
    get label() { return i18n.t('state.loading') },
    value: 'loading',
    hide: true,
  },
  {
    emoji: '🔕',
    get label() { return i18n.t('state.ignored') },
    value: 'ignored',
  },
  {
    emoji: '💊',
    get label() { return i18n.t('state.missing') },
    value: 'missing',
    hide: true,
  },
  {
    emoji: '📍',
    get label() { return i18n.t('state.pinned') },
    value: 'pinned',
  },
  {
    emoji: '🍿',
    get label() { return i18n.t('state.wished') },
    value: 'wished',
  },
  {
    emoji: '📼',
    get label() { return i18n.t('state.archived') },
    value: 'archived',
  },
]

const UIMovieState = ({
  ...props
}: MovieStateProps) => (
  <UIState {...props as any} options={MovieStateOptions} />
)

export const MovieState = memo(UIMovieState)
