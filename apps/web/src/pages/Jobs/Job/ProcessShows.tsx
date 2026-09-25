import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Icon, Warning } from '@sensorr/ui'
import { coverageLabel, jobNameOf, levelOf } from '@sensorr/sensorr'
import { useResponsiveValue } from '@sensorr/utils'
import { formatDuration, intervalToDuration } from 'date-fns'
import toast from 'react-hot-toast'
import { useShowsMetadataContext } from '../../../contexts/ShowsMetadata/ShowsMetadata'
import { useAPI } from '../../../store/api'
import Show from '../../../components/Show/Show'
import { Release } from '../../../components/Sensorr/Release'
import { Summary } from '../Summary'
import { RecordLogs, useRecordsVirtualizer } from './ProcessMovies'
import { ShowSettings } from '../../Shows/components/Actions'

export const summary = ({ wished = 0, processed, recorded = 0, proposal = 0, treated = 0, withdrawn, ignored, missing, warning }, extended = true, config = {} as any) => [
  ...(extended ? [{
    key: 'wished',
    emoji: '📺',
    title: <span><strong>{wished}</strong> Wished shows with wanted episodes</span>,
    length: wished,
  }] : []),
  ...(extended && (processed > 0) ? [{
    key: 'processed',
    emoji: '🎟 ',
    title: <span><strong>{processed}</strong> Processed shows</span>,
    length: processed,
  }] : []),
  ...((config?.proposalOnly || proposal > 0) ? [{
    key: 'proposal',
    emoji: '🛎️ ',
    title: <span><strong>{Math.max(0, proposal - treated)}</strong> Release proposals</span>,
    length: Math.max(0, proposal - treated),
  }] : []),
  ...(treated > 0 ? [{
    key: 'treated',
    emoji: '✍️ ',
    title: <span><strong>{treated}</strong> Answered release proposals</span>,
    length: treated,
  }] : []),
  {
    key: 'recorded',
    emoji: '📼',
    title: <span><strong>{recorded}</strong> Recorded show releases</span>,
    length: recorded,
  },
  ...(extended && (withdrawn > 0) ? [{
    key: 'withdrawn',
    emoji: '⛔ ',
    title: <span><strong>{withdrawn}</strong> Withdrawn shows releases</span>,
    length: withdrawn,
  }] : []),
  ...(extended && (ignored > 0) ? [{
    key: 'ignored',
    emoji: '🗑️ ',
    title: <span><strong>{ignored}</strong> Ignored shows releases</span>,
    length: ignored,
  }] : []),
  ...(extended && (missing > 0) ? [{
    key: 'missing',
    emoji: '📭 ',
    title: <span><strong>{missing}</strong> Shows with no releases found</span>,
    length: missing,
  }] : []),
  ...(warning > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{warning}</strong> Disturbed during process</span>,
    length: warning,
  }] : []),
]

const estimateRecordHeight = (record: any) => Math.max(420, 360 + (record?.logs?.length ?? 0) * 22 + (record?.releases?.length ?? 1) * 150)

// The first episode a release covers; coverage arrays come unsorted
const firstOf = (release: any) => [...(release.coverage || [])].sort((a, b) => a.season - b.season || a.episode - b.episode)[0] || { season: 0, episode: 0 }

const byCoverage = (a: any, b: any) => firstOf(a).season - firstOf(b).season || firstOf(a).episode - firstOf(b).episode

const matches = (record: any, filter: string) => ({
  recorded: record.releases.some(release => !release.proposal),
  proposal: record.releases.some(release => release.proposal && !release.treated),
  treated: record.releases.some(release => release.proposal && release.treated),
  withdrawn: !record.releases.length && record.failure?.warning <= 10,
  ignored: !record.releases.length && record.failure?.warning > 10,
  missing: !record.releases.length && !record.failure && !record.warning,
  warning: !!record.warning,
})[filter] ?? true

const UIProcessShowsJob = ({ job, logs }) => {
  const [filter, setFilter] = useState(null)
  const [znab, setZnab] = useState(null)
  const toggleZnab = (z: string) => setZnab(znab => znab === z ? null : z)
  const { metadata: showsMetadata, setShowMetadata, banShowRelease, unbanShowRelease } = useShowsMetadataContext() as any

  const records = useMemo(() => Object.values((logs || []).reduce((groups, log) => (!log.meta.group || log.meta.type !== 'show') ? groups : {
    ...groups,
    [log.meta.group]: {
      group: log.meta.group,
      timestamp: groups[log.meta.group]?.timestamp || log.timestamp,
      show: {
        ...groups[log.meta.group]?.show,
        ...log.meta.show,
      },
      releases: [
        ...(groups[log.meta.group]?.releases || []),
        ...((log.meta.show && log.meta.release?.valid) ? [{ log: log._id, ...log.meta.release, treated: log.meta.treated, choice: log.meta.choice }] : []),
      ],
      failure: groups[log.meta.group]?.failure || ((!log.meta.show && log.meta.release && !log.meta.release.valid) ? log.meta.release : undefined),
      warning: groups[log.meta.group]?.warning || (log.meta.done ? log.meta.warning : undefined),
      logs: [...(log.message ? [log] : []), ...(groups[log.meta.group]?.logs || [])].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      done: !!job.meta.done || groups[log.meta.group]?.done || log.meta.done,
    },
  }, {}))
    .map((record: any) => ({ ...record, releases: [...record.releases].sort(byCoverage) }))
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [logs, job.meta.done])

  const znabs = useMemo(() => records.flatMap((record: any) => record.releases).reduce((acc: any, release: any) => release.znab ? ({
    ...acc,
    [release.znab]: (acc[release.znab] || 0) + 1,
  }) : acc, {}), [records])

  const filtered = useMemo(() => records.filter((record: any) => (
    (!filter || matches(record, filter)) &&
    (!znab || record.releases.some(release => release.znab === znab))
  )), [records, filter, znab])

  const { ref, listRef, headerRef, logsCache, rowVirtualizer } = useRecordsVirtualizer(filtered.length, (index) => estimateRecordHeight(filtered[index]), job.job)

  useEffect(() => {
    setFilter(null)
    setZnab(null)
  }, [job.job])

  return (
    <div ref={ref} sx={UIProcessShowsJob.styles.element}>
      <div ref={headerRef}>
        <Warning
          emoji={{ 'record': '📹', 'airing': '📡' }[job.meta.command]}
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIProcessShowsJob.styles.title}>{jobNameOf(job.meta)}</span>
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIProcessShowsJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIProcessShowsJob.styles.subtitle}>{formatDuration(intervalToDuration({ start: new Date(job.start), end: new Date(job.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}</strong>
                </>
              )}
            </>
          )}
          children={(
            <span>
              <span sx={UIProcessShowsJob.styles.summary}>
                <Summary
                  error={job.meta.error}
                  meta={summary({
                    ...job.meta.summary,
                    ...(job.meta.done ? {} : { processed: records.length }),
                    treated: records.reduce((sum, record: any) => sum + record.releases.filter(release => release.treated).length, 0),
                  }, true, job.meta.config).map(meta => ({
                    ...meta,
                    props: ['wished', 'processed'].includes(meta.key) ? {
                      style: {
                        cursor: 'pointer',
                        opacity: !filter ? 1 : 0.5,
                      },
                      onClick: () => setFilter(null),
                    } : {
                      role: 'button',
                      tabIndex: 0,
                      'aria-pressed': filter === meta.key,
                      style: {
                        cursor: 'pointer',
                        opacity: !filter || filter === meta.key ? 1 : 0.5,
                      },
                      onClick: () => setFilter(filter => filter === meta.key ? null : meta.key),
                      onKeyDown: (e) => ['Enter', ' '].includes(e.key) && (e.preventDefault(), setFilter(filter => filter === meta.key ? null : meta.key)),
                    },
                  }))}
                />
              </span>
              <span sx={UIProcessShowsJob.styles.summary}>
                {Object.entries(znabs).map(([z, count]) => (
                  <span
                    key={z}
                    role='button'
                    tabIndex={0}
                    aria-pressed={znab === z}
                    onClick={() => toggleZnab(z)}
                    onKeyDown={(e) => ['Enter', ' '].includes(e.key) && (e.preventDefault(), toggleZnab(z))}
                    sx={UIProcessShowsJob.styles.link}
                    style={{ opacity: !znab || znab === z ? 1 : 0.5 }}
                  >
                    {z} ({count as number})
                  </span>
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
      <div sx={UIProcessShowsJob.styles.content}>
        {logs === null ? (
          <div sx={UIProcessShowsJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : filtered.length ? (
          <div ref={listRef} style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const record = filtered[virtualItem.index] as any

              return (
                <div
                  key={record.group}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
                  }}
                >
                  <Record
                    {...record}
                    job={job.job}
                    command={job.meta.command}
                    metadata={showsMetadata[record.show?.id] || {}}
                    setShowMetadata={setShowMetadata}
                    banShowRelease={banShowRelease}
                    unbanShowRelease={unbanShowRelease}
                    logsCache={logsCache}
                  />
                </div>
              )
            })}
          </div>
        ) : job.meta.done ? (
          <Warning emoji={job.meta.error ? '💢' : '📺'} title={job.meta.error ? 'Error': 'Empty'} subtitle={job.meta.error?.message || job.meta.error || 'No recorded shows during this job'} />
        ) : (
          <Warning emoji='⏳' title='Loading' subtitle='Waiting first record...' />
        )}
      </div>
    </div>
  )
}

UIProcessShowsJob.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingY: 0,
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
}

export const ProcessShowsJob = memo(UIProcessShowsJob)

const UIRecord = ({ command, job, group, show, logs: summaryLogs, releases, failure, metadata, setShowMetadata, banShowRelease, unbanShowRelease, logsCache, done, ...props }) => {
  const api = useAPI()
  const cacheKey = `${job}-${group}`
  const [logs, setLogs] = useState(() => logsCache?.get(cacheKey) ?? null)
  const [optimistic, setOptimistic] = useState({})
  const mobile = useResponsiveValue([true, false])
  const banned = metadata?.banned_releases || []

  // The Policy and Auto fields handle their own failure
  const setSettings = useCallback((key, value) => setShowMetadata(show?.id, key, value), [show?.id, setShowMetadata])
  // A ban goes through its own route: the list written whole would drop a ban a job made meanwhile
  const toggleBan = useCallback((title) => (banned.includes(title) ? unbanShowRelease : banShowRelease)(show?.id, title).catch(() => {
    toast.error(banned.includes(title) ? 'Error while unbanning the release' : 'Error while banning the release')
  }), [show?.id, banned, banShowRelease, unbanShowRelease])

  const proceed = useCallback(({ treated, choice: _choice, ...release }, choice) => {
    setOptimistic(optimistic => ({ ...optimistic, [release.id]: { treated: true, choice } }))
    setShowMetadata(show?.id, 'proposal', { id: release.id, choice }).catch(() => {
      toast.error('Error while updating show metadata')
      setOptimistic(({ [release.id]: reverted, ...optimistic }: any) => optimistic)
    })
  }, [show?.id, setShowMetadata])

  const settings = (
    <div sx={UIRecord.styles.metadata}>
      <ShowSettings entity={show || {}} metadata={metadata} ready={!!metadata?.state} setMetadata={setSettings} help={false} />
    </div>
  )

  useEffect(() => {
    if (job === 'anonymous' || !done) {
      setLogs(null)
      return
    }

    const cached = logsCache?.get(cacheKey)

    if (cached) {
      setLogs(cached)
      return
    }

    setLogs(null)

    const controller = new AbortController()

    const cb = async () => {
      const { uri, params, init } = api.query.logs.getJobGroupLogs({ init: { signal: controller.signal }, params: { job, group } })

      try {
        const result = await api.fetch(uri, params, init)
        logsCache?.set(cacheKey, result)
        setLogs(result)
      } catch (e) {
        if (controller.signal.aborted) {
          return
        }

        console.warn(e)
        setLogs([])
      }
    }

    cb()

    return () => controller.abort()
  }, [job, group, done, cacheKey])

  return (
    <div sx={UIRecord.styles.element}>
      <div sx={UIRecord.styles.show}>
        <Show entity={show || {}} />
        {mobile && settings}
      </div>
      <div sx={UIRecord.styles.results}>
        {!mobile && settings}
        {logs === null && !summaryLogs?.length ? (
          <div sx={UIRecord.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : (
          <>
            <RecordLogs
              logs={logs || summaryLogs}
              command={command}
              metadata={metadata}
              toggleBan={toggleBan}
            />
            {done && (releases.length ? (
              <div>
                {releases.map(release => (
                  <div key={release.id} sx={UIRecord.styles.release}>
                    <code>{coverageLabel(release.coverage || [], release.level || levelOf(release.meta, release.category) || undefined)}</code>
                    <Release
                      entity={{ from: command, job, ...release, ...optimistic[release.id] }}
                      display='column'
                      proceed={proceed}
                      banned={banned.includes(release.title)}
                      ban={() => toggleBan(release.title)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div sx={UIRecord.styles.release}>
                <Release entity={failure || {}} display='column' />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

UIRecord.styles = {
  element: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['center', 'unset'],
    paddingY: 4,
    paddingX: [4, 0],
    backgroundColor: 'grayLighter',
    overflow: 'hidden',
  },
  show: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'row',
    maxWidth: '100%',
    marginRight: [12, 4],
    marginBottom: [4, 12],
  },
  metadata: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
    fontSize: 5,
    marginLeft: [4, 12],
  },
  results: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: ['100%', 'auto'],
    maxWidth: '100%',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  release: {
    flexShrink: 0,
    paddingTop: 4,
    marginTop: 4,
    borderTop: '1px solid',
    borderColor: 'grayLight',
    ':first-of-type': {
      borderTop: 'none',
      marginTop: 12,
    },
    '>code': {
      display: 'block',
      textAlign: 'center',
      paddingX: 12,
      paddingBottom: 12,
      fontSize: 4,
      fontWeight: 'semibold',
      fontVariantNumeric: 'tabular-nums',
    },
    '>div>div': {
      paddingX: 12,
      '>div': {
        paddingY: 4,
      },
    },
  },
}

const Record = memo(UIRecord)
