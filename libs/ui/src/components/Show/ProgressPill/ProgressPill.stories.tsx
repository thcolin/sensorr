import { ProgressPill as UIProgressPill } from './ProgressPill'

export default { component: UIProgressPill, title: 'Components / Show / ProgressPill' }

export const ProgressPill = (args: any) => <UIProgressPill {...args} />

ProgressPill.args = {
  owned: 32,
  aired: 33,
  airing: false,
  compact: true,
}

export const EndedComplete = () => <UIProgressPill owned={33} aired={33} />
export const EndedMissing = () => <UIProgressPill owned={32} aired={33} />
export const AiringComplete = () => <UIProgressPill owned={42} aired={42} airing={true} />
export const AiringMissing = () => <UIProgressPill owned={40} aired={42} airing={true} />
export const AiringDetail = () => <UIProgressPill owned={42} aired={42} airing={true} detail='next episode on 29/09' />
export const AiringUnfollowed = () => <UIProgressPill owned={40} aired={42} airing={true} followed={false} />
export const AiringUnfollowedComplete = () => <UIProgressPill owned={42} aired={42} airing={true} followed={false} />
export const Empty = () => <UIProgressPill owned={0} aired={24} />
export const Longest = () => <UIProgressPill owned={912} aired={1454} />
export const Normal = () => <UIProgressPill owned={32} aired={33} compact={false} />
