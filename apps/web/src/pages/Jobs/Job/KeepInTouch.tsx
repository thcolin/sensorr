import { memo, useMemo, useState } from 'react'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { formatDuration, intervalToDuration } from 'date-fns'
import Movie from '../../../components/Movie/Movie'
import { Summary } from '../Summary'
import { Warnings } from '../Warnings'

export const summary = ({ library = 0, guests = 0, watchlist = 0, processed = 0, warning = 0 }, extended = true) => [
  ...(extended ? [{
    key: 'library',
    emoji: '🗄️',
    title: <span><strong>{library}</strong> Movies in Sensorr library</span>,
    length: library,
  }] : []),
  ...(extended ? [{
    key: 'guests',
    emoji: '🏘️',
    title: <span><strong>{guests}</strong> Guests registered on Sensorr</span>,
    length: guests,
  }] : []),
  ...(extended ? [{
    key: 'watchlist',
    emoji: '📡',
    title: <span><strong>{watchlist}</strong> Movies found on guests Plex watchlist</span>,
    length: watchlist,
  }] : []),
  {
    key: 'processed',
    emoji: '🍺',
    title: <span><strong>{processed}</strong> Requests processed (added or updated)</span>,
    length: processed,
  },
  ...(warning ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{warning}</strong> Warning(s)</span>,
    length: warning,
  }] : []),
]

const UIKeepInTouchJob = ({ job, logs }) => {
  const [guest, setGuest] = useState(null)
  const warning = useMemo(() => (logs || []).filter(log => log.level === 'warn'), [logs])
  const entities = useMemo(() => (logs || []).filter(log => log.meta.movie && log.meta.processed && (!guest || log.meta.requested_by?.includes(guest))).map(({ meta: { movie, requested_by } }) => ({ ...movie, requested_by })), [logs, guest])

  const guests = useMemo(() => (logs || []).filter(log => log.meta.movie && log.meta.processed).reduce((guests: any, log: any) => ({
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
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIKeepInTouchJob.styles.title}>{job.meta.command}</span>
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIKeepInTouchJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIKeepInTouchJob.styles.subtitle}>{formatDuration(intervalToDuration({ start: new Date(job.start), end: new Date(job.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}</strong>
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
                {Object.entries(guests).map(([g, count]) => (
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
            {entities.length ? (
              <Entities
                id={`keep-in-touch-${job.id}`}
                entities={entities}
                length={entities?.length}
                label={emojize('🍺', 'Requests')}
                display='grid'
                hide={true}
                child={Movie}
                props={({ entity }) => ({
                  display: 'poster',
                  guestsDisplay: 'always',
                  metadata: {
                    requested_by: (entity as any).requested_by,
                  },
                })}
              />
            ) : job.meta.done ? (
              <Warning emoji={job.meta.error ? '💢' : '🍺'} title={job.meta.error ? 'Error': 'Empty'} subtitle={job.meta.error?.message || job.meta.error || 'No processed requestes during this job'} />
            ) : (
              <Warning emoji='⏳' title='Loading' subtitle='Waiting for entities fix...' />
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
