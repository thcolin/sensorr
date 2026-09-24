import React, { useEffect } from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { render, Text } from 'ink'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import { lighten } from '../store/logger'
import api from '../store/api'
import command from '../utils/command'
import { fetchSensorrShows, isImportable, isReleaseFinished, importLinksOf, showFolderOf, INCOMPLETE } from '../utils/shows'

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
      let imported = 0, pending = 0, links = 0, warning = 0
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
          const done = []

          for (const release of show.releases.filter(isImportable)) {
            if (!isReleaseFinished(release, await listingOf(staging, release))) {
              pending++
              continue
            }

            if (!episodes) {
              const { uri, params, init } = api.query.shows.getShowEpisodes({ params: { id: show.id } })
              episodes = await api.fetch(uri, params, init)
            }

            let retry = false
            const linked = []

            // A copy would double the space a hard link does not take: a failed link is only logged
            for (const link of importLinksOf(release, show, episodes, library)) {
              try {
                await fs.mkdir(path.dirname(link.target), { recursive: true })
                await fs.link(path.join(staging, link.source), link.target)
                linked.push(link)
              } catch (error) {
                retry = retry || error.code !== 'EEXIST'
                state.logger.warn({ message: `⚠️ Error on "${show.name}" import of "${link.source}", ${error.code || error.message}`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), release: { id: release.id, title: release.title }, link, error } })
                warning++
              }
            }

            links += linked.length

            // An existing target is never replaced, any other failure is tried again on the next run
            if (!retry) {
              done.push(release.id)
              imported++
              state.logger.info({ message: `📥 Import "${release.title}" into "${folder}", ${linked.length} files linked`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), release: { id: release.id, title: release.title }, links: linked.length } })
            }
          }

          if (done.length) {
            const now = Date.now()
            const { uri, params, init } = api.query.shows.postShows({
              body: {
                [show.id]: {
                  ...(!show.path ? { path: folder } : {}),
                  releases: show.releases.map((release) => done.includes(release.id) ? { ...release, imported_at: now } : release),
                },
              },
            })
            await api.fetch(uri, params, init)
          }
        } catch (error) {
          setTask((task) => ({ ...task, output: `⚠️  ${error.message || error}` }))
          state.logger.warn({ message: `⚠️ Error during show "${show.name}" import: "${error?.message || error}"`, metadata: { ...state.metadata, group: show.id, type: 'show', show: lighten.show(show), warning: error } })
          warning++
        }
      }

      state.logger.info({ message: `📥 Imported ${imported} show releases, ${links} files linked, ${pending} still downloading`, metadata: { ...state.metadata, summary: { imports: { success: imported, pending, links, warning } } } })
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
