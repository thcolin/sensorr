import { memo, useMemo } from 'react'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { jobNameOf } from '@sensorr/sensorr'
import { formatDuration, intervalToDuration } from 'date-fns'
import Show from '../../../components/Show/Show'
import { Summary } from '../Summary'
import { Warnings } from '../Warnings'

export const summaryRefreshShows = ({ due = 0, show }, extended = true) => [
  ...(extended ? [{
    key: 'due',
    emoji: '🗄️',
    title: <span><strong>{due}</strong> Shows due for a refresh</span>,
    length: due,
  }] : []),
  {
    key: 'show',
    emoji: '📺',
    title: <span><strong>{show?.success || 0}</strong> Applied show changes</span>,
    length: show?.success || 0,
  },
  ...(show?.episodes > 0 ? [{
    key: 'episodes',
    emoji: '🆕',
    title: <span><strong>{show.episodes}</strong> New episodes</span>,
    length: show.episodes,
  }] : []),
  ...(show?.warning > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{show.warning}</strong> Shows not refreshed</span>,
    length: show.warning,
  }] : []),
]

export const summarySyncShows = ({ shows = 0, plex, corrections, missings }, extended = true) => [
  ...(extended ? [{
    key: 'shows',
    emoji: '🗄️',
    title: <span><strong>{shows}</strong> Shows in Sensorr library</span>,
    length: shows,
  }] : []),
  ...(extended ? [{
    key: 'plex',
    emoji: '📡',
    title: <span><strong>{plex?.shows || 0}</strong> Shows and <strong>{plex?.episodes || 0}</strong> episodes available on Plex server</span>,
    length: plex?.shows || 0,
  }] : []),
  {
    key: 'corrections',
    emoji: '🩹',
    title: <span><strong>{corrections?.success || 0}</strong> Fixed shows with Plex metadata</span>,
    length: corrections?.success || 0,
  },
  ...(missings?.success > 0 ? [{
    key: 'missings',
    emoji: '💊',
    title: <span><strong>{missings.success}</strong> Episodes no longer on Plex</span>,
    length: missings.success,
  }] : []),
  ...(((corrections?.warning || 0) + (missings?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{(corrections?.warning || 0) + (missings?.warning || 0)}</strong> Shows not fixed</span>,
    length: (corrections?.warning || 0) + (missings?.warning || 0),
  }] : []),
]

export const summaryImportShows = ({ shows = 0, releases = 0, imports }, extended = true) => [
  ...(extended ? [{
    key: 'releases',
    emoji: '🗄️',
    title: <span><strong>{releases}</strong> Releases of <strong>{shows}</strong> shows waiting for an import</span>,
    length: releases,
  }] : []),
  {
    key: 'imports',
    emoji: '📥',
    title: <span><strong>{imports?.success || 0}</strong> Imported show releases</span>,
    length: imports?.success || 0,
  },
  ...(extended && imports?.links > 0 ? [{
    key: 'links',
    emoji: '🔗',
    title: <span><strong>{imports.links}</strong> Files linked into the library</span>,
    length: imports.links,
  }] : []),
  ...(imports?.pending > 0 ? [{
    key: 'pending',
    emoji: '⏳',
    title: <span><strong>{imports.pending}</strong> Releases still downloading</span>,
    length: imports.pending,
  }] : []),
  ...(imports?.warning > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <span><strong>{imports.warning}</strong> Releases not imported</span>,
    length: imports.warning,
  }] : []),
]

const newest = (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()

const showsOf = (logs, test) => logs
  .filter(test)
  .sort(newest)
  .map(({ meta }) => meta.show || meta.entity)
  .filter((show, index, shows) => shows.findIndex(({ id }) => id === show.id) === index)

// Keyed by `jobNameOf`
const COMMANDS = {
  'refresh shows': {
    emoji: '🔌',
    summary: summaryRefreshShows,
    live: (sections, summary) => ({ show: { ...summary.show, success: sections.refreshed.length } }),
    warnings: (log) => log.level === 'warn',
    sections: [
      { key: 'refreshed', label: emojize('📺', 'Shows'), test: (log) => log.level === 'info' && log.meta.type === 'show' && log.meta.entity },
    ],
    empty: 'No changes applied during this job',
  },
  'sync shows': {
    emoji: '🔗',
    summary: summarySyncShows,
    live: (sections, summary) => ({
      corrections: { ...summary.corrections, success: sections.corrections.length },
      missings: { ...summary.missings, success: sections.missings.reduce((sum, show) => sum + (show.missing || 0), 0) },
    }),
    // A show whose episodes left Plex is logged as a warning too, with its count
    warnings: (log) => log.level === 'warn' && typeof log.meta.missing !== 'number',
    sections: [
      { key: 'missings', label: emojize('💊', 'Missing episodes'), test: (log) => log.meta.group === 'missings' && log.meta.show && typeof log.meta.missing === 'number' },
      { key: 'corrections', label: emojize('🩹', 'Fixed'), test: (log) => log.level === 'info' && log.meta.group === 'corrections' && log.meta.show },
    ],
    empty: 'No fixed shows during this job',
  },
  'import shows': {
    emoji: '📥',
    summary: summaryImportShows,
    live: (sections, summary) => ({ imports: { ...summary.imports, success: sections.imported.length } }),
    warnings: (log) => log.level === 'warn',
    sections: [
      { key: 'imported', label: emojize('📥', 'Imported'), test: (log) => log.level === 'info' && log.meta.show && typeof log.meta.links === 'number' },
    ],
    empty: 'No imported releases during this job',
  },
}

const UIShowsJob = ({ job, logs }) => {
  const command = COMMANDS[jobNameOf(job.meta)]
  const warnings = useMemo(() => [...(logs || [])].filter(command.warnings).sort(newest), [logs, command])
  const sections = useMemo(() => command.sections.reduce((acc, { key, test }) => ({
    ...acc,
    [key]: key === 'missings'
      ? (logs || []).filter(test).sort(newest).map(({ meta }) => ({ ...meta.show, missing: meta.missing }))
      : showsOf(logs || [], test),
  }), {}), [logs, command])
  const empty = !warnings.length && command.sections.every(({ key }) => !sections[key].length)

  return (
    <div sx={UIShowsJob.styles.element}>
      <div>
        <Warning
          emoji={command.emoji}
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIShowsJob.styles.title}>{jobNameOf(job.meta)}</span>
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIShowsJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIShowsJob.styles.subtitle}>{formatDuration(intervalToDuration({ start: new Date(job.start), end: new Date(job.end) }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')}</strong>
                </>
              )}
            </>
          )}
          children={(
            <span sx={UIShowsJob.styles.summary}>
              <Summary
                error={job.meta.error}
                meta={command.summary({
                  ...job.meta.summary,
                  ...(job.meta.done ? {} : command.live(sections, job.meta.summary)),
                })}
              />
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
      <div sx={UIShowsJob.styles.content}>
        {logs === null ? (
          <div sx={UIShowsJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : !empty ? (
          <div sx={UIShowsJob.styles.entities}>
            <Warnings logs={warnings} />
            {command.sections.map(({ key, label }) => (
              <Entities
                key={key}
                id={`${job.meta.command}-${key}-${job.job}`}
                entities={sections[key]}
                length={sections[key].length}
                label={label}
                display='grid'
                hide={true}
                child={Show as any}
              />
            ))}
          </div>
        ) : job.meta.done ? (
          <Warning
            emoji={job.meta.error ? '💢' : '🗄️'}
            title={job.meta.error ? 'Error': 'Empty'}
            subtitle={job.meta.error?.message || job.meta.error || command.empty}
          />
        ) : (
          <Warning emoji='⏳' title='Loading' subtitle='Waiting for shows...' />
        )}
      </div>
    </div>
  )
}

UIShowsJob.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflowX: 'hidden',
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

export const ShowsJob = memo(UIShowsJob)
