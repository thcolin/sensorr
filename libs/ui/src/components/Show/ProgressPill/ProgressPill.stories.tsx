import { ProgressPill as UIProgressPill } from './ProgressPill'

export default { component: UIProgressPill, title: 'Components / Show / ProgressPill' }

export const ProgressPill = (args: any) => <UIProgressPill {...args} />

ProgressPill.args = {
  owned: 32,
  aired: 33,
  compact: true,
}

export const Complete = () => <UIProgressPill owned={33} aired={33} />
export const Empty = () => <UIProgressPill owned={0} aired={24} />
export const Longest = () => <UIProgressPill owned={912} aired={1454} />
export const Normal = () => <UIProgressPill owned={32} aired={33} compact={false} />
