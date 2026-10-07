import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Entities, Icon, Progress, Show as UIShow, TransitionPill, Warning } from '@sensorr/ui'
import { compose, emojize, filesize } from '@sensorr/utils'
import i18n from '@sensorr/i18n'
import { jobNameOf } from '@sensorr/sensorr'
import { JobName } from '../../../components/Sensorr/JobName'
import { JobState } from '../../../components/Sensorr/JobState'
import Show, { FOOTER_HEIGHT } from '../../../components/Show/Show'
import { withShowProgress } from '../../../components/Show/withShowProgress'
import { withShowMetadataContext } from '../../../contexts/ShowsMetadata/ShowsMetadata'
import { withMovieGuestsContext } from '../../../contexts/Guests/Guests'
import { Summary, freed, sideOf, durationOf } from '../Summary'
import { Warnings } from '../Warnings'

export const summaryRefreshShows = ({ due = 0, show }, extended = true) => [
  ...(extended ? [{
    key: 'due',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.shows.refresh.summary.due' values={{ count: due }} components={[<strong />]} />,
    length: due,
  }] : []),
  {
    key: 'show',
    emoji: '📺',
    title: <Trans i18nKey='jobs.shows.refresh.summary.show' values={{ count: show?.success || 0 }} components={[<strong />]} />,
    length: show?.success || 0,
  },
  ...(show?.episodes > 0 ? [{
    key: 'episodes',
    emoji: '🆕',
    title: <Trans i18nKey='jobs.shows.refresh.summary.episodes' values={{ count: show.episodes }} components={[<strong />]} />,
    length: show.episodes,
  }] : []),
  ...(show?.warning > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.shows.refresh.summary.warning' values={{ count: show.warning }} components={[<strong />]} />,
    length: show.warning,
  }] : []),
]

export const summarySyncShows = ({ shows = 0, plex, corrections, cleanups, missings, created = 0, withdrawals = 0, read = 0, unmatched = 0 }, extended = true) => [
  ...(extended ? [{
    key: 'shows',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.shows.sync.summary.shows' values={{ count: shows }} components={[<strong />]} />,
    length: shows,
  }] : []),
  ...(extended ? [{
    key: 'plex',
    emoji: '📡',
    title: <Trans i18nKey='jobs.shows.sync.summary.plex' values={{ shows: plex?.shows || 0, episodes: plex?.episodes || 0 }} components={[<strong />, <strong />]} />,
    length: plex?.shows || 0,
  }] : []),
  {
    key: 'corrections',
    emoji: '🩹',
    title: <Trans i18nKey='jobs.shows.sync.summary.corrections' values={{ count: corrections?.success || 0 }} components={[<strong />]} />,
    length: corrections?.success || 0,
  },
  ...(created > 0 ? [{
    key: 'created',
    emoji: '🆕',
    title: <Trans i18nKey='jobs.shows.sync.summary.created' values={{ count: created }} components={[<strong />]} />,
    length: created,
  }] : []),
  ...(withdrawals > 0 ? [{
    key: 'withdrawals',
    emoji: '🗑️',
    title: <Trans i18nKey='jobs.shows.sync.summary.withdrawals' values={{ count: withdrawals }} components={[<strong />]} />,
    length: withdrawals,
  }] : []),
  ...(cleanups?.success > 0 ? [{
    key: 'cleanups',
    emoji: '🧹',
    title: <Trans i18nKey='jobs.shows.sync.summary.cleanups' values={{ count: cleanups.success }} components={[<strong />]} />,
    length: cleanups.success,
  }] : []),
  ...((cleanups?.success > 0 && typeof cleanups?.deleted === 'number' && typeof cleanups?.arrived === 'number') ? [{
    key: 'space',
    emoji: cleanups.arrived > cleanups.deleted ? '📈' : '📉',
    title: <Trans i18nKey='jobs.space.cleanups' values={{ size: freed(cleanups.arrived - cleanups.deleted), side: sideOf(cleanups.arrived - cleanups.deleted), deleted: filesize.stringify(cleanups.deleted), arrived: filesize.stringify(cleanups.arrived) }} components={[<strong />]} />,
    length: freed(cleanups.arrived - cleanups.deleted),
  }] : []),
  ...(missings?.success > 0 ? [{
    key: 'missings',
    emoji: '💊',
    title: <Trans i18nKey='jobs.shows.sync.summary.missings' values={{ count: missings.success }} components={[<strong />]} />,
    length: missings.success,
  }] : []),
  ...(extended && read > 0 ? [{
    key: 'read',
    emoji: '🔍',
    title: <Trans i18nKey='jobs.shows.sync.summary.read' values={{ count: read }} components={[<strong />]} />,
    length: read,
  }] : []),
  ...(extended && unmatched > 0 ? [{
    key: 'unmatched',
    emoji: '❓',
    title: <Trans i18nKey='jobs.shows.sync.summary.unmatched' values={{ count: unmatched }} components={[<strong />]} />,
    length: unmatched,
  }] : []),
  ...(((corrections?.warning || 0) + (missings?.warning || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.shows.sync.summary.warning' values={{ count: (corrections?.warning || 0) + (missings?.warning || 0) }} components={[<strong />]} />,
    length: (corrections?.warning || 0) + (missings?.warning || 0),
  }] : []),
]

export const summaryImportShows = ({ shows = 0, releases = 0, imports }, extended = true) => [
  ...(extended ? [{
    key: 'releases',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.shows.import.summary.releases' values={{ releases, shows }} components={[<strong />, <strong />]} />,
    length: releases,
  }] : []),
  {
    key: 'imports',
    emoji: '📥',
    title: <Trans i18nKey='jobs.shows.import.summary.imports' values={{ count: imports?.success || 0 }} components={[<strong />]} />,
    length: imports?.success || 0,
  },
  ...(extended && imports?.links > 0 ? [{
    key: 'links',
    emoji: '🔗',
    title: <Trans i18nKey='jobs.shows.import.summary.links' values={{ count: imports.links }} components={[<strong />]} />,
    length: imports.links,
  }] : []),
  ...(imports?.pending > 0 ? [{
    key: 'pending',
    emoji: '⏳',
    title: <Trans i18nKey={imports.downloading?.length ? 'jobs.shows.import.summary.pendingOf' : 'jobs.shows.import.summary.pending'} values={{ count: imports.pending, releases: imports.downloading?.join(', ') }} components={[<strong />]} />,
    length: imports.pending,
  }] : []),
  ...(imports?.warning > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.shows.import.summary.warning' values={{ count: imports.warning }} components={[<strong />]} />,
    length: imports.warning,
  }] : []),
]

// `shows` is the count object the CLI logs once done, `migrated` the live count while it runs
export const summaryMigrateSonarr = ({ sonarr = 0, shows = {} as any, migrated = undefined }, extended = true) => [
  ...(extended ? [{
    key: 'sonarr',
    emoji: '🗄️',
    title: <Trans i18nKey='jobs.shows.migrateSonarr.summary.sonarr' values={{ count: sonarr }} components={[<strong />]} />,
    length: sonarr,
  }] : []),
  {
    key: 'migrated',
    emoji: '🚚',
    title: <Trans i18nKey='jobs.shows.migrateSonarr.summary.migrated' values={{ count: migrated ?? ((shows.wished || 0) + (shows.archived || 0)), wished: shows.wished || 0, archived: shows.archived || 0 }} components={[<strong />, <strong />, <strong />]} />,
    length: migrated ?? ((shows.wished || 0) + (shows.archived || 0)),
  },
  // `skipped`, series without monitoring nor file, only exists in the logs of runs before they were migrated too
  ...(extended && ((shows.known || 0) + (shows.skipped || 0) + (shows.untracked || 0)) > 0 ? [{
    key: 'skipped',
    emoji: '🗑️ ',
    title: <Trans i18nKey={shows.skipped ? 'jobs.shows.migrateSonarr.summary.skippedUnmonitored' : 'jobs.shows.migrateSonarr.summary.skipped'} values={{ count: (shows.known || 0) + (shows.skipped || 0) + (shows.untracked || 0), known: shows.known || 0, skipped: shows.skipped, untracked: shows.untracked || 0 }} components={[<strong />, <strong />, <strong />, <strong />]} />,
    length: (shows.known || 0) + (shows.skipped || 0) + (shows.untracked || 0),
  }] : []),
  ...(((shows.warning || 0) + (shows.unmatched || 0)) > 0 ? [{
    key: 'warning',
    emoji: '⚠️',
    title: <Trans i18nKey='jobs.shows.migrateSonarr.summary.warning' values={{ count: shows.warning || 0, unmatched: shows.unmatched || 0 }} components={[<strong />, <strong />]} />,
    length: (shows.warning || 0) + (shows.unmatched || 0),
  }] : []),
]

const newest = (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()

const UINotedShow = ({ entity, ...props }) => {
  const { t } = useTranslation()
  const note = entity.note ?? emojize('💊', t('jobs.shows.episodes', { count: entity.missing }))

  return (
    <div sx={UINotedShow.styles.element}>
      <Show entity={entity} {...props} />
      <code title={entity.details || note}>{note}</code>
    </div>
  )
}

UINotedShow.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    // `width: 0` keeps a long line from widening the card, `minWidth` gives it the card's width back
    '>code': {
      width: 0,
      minWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    },
  },
}

const NotedShow = memo(UINotedShow)

// The show's name already titles the card: a release title is read from its season on
const fromSeason = (title: string) => title.replace(/^.*?(?=\bS\d{2})/i, '')

// The footer of a library card, its pill and its bar, counting the downloaded files instead of the owned episodes
const UIDownloadingShow = ({ entity, ...props }) => {
  const staged = entity.waiting.reduce((sum, { staged }) => sum + staged, 0)
  const files = entity.waiting.reduce((sum, { files }) => sum + files, 0)
  const partial = entity.waiting.reduce((sum, { partial = 0 }) => sum + partial, 0)
  const title = [
    i18n.t('jobs.shows.downloading', { staged, files, partial }),
    filesize.stringify(entity.waiting.reduce((sum, { size }) => sum + (size || 0), 0)),
    ...entity.waiting.map(({ title }) => title),
  ].join(' · ')

  return (
    <Show
      entity={entity}
      {...props}
      footer={(
        <span sx={UIDownloadingShow.styles.footer}>
          <span sx={UIDownloadingShow.styles.pill}>
            <TransitionPill from={staged} to={files} state='downloading' compact={true} title={title} />
          </span>
          <Progress value={staged} max={files} tint='warning' segments={entity.waiting.map(({ staged, files }) => ({ value: staged, max: files }))} title={title} />
        </span>
      )}
    />
  )
}

UIDownloadingShow.styles = {
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    '>progress, >[role="progressbar"]': {
      flex: 1,
    },
  },
  pill: {
    display: 'flex',
    fontSize: [5, 4],
  },
}

const DownloadingShow = memo(UIDownloadingShow)

const showsOf = (logs, test) => logs
  .filter(test)
  .sort(newest)
  .map(({ meta }) => meta.show || meta.entity)
  .filter((show, index, shows) => shows.findIndex(({ id }) => id === show.id) === index)


// Read left to right, the Plex episodes TMDB knows in gray, then the ones it does not know in blue. The bar draws each
// season the same way, its known episodes then its unknown ones right after
const UIUnmatchedShow = ({ entity, ...props }) => {
  const progress = entity.progress
  const seasons = useMemo(() => {
    if (!progress) {
      return []
    }

    const unknown = entity.unmatched.reduce((acc, label) => {
      const season = Number(/^S(\d+)/i.exec(label)?.[1])
      return { ...acc, [season]: (acc[season] || 0) + 1 }
    }, {})
    const numbers = [...new Set([...progress.seasons.map(({ season_number }) => season_number), ...Object.keys(unknown).map(Number)])].sort((a, b) => a - b)
    return numbers.flatMap((season) => [
      { value: 0, max: progress.seasons.find(({ season_number }) => season_number === season)?.owned || 0 },
      { value: unknown[season] || 0, max: unknown[season] || 0 },
    ])
  }, [progress, entity.unmatched])
  const title = progress ? i18n.t('jobs.shows.known', { owned: progress.owned, count: entity.unmatched.length, episodes: entity.unmatched.join(', ') }) : null

  return (
    <UIShow
      entity={entity}
      {...props}
      footer={progress && (
        <span sx={UIDownloadingShow.styles.footer}>
          <span sx={UIDownloadingShow.styles.pill}>
            <TransitionPill from={progress.owned} to={`+${entity.unmatched.length}`} state='unknown' compact={true} role='img' aria-label={title} title={title} />
          </span>
          <Progress value={entity.unmatched.length} max={progress.owned + entity.unmatched.length} tint='info' segments={seasons} title={title} />
        </span>
      )}
    />
  )
}

// `withShowProgress` gets no `footer` here, so it loads the progress the footer counts from
const UnmatchedShow = compose(
  withShowMetadataContext(),
  withShowProgress(),
  withMovieGuestsContext(),
)(memo(UIUnmatchedShow))

// Keyed by `jobNameOf`. `label` and `empty` are translation keys, resolved where they are shown
const COMMANDS = {
  'refresh shows': {
    emoji: '🔌',
    summary: summaryRefreshShows,
    live: (sections, summary) => ({ show: { ...summary.show, success: sections.refreshed.length } }),
    warnings: (log) => log.level === 'warn',
    sections: [
      { key: 'refreshed', label: 'jobs.shows.refresh.refreshed', test: (log) => log.level === 'info' && log.meta.type === 'show' && log.meta.entity },
    ],
    empty: 'jobs.shows.refresh.empty',
  },
  'sync shows': {
    emoji: '🔗',
    summary: summarySyncShows,
    live: (sections, summary) => ({
      corrections: { ...summary.corrections, success: sections.corrections.length },
      missings: { ...summary.missings, success: sections.missings.reduce((sum, show) => sum + (show.missing || 0), 0) },
      withdrawals: sections.withdrawals.length,
      unmatched: sections.unmatched.reduce((sum, show) => sum + show.unmatched.length, 0),
    }),
    // A show whose episodes left Plex is logged as a warning too, with its count
    warnings: (log) => log.level === 'warn' && typeof log.meta.missing !== 'number',
    sections: [
      { key: 'missings', label: 'jobs.shows.sync.missings', test: (log) => log.meta.group === 'missings' && log.meta.show && typeof log.meta.missing === 'number', entity: ({ show, missing }) => ({ ...show, missing }), child: NotedShow, extra: 36 },
      { key: 'withdrawals', label: 'jobs.shows.sync.withdrawals', test: (log) => log.meta.group === 'withdrawals' && log.meta.show && log.meta.release, entity: ({ show, release }) => ({ ...show, note: emojize('🗑️', fromSeason(release.title)), details: release.title }), child: NotedShow, extra: 36 },
      { key: 'unmatched', label: 'jobs.shows.sync.unmatched', test: (log) => log.meta.group === 'unmatched' && log.meta.show && Array.isArray(log.meta.unmatched), entity: ({ show, unmatched }) => ({ ...show, unmatched }), child: UnmatchedShow },
      { key: 'corrections', label: 'jobs.shows.sync.corrections', test: (log) => log.level === 'info' && log.meta.group === 'corrections' && log.meta.show },
    ],
    empty: 'jobs.shows.sync.empty',
  },
  'import shows': {
    emoji: '📥',
    summary: summaryImportShows,
    live: (sections, summary) => ({ imports: { ...summary.imports, success: sections.imported.length } }),
    warnings: (log) => log.level === 'warn',
    sections: [
      { key: 'imported', label: 'jobs.shows.import.imported', test: (log) => log.level === 'info' && log.meta.show && typeof log.meta.links === 'number' },
      {
        key: 'downloading',
        label: 'jobs.shows.import.downloading',
        test: (log) => log.level === 'info' && log.meta.show && log.meta.waiting,
        entity: ({ show, waiting }) => ({ ...show, waiting }),
        child: DownloadingShow,
      },
    ],
    empty: 'jobs.shows.import.empty',
  },
  'migrate sonarr': {
    emoji: '🚚',
    summary: summaryMigrateSonarr,
    live: (sections) => ({ migrated: sections.migrated.length }),
    warnings: (log) => log.level === 'warn',
    sections: [
      { key: 'migrated', label: 'jobs.shows.migrateSonarr.migrated', test: (log) => log.level === 'info' && log.meta.type === 'show' && log.meta.entity },
    ],
    empty: 'jobs.shows.migrateSonarr.empty',
  },
}

const UIShowsJob = ({ job, logs }) => {
  const { t, i18n } = useTranslation()
  const command = COMMANDS[jobNameOf(job.meta)]
  const warnings = useMemo(() => [...(logs || [])].filter(command.warnings).sort(newest), [logs, command])
  const sections = useMemo(() => command.sections.reduce((acc, { key, test, entity }: any) => ({
    ...acc,
    [key]: entity
      ? (logs || []).filter(test).sort(newest).map(({ meta }) => entity(meta))
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
              <JobState job={job.job} name={jobNameOf(job.meta)} done={job.meta.done} />
              <JobName name={jobNameOf(job.meta)} sx={UIShowsJob.styles.title} />
            </span>
          )}
          subtitle={(
            <>
              <span sx={UIShowsJob.styles.subtitle}>{job.job} - {(new Date(job.start)).toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })} - {(new Date(job.start)).toLocaleTimeString(i18n.language, { hour: '2-digit', minute:'2-digit' })}</span>
              {job.meta.done && (
                <>
                  <br/>
                  <strong sx={UIShowsJob.styles.subtitle}>{durationOf(job)}</strong>
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
            {command.sections.map(({ key, label, child = Show, extra = 0 }) => (
              <Entities
                key={key}
                id={`${job.meta.command}-${key}-${job.job}`}
                entities={sections[key]}
                length={sections[key].length}
                label={t(label)}
                display='grid'
                hide={true}
                child={child as any}
                extra={FOOTER_HEIGHT + extra}
              />
            ))}
          </div>
        ) : job.meta.done ? (
          <Warning
            emoji={job.meta.error ? '💢' : '🗄️'}
            title={job.meta.error ? t('jobs.job.error') : t('jobs.job.empty')}
            subtitle={job.meta.error?.message || job.meta.error || t(command.empty)}
          />
        ) : (
          <Warning emoji='⏳' title={t('state.loading')} subtitle={t('jobs.shows.waiting')} />
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
