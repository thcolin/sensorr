import { memo } from 'react'
import { State as UIState, StateProps } from '../../../atoms/State/State'
import { Badge, BadgeProps } from '../../../atoms/Badge/Badge'

export interface ShowStateProps extends Omit<StateProps, 'value' | 'options'> {
  value: 'loading' | 'unfollowed' | 'followed'
}

export const ShowStateOptions = [
  {
    emoji: '⌛',
    label: 'Loading',
    value: 'loading',
    hide: true,
  },
  {
    emoji: '🔕',
    label: 'Not followed',
    value: 'unfollowed',
  },
  {
    // Not a bell: the 🛎 of a pending proposal sits right under this badge on a poster
    emoji: '📹',
    label: 'Followed',
    value: 'followed',
  },
]

const UIShowState = ({
  ...props
}: ShowStateProps) => (
  <UIState {...props as any} options={ShowStateOptions} />
)

export const ShowState = memo(UIShowState)

// Keyed by the values of `episodeStatus` from @sensorr/sensorr
export const EpisodeStatusOptions = {
  upcoming: { emoji: '📅', label: 'Upcoming' },
  unmonitored: { emoji: '🔕', label: 'Not followed' },
  wanted: { emoji: '🍿', label: 'Wanted' },
  proposed: { emoji: '🛎️', label: 'Proposed' },
  owned: { emoji: '📼', label: 'Owned' },
}

export interface EpisodeStatusProps extends Omit<BadgeProps, 'emoji' | 'label'> {
  value: 'upcoming' | 'unmonitored' | 'wanted' | 'proposed' | 'owned'
}

// Only the states that wait on something carry their label; the others are an emoji circle
const LABELLED = ['wanted', 'proposed']

const UIEpisodeStatus = ({ value, compact = false, ...props }: EpisodeStatusProps) => {
  const label = !compact && LABELLED.includes(value) ? EpisodeStatusOptions[value]?.label : null

  return (
    <Badge
      {...props}
      compact={!!label}
      emoji={EpisodeStatusOptions[value]?.emoji}
      label={label}
      title={EpisodeStatusOptions[value]?.label}
    />
  )
}

export const EpisodeStatus = memo(UIEpisodeStatus)
