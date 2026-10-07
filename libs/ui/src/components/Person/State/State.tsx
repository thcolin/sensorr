import { memo } from 'react'
import { State as UIState, StateProps } from '../../../atoms/State/State'
import i18n from '@sensorr/i18n'

export interface PersonStateProps extends Omit<StateProps, 'value' | 'options'> {
  value: 'loading' | 'ignored' | 'followed'
}

export const PersonStateOptions = [
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
    emoji: '🔔',
    get label() { return i18n.t('state.followed') },
    value: 'followed',
  },
]

const UIPersonState = ({
  ...props
}: PersonStateProps) => (
  <UIState {...props as any} options={PersonStateOptions} />
)

export const PersonState = memo(UIPersonState)
