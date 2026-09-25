import path from 'node:path'
import oleoo from 'oleoo'
import sanitizeFilename from 'sanitize-filename'
import { MEDIA } from '@sensorr/sensorr'
import { OVERDUE_AFTER } from './swaps'
export { fetchShow } from '@sensorr/tmdb'

const AIRING = ['Returning Series', 'In Production', 'Planned', 'Pilot']

export const REFRESH_AFTER = 30 * 24 * 60 * 60 * 1000

export const isRefreshDue = (show, now) => (
  AIRING.includes(show.status) ||
  !show.refreshed_at ||
  now - new Date(show.refreshed_at).getTime() >= REFRESH_AFTER
)

export const monitoredOf = (episode, show, known = []) => {
  const season = known.filter(({ season_number }) => season_number === episode.season_number)

  return !!show.monitored && episode.season_number !== 0 && (
    season.length ? season.some(({ monitored }) => monitored) : !!show.monitor_new_seasons
  )
}

export const requestedShowOf = ({ show, episodes }, plex_guid, requested_by) => ({
  show: { ...show, state: 'ignored', monitored: false, monitor_new_seasons: false, plex_guid, requested_by },
  episodes: episodes.map((episode) => ({ ...episode, monitored: false })),
})

export const proposalOnlyOf = (show, job) => typeof show.proposal_only === 'boolean' ? show.proposal_only : !!job

export const showReleaseOf = (release, { from, job, proposal, level }, now) => ({
  id: release.id,
  title: release.title,
  original: release.original,
  from,
  job,
  proposal,
  znab: release.znab,
  link: release.link,
  enclosure: release.enclosure,
  size: release.size,
  coverage: release.coverage,
  level,
  ...(release.swap ? { swap: true } : {}),
  ...(proposal ? {} : { accepted_at: now }),
})

export const airingUnits =(units, episodes, since) => {
  const aired = new Set(episodes
    .filter(({ air_date }) => air_date && new Date(air_date).getTime() >= since)
    .map(({ season_number, episode_number }) => `${season_number}:${episode_number}`))

  return units.filter(({ type, season, episode }) => type === 'episode' && aired.has(`${season}:${episode}`))
}

// A "Fix match" in Plex can drop the tmdb:// guid of a show: its tvdb:// or imdb:// guid still names it, and its title and year
// at least keep its files from being read as lost
export const plexShowOf = (payload, library) => {
  const guidOf = (scheme) => ((payload.Guid || []).find(({ id }) => id.startsWith(`${scheme}://`))?.id || '').replace(`${scheme}://`, '')
  const [tmdb, tvdb, imdb] = ['tmdb', 'tvdb', 'imdb'].map(guidOf)
  const title = (value) => `${value || ''}`.toLowerCase().trim()
  const matched = (tvdb && library.find(({ external_ids }) => `${external_ids?.tvdb_id || ''}` === tvdb)) || (imdb && library.find(({ external_ids }) => external_ids?.imdb_id === imdb))
  const named = library.find((show) => title(show.name) === title(payload.title) && (!payload.year || !show.first_air_date || new Date(show.first_air_date).getUTCFullYear() === Number(payload.year)))

  return tmdb ? { id: Number(tmdb), exact: true } : matched ? { id: matched.id, exact: true } : named ? { id: named.id, exact: false } : null
}

export const syncedFilesOf = (files) => files.length ? { files } : { files, release: null }

export const withdrawnProposalsOf = (releases = [], episodes) => {
  const owned = new Set(episodes.filter(({ files }) => files?.length).map(({ season_number, episode_number }) => `${season_number}:${episode_number}`))
  return releases.filter(({ proposal, coverage }) => proposal && coverage?.length && coverage.every(({ season, episode }) => owned.has(`${season}:${episode}`)))
}

// Plex decides, except for a file `import shows` linked that Plex has not scanned yet.
export const plexFilesOf = (known = [], files) => {
  const kept = files.length ? files : known.filter(({ from }) => from === 'import')

  return {
    files: kept,
    changed: JSON.stringify(kept) !== JSON.stringify(known),
    lost: !kept.length && known.some(({ from }) => !['import', 'sonarr'].includes(from)),
  }
}

// GET /api/shows leaves ignored shows out unless asked for them
export const fetchSensorrShows = async (api, params = {}) => {
  const shows = []

  for (const state of [null, 'ignored']) {
    const { uri, params: query, init } = api.query.shows.getShows({ params: { ...params, ...(state ? { state } : {}) } })
    const { results } = await api.fetch(uri, { ...query, limit: '' }, init)
    shows.push(...results)
  }

  return shows
}

export const sonarrShowOf = (series) => (!series.monitored && !series.statistics?.episodeFileCount) ? null : {
  state: series.monitored ? 'wished' : 'archived',
  monitored: !!series.monitored,
  monitor_new_seasons: series.monitorNewItems === 'all',
  path: (series.path || '').split(/[\\/]/).filter(Boolean).pop(),
}

const sonarrFileOf = (file) => {
  const { generated, original } = oleoo.parse((file.relativePath || file.path || '').split(/[\\/]/).pop(), { strict: false, flagged: true })
  return { id: `sonarr:${file.id}`, size: file.size, title: generated, original, from: 'sonarr' }
}

// Sonarr only searches an episode whose series and season are monitored too, whatever the episode's own flag says.
export const sonarrEpisodesOf = (episodes, sonarr, show, seasons = [], files = []) => {
  const keyOf = ({ season_number, episode_number }) => `${season_number}:${episode_number}`
  const numbered = new Map(sonarr.map((episode) => [`${episode.seasonNumber}:${episode.episodeNumber}`, episode]))
  const unmonitored = new Set(seasons.filter(({ monitored }) => !monitored).map(({ seasonNumber }) => seasonNumber))
  const numbers = new Set(episodes.map(keyOf))
  const filed = new Map(files.map((file) => [file.id, file]))
  const known = episodes
    .filter((episode) => numbered.has(keyOf(episode)))
    .map((episode) => {
      const { monitored, hasFile, episodeFileId } = numbered.get(keyOf(episode))
      const file = hasFile && filed.get(episodeFileId)

      return {
        ...episode,
        monitored: !!show.monitored && !unmonitored.has(episode.season_number) && !!monitored,
        ...(file ? { files: [sonarrFileOf(file)] } : {}),
      }
    })
  const copied = new Map(known.map((episode) => [episode.id, episode]))

  return {
    episodes: episodes.map((episode) => copied.get(episode.id) || { ...episode, monitored: monitoredOf(episode, show, known) }),
    unmatched: sonarr.filter(({ seasonNumber, episodeNumber }) => !numbers.has(`${seasonNumber}:${episodeNumber}`)),
  }
}

export const INCOMPLETE = '.!qB'

export const isImportable = (release) => !release.proposal && !release.imported_at && !!release.torrent?.files?.length

export const isReleaseOverdue = (release, now) => now - (release.accepted_at || now) > OVERDUE_AFTER

// qBittorrent suffixes a file with `.!qB` until it is complete
export const isReleaseFinished = (release, listing) => release.torrent.files.every(({ path: file, size }) => (
  listing[file] === size && !(`${file}${INCOMPLETE}` in listing)
))

export const showFolderOf = (show) => show.path || sanitizeFilename(show.first_air_date ? `${show.name} (${new Date(show.first_air_date).getUTCFullYear()})` : show.name)

export const importTargetOf = (library, show, season, file) => path.join(library, showFolderOf(show), `Season ${`${season}`.padStart(2, '0')}`, path.basename(file))

const SUBTITLE = /\.(srt|ass|ssa|sub|idx|vtt)$/i

// A subtitle holds no episode: it follows a video it numbers the same, into its Season folder.
// A swap links the episodes you own too, it replaces them.
export const importLinksOf = (release, show, episodes, library) => {
  const keyOf = (season, episode) => `${season}:${episode}`
  const covered = new Set((release.coverage || []).map(({ season, episode }) => keyOf(season, episode)))
  const missing = new Set(episodes.filter(({ files }) => !files?.length).map(({ season_number, episode_number }) => keyOf(season_number, episode_number)))

  const videos = release.torrent.files.flatMap(({ path: file, size }) => {
    if (!MEDIA.test(file) || /\bsamples?\b/i.test(file)) {
      return []
    }

    const { season, episodes: numbers } = oleoo.parse(path.basename(file))
    const matched = typeof season === 'number' ? numbers.filter((number) => covered.has(keyOf(season, number)) && (release.swap || missing.has(keyOf(season, number)))) : []

    return matched.length ? [{ source: file, target: importTargetOf(library, show, season, file), season, episodes: matched, size }] : []
  })

  const subtitles = release.torrent.files.filter(({ path: file }) => SUBTITLE.test(file)).flatMap(({ path: file, size }) => {
    const { season, episodes: numbers } = oleoo.parse(path.basename(file))
    const followed = videos.some((video) => video.season === season && video.episodes.some((number) => numbers.includes(number)))

    return followed ? [{ source: file, target: importTargetOf(library, show, season, file), season, episodes: [], size }] : []
  })

  return [...videos, ...subtitles]
}

export const importedEpisodesOf = (release, episodes, links) => {
  const keyOf = (season, episode) => `${season}:${episode}`
  const covered = new Set((release.coverage || []).map(({ season, episode }) => keyOf(season, episode)))
  const files = links.reduce((acc, link) => {
    const { generated, original } = oleoo.parse(path.basename(link.source), { strict: false, flagged: true })
    const file = { id: `import:${link.source}`, size: link.size, title: generated, original, from: 'import' }
    link.episodes.forEach((number) => acc.set(keyOf(link.season, number), [...(acc.get(keyOf(link.season, number)) || []), file]))
    return acc
  }, new Map())

  return {
    owned: episodes
      .filter(({ season_number, episode_number }) => files.has(keyOf(season_number, episode_number)))
      .map((episode) => {
        const linked = files.get(keyOf(episode.season_number, episode.episode_number))
        return { ...episode, files: [...(episode.files || []).filter(({ id }) => !linked.some((file) => file.id === id)), ...linked] }
      }),
    unlinked: episodes.filter(({ season_number, episode_number, files: known, release: id }) => (
      id === release.id && covered.has(keyOf(season_number, episode_number)) && !known?.length && !files.has(keyOf(season_number, episode_number))
    )),
  }
}
