import React, { useEffect } from 'react'
import { Policy, matchPolicy, searchUnits, searchShowUnits, levelOf, coverageLabel } from '@sensorr/sensorr'
import { Text } from 'ink'
import { Task, useTask } from '../Taskink'
import api from '../../store/api'
import { lighten } from '../../store/logger'
import { proposalOnlyOf, airingUnits } from '../../utils/shows'

const TITLES = {
  record: `📹 Record wished shows`,
  airing: `📡 Record aired episodes`,
}

const yearOf = (show) => show.first_air_date ? new Date(show.first_air_date).getFullYear() : '?'

const ShowTitle = ({ show }) => <Text color='grey'>"<Text color='white'>{show.name}</Text>" ({yearOf(show)})</Text>

const unemoji = (value) => value?.replace(/([✀-➿]|[-]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[‑-⛿]|\uD83E[\uDD10-\uDDFF])/g, '')?.trim()

// Only the shows with a wanted episode, aired since `since` when given, are worth a search
export const FetchAPIShowsTask = ({ since = null, ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-api-shows',
    title: since ? '📺 Fetch wished shows with episodes aired this week from API...' : '📺 Fetch wished shows from API...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const shows = api.query.shows.getShows({ params: { state: 'wished', monitored: true } })
        const { results } = await api.fetch(shows.uri, { ...shows.params, limit: '' }, shows.init)
        const episodes = api.query.episodes.getEpisodes({ params: { wanted: true, fields: 'show_id', ...(since ? { aired_after: new Date(since).toISOString() } : {}) } })
        const { results: wanted } = await api.fetch(episodes.uri, { ...episodes.params, limit: '' }, episodes.init)
        const ids = new Set(wanted.map(({ show_id }) => show_id))
        const found = results.filter(({ id }) => ids.has(id))

        setState((state) => ({ ...state, shows: found.reduce((acc, show) => ({ ...acc, [show.id]: show }), {}) }))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{found.length}</Text> shows with wanted episodes found</Text> }))
        setStatus('done')
        state.logger.info({ message: `📺 ${found.length} Wished shows with wanted episodes`, metadata: { ...state.metadata, summary: { wished: found.length } } })
      } catch (error) {
        setStatus('error')
        setTask((task) => ({ ...task, error: error.message || error }))
        handleError(error)
      }
    }

    cb()
  }, [])

  return (
    <Task {...task} status={status} />
  )
}

export const ProcessShowsTask = ({ command, proposalOnly = false, since = null, ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { tasks, state } } = useTask(
    {
      id: 'process-shows',
      title: TITLES[command],
      status: 'waiting',
    },
    {
      dependencies: ['fetch-api-shows'],
    },
  )
  const subtasks = Object.entries(tasks).filter(([id, status]) => new RegExp(/^process-show-/).test(id))
  const index = subtasks.findIndex(([id, status]) => ['loading', 'waiting'].includes(status))

  useEffect(() => {
    if (!ready) {
      return
    }

    setStatus(Object.keys(state?.shows || {}).length ? 'loading' : 'done')
  }, [ready])

  const shows = Object.values(state?.shows || {})
  const releases = shows.flatMap((show) => (show.picks || []).map((release) => ({ show, release })))
  const results = {
    recorded: releases.filter(({ release }) => !release.proposal),
    proposal: releases.filter(({ release }) => release.proposal),
    withdrawn: shows.filter((show) => !show.warning && !show.picks?.length && show.release && show.release.warning <= 10),
    ignored: shows.filter((show) => !show.warning && !show.picks?.length && show.release && show.release.warning > 10),
    missing: shows.filter((show) => !show.warning && !show.picks?.length && !show.release?.title),
    warning: shows.filter((show) => show.warning),
  }

  useEffect(() => {
    if (!ready || !subtasks.length) {
      return
    }

    const cb = async () => {
      setTask((task) => ({ ...task, title: (
        <Text>
          {TITLES[command]} {!!subtasks.length && (
            <Text color='grey'>({subtasks.filter(([id, status]) => ['done', 'warning', 'error'].includes(status)).length}/{subtasks.length})</Text>
          )}
        </Text>
      ) }))

      if (subtasks.every(([id, status]) => ['done', 'warning', 'error'].includes(status))) {
        Object.entries(results)
          .filter(([type, items]) => items.length)
          .forEach(([type, items]) => state.logger.info({
            message: ({
              recorded: `📼 ${items.length} Recorded show releases`,
              proposal: `🛎️  ${items.length} Proposed show releases`,
              withdrawn: `⛔  ${items.length} Withdrawn shows releases`,
              ignored: `🗑️  ${items.length} Ignored shows releases`,
              missing: `📭 ${items.length} No releases found`,
              warning: `⚠️  ${items.length}  Disturbed during process`,
            }[type] || ''),
            [type]: items.length,
            metadata: { ...state.metadata, summary: { [type]: items.length } },
          }))

        await new Promise(resolve => setTimeout(resolve, 600))
        setStatus('done')
      }
    }

    cb()
  }, [ready, subtasks.map(value => value.join(':')).join(',')])

  return status === 'done' ? (
    <>
      {Object.entries(results).filter(([type, items]) => items.length).map(([type, items]) => (
        <React.Fragment key={type}>
          <Task
            key='summary'
            title={{
              recorded: <Text>📼 Recorded show releases</Text>,
              proposal: <Text>🛎️  Proposed show releases</Text>,
              withdrawn: <Text>⛔  Withdrawn shows releases</Text>,
              ignored: <Text>🗑️  Ignored shows releases</Text>,
              missing: <Text>📭 No releases found</Text>,
              warning: <Text>⚠️  Disturbed during process</Text>,
            }[type]}
            status={{
              recorded: 'done',
              proposal: 'done',
              withdrawn: 'warning',
              ignored: 'error',
              missing: 'error',
              warning: 'error',
            }[type]}
            output={{
              recorded: <Text><Text bold={true}>{items.length}</Text> recorded</Text>,
              proposal: <Text><Text bold={true}>{items.length}</Text> proposals</Text>,
              withdrawn: <Text><Text bold={true}>{items.length}</Text> withdrawn</Text>,
              ignored: <Text><Text bold={true}>{items.length}</Text> ignored</Text>,
              missing: <Text><Text bold={true}>{items.length}</Text> with no releases found</Text>,
              warning: <Text><Text bold={true}>{items.length}</Text> disturbed</Text>,
            }[type]}
          />
          {(['recorded', 'proposal'].includes(type) && items.map(({ show, release }) => (
            <Task
              key={`${show.id}-${release.id}`}
              title={<ShowTitle show={show} />}
              output={`${release.label} ${release.title} (${release.znab})`}
              status='done'
              depth={1}
            />
          )))}
          {(['withdrawn', 'ignored'].includes(type) && items.map((show) => (
            <Task
              key={show.id}
              title={<ShowTitle show={show} />}
              output={`${unemoji(show.release?.reason)}: ${show.release?.title}`}
              status={type === 'withdrawn' ? 'warning' : 'error'}
              depth={1}
            />
          )))}
          {(type === 'missing' && items.map((show) => (
            <Task
              key={show.id}
              title={<ShowTitle show={show} />}
              output={`"${(show.query?.terms || []).join('", "')}" (${show.units || 0} searched)`}
              status='error'
              depth={1}
            />
          )))}
          {(type === 'warning' && items.map((show) => (
            <Task
              key={show.id}
              title={<ShowTitle show={show} />}
              output={show.warning?.message || show.warning}
              status='error'
              depth={1}
            />
          )))}
        </React.Fragment>
      ))}
    </>
  ) : (
    <>
      <Task key='process-shows-task' {...task} status={status} />
      {...shows.map((show, i, arr) => (
        <ProcessShowTask
          key={show.id}
          show={show}
          proposalOnly={proposalOnly}
          since={since}
          dependencies={arr[i - 1] ? [`process-show-${arr[i - 1].id}`] : []}
          hide={status === 'done' || (['waiting', 'loading'].includes(status) && !(i >= index && i <= (index + 10)))}
          depth={1}
        />
      ))}
    </>
  )
}

const ProcessShowTask = ({ show, hide, since, dependencies = [], proposalOnly = false, ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state, setState } } = useTask(
    {
      id: `process-show-${show.id}`,
      title: <ShowTitle show={show} />,
      status: 'waiting',
    },
    {
      type: 'process-show',
      dependencies,
    }
  )

  useEffect(() => {
    if (!ready) {
      return
    }

    const policy = new Policy({
      ...(state.policies.find(p => p.name === show.policy) || matchPolicy(show, state.policies)),
    }, state.policies)

    const cb = async () => {
      const picked = []

      try {
        setStatus('loading')
        const query = state.sensorr.getShowQuery(show, show.query, show.banned_releases)
        const metadata = { ...state.metadata, group: show.id, type: 'show' }

        state.logger.info({
          message: since ? `📡 Record aired episodes of "${show.name}" (${yearOf(show)})` : `📹 Record "${show.name}" (${yearOf(show)})`,
          metadata: { ...metadata, important: true, show: { ...lighten.show(show), query } },
        })

        if (!query.terms.some((term) => term)) {
          throw new Error('No query term')
        }

        const { uri, params, init } = api.query.shows.getShowEpisodes({ params: { id: show.id } })
        const episodes = await api.fetch(uri, params, init)
        const units = since ? airingUnits(searchUnits(show, episodes), episodes, since) : searchUnits(show, episodes)
        const znabs = state.znabs.filter((znab) => !(policy?.avoid?.znab || []).includes(znab.name))
        const { picks, searched } = await searchShowUnits(units, episodes, {
          znabs,
          terms: query.terms,
          apply: (releases, unit) => policy.apply(releases, { ...query, unit }),
          search: async (znab, term, params, served) => {
            const label = params.season === undefined ? 'whole series' : coverageLabel([params], params.episode === undefined ? 'season' : 'episode')
            setTask((task) => ({ ...task, output: `${label}, "${term}" (${znab.name})` }))

            try {
              const found = await znab.searchShow(term, params)
              // A season request feeds its pack and its episodes: a release counts as its best result among them
              const best = {}
              served.flatMap((unit) => policy.apply(found, { ...query, unit })).forEach((release) => {
                const known = best[release.link]
                best[release.link] = (!known || (release.valid && !known.valid) || (!known.valid && !release.valid && release.warning < known.warning)) ? release : known
              })
              const results = Object.values(best)

              const stats = {
                total: results?.length || 0,
                matches: results?.filter(release => release.valid && !release.warning).map(({ size, score, seeders, link, meta: { generated: release, original } }) => ({ release, original, size, score, seeders, link })),
                withdrawn: results?.filter(release => !release.valid && release.warning <= 10).map(({ reason, size, score, seeders, link, meta: { generated: release, original } }) => ({ release, original, reason, size, score, seeders, link })),
                ignored: results?.filter(release => !release.valid && release.warning > 10).map(({ reason, size, score, seeders, link, meta: { generated: release, original } }) => ({ release, original, reason, size, score, seeders, link })),
              }

              state.logger.info({ message: (
                (stats.matches.length) ? `⭐  ${znab.name} - "${term}" ${label}, ${stats.matches.length} matching releases found`
                : (stats.withdrawn.length) ? `⛔  ${znab.name} - "${term}" ${label}, ${stats.withdrawn.length} releases withdrawn by policy`
                : (stats.ignored.length) ? `🗑️  ${znab.name} - "${term}" ${label}, ${stats.total} releases ignored`
                : (stats.total) ? `📭  ${znab.name} - "${term}" ${label}, no matching releases found`
                : `📭  ${znab.name} - "${term}" ${label}, no releases found`
              ), metadata: { ...metadata, znab: znab.name, term, unit: label, stats } })

              return found
            } catch (error) {
              state.logger.warn({ message: `⚠️  ${znab.name} - "${term}" ${label}, ${error?.message || error}`, metadata: { ...metadata, znab: znab.name, term, unit: label, warning: error } })
              return []
            }
          },
        })

        if (!picks.length) {
          const release = [...searched.values()].flat().find(({ valid }) => !valid)
          setState((state) => ({ ...state, shows: { ...state.shows, [show.id]: { ...show, query, units: searched.size, release } } }))

          if (!release) {
            setTask((task) => ({ ...task, output: '📭 No releases found' }))
            state.logger.info({ message: `📭 No releases found`, metadata: { ...metadata, important: true, done: true } })
            await new Promise(resolve => setTimeout(resolve, 600))
            setStatus('error')
          } else if (release.warning <= 10) {
            setTask((task) => ({ ...task, output: `${release.reason}: ${release.title}` }))
            state.logger.info({ message: `🚨 Release ${release.title} withdrawn`, metadata: { ...metadata, important: true, release: { ...release, level: levelOf(release.meta, release.category) }, done: true } })
            await new Promise(resolve => setTimeout(resolve, 600))
            setStatus('warning')
          } else {
            setTask((task) => ({ ...task, output: `${release.reason}: ${release.title}` }))
            state.logger.info({ message: `🗑️  No matching releases found`, metadata: { ...metadata, important: true, release: { ...release, level: levelOf(release.meta, release.category), hide: true }, done: true } })
            await new Promise(resolve => setTimeout(resolve, 600))
            setStatus('error')
          }

          return
        }

        const proposal = proposalOnlyOf(show, proposalOnly)
        const stored = [...(show.releases || [])]

        for (const release of picks) {
          const level = levelOf(release.meta, release.category)
          const label = coverageLabel(release.coverage, level)
          const raw = {
            id: release.id,
            title: release.title,
            original: release.original,
            from: state.metadata.command,
            job: state.metadata.job,
            proposal,
            znab: release.znab,
            link: release.link,
            enclosure: release.enclosure,
            size: release.size,
            coverage: release.coverage,
            level,
          }

          setTask((task) => ({ ...task, output: `${{ false: '📼', true: '🛎️ ' }[proposal]} ${label} ${release.title}` }))
          const downloadRelease = api.query.sensorr.downloadRelease({ body: raw, params: { source: 'enclosure', destination: proposal ? 'cache' : 'fs', kind: 'show' } })
          const { torrent } = await api.fetch(downloadRelease.uri, downloadRelease.params, downloadRelease.init)
          stored.push({ ...raw, ...(torrent ? { torrent } : {}) })
          const postShows = api.query.shows.postShows({ body: { [show.id]: { releases: stored } } })
          await api.fetch(postShows.uri, postShows.params, postShows.init)

          const covered = episodes.filter(({ season_number, episode_number }) => release.coverage.some(({ season, episode }) => season === season_number && episode === episode_number))
          const postEpisodes = api.query.episodes.postEpisodes({ body: covered.reduce((acc, episode) => ({ ...acc, [episode.id]: { release: raw.id } }), {}) })
          await api.fetch(postEpisodes.uri, postEpisodes.params, postEpisodes.init)

          picked.push({ ...raw, label })
          state.logger.info({ message: `${{ false: '📼', true: '🛎️ ' }[proposal]} Release ${release.title} ${{ false: 'recorded', true: 'proposed' }[proposal]} for ${label} (${release.znab})`, metadata: { ...metadata, important: true, show: lighten.show(show), release: { ...release, proposal, level } } })
        }

        setState((state) => ({ ...state, shows: { ...state.shows, [show.id]: { ...show, query, units: searched.size, picks: picked } } }))
        state.logger.info({ message: `${{ false: '📼', true: '🛎️ ' }[proposal]} ${picked.length} releases ${{ false: 'recorded', true: 'proposed' }[proposal]} for "${show.name}"`, metadata: { ...metadata, important: true, done: true } })
        await new Promise(resolve => setTimeout(resolve, 600))
        setStatus('done')
      } catch (error) {
        setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
        state.logger.warn({ message: `⚠️ Error during record: "${error?.message || error}"`, metadata: { ...state.metadata, important: true, group: show.id, type: 'show', warning: error, done: true } })
        await new Promise(resolve => setTimeout(resolve, 600))
        setStatus('error')
        setState((state) => ({ ...state, shows: { ...state.shows, [show.id]: { ...show, picks: picked, warning: error } } }))
      }
    }

    cb()
  }, [show?.id, ready])

  if (hide) {
    return null
  }

  return (
    <Task
      {...props}
      {...task}
      status={status}
      output={task.output || (ready && ['waiting', 'loading'].includes(status) && 'Loading...')}
    />
  )
}
