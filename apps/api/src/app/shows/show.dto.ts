import { TorrentFiles } from '@sensorr/sensorr'
import { ReleaseDTO } from '../movies/release.dto'

export class ShowReleaseDTO extends ReleaseDTO {
  coverage?: { season: number, episode: number }[]
  torrent?: TorrentFiles
  imported_at?: number
}

export class ShowDTO {
  _id: number

  readonly id: number
  readonly name: string
  readonly original_name: string
  readonly original_language: string
  readonly overview: string
  readonly first_air_date: Date
  readonly last_air_date: Date
  readonly status: string
  readonly type: string
  readonly in_production: boolean
  readonly number_of_seasons: number
  readonly number_of_episodes: number
  readonly episode_run_time: number[]
  readonly genres: { id: number, name: string }[]
  readonly networks: { id: number, name: string, logo_path: string }[]
  readonly origin_country: string[]
  readonly poster_path: string
  readonly backdrop_path: string
  readonly popularity: number
  readonly vote_average: number
  readonly vote_count: number
  readonly external_ids: { imdb_id: string, tvdb_id: number }
  readonly alternative_titles: { results: { iso_3166_1: string, title: string }[] }
  readonly seasons: {
    id: number
    season_number: number
    name: string
    episode_count: number
    air_date: Date
    poster_path: string
  }[]
  readonly state: string
  readonly monitored: boolean
  readonly monitor_new_seasons: boolean
  readonly policy: string
  readonly proposal_only: boolean | null
  readonly path: string
  readonly plex_guid: string
  readonly requested_by: string[]
  readonly banned_releases: string[]
  readonly releases: ShowReleaseDTO[]
  readonly query: {
    titles: string[],
    terms: string[],
    years: string[],
  }
  readonly refreshed_at: Date
}
