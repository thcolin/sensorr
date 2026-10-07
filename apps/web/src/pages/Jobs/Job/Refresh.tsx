import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { jobNameOf } from '@sensorr/sensorr'
import { JobName } from '../../../components/Sensorr/JobName'
import { JobState } from '../../../components/Sensorr/JobState'
import Person from '../../../components/Person/Person'
import Movie from '../../../components/Movie/Movie'
import { Summary, durationOf } from '../Summary'
import { Warnings } from '../Warnings'

export const summary = ({ changes = 0, movie, person }, extended = true) => [
  ...(extended ? [{
    key: 'changes',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.refresh.summary.changes' values={{ count: changes }} components={[<strong />]} />,
    length: changes,
  }] : []),
  {
    key: 'movie',
    emoji: '🎞️',
    title: <Trans i18nKey='jobs.refresh.summary.movie' values={{ count: movie?.success || 0 }} components={[<strong />]} />,
    length: movie?.success || 0,
  },
  {
    key: 'person',
    emoji: '⭐️',
    title: <Trans i18nKey='jobs.refresh.summary.person' values={{ count: person?.success || 0 }} components={[<strong />]} />,
    length: person?.success || 0,
  },
  ...(((movie?.warning || 0) + (person?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.refresh.summary.warning' values={{ count: (movie?.warning || 0) + (person?.warning || 0) }} components={[<strong />]} />,
    length: (movie?.warning || 0) + (person?.warning || 0),
  }] : []),
]

const UIRefreshJob = ({ job, logs }) => {
  const { t, i18n } = useTranslation()
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
              <JobState job={job.job} name={jobNameOf(job.meta)} done={job.meta.done} />
              <JobName name={jobNameOf(job.meta)} sx={UIRefreshJob.styles.title} />
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIRefreshJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(i18n.language, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIRefreshJob.styles.subtitle}>{durationOf(job)}</strong>
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
              label={t('jobs.refresh.persons')}
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
              label={t('jobs.refresh.movies')}
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
            title={job.meta.error ? t('jobs.job.error') : t('jobs.job.empty')}
            subtitle={job.meta.error?.message || job.meta.error || t('jobs.refresh.empty')}
          />
        ) : (
          <Warning emoji='⏳' title={t('state.loading')} subtitle={t('jobs.refresh.waiting')} />
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
