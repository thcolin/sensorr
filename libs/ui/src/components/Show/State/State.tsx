import { memo } from 'react'
import { State as UIState, StateProps } from '../../../atoms/State/State'
import { Badge, BadgeProps } from '../../../atoms/Badge/Badge'

export interface ShowStateProps extends Omit<StateProps, 'value' | 'options'> {
  value: 'loading' | 'ignored' | 'unfollowed' | 'followed'
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
    label: 'Ignored',
    value: 'ignored',
  },
  {
    emoji: '📍',
    label: 'Pinned',
    value: 'unfollowed',
  },
  {
    // A television, it says TV. Not a bell, the 🛎️ of a pending proposal sits right under
    // this badge on a poster, and not 📹, the record job beside it in a notification
    emoji: '📺',
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

// A state that is off, like an episode or a season not followed: its emoji without its colors
export const INACTIVE = {
  filter: 'grayscale(1)',
  opacity: 0.4,
}

type EpisodeStatusValue = 'upcoming' | 'unmonitored' | 'wanted' | 'proposed' | 'owned'

// Keyed by the values of `episodeStatus` from @sensorr/sensorr. Not followed is the 📺 of a followed show, turned off
export const EpisodeStatusOptions: Record<EpisodeStatusValue, { emoji: string, label: string, inactive?: boolean }> = {
  upcoming: { emoji: '📅', label: 'Upcoming' },
  unmonitored: { emoji: '📺', label: 'Not followed', inactive: true },
  wanted: { emoji: '🍿', label: 'Wanted' },
  proposed: { emoji: '🛎️', label: 'Proposed' },
  owned: { emoji: '📼', label: 'Owned' },
}

export interface EpisodeStatusProps extends Omit<BadgeProps, 'emoji' | 'label'> {
  value: EpisodeStatusValue
}

const LABELLED = ['wanted', 'proposed']

const UIEpisodeStatus = ({ value, compact = false, ...props }: EpisodeStatusProps) => {
  const option = EpisodeStatusOptions[value]
  const label = !compact && LABELLED.includes(value) ? option?.label : null

  return (
    <Badge
      role='img'
      aria-label={option?.label}
      {...props}
      compact={!!label}
      emoji={option?.inactive ? <span sx={INACTIVE}>{option.emoji}</span> : option?.emoji}
      label={label}
      title={option?.label}
    />
  )
}

export const EpisodeStatus = memo(UIEpisodeStatus)
