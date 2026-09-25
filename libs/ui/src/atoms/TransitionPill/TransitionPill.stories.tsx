import { TransitionPill as UITransitionPill } from './TransitionPill'

export default { component: UITransitionPill, title: 'Atoms / TransitionPill' }

export const TransitionPill = (args: any) => <UITransitionPill {...args} />

TransitionPill.args = {
  from: 'x264',
  to: 'x265',
  state: 'quiet',
  compact: false,
}

export const Held = () => <UITransitionPill from='MULTi' to='MULTi-VFF' state='held' />
export const Broken = () => <UITransitionPill from='1080p' to='720p' state='broken' />
export const Same = () => <UITransitionPill to='1080p' state='same' />
export const Unknown = () => <UITransitionPill from='?' to='HE-AAC-5.1' state='held' unknown={{ from: true }} />
export const Compact = () => <UITransitionPill from='7.95 GB' to='2.23 GB' state='held' compact={true} />
