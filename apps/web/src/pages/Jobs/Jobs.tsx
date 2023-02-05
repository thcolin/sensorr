import { Fragment, memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { throttle } from 'throttle-debounce'
import { formatRelative, formatDuration, intervalToDuration } from 'date-fns'
import { Icon, Link } from '@sensorr/ui'
import { Warning } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { RecordJob, summary as summaryRecord } from './Job/Record'
import { RefreshJob, summary as summaryRefresh } from './Job/Refresh'
import { SyncJob, summary as summarySync } from './Job/Sync'
import { MigrateJob, summary as summaryMigrate } from './Job/Migrate'
import { DoctorJob, summary as summaryDoctor } from './Job/Doctor'
import { KeepInTouchJob, summary as summaryKeepInTouch } from './Job/KeepInTouch'
import { Summary } from './Summary'

const UIJobs = ({ controls = null, ...props }) => {
  const api = useAPI()
  const location = useLocation()
  const navigate = useNavigate()
  const { jobs, loading } = useJobsContext() as any
  const { job } = useParams() as any
  const store = useRef(null)
  const [logs, setLogs] = useState(null)
  const drainLogs = useMemo(() => throttle(3000, () => setLogs(store.current)), [])

  useEffect(() => {
    if ((!job && !loading && jobs.length) || (!loading && !jobs.find(j => j.job === job) && jobs.length && !(location.state as any)?.new)) {
      navigate(`/jobs/${(jobs[0] as any).job}`, { replace: true })
      return
    }
  }, [jobs, job, loading])

  useEffect(() => {
    if (!job) {
      return
    }

    store.current = null
    setLogs(null)
    const eventSource = new ReconnectingEventSource(`/api/jobs/${job}?authorization=Bearer%20${api.access_token}`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)
      store.current = Array.isArray(raw) ? raw : [raw, ...(store.current || [])]
      drainLogs()
    }

    return () => eventSource.close()
  }, [job])

  return (
    <section sx={UIJobs.styles.element}>
      {(!loading && !jobs.length) ? (
        <div sx={UIJobs.styles.placeholder}>
          <Warning
            emoji="🏗️"
            title="No jobs yet"
            subtitle="Jobs start everyday automatically, but you can start one manually from Settings"
          />
        </div>
      ) : (
        <Fragment>
          <Sidebar loading={loading} jobs={jobs} job={job} />
          <div sx={UIJobs.styles.content}>
            {loading ? (
              <div sx={UIJobs.styles.placeholder}>
                <Warning
                  emoji="🏗️"
                  title="Loading jobs"
                  subtitle="Please wait a few moments..."
                />
              </div>
            ) : jobs.find(j => j.job === job)?.meta?.command === 'record' ? (
              <RecordJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : jobs.find(j => j.job === job)?.meta?.command === 'doctor' ? (
              <DoctorJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : jobs.find(j => j.job === job)?.meta?.command === 'refresh' ? (
              <RefreshJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : jobs.find(j => j.job === job)?.meta?.command === 'sync' ? (
              <SyncJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : jobs.find(j => j.job === job)?.meta?.command === 'keep-in-touch' ? (
              <KeepInTouchJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : jobs.find(j => j.job === job)?.meta?.command === 'migrate' ? (
              <MigrateJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : (
              <div sx={UIJobs.styles.placeholder}>
                <Warning
                  emoji="🏗️"
                  title="Setup job"
                  subtitle="Please wait a few moments..."
                />
              </div>
            )}
          </div>
        </Fragment>
      )}
    </section>
  )
}

UIJobs.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  }
}

const Jobs = memo(UIJobs)

export default Jobs

const UISidebar = ({ loading, jobs, job, ...props }) => {
  const groups = useMemo(() => jobs.reduce((groups, job) => {
    const relative = formatRelative(job.start ? new Date(job.start) : new Date(), new Date()).split(' ')[0]
    const key = ['today', 'yesterday'].includes(relative) ? relative : (new Date(job.start)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

    return {
      ...groups,
      [key]: [
        ...(groups[key] || []),
        job,
      ].sort((a, b) => b.start - a.start),
    }
  }, {}), [jobs])

  return (
    <aside sx={UISidebar.styles.element}>
      <div sx={UISidebar.styles.head}>
        <h4>Jobs</h4>
      </div>
      {loading ? (
        <div sx={UISidebar.styles.placeholder}>
          <Icon value='spinner' />
        </div>
      ) : (
        <nav sx={UISidebar.styles.nav}>
          {Object.entries(groups).map(([distance, jobs]: [string, any[]]) => (
            <Fragment key={distance}>
              <h6>{distance}</h6>
              <div>
                {jobs.map(j => (
                  <Job
                    key={j.job}
                    emoji={{
                      'sync': '🔗',
                      'refresh': '🔌',
                      'record': '📹',
                      'doctor': '🚑',
                      'keep-in-touch': '🍻',
                      'migrate': '🚚',
                    }[j.meta.command]}
                    selected={j.job === job}
                    {...j}
                    summary={({
                      'sync': summarySync,
                      'refresh': summaryRefresh,
                      'record': summaryRecord,
                      'doctor': summaryDoctor,
                      'keep-in-touch': summaryKeepInTouch,
                      'migrate': summaryMigrate,
                    }[j.meta.command] || (() => []))(j.meta.summary, false, j.meta.config)}
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </nav>
      )}
    </aside>
  )
}

UISidebar.styles = {
  element: {
    position: 'sticky',
    top: '66px',
    height: 'calc(100vh - 66px)',
    minWidth: '21em',
    maxWidth: '21em',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid',
    borderColor: 'grayLight',
    overflow: 'hidden',
  },
  head: {
    backgroundColor: 'primary',
    color: 'whitePure',
    paddingX: 3,
    paddingY: 3,
    '>h4': {
      margin: '0px',
    },
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    overflow: 'scroll',
    '>h6': {
      position: 'sticky',
      top: '0px',
      paddingX: 4,
      paddingY: 6,
      margin: 12,
      backgroundColor: 'grayLighter',
      borderBottom: '1px solid',
      borderColor: 'grayLight',
      textTransform: 'capitalize',
      zIndex: 1,
    },
    '>div': {
      paddingX: 2,
    }
  },
}

const Sidebar = memo(UISidebar)

const UIJob = ({ emoji, job, start, end, meta: { command, done, ...meta }, selected = false, summary }) => {
  const ref = useRef(null)

  // useEffect(() => {
  //   if (selected && ref.current) {
  //     ref.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  //   }
  // }, [selected])

  return (
    <Link to={`/jobs/${job}`} sx={UIJob.styles.element}>
      <span ref={ref} sx={UIJob.styles.wrapper} style={{ opacity: selected ? 1 : 0.5 }}>
        <span sx={UIJob.styles.head}>
          <span sx={UIJob.styles.icon}>
            {emoji}
          </span>
          <span sx={UIJob.styles.container}>
            <span sx={{ display: 'flex', alignItems: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIJob.styles.title}>{command}</span>
              {done && (
                <span sx={{ ...UIJob.styles.subtitle, marginY: 12, marginLeft: 4, alignSelf: 'flex-end' }}>
                  {formatDuration(intervalToDuration({ start: new Date(start), end: new Date(end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}
                </span>
              )}
            </span>
            <span sx={UIJob.styles.subtitle}><strong>{job}</strong> - {(new Date(start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
          </span>
        </span>
        <span sx={UIJob.styles.summary}>
          <Summary error={meta.error} meta={summary} />
        </span>
      </span>
    </Link>
  )
}

UIJob.styles = {
  element: {
    display: 'flex',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    paddingY: 3,
    overflow: 'hidden',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    transition: 'opacity ease 300ms',
    overflow: 'hidden',
    '&:hover': {
      opacity: '1 !important',
    },
  },
  head: {
    display: 'flex',
    alignItems: 'start',
    marginBottom: 8,
  },
  icon: {
    flexShrink: 0,
    height: '2.5em',
    width: '2.5em',
    backgroundColor: 'grayLight',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    marginX: 4,
    marginTop: 10,
  },
  title: {
    fontSize: 4,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  subtitle: {
    marginY: 6,
    fontSize: 7,
    color: 'grayDarkest',
    fontFamily: 'monospace',
  },
  summary: {
    fontSize: 6,
    overflowX: 'auto',
  },
}

const Job = memo(UIJob)
