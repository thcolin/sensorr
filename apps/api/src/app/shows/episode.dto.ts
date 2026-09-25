export class EpisodeDTO {
  _id: number

  readonly id: number
  readonly show_id: number
  readonly season_number: number
  readonly episode_number: number
  readonly name: string
  readonly overview: string
  readonly air_date: Date
  readonly runtime: number
  readonly still_path: string
  readonly monitored: boolean
  readonly files: { id: string, size: number, title: string, original: string, from?: 'import' | 'sonarr' }[]
  readonly release: string | null
}
