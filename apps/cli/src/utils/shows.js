import { lightenShow, lightenEpisodes, buildShowSeasonsRequests } from '@sensorr/tmdb'

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

export const fetchShow = async (tmdb, id) => {
  const raw = await tmdb.fetch(`tv/${id}`, { append_to_response: 'external_ids,alternative_titles' })
  const numbers = (raw.seasons || []).map(({ season_number }) => season_number)
  const seasons = []

  for (const { uri, params } of buildShowSeasonsRequests(raw.id, Math.max(0, ...numbers)).filter(({ params }) => params.append_to_response)) {
    const chunk = await tmdb.fetch(uri, params)
    seasons.push(...numbers.map((number) => chunk[`season/${number}`]).filter(Boolean))
  }

  // buildShowSeasonsRequests starts at season 1
  if (numbers.includes(0)) {
    seasons.push(await tmdb.fetch(`tv/${raw.id}/season/0`))
  }

  return {
    show: lightenShow(raw),
    episodes: seasons.flatMap((season) => lightenEpisodes({ ...season, episodes: season.episodes || [] }, raw.id)),
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
