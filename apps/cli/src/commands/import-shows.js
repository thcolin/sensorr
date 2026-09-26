import React, { useEffect } from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { render, Text } from 'ink'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'
import { fetchSensorrShows, isImportable, isReleaseFinished, isReleaseOverdue, importLinksOf, importedEpisodesOf, showFolderOf, INCOMPLETE } from '../utils/shows'

const meta = {
  command: 'import',
  type: 'show',
  desc: '📥 Import finished show releases from the staging folder into the library',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command, type: meta.type }, logger, shows: config.get('shows') }}>
        <FetchSensorrShowsTask />
        <ImportShowsReleasesTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const sizeOf = async (file) => {
  try {
    return (await fs.stat(file)).size
  } catch (error) {
    return undefined
  }
}

const listingOf = async (staging, release) => {
  const listing = {}

  for (const candidate of release.torrent.files.flatMap(({ path: file }) => [file, `${file}${INCOMPLETE}`])) {
    const size = await sizeOf(path.join(staging, candidate))
    if (size !== undefined) {
      listing[candidate] = size
    }
  }

  return listing
}

const FetchSensorrShowsTask = ({ ...props }) => {
  const { task, setTask, status, setStatus, context: { state, setState, handleError } } = useTask({
    id: 'fetch-sensorr-shows',
    title: '🗄️  Fetch Sensorr shows releases...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const shows = (await fetchSensorrShows(api, { fields: 'id|name|first_air_date|path|genres|poster_path|vote_average|releases' }))
          .filter(({ releases }) => (releases || []).some(isImportable))
        const releases = shows.reduce((sum, show) => sum + show.releases.filter(isImportable).length, 0)
        setState((state) => ({ ...state, library: shows }))
        state.logger.info({ message: `🗄️  ${releases} releases of ${shows.length} shows waiting for an import`, metadata: { ...state.metadata, summary: { shows: shows.length, releases } } })
        await new Promise(resolve => setTimeout(resolve, 600))
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{releases}</Text> releases of <Text bold={true}>{shows.length}</Text> shows waiting for an import</Text> }))
        setStatus('done')
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

const ImportShowsReleasesTask = ({ ...props }) => {
  const { ready, task, setTask, status, setStatus, context: { state } } = useTask({
    id: 'import-shows-releases',
    title: '📥 Import show releases...',
  }, { dependencies: ['fetch-sensorr-shows'] })

  useEffect(() => {
    if (!ready) {
      return
    }

    const cb = async () => {
      let imported = 0, pending = 0, links = 0, warning = 0, late = 0
      const { library, staging } = state.shows
      setStatus('loading')

      for (const show of (state.library || [])) {
        const folder = showFolderOf(show)

        try {
          setTask((task) => ({
            ...task,
            title: (
              <Text>
                📥 Import show releases {(
                  <Text color='grey'>({state.library.indexOf(show) + 1}/{state.library.length})</Text>
                )}
              </Text>
            ),
            output: `Check "${show.name}" releases in staging...`,
          }))

          let episodes = null
          const done = [], overdue = []
          const folders = (await fs.readdir(path.join(library, folder), { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory()).map(({ name }) => name)
          const now = Date.now()
          const fetchEpisodes = async () => {
            const { uri, params, init } = api.query.shows.getShowEpisodes({ params: { id: show.id } })
            return api.fetch(uri, params, init)
          }

          for (const release of show.releases.filter(isImportable)) {
            if (!isReleaseFinished(release, await listingOf(staging, release))) {
              pending++

              if (!release.overdue && isReleaseOverdue(release, now)) {
                overdue.push(release)
              }

              continue
            }

            if (!episodes) {
              episodes = await fetchEpisodes()
            }

            let retry = false
            const linked = [], existing = []

            // A copy would double the space a hard link does not take: a failed link is only logged
            for (const link of importLinksOf(release, show, episodes, library, folders)) {
              try {
                await fs.mkdir(path.dirname(link.target), { recursive: true })
                await fs.link(path.join(staging, link.source), link.target)
                linked.push(link)
              } catch (error) {
                retry = retry || error.code !== 'EEXIST'
                if (error.code === 'EEXIST') {
                  existing.push(link)
                }

                state.logger.warn({ message: `⚠️ Error on "${show.name}" import of "${link.source}", ${error.code || error.message}`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), release: { id: release.id, title: release.title }, link, error } })
                warning++
              }
            }

            links += linked.length
            const { owned, unlinked } = importedEpisodesOf(release, episodes, [...linked, ...existing])

            if (owned.length) {
              const { uri, params, init } = api.query.episodes.postEpisodes({ body: owned.reduce((acc, { id, files }) => ({ ...acc, [id]: { files } }), {}) })
              await api.fetch(uri, params, init)
              episodes = episodes.map((episode) => owned.find(({ id }) => id === episode.id) || episode)
            }

            // An existing target is never replaced, any other failure is tried again on the next run
            if (!retry) {
              if (unlinked.length) {
                const numbers = unlinked.map(({ season_number, episode_number }) => `S${`${season_number}`.padStart(2, '0')}E${`${episode_number}`.padStart(2, '0')}`)
                const { uri, params, init } = api.query.episodes.postEpisodes({ body: unlinked.reduce((acc, { id }) => ({ ...acc, [id]: { release: null } }), {}) })
                await api.fetch(uri, params, init)
                episodes = episodes.map((episode) => unlinked.some(({ id }) => id === episode.id) ? { ...episode, release: null } : episode)
                state.logger.warn({ message: `⚠️ "${release.title}" of "${show.name}" holds no file for ${numbers.join(', ')}, searched again`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), release: { id: release.id, title: release.title }, unlinked: numbers } })
                warning++
              }

              done.push(release.id)
              imported++
              state.logger.info({ message: `📥 Import "${release.title}" into "${folder}", ${linked.length} files linked`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), release: { id: release.id, title: release.title }, links: linked.length } })
            }
          }

          // Its episodes are released before the mark is written, so a failed write only repeats this next run
          if (overdue.length) {
            episodes = episodes || await fetchEpisodes()

            for (const release of overdue) {
              const released = episodes.filter((episode) => episode.release === release.id)

              if (released.length) {
                const { uri, params, init } = api.query.episodes.postEpisodes({ body: released.reduce((acc, { id }) => ({ ...acc, [id]: { release: null } }), {}) })
                await api.fetch(uri, params, init)
              }

              late++
              state.logger.warn({ message: `⏳ "${release.title}" of "${show.name}" not imported a week after it was accepted, ${released.length} episodes searched again`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), release: { id: release.id, title: release.title }, overdue: true, released: released.length } })
            }
          }

          for (const [id, fields] of [...done.map((id) => [id, { imported_at: now, overdue: false }]), ...overdue.map(({ id }) => [id, { overdue: true }])]) {
            const { uri, params, init } = api.query.shows.patchShowRelease({ params: { id: show.id }, body: { id, ...fields } })
            await api.fetch(uri, params, init)
          }

          if (!show.path && done.length) {
            const { uri, params, init } = api.query.shows.postShows({ body: { [show.id]: { path: folder } } })
            await api.fetch(uri, params, init)
          }
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
          state.logger.warn({ message: `⚠️ Error during show "${show.name}" import: "${error?.message || error}"`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), warning: error } })
          warning++
        }
      }

      state.logger.info({ message: `📥 Imported ${imported} show releases, ${links} files linked, ${pending} still downloading, ${late} newly overdue`, metadata: { ...state.metadata, summary: { imports: { success: imported, pending, links, warning, overdue: late } } } })
      await new Promise(resolve => setTimeout(resolve, 600))
      setTask((task) => ({ ...task, output: <Text><Text bold={true}>{imported}</Text> releases imported, <Text bold={true}>{links}</Text> files linked, <Text bold={true}>{pending}</Text> still downloading</Text> }))
      setStatus('done')
    }

    cb()
  }, [ready])

  return (
    <Task {...props} {...task} status={status} />
  )
}
