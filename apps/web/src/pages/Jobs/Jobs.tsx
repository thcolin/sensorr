import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { throttle } from 'throttle-debounce'
import { formatRelative, formatDuration, intervalToDuration } from 'date-fns'
import useRipple from 'use-ripple-hook'
import { Icon, Link } from '@sensorr/ui'
import { Warning } from '@sensorr/ui'
import { usePainted, useResponsiveValue, useTitle } from '@sensorr/utils'
import { JOB_EMOJIS, jobNameOf, jobTitleOf } from '@sensorr/sensorr'
import { useAPI } from '../../store/api'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { RecordJob, summary as summaryRecord } from './Job/Record'
import { RefreshJob, summary as summaryRefresh } from './Job/Refresh'
import { SyncJob, summary as summarySync } from './Job/Sync'
import { MigrateJob, summary as summaryMigrate } from './Job/Migrate'
import { ShrinkJob, summary as summaryShrink } from './Job/Shrink'
import { RefineJob, summary as summaryRefine } from './Job/Refine'
import { ReportJob, summary as summaryReport } from './Job/Report'
import { KeepInTouchJob, summary as summaryKeepInTouch } from './Job/KeepInTouch'
import { ProcessShowsJob, summary as summaryProcessShows } from './Job/ProcessShows'
import { ShowsJob, summaryRefreshShows, summarySyncShows, summaryImportShows, summaryMigrateSonarr } from './Job/Shows'
import { Summary } from './Summary'
import { cumulate } from './cumulate'
import Body from '../../layout/Body/Body'
import { CommandTabs } from '../../components/Sensorr/CommandTabs'
import { JobName } from '../../components/Sensorr/JobName'
import { StartJob } from '../../components/Sensorr/StartJob'

const JOBS_UI: { [name: string]: { view: any, summary: (summary: any, extended?: boolean, config?: any) => any[] } } = {
  'sync movies': { view: SyncJob, summary: summarySync },
  'refresh movies': { view: RefreshJob, summary: summaryRefresh },
  'record movies': { view: RecordJob, summary: summaryRecord },
  'refine movies': { view: RefineJob, summary: summaryRefine },
  'shrink movies': { view: ShrinkJob, summary: summaryShrink },
  'report movies': { view: ReportJob, summary: summaryReport },
  'keep-in-touch': { view: KeepInTouchJob, summary: summaryKeepInTouch },
  'migrate': { view: MigrateJob, summary: summaryMigrate },
  'refresh shows': { view: ShowsJob, summary: summaryRefreshShows },
  'sync shows': { view: ShowsJob, summary: summarySyncShows },
  'import shows': { view: ShowsJob, summary: summaryImportShows },
  'record shows': { view: ProcessShowsJob, summary: summaryProcessShows },
  'airing shows': { view: ProcessShowsJob, summary: summaryProcessShows },
  'migrate sonarr': { view: ShowsJob, summary: summaryMigrateSonarr },
}

// An import shows runs every ten minutes: once done with nothing imported, pending, late or failed, it only shows under its own tab
const isEmptyImport = (job) => {
  const { success, pending, warning, overdue } = job.meta.summary?.imports || {}
  return jobNameOf(job.meta) === 'import shows' && job.meta.done && !job.meta.error && !success && !pending && !warning && !overdue
}

// Every command while the jobs load, the ones without a job leave once they are there
const LOADING_TABS = Object.keys(JOBS_UI).map(name => ({ value: name, emoji: JOB_EMOJIS[name], count: 0 }))

const summaryOf = (job, summary = job.meta.summary) => (JOBS_UI[jobNameOf(job.meta)]?.summary || (() => []))(summary, false, job.meta.config)

const dayOf = (job) => {
  const relative = formatRelative(job.start ? new Date(job.start) : new Date(), new Date()).split(' ')[0]
  return ['today', 'yesterday'].includes(relative) ? relative : (new Date(job.start)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

// "all" stacks the jobs of a command on the same day under the newest, a job that failed stays on its own
const listedOf = (jobs) => {
  const piles = {}

  return jobs.filter(job => job.meta.done && !isEmptyImport(job)).reduce((listed, job) => {
    const key = `${jobNameOf(job.meta)} ${dayOf(job)}`

    if (job.meta.error) {
      return [...listed, { ...job, stack: [] }]
    }

    if (piles[key]) {
      piles[key].stack.push(job)
      return listed
    }

    piles[key] = { ...job, stack: [] }
    return [...listed, piles[key]]
  }, [])
}

const UIJobs = ({ controls = null, ...props }) => {
  const api = useAPI()
  const location = useLocation()
  const navigate = useNavigate()
  const { jobs, loading } = useJobsContext() as any
  const { job } = useParams() as any
  const active = jobs.find(j => j.job === job)
  const View = active && JOBS_UI[jobNameOf(active.meta)]?.view
  useTitle(['Jobs', active && jobTitleOf(jobNameOf(active.meta))].filter(part => part).join(' - '))
  const store = useRef(null)
  const [logs, setLogs] = useState(null)
  const drainLogs = useMemo(() => throttle(3000, () => setLogs(store.current)), [])

  useEffect(() => {
    if ((!job && !loading && jobs.length) || (!loading && !jobs.find(j => j.job === job) && jobs.length && !(location.state as any)?.new)) {
      navigate(`/jobs/${(jobs.find(job => !job.meta.done) || listedOf(jobs)[0] || jobs[0]).job}`, { replace: true })
      return
    }
  }, [jobs, job, loading])

  useEffect(() => {
    if (!job || !jobs.length) {
      return
    }

    store.current = null
    setLogs(null)
    const eventSource = new ReconnectingEventSource(`/api/jobs/${job}?authorization=Bearer%20${api.access_token}${['record', 'refine', 'shrink', 'report', 'airing'].includes(jobs.find(j => j.job === job)?.meta?.command) ? '&summarize=1' : ''}`)
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
          ) : View ? (
            <View job={active} logs={logs} />
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
  const [filter, setFilter] = useState(null)
  const painted = usePainted()
  const mobile = useResponsiveValue([true, false])
  const [unstacked, setUnstacked] = useState({})
  const onToggle = useCallback((pile, value) => setUnstacked(unstacked => ({ ...unstacked, [pile]: value })), [])
  const [folded, setFolded] = useState({})
  const running = useMemo(() => jobs.filter(job => !job.meta.done).sort((a, b) => b.start - a.start), [jobs])
  const listed = useMemo(() => listedOf(jobs), [jobs])
  const groups = useMemo(() => {
    const shown = filter ? running.filter(job => jobNameOf(job.meta) === filter) : running

    return (filter ? jobs.filter(job => job.meta.done && jobNameOf(job.meta) === filter).map(job => ({ ...job, stack: [] })) : listed).reduce((groups, job) => {
      const day = dayOf(job)

      return {
        ...groups,
        [day]: [
          ...(groups[day] || []),
          job,
        ].sort((a, b) => b.start - a.start),
      }
    }, shown.length ? { running: shown } : {})
  }, [jobs, listed, running, filter])
  // The command running or run last comes first
  const options = useMemo(() => Object.keys(JOBS_UI)
    .filter(name => name === filter || jobs.some(job => jobNameOf(job.meta) === name))
    .map(name => ({
      value: name,
      emoji: JOB_EMOJIS[name],
      count: jobs.filter(job => jobNameOf(job.meta) === name).length,
      running: running.some(job => jobNameOf(job.meta) === name),
      last: Math.max(0, ...jobs.filter(job => jobNameOf(job.meta) === name).map(job => new Date(job.start).getTime() || 0)),
    }))
    .sort((a, b) => Number(b.running) - Number(a.running) || b.last - a.last)
    .map(({ running, last, ...option }) => option), [jobs, running, filter])

  useEffect(() => {
    setExpanded(false)
  }, [location.key])

  const active = jobs.find(j => j.job === job)

  return (
    <aside sx={UISidebar.styles.element}>
      <div sx={UISidebar.styles.head}>
        <h4>Jobs</h4>
        {!mobile && <StartJob />}
        <div sx={UISidebar.styles.selector}>
          <div>
            <span>
              {(active && JOB_EMOJIS[jobNameOf(active.meta)]) || '⌛'}
            </span>
            <div>
              <div sx={{ display: 'flex', alignItems: 'center' }}>
                <div sx={{ marginRight: 7, lineHeight: 'reset' }}><Icon value={active?.meta?.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></div>
                <h5>{active ? <JobName name={jobNameOf(active.meta)} /> : 'Loading'}</h5>
                {active?.meta?.done && (
                  <span>
                    {formatDuration(intervalToDuration({ start: new Date(active?.start), end: new Date(active?.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}
                  </span>
                )}
              </div>
              <span><strong>{job}</strong> - {(new Date(active?.start || Date.now())).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(active?.start || Date.now())).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
            </div>
          </div>
          <StartJob />
          <button ref={ref} onPointerDown={onPointerDown} sx={{ variant: 'button.reset', paddingX: 0, color: 'whitePure' }} onClick={() => setExpanded(e => !e)}>
            <Icon value="chevron" direction={expanded} height="1em" width="1em" />
          </button>
        </div>
      </div>
      {loading ? (
        <>
          {/* The row keeps its place under the head while the jobs load */}
          {!mobile && <CommandTabs options={LOADING_TABS} all={0} value={null} onChange={setFilter} />}
          <div sx={UISidebar.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        </>
      ) : (
        <nav sx={{ ...UISidebar.styles.nav, height: [expanded ? 'calc(100% - 90px)' : '0%', 'unset'] }}>
          <CommandTabs options={options} all={running.length + listed.length} value={filter} onChange={setFilter} />
          <div sx={UISidebar.styles.jobs} data-scroller={true}>
            {(painted || !mobile) && Object.entries(groups).map(([distance, jobs]: [string, any[]]) => (
              <Fragment key={distance}>
                <h6>
                  {distance === 'running' ? distance : (
                    <button type='button' aria-expanded={!folded[distance]} onClick={() => setFolded(folded => ({ ...folded, [distance]: !folded[distance] }))}>
                      <span>{distance}</span>
                      {folded[distance] && <span>{jobs.reduce((count, entry) => count + 1 + (entry.stack?.length || 0), 0)}</span>}
                      <Icon value='chevron' direction={!folded[distance]} height='0.75em' width='0.75em' />
                    </button>
                  )}
                </h6>
                <div sx={{ paddingX: 2 }} hidden={!!folded[distance]}>
                  {jobs.map((entry) => {
                    // A new head joins the pile every cron tick: its oldest job keeps the pile's state
                    const pile = entry.stack?.[entry.stack.length - 1]?.job

                    return (
                      <Pile
                        key={entry.job}
                        entry={entry}
                        pile={pile}
                        job={job}
                        unstacked={unstacked[pile] ?? !!entry.stack?.some(s => s.job === job)}
                        onToggle={onToggle}
                      />
                    )
                  })}
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
    paddingTop: [12, 3],
    paddingBottom: [12, 5],
    alignItems: 'center',
    justifyContent: 'space-between',
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
      '>button': {
        variant: 'button.reset',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5em',
        font: 'inherit',
        color: 'inherit',
        textTransform: 'inherit',
        cursor: 'pointer',
        '>span:first-of-type': {
          flex: 1,
          textAlign: 'left',
        },
        '>span:nth-of-type(2)': {
          fontFamily: 'monospace',
          fontWeight: 'normal',
          fontSize: 6,
          backgroundColor: 'grayLight',
          borderRadius: '1em',
          paddingX: 5,
          paddingY: 9,
        },
        ':focus-visible': {
          outline: '2px solid',
          outlineColor: 'text',
          outlineOffset: '2px',
        },
      },
    },
  }
}

const Sidebar = memo(UISidebar)

const EASE = 'cubic-bezier(0.2, 0, 0, 1)'

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A pile of 80 jobs is thousands of pixels tall: only the part inside the scrolled list moves
const roomOf = (element) => {
  const scroller = element.closest('[data-scroller]')
  const bottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight
  return Math.max(0, Math.min(element.scrollHeight, bottom - element.getBoundingClientRect().top))
}

const UIPile = ({ entry: { stack = [], ...head }, pile, job, unstacked, onToggle }) => {
  const more = useRef(null)
  const opening = useRef(false)
  const [closing, setClosing] = useState(false)
  const [shown, setShown] = useState(Infinity)
  const oldest = stack[stack.length - 1]
  const selected = [head, ...stack].some(j => j.job === job)
  const open = unstacked && !closing

  useLayoutEffect(() => {
    if (!unstacked || !opening.current || !more.current) {
      return
    }

    opening.current = false

    if (still()) {
      setShown(Infinity)
      return
    }

    const room = roomOf(more.current)
    more.current.animate([{ height: '0px' }, { height: `${room}px` }], { duration: 280, easing: EASE }).onfinish = () => setShown(Infinity)
    Array.from(more.current.firstElementChild.children).forEach((card: any) => card.animate(
      [{ opacity: 0, transform: 'translateY(-0.75em)' }, { opacity: 1, transform: 'none' }],
      { duration: 280, easing: EASE },
    ))
  }, [unstacked])

  const toggle = () => {
    if (!unstacked) {
      opening.current = true
      setShown(6)
      onToggle(pile, true)
      return
    }

    if (!more.current || still()) {
      onToggle(pile, false)
      return
    }

    setClosing(true)
    const room = roomOf(more.current)
    more.current.animate([{ height: `${room}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 180, easing: EASE, fill: 'forwards' }).onfinish = () => {
      onToggle(pile, false)
      setClosing(false)
    }
  }

  const card = (j, props = {}) => (
    <Job
      key={j.job}
      emoji={JOB_EMOJIS[jobNameOf(j.meta)]}
      selected={j.job === job}
      {...j}
      summary={summaryOf(j)}
      {...props}
    />
  )

  return (
    <div sx={UIPile.styles.element} data-pile={!head.meta.done ? null : !stack.length ? 'single' : open ? 'unstacked' : 'stacked'} data-selected={selected}>
      <div sx={UIPile.styles.frame}>
        {card(head, open || !stack.length ? {} : {
          since: oldest.start,
          summary: summaryOf(head, stack.reduce((summary, older) => cumulate(summary, older.meta.summary), head.meta.summary)),
        })}
        {!!stack.length && unstacked && (
          <div ref={more} sx={UIPile.styles.more}>
            <div>
              {stack.slice(0, shown).map(j => card(j))}
            </div>
          </div>
        )}
      </div>
      {!!stack.length && (
        <>
          <span sx={UIPile.styles.sheets} aria-hidden={true}><span><span /><span /></span></span>
          <button
            type='button'
            sx={UIPile.styles.toggle}
            aria-expanded={open}
            aria-label={`${stack.length + 1}, ${open ? 'stack' : 'show'} the ${stack.length} older ${jobTitleOf(jobNameOf(head.meta))} jobs of the day`}
            onClick={toggle}
          >
            {stack.length + 1}
            <Icon value='chevron' direction={open} height='0.75em' width='0.75em' />
          </button>
        </>
      )}
    </div>
  )
}

UIPile.styles = {
  element: {
    position: 'relative',
    '&[data-pile]': {
      marginY: 6,
      marginX: '-0.5em',
    },
    '&[data-pile]>div:first-of-type': {
      backgroundColor: 'grayLighter',
      border: '1px solid',
      borderColor: 'grayLight',
      borderRadius: '0.25em',
      paddingX: '0.5em',
      transition: 'border-color ease 300ms',
    },
    '&[data-selected=true]>div:first-of-type, &[data-pile]:hover>div:first-of-type, &[data-selected=true]>span>span>span, &:hover>span>span>span': {
      borderColor: 'grayDark',
    },
    '&[data-pile=unstacked]>span': {
      gridTemplateRows: '0fr',
      opacity: 0,
    },
    '&[data-selected=false]>button': {
      opacity: 0.5,
      transition: 'opacity ease 300ms',
    },
    '&:hover>button, &:focus-within>button': {
      opacity: 1,
    },
  },
  frame: {
    '>a, >div>div>a': {
      borderBottom: 'none',
    },
  },
  more: {
    overflow: 'hidden',
    '>div>a': {
      borderTop: '1px solid',
      borderColor: 'grayLight',
    },
  },
  sheets: {
    display: 'grid',
    gridTemplateRows: '1fr',
    transition: `grid-template-rows 320ms ${EASE}, opacity 200ms ${EASE}`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
    '>span': {
      minHeight: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      '>span': {
        height: '0.4em',
        flexShrink: 0,
        width: 'calc(100% - 1.5em)',
        backgroundColor: 'grayLighter',
        border: '1px solid',
        borderTop: 'none',
        borderColor: 'grayLight',
        borderRadius: '0 0 0.25em 0.25em',
        transition: 'border-color ease 300ms',
      },
      '>span:last-of-type': {
        width: 'calc(100% - 3em)',
      },
    },
  },
  toggle: {
    variant: 'button.reset',
    position: 'absolute',
    top: ['0.75em', '1em'],
    right: '0.75em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6em',
    backgroundColor: 'grayLight',
    color: 'text',
    fontFamily: 'monospace',
    fontSize: 6,
    borderRadius: '1em',
    paddingX: 5,
    paddingY: 9,
    cursor: 'pointer',
    '::before': {
      content: '""',
      position: 'absolute',
      inset: ['-12px', '-8px'],
    },
    '&[aria-expanded=true]': {
      backgroundColor: 'gray',
    },
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'text',
      outlineOffset: '2px',
    },
  },
}

const Pile = memo(UIPile)

const UIJob = ({ emoji, job, start, end, meta: { command, done, ...meta }, selected = false, summary, since = null }) => {
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
              <JobName name={jobNameOf({ command, type: meta.type })} sx={UIJob.styles.title} />
              {done && (
                <span sx={{ ...UIJob.styles.subtitle, marginY: 12, marginLeft: 4, alignSelf: 'flex-end' }}>
                  {formatDuration(intervalToDuration({ start: new Date(start), end: new Date(end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}
                </span>
              )}
            </span>
            <span sx={UIJob.styles.subtitle}><strong>{job}</strong> - {(new Date(start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {since && `${(new Date(since)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })} → `}{(new Date(start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
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
