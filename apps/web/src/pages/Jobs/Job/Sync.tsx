import { memo, useMemo } from 'react'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { formatDuration, intervalToDuration } from 'date-fns'
import Movie from '../../../components/Movie/Movie'
import { Summary } from '../Summary'
import { Warnings } from '../Warnings'

export const summary = ({ archived = 0, plex = 0, corrections, missings }, extended = true) => [
  ...(extended ? [{
    key: 'archived',
    emoji: '🗄️',
    title: <span><strong>{archived}</strong> Archived movies in Sensorr library</span>,
    length: archived,
  }] : []),
  ...(extended ? [{
    key: 'plex',
    emoji: '📡',
    title: <span><strong>{plex}</strong> Available movies on Plex server</span>,
    length: plex,
  }] : []),
  {
    key: 'corrections',
    emoji: '🩹',
    title: <span><strong>{corrections?.success || 0}</strong> Fixed movies with Plex metadata</span>,
    length: corrections?.success || 0,
  },
  ...(missings?.success > 0 ? [{
    key: 'missings',
    emoji: '💊',
    title: <span><strong>{missings?.success}</strong> Missing movies in Sensorr but available on Plex</span>,
    length: missings?.success,
  }] : []),
  ...(((corrections?.warning || 0) + (missings?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{(corrections?.warning || 0) + (missings?.warning || 0)}</strong> Movies not fixed</span>,
    length: (corrections?.warning || 0) + (missings?.warning || 0),
  }] : []),
]

const UISyncJob = ({ job, logs }) => {
  const entities = useMemo(() => ({
    warning: [...(logs || [])].filter((log: any) => log.level === 'warn').sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    corrections: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.movie?.id && log.meta.group === 'corrections').map(({ meta: { movie } }) => movie).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    missings: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.movie?.id && log.meta.group === 'missings').map(({ meta: { movie } }) => movie).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  }), [logs])

  return (
    <div sx={UISyncJob.styles.element}>
      <div>
        <Warning
          emoji='🔗'
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UISyncJob.styles.title}>{job.meta.command}</span>
            </span>
          )}
          subtitle={(
            <>
              <span sx={UISyncJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UISyncJob.styles.subtitle}>{formatDuration(intervalToDuration({ start: new Date(job.start), end: new Date(job.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}</strong>
                </>
              )}
            </>
          )}
          children={(
            <span>
              <span sx={UISyncJob.styles.summary}>
                <Summary
                  error={job.meta.error}
                  meta={summary({
                    ...job.meta.summary,
                    corrections: {
                      success: job.meta.done ? job.meta.summary.corrections?.success : entities.corrections.length,
                      warning: job.meta.done ? job.meta.summary.corrections?.warning : entities.warning.length,
                    },
                    missings: {
                      success: job.meta.done ? job.meta.summary.missings?.success : entities.missings.length,
                      warning: job.meta.summary.missings?.warning,
                    },
                  })}
                />
              </span>
            </span>
          )}
          sx={{
            paddingTop: 'unset !important',
            '>h2': {
              textTransform: 'unset !important',
            },
          }}
        />
      </div>
      <div sx={UISyncJob.styles.content}>
        {logs === null ? (
          <div sx={UISyncJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : (entities?.warning?.length || entities?.corrections?.length || entities?.missings?.length) ? (
          <div sx={UISyncJob.styles.entities}>
            <Warnings logs={entities.warning} />
            <Entities
              id={`sync-missing-${job.id}`}
              entities={entities?.missings}
              length={entities?.missings?.length}
              label={emojize('💊', 'Missing')}
              display='grid'
              hide={true}
              child={Movie}
              props={() => ({
                display: 'poster',
              })}
            />
            <Entities
              id={`sync-fixed-${job.id}`}
              entities={entities?.corrections}
              length={entities?.corrections?.length}
              label={emojize('🩹', 'Fixed')}
              display='grid'
              hide={true}
              child={Movie}
              props={() => ({
                display: 'poster',
              })}
            />
          </div>
        ) : job.meta.done ? (
          <Warning emoji={job.meta.error ? '💢' : '🗄️'} title={job.meta.error ? 'Error': 'Empty'} subtitle={job.meta.error?.message || job.meta.error || 'No fixed movies during this job'} />
        ) : (
          <Warning emoji='⏳' title='Loading' subtitle='Waiting for entities fix...' />
        )}
      </div>
    </div>
  )
}

UISyncJob.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflowX: 'hidden',
  },
  link: {
    color: 'primary',
    opacity: 0.8,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'monospace',
    ':hover': {
      opacity: 1,
    },
  },
  title: {
    fontFamily: 'monospace',
  },
  subtitle: {
    color: 'grayDarkest',
    fontFamily: 'monospace',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entities: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
}

export const SyncJob = memo(UISyncJob)
