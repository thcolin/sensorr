import { memo } from 'react'
import { ProcessMoviesJob, spacePills } from './ProcessMovies'

export const summary = ({ reported = 0, processed, recorded = 0, proposal = 0, treated = 0, withdrawn, ignored, missing, warning, proposed, accepted }, extended = true, config = {} as any) => [
  ...(extended ? [{
    key: 'reported',
    emoji: '🚩',
    title: <span><strong>{reported}</strong> Reported movies</span>,
    length: reported,
  }] : []),
  ...(extended && (processed > 0) ? [{
    key: 'processed',
    emoji: '🎟 ',
    title: <span><strong>{processed}</strong> Processed movies</span>,
    length: processed,
  }] : []),
  ...(config?.proposalOnly ? [{
    key: 'proposal',
    emoji: '🛎️ ',
    title: <span><strong>{Math.max(0, proposal - treated)}</strong> Release proposals</span>,
    length: Math.max(0, proposal - treated),
  }] : []),
  ...(config?.proposalOnly && (treated > 0) ? [{
    key: 'treated',
    emoji: '🔁',
    title: <span><strong>{treated}</strong> Replaced movies</span>,
    length: treated,
  }] : [{
    key: 'recorded',
    emoji: '🔁',
    title: <span><strong>{recorded}</strong> Replaced movies</span>,
    length: recorded,
  }]),
  ...(extended && (withdrawn > 0) ? [{
    key: 'withdrawn',
    emoji: '🥈 ',
    title: <span><strong>{withdrawn}</strong> Withdrawn movies releases</span>,
    length: withdrawn,
  }] : []),
  ...spacePills({ proposed, accepted }),
  ...(extended && (ignored > 0) ? [{
    key: 'ignored',
    emoji: '🗑️ ',
    title: <span><strong>{ignored}</strong> Ignored movies releases</span>,
    length: ignored,
  }] : []),
  ...(extended && (missing > 0) ? [{
    key: 'missing',
    emoji: '📭 ',
    title: <span><strong>{missing}</strong> Movies with no releases found</span>,
    length: missing,
  }] : []),
  ...(warning > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{warning}</strong> Disturbed during process</span>,
    length: warning,
  }] : []),
]

const UIReportJob = ({ job, logs }) => (
  <ProcessMoviesJob job={job} logs={logs} summary={summary} />
)

export const ReportJob = memo(UIReportJob)
