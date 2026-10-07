import { ReactNode, memo, useMemo } from 'react'
import Tippy from '@tippyjs/react'
import { useResponsiveValue } from '@sensorr/utils'
import { Cast, Crew, Movie, Person, fields, utils } from '@sensorr/tmdb'
import { Badge, BadgeProps } from '../Badge/Badge'
import i18n from '@sensorr/i18n'

export interface FocusProps extends Omit<BadgeProps, 'emoji' | 'label'> {
  entity: Movie | Person | Cast | Crew
  property: 'vote_average' | 'release_date_full' | 'release_date' | 'popularity' | 'runtime' | 'vote_count' | 'birthday'
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
  birthday: () => '🎂',
}

const labels = {
  vote_average: (entity) => `${((entity as Movie).vote_average || 0).toFixed(1)}`,
  release_date_full: (entity) => (entity as Movie).release_date ? new Date((entity as Movie).release_date).toLocaleDateString(i18n.language, { month: '2-digit', day: '2-digit' }) : i18n.t('ui.unknown'),
  release_date: (entity) => (entity as Movie).release_date ? new Date((entity as Movie).release_date).getFullYear() : i18n.t('ui.unknown'),
  popularity: (entity) => `${fields.popularity.humanize(entity as Movie)}`,
  runtime: (entity) => <span style={{ textTransform: 'none' }}>{fields.runtime.humanize(entity as Movie) || i18n.t('ui.unknown')}</span>,
  vote_count: (entity) => `${fields.vote_count.humanize(entity as Movie)}`,
  birthday: (entity) => (entity as Person).birthday ? new Date((entity as Person).birthday).toLocaleDateString(i18n.language, { month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : i18n.t('ui.unknown'),
}

const UIFocus = ({
  entity,
  property,
  tippy,
  ...props
}: FocusProps) => {
  const maxWidth = useResponsiveValue(['100vw', '80vw'])
  const emoji = useMemo(() => props.emoji || emojis[property](entity), [entity, property, props.emoji])
  const label = useMemo(() => props.label || labels[property](entity), [entity, property, props.label])

  if (!entity) {
    return null
  }

  if (tippy) {
    return (
      <Tippy maxWidth={maxWidth} content={tippy}>
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
