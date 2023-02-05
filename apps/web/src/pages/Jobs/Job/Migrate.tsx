import { memo, useMemo } from 'react'
import { Entities, Icon, Person, Warning } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { formatDuration, intervalToDuration } from 'date-fns'
import Movie from '../../../components/Movie/Movie'
import { Summary } from '../Summary'
import { Warnings } from '../Warnings'

export const summary = ({
  dump = { movies: 0, persons: 0 },
  local = { movies: 0, persons: 0 },
  movies = { success: 0, warning: 0 },
  persons = { success: 0, warning: 0 },
}) => [
  {
    key: 'dump',
    emoji: '📦',
    title: <span><strong>{(dump.movies + dump.persons)}</strong> Documents from dump ({dump.movies} Movies, {dump.persons} Persons)</span>,
    length: (dump.movies + dump.persons),
  },
  {
    key: 'local',
    emoji: '🗄️',
    title: <span><strong>{(local.movies + local.persons)}</strong> Documents from Sensorr library ({local.movies} Movies, {local.persons} Persons)</span>,
    length: (local.movies + local.persons),
  },
  ...(movies?.success > 0 ? [{
    key: 'movies',
    emoji: '🎞️',
    title: <span><strong>{movies?.success}</strong> Movies migrated from dump</span>,
    length: movies?.success,
  }] : []),
  ...(persons?.success > 0 ? [{
    key: 'persons',
    emoji: '🎭',
    title: <span><strong>{persons?.success}</strong> Persons migrated from dump</span>,
    length: persons?.success,
  }] : []),
  ...(((movies?.warning || 0) + (persons?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{(movies?.warning || 0) + (persons?.warning || 0)}</strong> Errors during documents migration</span>,
    length: (movies?.warning || 0) + (persons?.warning || 0),
  }] : []),
]

const UIMigrateJob = ({ job, logs }) => {
  const entities = useMemo(() => ({
    warning: [...(logs || [])].filter((log: any) => log.level === 'warn').sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    movies: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.entity?.id && log.meta.type === 'movies').map(({ meta: { entity } }) => entity).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    persons: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.entity?.id && log.meta.type === 'persons').map(({ meta: { entity } }) => entity).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  }), [logs])

  return (
    <div sx={UIMigrateJob.styles.element}>
      <div>
        <Warning
          emoji='🚚'
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIMigrateJob.styles.title}>{job.meta.command}</span>
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIMigrateJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIMigrateJob.styles.subtitle}>{formatDuration(intervalToDuration({ start: new Date(job.start), end: new Date(job.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}</strong>
                </>
              )}
            </>
          )}
          children={(
            <span>
              <span sx={UIMigrateJob.styles.summary}>
                <Summary
                  error={job.meta.error}
                  meta={summary({
                    ...job.meta.summary,
                    movies: {
                      success: job.meta.done ? job.meta.summary.movies?.success : entities.movies.length,
                      warning: job.meta.done ? job.meta.summary.movies?.warning : entities.warning.length,
                    },
                    persons: {
                      success: job.meta.done ? job.meta.summary.persons?.success : entities.persons.length,
                      warning: job.meta.summary.persons?.warning,
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
      <div sx={UIMigrateJob.styles.content}>
        {logs === null ? (
          <div sx={UIMigrateJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : (entities?.warning?.length || entities?.movies?.length || entities?.persons?.length) ? (
          <div sx={UIMigrateJob.styles.entities}>
            <Warnings logs={entities.warning} />
            <Entities
              id={`migrate-movies-${job.id}`}
              entities={entities?.movies}
              length={entities?.movies?.length}
              label={emojize('🎞️', 'Movies')}
              display='grid'
              hide={true}
              child={Movie}
              props={() => ({
                display: 'poster',
              })}
            />
            <Entities
              id={`migrate-persons-${job.id}`}
              entities={entities?.persons}
              length={entities?.persons?.length}
              label={emojize('🎭', 'Persons')}
              display='grid'
              hide={true}
              child={Person}
              props={() => ({
                display: 'poster',
              })}
            />
          </div>
        ) : job.meta.done ? (
          <Warning emoji={job.meta.error ? '💢' : '📦'} title={job.meta.error ? 'Error': 'Empty'} subtitle={job.meta.error?.message || job.meta.error || 'No documents migrated from dump during this job'} />
        ) : (
          <Warning emoji='⏳' title='Loading' subtitle='Waiting for dumped documents...' />
        )}
      </div>
    </div>
  )
}

UIMigrateJob.styles = {
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

export const MigrateJob = memo(UIMigrateJob)
