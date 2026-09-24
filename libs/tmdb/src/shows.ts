import { Show, Season, Episode } from './interfaces'

export const lightenShow = ({
  id,
  name,
  original_name,
  original_language,
  overview,
  first_air_date,
  last_air_date,
  status,
  type,
  in_production,
  number_of_seasons,
  number_of_episodes,
  episode_run_time,
  genres,
  networks,
  origin_country,
  poster_path,
  backdrop_path,
  popularity,
  vote_average,
  vote_count,
  external_ids,
  alternative_titles,
  seasons,
}: Show) => ({
  id,
  name,
  original_name,
  original_language,
  overview,
  first_air_date,
  last_air_date,
  status,
  type,
  in_production,
  number_of_seasons,
  number_of_episodes,
  episode_run_time,
  genres,
  networks,
  origin_country,
  poster_path,
  backdrop_path,
  popularity,
  vote_average,
  vote_count,
  external_ids,
  alternative_titles,
  seasons,
})

export const lightenEpisodes = (season: Season, showId: number): Episode[] => season.episodes.map(({
  id,
  season_number,
  episode_number,
  name,
  overview,
  air_date,
  runtime,
  still_path,
}) => ({
  id,
  show_id: showId,
  season_number,
  episode_number,
  name,
  overview,
  air_date,
  runtime,
  still_path,
}))

// TMDB caps `append_to_response` at 20 items. Splits a show's seasons into as few
// `tv/{id}` requests as possible, each appending up to 20 `season/N` items.
export const buildShowSeasonsRequests = (
  showId: number,
  numberOfSeasons: number,
  chunkSize = 20,
): { uri: string; params: { append_to_response: string } }[] => {
  const seasons = Array(numberOfSeasons).fill(null).map((foo, index) => index + 1)
  const chunks: number[][] = []

  for (let i = 0; i < seasons.length; i += chunkSize) {
    chunks.push(seasons.slice(i, i + chunkSize))
  }

  return (chunks.length ? chunks : [[]]).map((chunk) => ({
    uri: `tv/${showId}`,
    params: { append_to_response: chunk.map((season) => `season/${season}`).join(',') },
  }))
}

// A show and every one of its episodes, specials included, in as few requests as TMDB allows
export const fetchShow = async (tmdb: { fetch: (uri: string, params?: any) => Promise<any> }, id: number) => {
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
