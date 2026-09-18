import { Badge as UIBadge } from './Badge'

export default { component: UIBadge, title: 'Atoms / Badge' }

export const Badge = (args: any) => <UIBadge {...args} />

Badge.args = {
  emoji: '🍿',
}

export const MovieStateLabel = () => <Badge emoji='🍿' label='Wished' />
export const MovieState = () => <Badge emoji='🍿' />
export const MovieFocus = () => <Badge emoji='📅' label='09/07' compact={true} size='small' />
export const PersonStateLabel = () => <Badge emoji='🔔' label='Followed' />
export const PersonState = () => <Badge emoji='🔔' />
