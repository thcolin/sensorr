import path from 'node:path'
import oleoo from 'oleoo'
import sanitizeFilename from 'sanitize-filename'
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

// A release downloaded without a proposal is accepted when it is downloaded, so it can turn overdue as well
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
  ...(proposal ? {} : { accepted_at: now }),
})

export const airingUnits =(units, episodes, since) => {
  const aired = new Set(episodes
    .filter(({ air_date }) => air_date && new Date(air_date).getTime() >= since)
    .map(({ season_number, episode_number }) => `${season_number}:${episode_number}`))

  return units.filter(({ type, season, episode }) => type === 'episode' && aired.has(`${season}:${episode}`))
}

export const syncedFilesOf = (files) => files.length ? { files } : { files, release: null }

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

// Sonarr only searches an episode whose series and season are monitored too, whatever the episode's own flag says.
export const sonarrEpisodesOf = (episodes, sonarr, show, seasons = []) => {
  const keyOf = ({ season_number, episode_number }) => `${season_number}:${episode_number}`
  const numbered = new Map(sonarr.map((episode) => [`${episode.seasonNumber}:${episode.episodeNumber}`, episode]))
  const unmonitored = new Set(seasons.filter(({ monitored }) => !monitored).map(({ seasonNumber }) => seasonNumber))
  const numbers = new Set(episodes.map(keyOf))
  const known = episodes
    .filter((episode) => numbered.has(keyOf(episode)))
    .map((episode) => ({ ...episode, monitored: !!show.monitored && !unmonitored.has(episode.season_number) && !!numbered.get(keyOf(episode)).monitored }))
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

export const importLinksOf = (release, show, episodes, library) => {
  const keyOf = (season, episode) => `${season}:${episode}`
  const covered = new Set((release.coverage || []).map(({ season, episode }) => keyOf(season, episode)))
  const missing = new Set(episodes.filter(({ files }) => !files?.length).map(({ season_number, episode_number }) => keyOf(season_number, episode_number)))

  return release.torrent.files.flatMap(({ path: file }) => {
    if (/\bsamples?\b/i.test(file)) {
      return []
    }

    const { season, episodes: numbers } = oleoo.parse(path.basename(file))
    const matched = typeof season === 'number' ? numbers.filter((number) => covered.has(keyOf(season, number)) && missing.has(keyOf(season, number))) : []

    return matched.length ? [{ source: file, target: importTargetOf(library, show, season, file), season, episodes: matched }] : []
  })
}
