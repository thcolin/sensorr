import { memo } from 'react'
import { Trans } from 'react-i18next'
import { ProcessMoviesJob, spacePills } from './ProcessMovies'

export const summary = ({ refined = 0, processed, recorded = 0, proposal = 0, treated = 0, withdrawn, ignored, missing, warning, proposed, accepted }, extended = true, config = {} as any) => [
  ...(extended ? [{
    key: 'refined',
    emoji: '🪨',
    title: <Trans i18nKey='jobs.refine.summary.refined' values={{ count: refined }} components={[<strong />]} />,
    length: refined,
  }] : []),
  ...(extended && (processed > 0) ? [{
    key: 'processed',
    emoji: '🎟 ',
    title: <Trans i18nKey='jobs.process.summary.processed' values={{ count: processed }} components={[<strong />]} />,
    length: processed,
  }] : []),
  ...(config?.proposalOnly ? [{
    key: 'proposal',
    emoji: '🛎️ ',
    title: <Trans i18nKey='jobs.process.summary.proposal' values={{ count: Math.max(0, proposal - treated) }} components={[<strong />]} />,
    length: Math.max(0, proposal - treated),
  }] : []),
  ...(config?.proposalOnly && (treated > 0) ? [{
    key: 'treated',
    emoji: '💎',
    title: <Trans i18nKey='jobs.refine.summary.recorded' values={{ count: treated }} components={[<strong />]} />,
    length: treated,
  }] : [{
    key: 'recorded',
    emoji: '💎',
    title: <Trans i18nKey='jobs.refine.summary.recorded' values={{ count: recorded }} components={[<strong />]} />,
    length: recorded,
  }]),
  ...(extended && (withdrawn > 0) ? [{
    key: 'withdrawn',
    emoji: '🥈 ',
    title: <Trans i18nKey='jobs.process.summary.withdrawn' values={{ count: withdrawn }} components={[<strong />]} />,
    length: withdrawn,
  }] : []),
  ...spacePills({ proposed, accepted }),
  ...(extended && (ignored > 0) ? [{
    key: 'ignored',
    emoji: '🗑️ ',
    title: <Trans i18nKey='jobs.process.summary.ignored' values={{ count: ignored }} components={[<strong />]} />,
    length: ignored,
  }] : []),
  ...(extended && (missing > 0) ? [{
    key: 'missing',
    emoji: '📭 ',
    title: <Trans i18nKey='jobs.process.summary.missing' values={{ count: missing }} components={[<strong />]} />,
    length: missing,
  }] : []),
  ...(warning > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.process.summary.warning' values={{ count: warning }} components={[<strong />]} />,
    length: warning,
  }] : []),
]

const UIRefineJob = ({ job, logs }) => (
  <ProcessMoviesJob job={job} logs={logs} summary={summary} />
)

export const RefineJob = memo(UIRefineJob)
