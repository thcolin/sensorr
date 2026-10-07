import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { emojize, filesize } from '@sensorr/utils'
import { jobNameOf } from '@sensorr/sensorr'
import { JobName } from '../../../components/Sensorr/JobName'
import { JobState } from '../../../components/Sensorr/JobState'
import Movie from '../../../components/Movie/Movie'
import { Transition } from '../../../components/Sensorr/Proposal'
import { sizeStateOf } from '../../Proposals/queue'
import { Summary, freed, sideOf, durationOf } from '../Summary'
import { Warnings } from '../Warnings'

export const summary = ({ archived = 0, plex = 0, corrections, cleanups, missings }, extended = true) => [
  ...(extended ? [{
    key: 'archived',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.sync.summary.archived' values={{ count: archived }} components={[<strong />]} />,
    length: archived,
  }] : []),
  ...(extended ? [{
    key: 'plex',
    emoji: '📡',
    title: <Trans i18nKey='jobs.sync.summary.plex' values={{ count: plex }} components={[<strong />]} />,
    length: plex,
  }] : []),
  {
    key: 'corrections',
    emoji: '🩹',
    title: <Trans i18nKey='jobs.sync.summary.corrections' values={{ count: corrections?.success || 0 }} components={[<strong />]} />,
    length: corrections?.success || 0,
  },
  ...(cleanups?.success > 0 ? [{
    key: 'cleanups',
    emoji: '🧹',
    title: <Trans i18nKey='jobs.sync.summary.cleanups' values={{ count: cleanups?.success }} components={[<strong />]} />,
    length: cleanups?.success,
  }] : []),
  ...((cleanups?.success > 0 && typeof cleanups?.deleted === 'number' && typeof cleanups?.arrived === 'number') ? [{
    key: 'space',
    emoji: cleanups.arrived > cleanups.deleted ? '📈' : '📉',
    title: <Trans i18nKey='jobs.space.cleanups' values={{ size: freed(cleanups.arrived - cleanups.deleted), side: sideOf(cleanups.arrived - cleanups.deleted), deleted: filesize.stringify(cleanups.deleted), arrived: filesize.stringify(cleanups.arrived) }} components={[<strong />]} />,
    length: freed(cleanups.arrived - cleanups.deleted),
  }] : []),
  ...(missings?.success > 0 ? [{
    key: 'missings',
    emoji: '💊',
    title: <Trans i18nKey='jobs.sync.summary.missings' values={{ count: missings?.success }} components={[<strong />]} />,
    length: missings?.success,
  }] : []),
  ...(((corrections?.warning || 0) + (missings?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.sync.summary.warning' values={{ count: (corrections?.warning || 0) + (missings?.warning || 0) }} components={[<strong />]} />,
    length: (corrections?.warning || 0) + (missings?.warning || 0),
  }] : []),
]

// A swap removing versions from several Plex items logs its landed release with each: its size
// counts once.
const cleanedSpaceOf = (logs) => {
  const landed = logs.filter((log: any) => log.meta.landed)

  if (!landed.length) {
    return {}
  }

  return {
    deleted: landed.reduce((sum, log: any) => sum + (log.meta.size || 0), 0),
    arrived: Object.values(landed.reduce((acc, log: any) => ({ ...acc, [log.meta.landed.release]: log.meta.landed.size }), {})).reduce((sum: number, size: number) => sum + size, 0) as number,
  }
}

const UICleanedMovie = ({ entity, cleaned, ...props }) => {
  const space = useMemo(() => cleanedSpaceOf((cleaned || []).filter((log: any) => log.meta.movie?.id === entity?.id)), [cleaned, entity?.id])

  return (
    <div sx={UICleanedMovie.styles.element}>
      <Movie entity={entity} {...props} />
      {typeof space.deleted === 'number' && (
        <Transition
          axis='size'
          from={emojize('📦', filesize.stringify(space.deleted))}
          to={filesize.stringify(space.arrived)}
          state={sizeStateOf(space.arrived - space.deleted)}
          compact={true}
        />
      )}
    </div>
  )
}

UICleanedMovie.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
}

const CleanedMovie = memo(UICleanedMovie)

const UISyncJob = ({ job, logs }) => {
  const { t, i18n } = useTranslation()
  const cleaned = useMemo(() => [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.movie?.id && log.meta.group === 'cleanups'), [logs])
  const entities = useMemo(() => ({
    warning: [...(logs || [])].filter((log: any) => log.level === 'warn').sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    corrections: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.movie?.id && log.meta.group === 'corrections').map(({ meta: { movie } }) => movie).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    cleanups: cleaned.map(({ meta: { movie } }) => movie).filter((movie, index, movies) => movies.findIndex(({ id }) => id === movie.id) === index).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    missings: [...(logs || [])].filter((log: any) => log.level === 'info' && log.meta.movie?.id && log.meta.group === 'missings').map(({ meta: { movie } }) => movie).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  }), [logs, cleaned])

  return (
    <div sx={UISyncJob.styles.element}>
      <div>
        <Warning
          emoji='🔗'
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <JobState job={job.job} name={jobNameOf(job.meta)} done={job.meta.done} />
              <JobName name={jobNameOf(job.meta)} sx={UISyncJob.styles.title} />
            </span>
          )}
          subtitle={(
            <>
              <span sx={UISyncJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(i18n.language, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UISyncJob.styles.subtitle}>{durationOf(job)}</strong>
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
                    cleanups: job.meta.done ? job.meta.summary.cleanups : {
                      success: entities.cleanups.length,
                      ...cleanedSpaceOf(cleaned),
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
        ) : (entities?.warning?.length || entities?.corrections?.length || entities?.cleanups?.length || entities?.missings?.length) ? (
          <div sx={UISyncJob.styles.entities}>
            <Warnings logs={entities.warning} />
            <Entities
              id={`sync-missing-${job.id}`}
              entities={entities?.missings}
              length={entities?.missings?.length}
              label={t('jobs.sync.missing')}
              display='grid'
              hide={true}
              child={Movie}
              props={() => ({
                display: 'poster',
              })}
            />
            <Entities
              id={`sync-cleaned-${job.id}`}
              entities={entities?.cleanups}
              length={entities?.cleanups?.length}
              label={t('jobs.sync.cleaned')}
              display='grid'
              extra={36}
              hide={true}
              child={CleanedMovie as any}
              props={() => ({
                display: 'poster',
                cleaned,
              }) as any}
            />
            <Entities
              id={`sync-fixed-${job.id}`}
              entities={entities?.corrections}
              length={entities?.corrections?.length}
              label={t('jobs.sync.fixed')}
              display='grid'
              hide={true}
              child={Movie}
              props={() => ({
                display: 'poster',
              })}
            />
          </div>
        ) : job.meta.done ? (
          <Warning emoji={job.meta.error ? '💢' : '🗄️'} title={job.meta.error ? t('jobs.job.error') : t('jobs.job.empty')} subtitle={job.meta.error?.message || job.meta.error || t('jobs.sync.empty')} />
        ) : (
          <Warning emoji='⏳' title={t('state.loading')} subtitle={t('jobs.sync.waiting')} />
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
