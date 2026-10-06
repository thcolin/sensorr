import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { throttle } from 'throttle-debounce'
import { formatRelative, formatDuration, intervalToDuration } from 'date-fns'
import { useRipple } from 'use-ripple-hook'
import { Bar, Drawer, Icon, Link } from '@sensorr/ui'
import { Warning } from '@sensorr/ui'
import { usePainted, useResponsiveValue, useTitle } from '@sensorr/utils'
import { JOB_EMOJIS, jobLabelOf, jobNameOf, jobTitleOf } from '@sensorr/sensorr'
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
import { CommandTabs, commandTabsOf } from '../../components/Sensorr/CommandTabs'
import { JobName } from '../../components/Sensorr/JobName'
import { DrawerHead, StartJob } from '../../components/Sensorr/StartJob'
import { JobState } from '../../components/Sensorr/JobState'

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

const COMMANDS = Object.fromEntries(Object.keys(JOBS_UI).map(name => [name, { emoji: JOB_EMOJIS[name] }]))
const startOf = (job) => new Date(job.start).getTime()

const summaryOf = (job, summary = job.meta.summary) => (JOBS_UI[jobNameOf(job.meta)]?.summary || (() => []))(summary, false, job.meta.config)

const durationOf = ({ start, end }) => formatDuration(intervalToDuration({ start: new Date(start), end: new Date(end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')

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
            <HeadPlaceholder />
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
  const options = useMemo(() => commandTabsOf(jobs, COMMANDS, filter, startOf, name => running.some(job => jobNameOf(job.meta) === name)), [jobs, running, filter])

  useEffect(() => {
    setExpanded(false)
  }, [location.key])

  const active = jobs.find(j => j.job === job)
  const label = active && jobLabelOf(jobNameOf(active.meta))
  const close = useCallback(() => setExpanded(false), [])

  const list = (
    <nav sx={UISidebar.styles.nav}>
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
  )

  return (
    <aside sx={UISidebar.styles.element}>
      <div sx={UISidebar.styles.head}>
        <h4>Jobs</h4>
        {!mobile && <StartJob />}
        <div sx={UISidebar.styles.selector}>
          <button ref={ref} type='button' onPointerDown={onPointerDown} onClick={() => setExpanded(e => !e)} aria-expanded={expanded} aria-haspopup='dialog' disabled={loading}>
            <span aria-hidden={true}>{active ? JOB_EMOJIS[jobNameOf(active.meta)] : <Bar width='1em' height='1em' radius='50%' />}</span>
            <span>
              <span>
                <code>{label ? label.command : <Bar width='6em' height='0.75em' />}</code>
                {!!label?.suffix && <span>{label.suffix}</span>}
              </span>
              {!!active && (
                <span>
                  <span role='img' aria-label={active.meta.done ? 'done' : 'running'}><Icon value={active.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
                  {active.meta.done && <strong>{durationOf(active)}</strong>}
                  <time dateTime={new Date(active.start).toISOString()}>
                    {active.meta.done ? '· ' : ''}{(new Date(active.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} {(new Date(active.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}
                  </time>
                  {!!active.meta.error && <span role='img' aria-label='failed'>💢</span>}
                </span>
              )}
            </span>
            <span><Icon value='chevron' direction={expanded} height='1.125em' width='1.125em' /></span>
          </button>
          <StartJob />
        </div>
      </div>
      {loading ? (
        <>
          {/* The row keeps its place under the head while the jobs load */}
          {!mobile && <CommandTabs options={LOADING_TABS} all={0} value={null} onChange={setFilter} />}
          <div sx={UISidebar.styles.placeholder} aria-hidden={true}>
            {[[5.5, 2], [6.5, 2], [5, 3], [6, 2]].map(([title, pills], index) => <JobPlaceholder key={index} title={title} pills={pills} />)}
          </div>
        </>
      ) : mobile ? createPortal((
        <Drawer open={expanded} close={close} height='85vh'>
          <DrawerHead title='Jobs' />
          {list}
        </Drawer>
      ), document.body) : list}
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
    // The same height whether the job has loaded or not
    height: ['5.25em', 'auto'],
    boxSizing: 'border-box',
    alignItems: 'center',
    justifyContent: 'space-between',
    '>h4': {
      display: ['none', 'block'],
      margin: '0px',
      color: 'whitePure',
    },
  },
  // The job shown is the head's title: its type in an `accentDarkest` badge, 5.68:1, its duration and date in an `accentDark` chip, 3.72:1
  selector: {
    flex: 1,
    minWidth: 0,
    display: ['flex', 'none'],
    alignItems: 'center',
    paddingRight: 6,
    '>button:first-of-type': {
      variant: 'button.reset',
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75em',
      paddingY: 6,
      paddingLeft: 2,
      color: 'whitePure',
      textAlign: 'left',
      cursor: 'pointer',
      // The emoji spans both lines, the spinner stands in for it while the jobs load
      '>span[aria-hidden]': {
        flexShrink: 0,
        display: 'flex',
        marginRight: '0.125em',
        fontSize: '2.25em',
        lineHeight: 1,
      },
      '>span:nth-last-of-type(2)': {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.375em',
        // Command and type
        '>span:first-of-type': {
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5em',
          '>code': {
            fontFamily: 'monospace',
            fontSize: '1.25em',
            fontWeight: 'bold',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'whitePure',
          },
          '>span': {
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            height: '2em',
            paddingX: '0.8em',
            borderRadius: '1em',
            backgroundColor: 'accentDarkest',
            fontFamily: 'monospace',
            fontSize: '0.625em',
            fontWeight: 'bold',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          },
        },
        // Status, duration and date
        '>span:nth-of-type(2)': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5em',
          height: '2em',
          paddingX: '0.8em',
          borderRadius: '1em',
          backgroundColor: 'accentDark',
          fontFamily: 'monospace',
          fontSize: '0.6875em',
          whiteSpace: 'nowrap',
          '>span:first-of-type': {
            display: 'flex',
          },
          '>strong': {
            fontWeight: 'semibold',
          },
        },
      },
      '>span:last-of-type': {
        flexShrink: 0,
        display: 'flex',
        padding: 8,
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '-2px',
      },
    },
  },
  placeholder: {
    display: ['none', 'block'],
    paddingX: 2,
    paddingTop: '2.5em',
    overflow: 'hidden',
  },
  nav: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
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
    '>[data-job], >div>div>[data-job]': {
      borderBottom: 'none',
    },
  },
  more: {
    overflow: 'hidden',
    '>div>[data-job]': {
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

// The link is stretched under the row, so the running job's dot can be a button of its own
const UIJob = ({ emoji, job, start, end, meta: { command, done, ...meta }, selected = false, summary, since = null }) => {
  const name = jobNameOf({ command, type: meta.type })

  return (
    <div sx={UIJob.styles.element} data-job={job}>
      <Link to={`/jobs/${job}`} aria-label={`${jobTitleOf(name)} ${job}`} sx={UIJob.styles.link} viewTransition={false} />
      <span sx={UIJob.styles.wrapper} style={{ opacity: selected ? 1 : 0.5 }}>
        <span sx={UIJob.styles.head}>
          <span sx={UIJob.styles.icon}>
            {emoji}
          </span>
          <span sx={UIJob.styles.container}>
            <span sx={{ display: 'flex', alignItems: 'center' }}>
              <JobState job={job} name={name} done={done} />
              <JobName name={name} sx={UIJob.styles.title} />
              {done && (
                <span sx={{ ...UIJob.styles.subtitle, marginY: 12, marginLeft: 4, alignSelf: 'flex-end' }}>
                  {durationOf({ start, end })}
                </span>
              )}
            </span>
            <span sx={UIJob.styles.subtitle}><strong>{job}</strong> - {(new Date(start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {since && `${(new Date(since)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })} → `}{(new Date(start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
          </span>
        </span>
        <Link to={`/jobs/${job}`} tabIndex={-1} aria-hidden={true} sx={UIJob.styles.summary} viewTransition={false}>
          <Summary error={meta.error} meta={summary} />
        </Link>
      </span>
    </div>
  )
}

UIJob.styles = {
  element: {
    position: 'relative',
    isolation: 'isolate',
    display: 'flex',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    paddingY: 3,
    overflow: 'hidden',
    '&:hover>span, &:focus-within>span': {
      opacity: '1 !important',
    },
  },
  link: {
    position: 'absolute',
    inset: '0px',
    zIndex: 1,
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'text',
      outlineOffset: '-2px',
    },
  },
  // Above the link but transparent to the pointer, except for the stop button and the summary
  wrapper: {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    transition: 'opacity ease 300ms',
    overflow: 'hidden',
    pointerEvents: 'none',
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
    display: 'block',
    pointerEvents: 'auto',
    fontSize: 6,
    overflowX: 'auto',
    paddingLeft: [12, '4em'],
  },
}

const Job = memo(UIJob)

const JobPlaceholder = ({ title, pills }) => (
  <div sx={UIJob.styles.element}>
    <span sx={{ ...UIJob.styles.wrapper, opacity: 0.5 }}>
      <span sx={UIJob.styles.head}>
        <span sx={UIJob.styles.icon} />
        <span sx={{ ...UIJob.styles.container, gap: 6 }}>
          <Bar width={`${title}em`} height='1em' />
          <Bar width='11em' height='0.625em' />
        </span>
      </span>
      <span sx={{ ...UIJob.styles.summary, display: 'flex', gap: 8 }}>
        {Array.from({ length: pills }).map((_, index) => <Bar key={index} pill={true} width='3.5em' height='1.75em' />)}
      </span>
    </span>
  </div>
)

const HeadPlaceholder = () => (
  <div sx={HeadPlaceholder.styles.element} aria-hidden={true}>
    <Bar width='5em' height='5em' radius='50%' />
    <Bar width='10em' height='1.5em' />
    <Bar width='14em' height='0.875em' />
    <span sx={HeadPlaceholder.styles.pills}>
      {[0, 1, 2].map(index => <Bar key={index} pill={true} width='4em' height='2.25em' />)}
    </span>
  </div>
)

HeadPlaceholder.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '2.5em',
  },
  pills: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
}
