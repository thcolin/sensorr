import { ReactNode, memo, useMemo } from 'react'
import { Cast, Crew, Movie, Person, fields, utils } from '@sensorr/tmdb'
import { Badge, BadgeProps } from '../Badge/Badge'
import Tippy from '@tippyjs/react'

export interface FocusProps extends Omit<BadgeProps, 'emoji' | 'label'> {
  entity: Movie | Person | Cast | Crew
  property: 'vote_average' | 'release_date_full' | 'release_date' | 'popularity' | 'runtime' | 'vote_count'
  label?: ReactNode
  emoji?: ReactNode
  tippy?: ReactNode
}

const emojis = {
  vote_average: (entity) => utils.judge(entity as Movie),
  release_date_full: () => '📅',
  release_date: () => '📅',
  popularity: () => '📣',
  runtime: () => '🕙',
  vote_count: () => '🗳',
}

const labels = {
  vote_average: (entity) => `${((entity as Movie).vote_average || 0).toFixed(1)}`,
  release_date_full: (entity) => (entity as Movie).release_date ? new Date((entity as Movie).release_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }) : 'Unknown',
  release_date: (entity) => (entity as Movie).release_date ? new Date((entity as Movie).release_date).getFullYear() : 'Unknown',
  popularity: (entity) => `${fields.popularity.humanize(entity as Movie)}`,
  runtime: (entity) => <span style={{ textTransform: 'none' }}>{fields.runtime.humanize(entity as Movie) || 'Unknown'}</span>,
  vote_count: (entity) => `${fields.vote_count.humanize(entity as Movie)}`,
}

const UIFocus = ({
  entity,
  property,
  tippy,
  ...props
}: FocusProps) => {
  const emoji = useMemo(() => props.emoji || emojis[property](entity), [entity, property, props.emoji])
  const label = useMemo(() => props.label || labels[property](entity), [entity, property, props.label])

  if (!entity) {
    return null
  }

  if (tippy) {
    return (
      <Tippy maxWidth='80vw' content={tippy}>
        <span>
          <Badge {...props} emoji={emoji} label={label} />
        </span>
      </Tippy>
    )
  }

  return (
    <Badge {...props} emoji={emoji} label={label} />
  )
}

export const Focus = memo(UIFocus)
