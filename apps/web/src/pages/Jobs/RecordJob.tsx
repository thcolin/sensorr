import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, Warning } from '@sensorr/ui'
import { filesize } from '@sensorr/utils'
import Tippy from '@tippyjs/react'
import * as oleoo from 'oleoo'
import ghReport from 'new-github-issue-url'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import Movie from '../../components/Movie/Movie'
import { Sensorr } from '../../components/Sensorr'
import { Metadata } from '../Details/components/Metadata'

const oleooReport = ({ generated = '', original = '' }) => {
  return ghReport({
    user: 'thcolin',
    repo: 'oleoo',
    labels: ['sensorr'],
    title: `Sensorr release parsing issue`,
    body: (
      'Sensorr release parsing issue:' + '\n\n' +
      '<!-- Please fill /* Expected */ section -->' + '\n\n' +
      'Original: `' + original + '`' + '\n' +
      'Generated: `' + generated + '`' + '\n\n' +
      '```\n/* Parsed */\n' + JSON.stringify(
        oleoo.parse(original, {
          strict: false,
          flagged: true,
          defaults: {
            language: 'ENGLISH',
            resolution: 'SD',
            year: 0,
          },
        }),
        null, 2
      ) + '\n```' + '\n\n' +
      '```\n/* Expected */\n' + JSON.stringify(
        oleoo.parse(original, {
          strict: false,
          flagged: true,
          defaults: {
            language: 'ENGLISH',
            resolution: 'SD',
            year: 0,
          },
        }),
        null, 2
      ) + '\n```'
    ),
  })
}

export const RecordJobSummary = ({ meta, ...props }) => (
  <Fragment>
    {typeof meta.total_results === 'number' && (
      <Tippy content={<code>🍿 <span><strong>{meta.total_results}</strong> Wished movies</span></code>}>
        <span>🍿 {meta.total_results}</span>
      </Tippy>
    )}
    {typeof meta.recorded === 'number' && (
      <Tippy content={<code>📼 <span><strong>{meta.recorded}</strong> Recorded movies</span></code>}>
        <span>📼 {meta.recorded}</span>
      </Tippy>
    )}
    {typeof meta.dropped === 'number' && (
      <Tippy content={<code>🚨 <span><strong>{meta.dropped}</strong> Dropped movies releases</span></code>}>
        <span>🚨 {meta.dropped}</span>
      </Tippy>
    )}
    {typeof meta.mismatch === 'number' && (
      <Tippy content={<code>💩 <span><strong>{meta.mismatch}</strong> Mismatch movies releases</span></code>}>
        <span>💩 {meta.mismatch}</span>
      </Tippy>
    )}
    {typeof meta.missing === 'number' && (
      <Tippy content={<code>📭 <span><strong>{meta.missing}</strong> Missing movies releases</span></code>}>
        <span>📭 {meta.missing}</span>
      </Tippy>
    )}
    {typeof meta.disturbed === 'number' && (
      <Tippy content={<code>⚠️ <span><strong>{meta.disturbed}</strong> Disturbed during process</span></code>}>
        <span>⚠️ {meta.disturbed}</span>
      </Tippy>
    )}
  </Fragment>
)

const UIRecordJob = ({ job, logs }) => {
  const [filter, setFilter] = useState(null)
  const [znab, setZnab] = useState(null)
  const [sensorr, setSensorr] = useState(null)
  const toggleMetadata = useRef() as any

  const records = useMemo(() => Object.values((logs || []).reduce((groups, log) => !log.meta.group ? groups : {
    ...groups,
    [log.meta.group]: {
      group: log.meta.group,
      timestamp: groups[log.meta.group]?.timestamp || log.timestamp,
      movie: groups[log.meta.group]?.movie || log.meta.movie,
      release: groups[log.meta.group]?.release || log.meta.release,
      logs: [log, ...(groups[log.meta.group]?.logs || [])].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    },
  }, {})).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [logs])

  const znabs = useMemo(() => records.reduce((acc: any, curr: any) => curr?.release?.valid ? ({
    ...acc,
    [curr?.release?.znab]: (acc[curr?.release?.znab] || 0) + 1,
  }) : acc, {}), [records])

  const filtered = useMemo(() => records.filter((record: any) => (!filter || {
    recorded: record.release?.valid && (!znab || record.release?.znab === znab),
    dropped: !record.release?.valid && record?.release?.warning <= 10,
    mismatch: !record.release?.valid && record?.release?.warning > 10,
    missing: !record.release,
    disturbed: record.error,
  }[filter])), [filter, znab, records])

  useEffect(() => {
    setFilter(null)
  }, [job.job])

  return (
    <div sx={UIRecordJob.styles.element}>
      <div>
        <Warning
          emoji='📹'
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIRecordJob.styles.title}>{job.job}</span>
            </span>
          )}
          subtitle={(
            <span sx={UIRecordJob.styles.subtitle}>{job.meta.command} - {new Date(job.timestamp).toLocaleString()}</span>
          )}
          children={(
            <span>
              <span sx={UIRecordJob.styles.summary}>
                {typeof job.meta.total_results === 'number' && (
                  <Tippy content={<code>🍿 <span><strong>{job.meta.total_results}</strong> Wished movies</span></code>}>
                    <span onClick={() => setFilter(null)} sx={UIRecordJob.styles.meta}>🍿 {job.meta.done ? job.meta.total_results : `${records.length}/${job.meta.total_results}`}</span>
                  </Tippy>
                )}
                {typeof job.meta.recorded === 'number' && (
                  <Tippy content={<code>📼 <span><strong>{job.meta.recorded}</strong> Recorded movies</span></code>}>
                    <span onClick={() => setFilter(filter => filter === 'recorded' ? null : 'recorded')} sx={UIRecordJob.styles.meta} style={{ opacity: !filter || filter === 'recorded' ? 1 : 0.5 }}>📼 {job.meta.recorded}</span>
                  </Tippy>
                )}
                {typeof job.meta.dropped === 'number' && (
                  <Tippy content={<code>🚨 <span><strong>{job.meta.dropped}</strong> Dropped movies releases</span></code>}>
                    <span onClick={() => setFilter(filter => filter === 'dropped' ? null : 'dropped')} sx={UIRecordJob.styles.meta} style={{ opacity: !filter || filter === 'dropped' ? 1 : 0.5 }}>🚨 {job.meta.dropped}</span>
                  </Tippy>
                )}
                {typeof job.meta.mismatch === 'number' && (
                  <Tippy content={<code>💩 <span><strong>{job.meta.mismatch}</strong> Mismatch movies releases</span></code>}>
                    <span onClick={() => setFilter(filter => filter === 'mismatch' ? null : 'mismatch')} sx={UIRecordJob.styles.meta} style={{ opacity: !filter || filter === 'mismatch' ? 1 : 0.5 }}>💩 {job.meta.mismatch}</span>
                  </Tippy>
                )}
                {typeof job.meta.missing === 'number' && (
                  <Tippy content={<code>📭 <span><strong>{job.meta.missing}</strong> Missing movies releases</span></code>}>
                    <span onClick={() => setFilter(filter => filter === 'missing' ? null : 'missing')} sx={UIRecordJob.styles.meta} style={{ opacity: !filter || filter === 'missing' ? 1 : 0.5 }}>📭 {job.meta.missing}</span>
                  </Tippy>
                )}
                {typeof job.meta.disturbed === 'number' && (
                  <Tippy content={<code>⚠️ <span><strong>{job.meta.disturbed}</strong> Disturbed during process</span></code>}>
                    <span onClick={() => setFilter(filter => filter === 'disturbed' ? null : 'disturbed')} sx={UIRecordJob.styles.meta} style={{ opacity: !filter || filter === 'disturbed' ? 1 : 0.5 }}>⚠️ {job.meta.disturbed}</span>
                  </Tippy>
                )}
              </span>
              <span sx={UIRecordJob.styles.summary}>
                {Object.entries(znabs).map(([z, count]) => (
                  <span onClick={() => setZnab(znab => znab === z ? null : z)} sx={UIRecordJob.styles.link} style={{ opacity: !znab || znab === z ? 1 : 0.5 }}>{z} ({count})</span>
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
      <div sx={UIRecordJob.styles.content}>
        {logs === null ? (
          <div sx={UIRecordJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : filtered.length ? (
          <div sx={UIRecordJob.styles.records}>
            <MetadataSingleton setToggle={fn => toggleMetadata.current = fn} />
            {filtered.map((record: any) => (
              <Record
                key={record.movie?.id}
                {...record}
                toggleMetadata={(e, movie) => toggleMetadata.current(e, movie)}
                toggleSensorr={movie => setSensorr(movie)}
                sensorr={sensorr?.id === record.movie?.id}
                done={job.meta.done}
              />
            ))}
          </div>
        ) : (
          <Warning emoji='⏳' title='Loading' subtitle='Waiting first record...' />
        )}
      </div>
    </div>
  )
}

UIRecordJob.styles = {
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
    color: 'gray6',
    fontFamily: 'monospace',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  meta: {
    backgroundColor: 'gray2',
    marginRight: 8,
    color: 'text',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    borderRadius: '1em',
    whiteSpace: 'nowrap',
    paddingX: 5,
    paddingY: 9,
    cursor: 'pointer',
    transition: 'all ease 100ms',
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

export const RecordJob = memo(UIRecordJob)

const Record = ({ group, movie, logs, release, toggleMetadata, toggleSensorr, sensorr, done, ...props }) => (
  <div key={group} sx={Record.styles.element}>
    <div sx={Record.styles.record}>
      <div sx={Record.styles.movie}>
        <Movie entity={movie || {}} />
        <button onClick={(e) => toggleMetadata(e, movie)} disabled={!movie?.id}>
          Preferences
        </button>
        <button onClick={() => toggleSensorr(sensorr ? null : movie)} disabled={!movie?.id || !done} data-open={sensorr}>
          Reseek
        </button>
      </div>
      <div sx={Record.styles.releases}>
        <div sx={Record.styles.logs}>
          {logs.map((log, index) => (
            <div key={index}>
              <RecordLog line={index + 1} {...log}>
                {!!log.meta?.stats?.total && (
                  <Fragment>
                    {!!log.meta?.stats?.matches?.length && (
                      <Fragment>
                        <code><i></i><i></i><i>➤</i> <span>👍 <strong>{log.meta?.stats?.matches?.length}</strong> Releases matches</span></code>
                        {(log.meta?.stats?.matches || []).map(({ release, original }, index) => <code key={index}><i title="Ban release">⊘</i><i title="Report release parsing issue"><a target='_blank' rel='norefer noopener' href={oleooReport({ generated: release, original })} sx={{ variant: 'link.reset' }}>⚠</a></i><i></i><i>➤</i> <span>{release}</span></code>)}
                      </Fragment>
                    )}
                    {!!log.meta?.stats?.dropped?.length && (
                      <Fragment>
                        <code><i></i><i></i><i>➤</i> <span>🚨 <strong>{log.meta?.stats?.dropped?.length}</strong> Releases dropped by policy</span></code>
                        {(log.meta?.stats?.dropped || []).map(({ release, original, reason }, index) => <code key={index}><i title="Ban release">⊘</i><i title="Report release parsing issue"><a target='_blank' rel='norefer noopener' href={oleooReport({ generated: release, original })} sx={{ variant: 'link.reset' }}>⚠</a></i><i></i><i>➤</i> <span>{release}</span> {reason}</code>)}
                      </Fragment>
                    )}
                    {!!log.meta?.stats?.mismatch?.length && (
                      <Fragment>
                        <code><i></i><i></i><i>➤</i> <span>💩 <strong>{log.meta?.stats?.mismatch?.length}</strong> Releases mismatch</span></code>
                        {(log.meta?.stats?.mismatch || []).map(({ release, original, reason }, index) => <code key={index}><i title="Ban release">⊘</i><i title="Report release parsing issue"><a target='_blank' rel='norefer noopener' href={oleooReport({ generated: release, original })} sx={{ variant: 'link.reset' }}>⚠</a></i><i></i><i>➤</i> <span>{release}</span> {reason}</code>)}
                      </Fragment>
                    )}
                  </Fragment>
                )}
                {(index === logs.length - 1 && release?.valid) && (
                  <code><i></i><i>➤</i> <span><a href={release?.link} target='_blank' rel='norefer noopener' sx={UIRecordJob.styles.link}>{release?.znab}</a> - {filesize.stringify(release?.size)} - {release?.seeders}/{release?.peers} - "{release?.term}"</span></code>
                )}
                {(index === logs.length - 1 && !release?.valid && release?.reason) && (
                  <code><i></i><i>➤</i> <span>{release?.reason}</span></code>
                )}
              </RecordLog>
            </div>
          ))}
        </div>
      </div>
    </div>
    {sensorr && (
      <SensorrSingleton entity={movie} />
    )}
  </div>
)

Record.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 0,
  },
  record: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    paddingY: 4,
  },
  movie: {
    display: 'flex',
    flexDirection: 'column',
    marginRight: 4,
    '>*:first-child': {
      marginBottom: 2,
    },
    '>button': {
      variant: 'button.reset',
      backgroundColor: 'primary',
      marginTop: 6,
      paddingY: 9,
      fontSize: 5,
      color: '#FFF',
      border: '0.125em solid',
      borderColor: 'primary',
      borderRadius: '2em',
      fontFamily: 'body',
      fontWeight: 'semibold',
      lineHeight: 'normal',
      opacity: 0.5,
      transition: 'opacity ease 300ms',
      '&:disabled': {
        opacity: 0.25,
      },
      '&:not(:disabled):hover, &[data-open="true"]': {
        opacity: 1,
      },
    }
  },
  releases: {
    flex: 1,
    overflowY: 'scroll',
  },
  logs: {
    margin: 12,
    paddingY: 4,
    paddingX: 12,
    borderTop: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'gray2',
    display: 'inline-block',
    whiteSpace: 'nowrap',
    minWidth: '100%',
  },
}

const MetadataSingleton = ({ setToggle, ...props }) => {
  const [entity, setEntity] = useState(null)
  const { loading, metadata: { [entity?.id]: metadata = {} }, setMovieMetadata } = useMoviesMetadataContext() as any
  const setMetadata = useCallback((key, value) => setMovieMetadata(entity?.id, key, value), [entity?.id])

  return (
    <Metadata
      entity={entity || {}}
      metadata={metadata}
      onChange={setMetadata}
      loading={loading}
      components={{
        toggle: ({ toggleOpen }) => {
          setToggle((e, entity) => {
            setEntity(entity)
            toggleOpen(e)
          })

          return null
        }
      }}
    />
  )
}

const SensorrSingleton = ({ entity }) => {
  const { loading, metadata: { [entity?.id]: metadata = {} } } = useMoviesMetadataContext() as any

  return (
    <div sx={{ marginTop: 6, marginBottom: 0, 'nav': { position: 'relative', top: 'unset' }}}>
      <Sensorr
        entity={entity}
        metadata={metadata}
        ready={!loading}
      />
    </div>
  )
}

const RecordLog = ({ line, message, children = null, timestamp = null, ...props }) => {
  const disabled = !children.filter(child => !!child).length
  const [open, setOpen] = useState(false)

  return (
    <details open={open} onToggle={() => setOpen(open => !open)} data-disabled={disabled} sx={RecordLog.styles.element}>
      <summary>
        <code>
          <i>{`${line}`.padStart(2, '0')}</i>
          <span>{message}</span>
          {timestamp && <time>{new Date(timestamp).toLocaleString()}</time>}
        </code>
      </summary>
      {!disabled && children}
    </details>
  )
}

RecordLog.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    color: 'gray4',
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
        color: 'gray6',
        marginX: 4,
      },
    },
    '>summary': {
      paddingLeft: 6,
      opacity: 0.75,
      cursor: 'pointer',
      transition: 'all ease 100ms',
      '&:hover': {
        backgroundColor: 'muted',
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
        backgroundColor: 'muted',
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
