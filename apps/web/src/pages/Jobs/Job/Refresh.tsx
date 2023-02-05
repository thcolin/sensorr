import { memo, useMemo } from 'react'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { formatDuration, intervalToDuration } from 'date-fns'
import Person from '../../../components/Person/Person'
import Movie from '../../../components/Movie/Movie'
import { Summary } from '../Summary'
import { Warnings } from '../Warnings'

export const summary = ({ changes = 0, movie, person }, extended = true) => [
  ...(extended ? [{
    key: 'changes',
    emoji: '🗄️',
    title: <span><strong>{changes}</strong> Affected changes</span>,
    length: changes,
  }] : []),
  {
    key: 'movie',
    emoji: '🎞️',
    title: <span><strong>{movie?.success || 0}</strong> Applied movie changes</span>,
    length: movie?.success || 0,
  },
  {
    key: 'person',
    emoji: '🎭',
    title: <span><strong>{person?.success || 0}</strong> Applied person changes</span>,
    length: person?.success || 0,
  },
  ...(((movie?.warning || 0) + (person?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{(movie?.warning || 0) + (person?.warning || 0)}</strong> Entities not refreshed</span>,
    length: (movie?.warning || 0) + (person?.warning || 0),
  }] : []),
]

const UIRefreshJob = ({ job, logs }) => {
  const entities = useMemo(() => ({
    warning: [...(logs || [])].filter((log: any) => log.level === 'warn').sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    movie: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.entity && log.meta.type === 'movie').map(({ meta: { entity } }) => entity).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    person: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.entity && log.meta.type === 'person').map(({ meta: { entity } }) => entity).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  }), [logs])

  return (
    <div sx={UIRefreshJob.styles.element}>
      <div>
        <Warning
          emoji='🔌'
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIRefreshJob.styles.title}>{job.meta.command}</span>
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIRefreshJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIRefreshJob.styles.subtitle}>{formatDuration(intervalToDuration({ start: new Date(job.start), end: new Date(job.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}</strong>
                </>
              )}
            </>
          )}
          children={(
            <span sx={UIRefreshJob.styles.summary}>
              <Summary
                error={job.meta.error}
                meta={summary({
                  ...job.meta.summary,
                  movie: {
                    success: job.meta.done ? job.meta.summary.movie?.success : entities.movie?.length,
                    warning: job.meta.summary.movie?.warning,
                  },
                  person: {
                    success: job.meta.done ? job.meta.summary.person?.success : entities.person?.length,
                    warning: job.meta.summary.person?.warning,
                  },
                })}
              />
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
      <div sx={UIRefreshJob.styles.content}>
        {logs === null ? (
          <div sx={UIRefreshJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : (entities?.warning?.length || entities?.movie?.length || entities?.person?.length) ? (
          <div sx={UIRefreshJob.styles.entities}>
            <Warnings logs={entities.warning} />
            <Entities
              id={`refresh-persons-${job.id}`}
              entities={entities?.person}
              length={entities?.person?.length}
              label={emojize('🎭', 'Persons')}
              display='grid'
              hide={true}
              child={Person}
              props={() => ({
                display: 'poster',
              })}
            />
            <Entities
              id={`refresh-movies-${job.id}`}
              entities={entities?.movie}
              length={entities?.movie?.length}
              label={emojize('🎞️', 'Movies')}
              display='grid'
              hide={true}
              child={Movie}
              props={() => ({
                display: 'poster',
              })}
            />
          </div>
        ) : job.meta.done ? (
          <Warning
            emoji={job.meta.error ? '💢' : '🗄️'}
            title={job.meta.error ? 'Error': 'Empty'}
            subtitle={job.meta.error?.message || job.meta.error || 'No changes applied during this job'}
          />
        ) : (
          <Warning emoji='⏳' title='Loading' subtitle='Waiting for changes...' />
        )}
      </div>
    </div>
  )
}

UIRefreshJob.styles = {
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

export const RefreshJob = memo(UIRefreshJob)
