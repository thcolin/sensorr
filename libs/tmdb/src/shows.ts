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
