import path from 'node:path'
import oleoo from 'oleoo'
import sanitizeFilename from 'sanitize-filename'
export { fetchShow } from '@sensorr/tmdb'

const AIRING = ['Returning Series', 'In Production', 'Planned', 'Pilot']

export const REFRESH_AFTER = 30 * 24 * 60 * 60 * 1000

// A show still airing is refreshed on every run, any other once its last refresh is 30 days old
export const isRefreshDue = (show, now) => (
  AIRING.includes(show.status) ||
  !show.refreshed_at ||
  now - new Date(show.refreshed_at).getTime() >= REFRESH_AFTER
)

// A new episode follows its season, a new season follows `monitor_new_seasons`, and specials are only monitored by hand
export const monitoredOf = (episode, show, known = []) => {
  const season = known.filter(({ season_number }) => season_number === episode.season_number)

  return !!show.monitored && episode.season_number !== 0 && (
    season.length ? season.some(({ monitored }) => monitored) : !!show.monitor_new_seasons
  )
}

// A show a guest asks for arrives unmonitored, the way a requested movie arrives ignored
export const requestedShowOf = ({ show, episodes }, plex_guid, requested_by) => ({
  show: { ...show, state: 'ignored', monitored: false, monitor_new_seasons: false, plex_guid, requested_by },
  episodes: episodes.map((episode) => ({ ...episode, monitored: false })),
})

// An empty `proposal_only` on the show follows the job
export const proposalOnlyOf = (show, job) => typeof show.proposal_only === 'boolean' ? show.proposal_only : !!job

// `airing` searches single episodes only, those aired since `since`
export const airingUnits = (units, episodes, since) => {
  const aired = new Set(episodes
    .filter(({ air_date }) => air_date && new Date(air_date).getTime() >= since)
    .map(({ season_number, episode_number }) => `${season_number}:${episode_number}`))

  return units.filter(({ type, season, episode }) => type === 'episode' && aired.has(`${season}:${episode}`))
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

// Sonarr series only listed, never monitored nor downloaded, are not taken over
export const sonarrShowOf = (series) => (!series.monitored && !series.statistics?.episodeFileCount) ? null : {
  state: series.monitored ? 'wished' : 'archived',
  monitored: !!series.monitored,
  monitor_new_seasons: series.monitorNewItems === 'all',
  path: (series.path || '').split(/[\\/]/).filter(Boolean).pop(),
}

// Sonarr decides for every episode it numbers the same, the others follow the rule of a new episode
export const sonarrEpisodesOf = (episodes, sonarr, show) => {
  const keyOf = ({ season_number, episode_number }) => `${season_number}:${episode_number}`
  const numbered = new Map(sonarr.map((episode) => [`${episode.seasonNumber}:${episode.episodeNumber}`, episode]))
  const numbers = new Set(episodes.map(keyOf))
  const known = episodes
    .filter((episode) => numbered.has(keyOf(episode)))
    .map((episode) => ({ ...episode, monitored: !!numbered.get(keyOf(episode)).monitored }))
  const copied = new Map(known.map((episode) => [episode.id, episode]))

  return {
    episodes: episodes.map((episode) => copied.get(episode.id) || { ...episode, monitored: monitoredOf(episode, show, known) }),
    unmatched: sonarr.filter(({ seasonNumber, episodeNumber }) => !numbers.has(`${seasonNumber}:${episodeNumber}`)),
  }
}

export const INCOMPLETE = '.!qB'

// An accepted release, or one downloaded without a proposal, is imported once, and only when its .torrent was read
export const isImportable = (release) => !release.proposal && !release.imported_at && !!release.torrent?.files?.length

// `listing` maps a path under the staging folder to its size, qBittorrent suffixes a file with `.!qB` until it is complete
export const isReleaseFinished = (release, listing) => release.torrent.files.every(({ path: file, size }) => (
  listing[file] === size && !(`${file}${INCOMPLETE}` in listing)
))

export const showFolderOf = (show) => show.path || sanitizeFilename(show.first_air_date ? `${show.name} (${new Date(show.first_air_date).getUTCFullYear()})` : show.name)

export const importTargetOf = (library, show, season, file) => path.join(library, showFolderOf(show), `Season ${`${season}`.padStart(2, '0')}`, path.basename(file))

// A file goes to the episodes oleoo reads in its name, when the release covers them and none has a file yet; samples never do
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
