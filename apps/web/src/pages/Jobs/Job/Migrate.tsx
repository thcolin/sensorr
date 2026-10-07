import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Entities, Icon, Person, Warning } from '@sensorr/ui'
import { jobNameOf } from '@sensorr/sensorr'
import { JobName } from '../../../components/Sensorr/JobName'
import { JobState } from '../../../components/Sensorr/JobState'
import Movie from '../../../components/Movie/Movie'
import { Summary, durationOf } from '../Summary'
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
    title: <Trans i18nKey='jobs.migrate.summary.dump' values={{ count: dump.movies + dump.persons, movies: dump.movies, persons: dump.persons }} components={[<strong />]} />,
    length: (dump.movies + dump.persons),
  },
  {
    key: 'local',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.migrate.summary.local' values={{ count: local.movies + local.persons, movies: local.movies, persons: local.persons }} components={[<strong />]} />,
    length: (local.movies + local.persons),
  },
  ...(movies?.success > 0 ? [{
    key: 'movies',
    emoji: '🎞️',
    title: <Trans i18nKey='jobs.migrate.summary.movies' values={{ count: movies?.success }} components={[<strong />]} />,
    length: movies?.success,
  }] : []),
  ...(persons?.success > 0 ? [{
    key: 'persons',
    emoji: '⭐️',
    title: <Trans i18nKey='jobs.migrate.summary.persons' values={{ count: persons?.success }} components={[<strong />]} />,
    length: persons?.success,
  }] : []),
  ...(((movies?.warning || 0) + (persons?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.migrate.summary.warning' values={{ count: (movies?.warning || 0) + (persons?.warning || 0) }} components={[<strong />]} />,
    length: (movies?.warning || 0) + (persons?.warning || 0),
  }] : []),
]

const UIMigrateJob = ({ job, logs }) => {
  const { t, i18n } = useTranslation()
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
              <JobState job={job.job} name={jobNameOf(job.meta)} done={job.meta.done} />
              <JobName name={jobNameOf(job.meta)} sx={UIMigrateJob.styles.title} />
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIMigrateJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(i18n.language, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIMigrateJob.styles.subtitle}>{durationOf(job)}</strong>
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
              label={t('jobs.migrate.movies')}
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
              label={t('jobs.migrate.persons')}
              display='grid'
              hide={true}
              child={Person}
              props={() => ({
                display: 'poster',
              })}
            />
          </div>
        ) : job.meta.done ? (
          <Warning emoji={job.meta.error ? '💢' : '📦'} title={job.meta.error ? t('jobs.job.error') : t('jobs.job.empty')} subtitle={job.meta.error?.message || job.meta.error || t('jobs.migrate.empty')} />
        ) : (
          <Warning emoji='⏳' title={t('state.loading')} subtitle={t('jobs.migrate.waiting')} />
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
