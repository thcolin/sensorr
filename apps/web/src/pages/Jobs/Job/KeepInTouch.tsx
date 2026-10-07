import { memo, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { jobNameOf } from '@sensorr/sensorr'
import { JobName } from '../../../components/Sensorr/JobName'
import { JobState } from '../../../components/Sensorr/JobState'
import Movie from '../../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../../components/Show/Show'
import { Summary, durationOf } from '../Summary'
import { Warnings } from '../Warnings'

export const summary = ({ library = 0, guests = 0, watchlist = 0, processed = 0, watchlist_shows = 0, processed_shows = 0, warning = 0 }, extended = true) => [
  ...(extended ? [{
    key: 'library',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.keepInTouch.summary.library' values={{ count: library }} components={[<strong />]} />,
    length: library,
  }] : []),
  ...(extended ? [{
    key: 'guests',
    emoji: '🏘️',
    title: <Trans i18nKey='jobs.keepInTouch.summary.guests' values={{ count: guests }} components={[<strong />]} />,
    length: guests,
  }] : []),
  ...(extended ? [{
    key: 'watchlist',
    emoji: '📡',
    title: <Trans i18nKey='jobs.keepInTouch.summary.watchlist' values={{ count: watchlist }} components={[<strong />]} />,
    length: watchlist,
  }] : []),
  ...(extended && watchlist_shows > 0 ? [{
    key: 'watchlist_shows',
    emoji: '📺',
    title: <Trans i18nKey='jobs.keepInTouch.summary.watchlistShows' values={{ count: watchlist_shows }} components={[<strong />]} />,
    length: watchlist_shows,
  }] : []),
  {
    key: 'processed',
    emoji: '🍺',
    title: <Trans i18nKey='jobs.keepInTouch.summary.processed' values={{ count: processed }} components={[<strong />]} />,
    length: processed,
  },
  ...(processed_shows > 0 ? [{
    key: 'processed_shows',
    emoji: '🍻',
    title: <Trans i18nKey='jobs.keepInTouch.summary.processedShows' values={{ count: processed_shows }} components={[<strong />]} />,
    length: processed_shows,
  }] : []),
  ...(warning ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.keepInTouch.summary.warning' values={{ count: warning }} components={[<strong />]} />,
    length: warning,
  }] : []),
]

const UIKeepInTouchJob = ({ job, logs }) => {
  const { t, i18n } = useTranslation()
  const [guest, setGuest] = useState(null)
  const warning = useMemo(() => (logs || []).filter(log => log.level === 'warn'), [logs])
  const entities = useMemo(() => (logs || []).filter(log => log.meta.movie && log.meta.processed && (!guest || log.meta.requested_by?.includes(guest))).map(({ meta: { movie, requested_by } }) => ({ ...movie, requested_by })), [logs, guest])
  const shows = useMemo(() => (logs || []).filter(log => log.meta.show && log.meta.processed && (!guest || log.meta.requested_by?.includes(guest))).map(({ meta: { show } }) => show), [logs, guest])

  const guests = useMemo(() => (logs || []).filter(log => (log.meta.movie || log.meta.show) && log.meta.processed).reduce((guests: any, log: any) => ({
    ...guests,
    ...(log.meta.requested_by || []).reduce((acc, guest) => ({
      ...acc,
      [guest]: (guests[guest] || 0) + 1,
    }), {}),
  }), {}), [logs])

  return (
    <div sx={UIKeepInTouchJob.styles.element}>
      <div>
        <Warning
          emoji='🍻'
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <JobState job={job.job} name={jobNameOf(job.meta)} done={job.meta.done} />
              <JobName name={jobNameOf(job.meta)} sx={UIKeepInTouchJob.styles.title} />
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIKeepInTouchJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(i18n.language, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIKeepInTouchJob.styles.subtitle}>{durationOf(job)}</strong>
                </>
              )}
            </>
          )}
          children={(
            <span>
              <span sx={UIKeepInTouchJob.styles.summary}>
                <Summary error={job.meta.error} meta={summary(job.meta.summary)} />
              </span>
              <span sx={UIKeepInTouchJob.styles.summary}>
                {Object.entries(guests).map(([g, count]: [string, any]) => (
                  <span key={g} onClick={() => setGuest(guest => guest === g ? null : g)} sx={UIKeepInTouchJob.styles.link} style={{ opacity: !guest || guest === g ? 1 : 0.5 }}>{g} ({count})</span>
                ))}
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
      <div sx={UIKeepInTouchJob.styles.content}>
        {logs === null ? (
          <div sx={UIKeepInTouchJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : (
          <div>
            <Warnings logs={warning} />
            <Entities
              id={`keep-in-touch-shows-${job.id}`}
              entities={shows}
              length={shows.length}
              label={t('jobs.keepInTouch.shows')}
              display='grid'
              extra={FOOTER_HEIGHT}
              hide={true}
              child={Show as any}
            />
            {(entities.length || shows.length) ? (
              <Entities
                id={`keep-in-touch-${job.id}`}
                entities={entities}
                length={entities?.length}
                label={shows.length ? t('jobs.keepInTouch.movies') : t('jobs.keepInTouch.requests')}
                display='grid'
                hide={true}
                child={Movie}
                props={({ entity }) => ({
                  display: 'poster',
                  metadata: {
                    requested_by: (entity as any).requested_by,
                  },
                })}
              />
            ) : job.meta.done ? (
              <Warning emoji={job.meta.error ? '💢' : '🍺'} title={job.meta.error ? t('jobs.job.error') : t('jobs.job.empty')} subtitle={job.meta.error?.message || job.meta.error || t('jobs.keepInTouch.empty')} />
            ) : (
              <Warning emoji='⏳' title={t('state.loading')} subtitle={t('jobs.keepInTouch.waiting')} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

UIKeepInTouchJob.styles = {
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
    marginX: 6,
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

export const KeepInTouchJob = memo(UIKeepInTouchJob)
