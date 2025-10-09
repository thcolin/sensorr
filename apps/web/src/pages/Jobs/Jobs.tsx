import { Fragment, memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { throttle } from 'throttle-debounce'
import { formatRelative, formatDuration, intervalToDuration } from 'date-fns'
import useRipple from 'use-ripple-hook'
import { Icon, Link } from '@sensorr/ui'
import { Warning } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { RecordJob, summary as summaryRecord } from './Job/Record'
import { RefreshJob, summary as summaryRefresh } from './Job/Refresh'
import { SyncJob, summary as summarySync } from './Job/Sync'
import { MigrateJob, summary as summaryMigrate } from './Job/Migrate'
import { ShrinkJob, summary as summaryShrink } from './Job/Shrink'
import { RefineJob, summary as summaryRefine } from './Job/Refine'
import { KeepInTouchJob, summary as summaryKeepInTouch } from './Job/KeepInTouch'
import { Summary } from './Summary'
import Body from '../../layout/Body/Body'

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
    if (!job || !jobs.length) {
      return
    }

    store.current = null
    setLogs(null)
    const eventSource = new ReconnectingEventSource(`/api/jobs/${job}?authorization=Bearer%20${api.access_token}${['record', 'refine', 'shrink'].includes(jobs.find(j => j.job === job)?.meta?.command) ? '&summarize=1' : ''}`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)

      if (Array.isArray(raw)) {
        store.current = raw
        setLogs(raw)
        return
      }

      store.current = [raw, ...(store.current || [])]
      drainLogs()
    }

    return () => eventSource.close()
  }, [job, jobs])

  if (!loading && !jobs.length) {
    return (
      <Body>
        <section sx={UIJobs.styles.element}>
          <div sx={UIJobs.styles.placeholder}>
            <Warning
              emoji="🏗️"
              title="No jobs yet"
              subtitle="Jobs start everyday automatically, but you can start one manually from Settings"
            />
          </div>
        </section>
      </Body>
    )
  }

  return (
    <section sx={UIJobs.styles.element}>
      <Sidebar loading={loading} jobs={jobs} job={job} />
      <Body>
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
          ) : jobs.find(j => j.job === job)?.meta?.command === 'refine' ? (
            <RefineJob job={jobs.find(j => j.job === job)} logs={logs} />
          ) : jobs.find(j => j.job === job)?.meta?.command === 'shrink' ? (
            <ShrinkJob job={jobs.find(j => j.job === job)} logs={logs} />
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
      </Body>
    </section>
  )
}

UIJobs.styles = {
  element: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: ['column', 'row'],
    overflow: 'hidden',
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
  const [ref, onPointerDown] = useRipple()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const [filters, setFilters] = useState([])
  const groups = useMemo(() => jobs.filter(job => !filters.length || filters.includes(job.meta.command)).reduce((groups, job) => {
    const relative = formatRelative(job.start ? new Date(job.start) : new Date(), new Date()).split(' ')[0]
    const key = ['today', 'yesterday'].includes(relative) ? relative : (new Date(job.start)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

    return {
      ...groups,
      [key]: [
        ...(groups[key] || []),
        job,
      ].sort((a, b) => b.start - a.start),
    }
  }, {}), [jobs, filters])

  useEffect(() => {
    setExpanded(false)
  }, [location.key])

  const active = jobs.find(j => j.job === job)

  return (
    <aside sx={UISidebar.styles.element}>
      <div sx={UISidebar.styles.head}>
        <h4>Jobs</h4>
        <div sx={UISidebar.styles.selector}>
          <div>
            <span>
              {{
                'sync': '🔗',
                'refresh': '🔌',
                'record': '📹',
                'refine': '✨',
                'shrink': '✂️',
                'keep-in-touch': '🍻',
                'migrate': '🚚',
              }[active?.meta?.command] || '⌛'}
            </span>
            <div>
              <div sx={{ display: 'flex', alignItems: 'center' }}>
                <div sx={{ marginRight: 7, lineHeight: 'reset' }}><Icon value={active?.meta?.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></div>
                <h5>{active?.meta?.command || 'Loading'}</h5>
                {active?.meta?.done && (
                  <span>
                    {formatDuration(intervalToDuration({ start: new Date(active?.start), end: new Date(active?.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}
                  </span>
                )}
              </div>
              <span><strong>{job}</strong> - {(new Date(active?.start || Date.now())).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(active?.start || Date.now())).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
            </div>
          </div>
          <button ref={ref} onPointerDown={onPointerDown} sx={{ variant: 'button.reset', color: 'whitePure' }} onClick={() => setExpanded(e => !e)}>
            <Icon value="chevron" direction={expanded} height="1em" width="1em" />
          </button>
        </div>
      </div>
      {loading ? (
        <div sx={UISidebar.styles.placeholder}>
          <Icon value='spinner' />
        </div>
      ) : (
        <nav sx={{ ...UISidebar.styles.nav, height: [expanded ? 'calc(100% - 90px)' : '0%', 'unset'] }}>
          <div sx={UISidebar.styles.filters}>
            <div sx={{ opacity: !filters.length || filters.includes('record') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('record') ? filters.filter(f => f !== 'record') : [...filters, 'record'])}>
              <span>📹</span>
              <code>record</code>
            </div>
            <div sx={{ opacity: !filters.length || filters.includes('refine') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('refine') ? filters.filter(f => f !== 'refine') : [...filters, 'refine'])}>
              <span>✨</span>
              <code>refine</code>
            </div>
            <div sx={{ opacity: !filters.length || filters.includes('shrink') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('shrink') ? filters.filter(f => f !== 'shrink') : [...filters, 'shrink'])}>
              <span>✂️</span>
              <code>shrink</code>
            </div>
            <div sx={{ opacity: !filters.length || filters.includes('sync') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('sync') ? filters.filter(f => f !== 'sync') : [...filters, 'sync'])}>
              <span>🔗</span>
              <code>sync</code>
            </div>
            <div sx={{ opacity: !filters.length || filters.includes('refresh') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('refresh') ? filters.filter(f => f !== 'refresh') : [...filters, 'refresh'])}>
              <span>🔌</span>
              <code>refresh</code>
            </div>
            <div sx={{ opacity: !filters.length || filters.includes('keep-in-touch') ? 1 : 0.5 }} onClick={() => setFilters(filters => filters.includes('keep-in-touch') ? filters.filter(f => f !== 'keep-in-touch') : [...filters, 'keep-in-touch'])}>
              <span>🍻</span>
              <code>keep-in-touch</code>
            </div>
          </div>
          <div sx={UISidebar.styles.jobs}>
            {Object.entries(groups).map(([distance, jobs]: [string, any[]]) => (
              <Fragment key={distance}>
                <h6>{distance}</h6>
                <div sx={{ paddingX: 2 }}>
                  {jobs.map(j => (
                    <Job
                      key={j.job}
                      emoji={{
                        'sync': '🔗',
                        'refresh': '🔌',
                        'record': '📹',
                        'refine': '✨',
                        'shrink': '✂️',
                        'keep-in-touch': '🍻',
                        'migrate': '🚚',
                      }[j.meta.command]}
                      selected={j.job === job}
                      {...j}
                      summary={({
                        'sync': summarySync,
                        'refresh': summaryRefresh,
                        'record': summaryRecord,
                        'refine': summaryRefine,
                        'shrink': summaryShrink,
                        'keep-in-touch': summaryKeepInTouch,
                        'migrate': summaryMigrate,
                      }[j.meta.command] || (() => []))(j.meta.summary, false, j.meta.config)}
                    />
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        </nav>
      )}
    </aside>
  )
}

UISidebar.styles = {
  element: {
    minWidth: ['100%', '22em'],
    maxWidth: ['100%', '22em'],
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid',
    borderColor: 'grayLight',
    overflow: 'hidden',
  },
  head: {
    display: 'flex',
    backgroundColor: 'primary',
    color: 'whitePure',
    paddingX: [12, 3],
    paddingY: [12, 3],
    '>h4': {
      display: ['none', 'block'],
      margin: '0px',
      color: 'whitePure',
    },
  },
  selector: {
    flex: 1,
    display: ['flex', 'none'],
    flexDirection: 'row',
    overflow: 'hidden',
    '>div': {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'accentDark',
      borderRadius: '0.25em',
      margin: 4,
      marginRight: 12,
      paddingX: 6,
      paddingY: 8,
      overflow: 'hidden',
      '>span': {
        flexShrink: 0,
        height: '2.5em',
        width: '2.5em',
        backgroundColor: 'accentDarkest',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      '>div': {
        display: 'flex',
        flexDirection: 'column',
        marginX: 4,
        marginTop: 10,
        overflow: 'hidden',
        '>div': {
          '>h5': {
            variant: 'heading.reset',
            margin: 12,
            lineHeight: 'reset',
            fontSize: 4,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          '>span': {
            alignSelf: 'flex-end',
            marginLeft: 4,
            fontSize: 7,
            color: 'whitePure',
            fontFamily: 'monospace',
          },
        },
        '>span': {
          marginY: 8,
          fontSize: 7,
          color: 'whitePure',
          fontFamily: 'monospace',
          opacity: 0.75,
        },
      },
    },
    '>button': {
      paddingX: 0,
    }
  },
  filters: {
    position: 'sticky',
    top: '0px',
    display: 'flex',
    backgroundColor: 'primaryDarker',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingX: 10,
    paddingY: 8,
    zIndex: 2,
    '>div': {
      display: 'flex',
      flexShrink: 0,
      backgroundColor: 'accentDark',
      margin: 11,
      paddingX: 6,
      paddingY: 10,
      borderRadius: '1em',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      ':hover': {
      backgroundColor: 'accentDarker',
      },
      '>span': {
        marginRight: 7,
      },
      '>code': {
        display: 'flex',
        alignItems: 'center',
        fontSize: 6,
      },
    },
  },
  placeholder: {
    flex: 1,
    display: ['none', 'flex'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: ['absolute', 'relative'],
    transition: 'height 400ms ease-in-out',
    top: ['90px', 'unset'],
    width: ['100%', 'unset'],
    zIndex: [1, 'unset'],
    backgroundColor: 'grayLightest',
  },
  jobs: {
    overflowX: 'hidden',
    overflowY: 'auto',
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
  }
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
    <Link to={`/jobs/${job}`} sx={UIJob.styles.element} viewTransition={false}>
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
    paddingLeft: [12, '4em'],
  },
}

const Job = memo(UIJob)
