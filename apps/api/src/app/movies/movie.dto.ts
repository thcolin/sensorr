import { ReleaseDTO } from './release.dto'

export class MovieDTO {
  _id: number

  readonly adult: boolean
  readonly backdrop_path: string
  readonly belongs_to_collection: {
    id: number
    name: string
    poster_path: string
    backdrop_path: string
  }
  readonly budget: number
  readonly genres: [
    {
      id: number
      name: string
    },
  ]
  readonly homepage: string
  readonly id: number
  readonly imdb_id: string
  readonly plex_guid: string
  readonly plex_url: string
  readonly original_language: string
  readonly original_title: string
  readonly overview: string
  readonly popularity: number
  readonly poster_path: string
  readonly production_companies: [
    {
      id: number
      logo_path: string
      name: string
      origin_country: string
    },
  ]
  readonly production_countries: [
    {
      iso_3166_1: string
      name: string
    },
  ]
  readonly release_date: Date
  readonly revenue: number
  readonly runtime: number
  readonly spoken_languages: [
    {
      iso_639_1: string
      name: string
    },
  ]
  readonly status: string
  readonly tagline: string
  readonly title: string
  readonly state: string
  readonly policy: string
  readonly cared: boolean
  readonly query: {
    titles: string[],
    terms: string[],
    years: string[],
  }
  readonly video: boolean
  readonly vote_average: number
  readonly vote_count: number
  readonly updated_at: number
  readonly cared_at: number
  readonly alternative_titles: {
    titles: [
      {
        iso_3166_1: string
        title: string
        type: string
      },
    ],
  }
  readonly release_dates: {
    results: [
      {
        iso_3166_1: string
        release_dates: [
          {
            certification: string
            iso_639_1: string
            note: string
            release_date: Date
            type: number
          },
        ],
      },
    ]
  }
  readonly banned_releases: string[]
  readonly requested_by: string[]
  readonly releases: ReleaseDTO[]
}
