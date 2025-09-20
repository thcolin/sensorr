import { Fragment, createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, Warning } from '@sensorr/ui'
import { filesize, useResponsiveValue } from '@sensorr/utils'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'
import { formatDuration, intervalToDuration } from 'date-fns'
import { useMoviesMetadataContext } from '../../../contexts/MoviesMetadata/MoviesMetadata'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { useAPI } from '../../../store/api'
import Movie from '../../../components/Movie/Movie'
import { Sensorr } from '../../../components/Sensorr'
import { Release, reportOleoo } from '../../../components/Sensorr/Release'
import { Metadata } from '../../Details/components/Metadata'
import { Summary } from '../Summary'
import { MovieActions } from '../../Details/components/Actions'

const RecordsContext = createContext([])

const RecordData = ({ style, index, readyInViewport, scrolling, sensorr, ...props }) => {
  const record = useContext(RecordsContext as any)[index]

  return (
    <div style={{ ...style, width: '100%' }}>
      <Record {...record} {...props} sensorr={sensorr === record.movie?.id} />
    </div>
  )
}

const UIProcessMoviesJob = ({ job, logs, summary }) => {
  const ref = useRef()
  const { device } = useDeviceContext()
  const [filter, setFilter] = useState(null)
  const [znab, setZnab] = useState(null)
  const toggleSensorr = useRef() as any
  const { metadata: moviesMetadataContext, setMovieMetadata } = useMoviesMetadataContext() as any

  const records = useMemo(() => Object.values((logs || []).reduce((groups, log) => !log.meta.group ? groups : {
    ...groups,
    [log.meta.group]: {
      group: log.meta.group,
      timestamp: groups[log.meta.group]?.timestamp || log.timestamp,
      movie: {
        ...groups[log.meta.group]?.movie,
        ...log.meta.movie,
      },
      release: groups[log.meta.group]?.release || (log.meta.release ? { log: log._id, ...log.meta.release } : undefined),
      treated: typeof groups[log.meta.group]?.treated === 'boolean' ? groups[log.meta.group]?.treated : log.meta.treated,
      choice: typeof groups[log.meta.group]?.choice === 'boolean' ? groups[log.meta.group]?.choice : log.meta.choice,
      warning: groups[log.meta.group]?.warning || log.meta?.release?.reason,
      logs: [...(log.message ? [log] : []), ...(groups[log.meta.group]?.logs || [])].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      done: !!job.meta.done || groups[log.meta.group]?.done || log.meta.done,
    },
  }, {})).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [logs, job.meta.done])

  const znabs = useMemo(() => records.reduce((acc: any, curr: any) => curr?.release?.valid ? ({
    ...acc,
    [curr?.release?.znab]: (acc[curr?.release?.znab] || 0) + 1,
  }) : acc, {}), [records])

  const filtered = useMemo(() => records.filter((record: any) => ((!filter && (!znab || (record.release?.valid && record.release?.znab === znab))) || {
    wished: (!znab || (record.release?.valid && record.release?.znab === znab)),
    refined: (!znab || (record.release?.valid && record.release?.znab === znab)),
    shrinked: (!znab || (record.release?.valid && record.release?.znab === znab)),
    recorded: record.release?.valid && (!record.release?.proposal || record.treated) && (!znab || (record.release?.valid && record.release?.znab === znab)),
    treated: record.release?.valid && record.release?.proposal && record.treated && (!znab || (record.release?.valid && record.release?.znab === znab)),
    proposal: record.release?.valid && record.release?.proposal && !record.treated && (!znab || (record.release?.valid && record.release?.znab === znab)),
    withdrawn: !record.release?.valid && record?.release?.warning <= 10 && (!znab || (record.release?.valid && record.release?.znab === znab)),
    ignored: !record.release?.valid && record?.release?.warning > 10 && (!znab || (record.release?.valid && record.release?.znab === znab)),
    missing: !record.release,
    warning: record.warning && (!znab || (record.release?.valid && record.release?.znab === znab)),
  }[filter])), [filter, znab, records])

  useEffect(() => {
    setFilter(null)
  }, [job.job])

  useEffect(() => {
    if ((ref.current as any).scrollTop > 400) {
      (ref.current as any).scrollTo({ top: (ref.current as any).scrollTop + 480, behavior: 'instant' })
    }
  }, [records.length])

  return (
    <div ref={ref} sx={UIProcessMoviesJob.styles.element}>
      <div>
        <Warning
          emoji={{ record: '📹', refine: '✨', shrink: '✂️' }[job.meta.command]}
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIProcessMoviesJob.styles.title}>{job.meta.command}</span>
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIProcessMoviesJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIProcessMoviesJob.styles.subtitle}>{formatDuration(intervalToDuration({ start: new Date(job.start), end: new Date(job.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}</strong>
                </>
              )}
            </>
          )}
          children={(
            <span>
              <span sx={UIProcessMoviesJob.styles.summary}>
                <Summary
                  error={job.meta.error}
                  meta={summary({
                    ...job.meta.summary,
                    ...(job.meta.done ? {} : { processed: records.length }),
                    treated: records.filter((record: any) => record.treated).length,
                    refined: (!job.meta.done && job.meta.summary.refined) ? `${records.length}/${job.meta.summary.refined}` : job.meta.summary.refined,
                    shrinked: (!job.meta.done && job.meta.summary.shrinked) ? `${records.length}/${job.meta.summary.shrinked}` : job.meta.summary.shrinked,
                  }, true, job.meta.config).map(meta => ({
                    ...meta,
                    props: {
                      style: {
                        cursor: 'pointer',
                        opacity: !filter || filter === meta.key ? 1 : 0.5
                      },
                      onClick: {
                        refined: () => setFilter(null),
                        shrinked: () => setFilter(null),
                      }[meta.key] || (() => setFilter(filter => filter === meta.key ? null : meta.key)),
                    },
                  }))}
                />
              </span>
              <span sx={UIProcessMoviesJob.styles.summary}>
                {Object.entries(znabs).map(([z, count]) => (
                  <span key={z} onClick={() => setZnab(znab => znab === z ? null : z)} sx={UIProcessMoviesJob.styles.link} style={{ opacity: !znab || znab === z ? 1 : 0.5 }}>{z} ({count})</span>
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
      <div sx={UIProcessMoviesJob.styles.content}>
        <RecordsContext.Provider value={filtered}>
          {logs === null ? (
            <div sx={UIProcessMoviesJob.styles.placeholder}>
              <Icon value='spinner' />
            </div>
          ) : filtered.length ? (
            <div sx={UIProcessMoviesJob.styles.records}>
              <SensorrSingleton setToggle={fn => toggleSensorr.current = fn} />
              <ResponsiveVirtualGrid
                scrollContainer={ref.current}
                total={filtered.length}
                viewportRowOffset={8}
                cell={{ height: device === 'mobile' ? 800 : 512 }}
                child={RecordData}
                useChildProps={(key) => ({
                  key: (filtered[key.split('-').shift()] as any).movie?.id,
                  metadata: (moviesMetadataContext[(filtered[key.split('-').shift()] as any).movie?.id] || {}),
                })}
                childProps={{
                  job: job.job,
                  command: job.meta.command,
                  setMovieMetadata,
                  toggleSensorr: (e, movie) => toggleSensorr.current(e, movie),
                }}
              />
            </div>
          ) : job.meta.done ? (
            <Warning emoji={job.meta.error ? '💢' : '🍿'} title={job.meta.error ? 'Error': 'Empty'} subtitle={job.meta.error?.message || job.meta.error || 'No recorded movies during this job'} />
          ) : (
            <Warning emoji='⏳' title='Loading' subtitle='Waiting first record...' />
          )}
        </RecordsContext.Provider>
      </div>
    </div>
  )
}

UIProcessMoviesJob.styles = {
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
  records: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
}

export const ProcessMoviesJob = memo(UIProcessMoviesJob)

const UIRecord = ({ command, job, group, movie, logs: summaryLogs, release, treated, choice, metadata, setMovieMetadata, toggleSensorr, done, error, ...props }) => {
  const api = useAPI()
  const [logs, setLogs] = useState(null)
  const mobile = useResponsiveValue([true, false])

  const [optimistic, setOptimistic] = useState({ treated, choice })

  const proceed = useCallback(({ treated: _treated, choice: _choice, ...release }, choice) => {
    setOptimistic({ treated: true, choice })
    setMovieMetadata(movie?.id, 'proposal', choice)
  }, [movie?.id, setMovieMetadata])

  useEffect(() => {
    setOptimistic({ treated, choice })
  }, [treated])

  useEffect(() => {
    setLogs(null)

    if (job === 'anonymous' || !done) {
      return
    }

    const controller = new AbortController()

    const cb = async () => {
      const { uri, params, init } = api.query.logs.getJobGroupLogs({ init: { controller }, params: { job, group } })

      try {
        setLogs(await api.fetch(uri, params, init))
        // if not done should listen to eventSource and close when done
      } catch (e) {
        console.warn(e)
        setLogs([])
      }
    }

    cb()

    return () => controller.abort()
  }, [job, group, done])

  return (
    <div sx={UIRecord.styles.element}>
      <div sx={UIRecord.styles.record}>
        <div sx={UIRecord.styles.wrapper}>
          <div sx={UIRecord.styles.movie}>
            <Movie entity={movie || {}} />
            {mobile && (
              <div sx={UIRecord.styles.metadata}>
                <Metadata
                  entity={movie || {}}
                  metadata={metadata}
                  setMetadata={(key, value) => setMovieMetadata(movie?.id, key, value)}
                  help={false}
                />
              </div>
            )}
          </div>
          <div sx={UIRecord.styles.button}>
            <MovieActions
              ready={!!metadata?.state && metadata?.state !== 'loading'}
              entity={movie}
              metadata={metadata}
              toggleSensorr={(e) => toggleSensorr(e, movie)}
            />
          </div>
        </div>
        <div sx={UIRecord.styles.results}>
          {!mobile && (
            <Metadata
              entity={movie || {}}
              metadata={metadata}
              setMetadata={(key, value) => setMovieMetadata(movie?.id, key, value)}
              help={false}
            />
          )}
          {logs === null ? (
            <div sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon value='spinner' />
            </div>
          ) : (
            <>
              <RecordLogs
                logs={logs || summaryLogs}
                command={command}
                movie={movie}
                release={release}
                metadata={metadata}
                setMovieMetadata={setMovieMetadata}
              />
              {['refine', 'shrink'].includes(command) && movie?.releases?.map(release => (
                <div sx={UIRecord.styles.release} key={release.id}>
                  <Release entity={release} display='column' compact={true} />
                </div>
              ))}
              {done && (
                (release && !release?.hide) ? (
                  <div sx={UIRecord.styles.release}>
                    <Release
                      entity={{ from: command, job, ...release, ...optimistic }}
                      display='column'
                      proceed={proceed}
                      banned={(metadata?.banned_releases || []).includes(release?.title)}
                      ban={() => setMovieMetadata(
                        movie?.id,
                        'banned_releases',
                        (metadata?.banned_releases || []).includes(release?.title) ?
                          [...(metadata?.banned_releases || [])].filter(r => r !== release?.title) :
                          [...(metadata?.banned_releases || []), release?.title]
                      )}
                    />
                  </div>
                ) : (
                  <div sx={UIRecord.styles.release}>
                    <Release
                      entity={{ ...(release || {}), ...optimistic }}
                      display='column'
                      banned={(metadata?.banned_releases || []).includes(release?.title)}
                      ban={() => setMovieMetadata(
                        movie?.id,
                        'banned_releases',
                        (metadata?.banned_releases || []).includes(release?.title) ?
                          [...(metadata?.banned_releases || [])].filter(r => r !== release?.title) :
                          [...(metadata?.banned_releases || []), release?.title]
                      )}
                    />
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

UIRecord.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: ['50em', '32em'],
    maxHeight: ['50em', '32em'],
    paddingY: 0,
  },
  record: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['center', 'unset'],
    paddingY: 4,
    paddingX: [4, 0],
    backgroundColor: 'grayLighter',
    overflow: 'hidden',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: ['center', 'unset'],
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
    marginLeft: 4,
  },
  movie: {
    display: 'flex',
    flexDirection: 'row',
    maxWidth: '100%',
  },
  button: {
    display: 'flex',
    marginX: 4,
    marginTop: 0,
    marginBottom: [12, 4],
    fontSize: 6,
    zIndex: 1,
  },
  results: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    marginTop: [2, 12],
    overflow: 'hidden',
  },
  empty: {},
  release: {
    flexShrink: 0,
    '>div>div': {
      paddingX: 12,
      '>div': {
        paddingY: 4,
      },
    },
  },
}

const Record = memo(UIRecord)

const UIRecordLogs = ({ logs, command, movie, release, metadata, setMovieMetadata  }) => {
  const refAssignCallback = useCallback((ref) => {
    if (ref) {
      var element = ref
      var scrollHeight = element.scrollHeight
      var clientHeight = element.getBoundingClientRect().height
      element.scrolTop = (scrollHeight - clientHeight) / 2
    }
  }, [])

  return (
    <div sx={UIRecordLogs.styles.element} ref={refAssignCallback}>
      <div sx={UIRecordLogs.styles.container}>
        <div sx={UIRecordLogs.styles.logs}>
          {logs.map((log, index) => (
            <div key={index}>
              <RecordLog
                {...log}
                line={index + 1}
                expandable={(
                  (command === 'record' && !!log.meta?.movie?.query?.terms?.length) ||
                  (command === 'refine' && !!log.meta?.movie?.releases?.length) ||
                  (command === 'shrink' && !!log.meta?.movie?.releases?.length) ||
                  !!log.meta?.stats?.total ||
                  (!!log.meta?.release && (release?.valid || !release?.hide))
                )}
                forceOpen={(
                  (command === 'refine' && !!log.meta?.movie?.releases?.length) ||
                  (command === 'shrink' && !!log.meta?.movie?.releases?.length) ||
                  (!!log.meta?.release && (release?.valid || !release?.hide))
                )}
                children={() => (
                  <Fragment>
                    {['refine', 'shrink'].includes(command) && !!log.meta?.movie?.releases?.length && (log.meta?.movie?.releases || []).map((release, index) => (
                      <code key={index}>
                        <i></i>
                        <i>➤</i>
                        <span> {release.title} </span>
                        score={release.score}, size={filesize.stringify(release.size)}, job={release.from}#{release.job}
                      </code>
                    ))}
                    {command === 'record' && log.meta?.movie?.query?.terms?.length && (
                      <code>
                        <i></i>
                        <i>➤</i>
                        <span> Use query terms "{log.meta?.movie?.query?.terms.join('", "')}" and years "{log.meta?.movie?.query?.years.join('", "')}"</span>
                      </code>
                    )}
                    {!!log.meta?.stats?.total && (
                      <Fragment>
                        {!!log.meta?.stats?.matches?.length && (
                          <Fragment>
                            <code>
                              <i></i>
                              <i></i>
                              <i>➤</i>
                              <span> ⭐ <strong>{log.meta?.stats?.matches?.length}</strong> Releases matches</span>
                            </code>
                            {(log.meta?.stats?.matches || []).map(({ release, original, link, score, size, seeders }, index) => (
                              <code key={index}>
                                <i
                                  title={(metadata?.banned_releases || []).includes(release) ? 'Unban release' : 'Ban release'}
                                  sx={(metadata?.banned_releases || []).includes(release) ? { opacity: '1 !important' } : {}}
                                  onClick={() => setMovieMetadata(
                                    movie?.id,
                                    'banned_releases',
                                    (metadata?.banned_releases || []).includes(release) ?
                                      [...(metadata?.banned_releases || [])].filter(r => r !== release) :
                                      [...(metadata?.banned_releases || []), release]
                                  )}
                                >
                                  ⊘
                                </i>
                                <i title="Report release parsing issue">
                                  <a target='_blank' rel='norefer noopener' href={reportOleoo({ generated: release, original })} sx={{ variant: 'link.reset', fontFamily: 'monospace-no-emoji' }}>⚠</a>
                                </i>
                                <i></i>
                                <i>➤</i>
                                <a href={link} target='_blank' rel='norefer noopener' sx={{ variant: 'link.reset' }}> {release}</a>
                                <span> score={score}, size={filesize.stringify(size)}, seeders={seeders}</span>
                              </code>
                            ))}
                          </Fragment>
                        )}
                        {!!log.meta?.stats?.withdrawn?.length && (
                          <Fragment>
                            <code><i></i><i></i><i>➤</i> <span>🚨 <strong>{log.meta?.stats?.withdrawn?.length}</strong> Releases withdrawn by policy</span></code>
                            {(log.meta?.stats?.withdrawn || []).map(({ release, original, reason, link, score, size, seeders }, index) => (
                              <code key={index}>
                                <i
                                  title={(metadata?.banned_releases || []).includes(release) ? 'Unban release' : 'Ban release'}
                                  sx={(metadata?.banned_releases || []).includes(release) ? { opacity: '1 !important' } : {}}
                                  onClick={() => setMovieMetadata(
                                    movie?.id,
                                    'banned_releases',
                                    (metadata?.banned_releases || []).includes(release) ?
                                      [...(metadata?.banned_releases || [])].filter(r => r !== release) :
                                      [...(metadata?.banned_releases || []), release]
                                  )}
                                >
                                  ⊘
                                </i>
                                <i title="Report release parsing issue">
                                  <a target='_blank' rel='norefer noopener' href={reportOleoo({ generated: release, original })} sx={{ variant: 'link.reset', fontFamily: 'monospace-no-emoji' }}>⚠</a>
                                </i>
                                <i></i>
                                <i>➤</i>
                                <a href={link} target='_blank' rel='norefer noopener' sx={{ variant: 'link.reset' }}> {release}</a>
                                <span> {reason}, score={score}, size={filesize.stringify(size)}, seeders={seeders}</span>
                              </code>
                            ))}
                          </Fragment>
                        )}
                        {!!log.meta?.stats?.ignored?.length && (
                          <Fragment>
                            <code><i></i><i></i><i>➤</i> <span>🗑️  <strong>{log.meta?.stats?.ignored?.length}</strong> Releases ignored</span></code>
                            {(log.meta?.stats?.ignored || []).map(({ release, original, reason, link, score, size, seeders }, index) => (
                              <code key={index}>
                                <i
                                  title={(metadata?.banned_releases || []).includes(release) ? 'Unban release' : 'Ban release'}
                                  sx={(metadata?.banned_releases || []).includes(release) ? { opacity: '1 !important' } : {}}
                                  onClick={() => setMovieMetadata(
                                    movie?.id,
                                    'banned_releases',
                                    (metadata?.banned_releases || []).includes(release) ?
                                      [...(metadata?.banned_releases || [])].filter(r => r !== release) :
                                      [...(metadata?.banned_releases || []), release]
                                  )}
                                >
                                  ⊘
                                </i>
                                <i title="Report release parsing issue">
                                  <a target='_blank' rel='norefer noopener' href={reportOleoo({ generated: release, original })} sx={{ variant: 'link.reset', fontFamily: 'monospace-no-emoji' }}>⚠</a>
                                </i>
                                <i></i>
                                <i>➤</i>
                                <a href={link} target='_blank' rel='norefer noopener' sx={{ variant: 'link.reset' }}> {release}</a>
                                <span> {reason}, score={score}, size={filesize.stringify(size)}, seeders={seeders}</span>
                              </code>
                            ))}
                          </Fragment>
                        )}
                      </Fragment>
                    )}
                    {!!log.meta?.release && (
                      release?.valid ? (
                        <code><i></i><i>➤</i> <span>{release?.title}</span>score={release?.score}, size={filesize.stringify(release?.size)}, seeders={release?.seeders}</code>
                      ) : !release?.hide ? (
                        <code><i></i><i>➤</i> <span>{release?.title}</span>{release?.reason ? `${release?.reason}, ` : ''}score={release?.score}, size={filesize.stringify(release?.size)}, seeders={release?.seeders}</code>
                      ) : null
                    )}
                  </Fragment>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

UIRecordLogs.styles = {
  element: {
    display: 'flex',
    paddingY: 6,
    borderTop: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    overflowY: 'scroll',
  },
  logs: {
    margin: 12,
    paddingX: 12,
    display: 'inline-block',
    whiteSpace: 'nowrap',
    minWidth: '100%',
  },
}

const RecordLogs = memo(UIRecordLogs)

const MetadataSingleton = ({ setToggle, ...props }) => {
  const [entity, setEntity] = useState(null)
  const { loading, metadata: { [entity?.id]: _metadata = {} }, setMovieMetadata, enhanceMovieMetadata } = useMoviesMetadataContext() as any
  const metadata = useMemo(() => enhanceMovieMetadata(entity, _metadata), [entity?.id, _metadata])
  const setMetadata = useCallback((key, value) => setMovieMetadata(entity?.id, key, value), [entity?.id])

  return (
    <Metadata
      entity={entity || {}}
      metadata={metadata}
      setMetadata={setMetadata}
      loading={loading}
      // components={{
      //   toggle: ({ toggleOpen }) => {
      //     setToggle((e, entity) => {
      //       setEntity(entity)
      //       toggleOpen(e)
      //     })

      //     return null
      //   }
      // }}
    />
  )
}

const SensorrSingleton = ({ setToggle, ...props }) => {
  const [entity, setEntity] = useState(null)
  const { loading, metadata: { [entity?.id]: _metadata = {} }, enhanceMovieMetadata } = useMoviesMetadataContext() as any
  const metadata = useMemo(() => enhanceMovieMetadata(entity, _metadata), [entity?.id, _metadata])

  return (
    <Sensorr
      entity={entity || {}}
      loading={loading}
      metadata={metadata}
      setPortalToggle={(toggleOpen) => {
        setToggle((e, entity) => {
          setEntity(entity)
          toggleOpen(e)
        })
      }}
    />
  )
}

const RecordLog = ({ line, message, meta = {}, children = null, timestamp = null, expandable = false, forceOpen = false, ...props }) => {
  const [open, setOpen] = useState(false)

  return (
    <details
      open={forceOpen || open}
      onToggle={() => setOpen(open => !open)}
      data-disabled={!expandable}
      sx={RecordLog.styles.element}
    >
      <summary>
        <code>
          <i>{`${line}`.padStart(2, '0')}</i>
          <span>
            <b sx={{ color: (meta as any)?.important ? 'text' : 'grayDarkest' }}>{message}</b>
          </span>
          {timestamp && <time>{new Date(timestamp).toLocaleString()}</time>}
        </code>
      </summary>
      {expandable && open && children && children()}
    </details>
  )
}

RecordLog.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    color: '#484848',
    fontFamily: 'monospace',
    fontSize: 6,
    lineHeight: '1.75',
    'code': {
      display: 'flex',
      alignItems: 'center',
      paddingX: 6,
      whiteSpace: 'nowrap',
      cursor: 'default',
      '>i': {
        flexShrink: 0,
        width: '1.5em',
        paddingX: 8,
        fontStyle: 'normal',
        textAlign: 'right',
      },
      '>span': {
        color: 'grayDarker',
        marginX: 4,
        '>b': {
          fontWeight: 'normal',
        },
      },
    },
    '>summary': {
      paddingLeft: 6,
      opacity: 0.75,
      cursor: 'pointer',
      transition: 'all ease 100ms',
      '&:hover': {
        backgroundColor: 'gray',
        opacity: 1,
      },
      '>code': {
        display: 'inline-flex',
        paddingLeft: 12,
        cursor: 'inherit',
      },
    },
    '>code': {
      opacity: 0.75,
      transition: 'all ease 100ms',
      '>i': {
        width: '1em',
        transition: 'opacity ease 100ms',
        '>*': {
          display: 'block',
        },
        '&:not(:last-of-type)': {
          opacity: 0,
          fontSize: 1,
          lineHeight: 'reset',
          padding: 12,
          cursor: 'pointer',
        },
      },
      '&:hover': {
        backgroundColor: 'gray',
        opacity: 1,
        '>i': {
          opacity: 1,
        },
      },
    },
    '&[data-disabled="true"]': {
      '>summary': {
        cursor: 'default',
        listStyle: 'none',
        paddingLeft: 'calc(10px + 0.75em)',
        '&::marker': {
          display: 'none',
        },
      },
    },
  },
}
