export interface Certification {
  certification: string
  meaning: string
  order: number
}

export interface Collection {
  id: number
  name: string
  original_name?: string | null
  original_language?: string | null
  poster_path: string | null
  backdrop_path: string | null
  overview?: string | null
}

export interface Genre {
  id: number
  name: string
}

export interface Company {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface Country {
  iso_3166_1: string
  name: string
}

export interface Language {
  iso_639_1: string
  name: string
}

export interface Movie {
  adult: boolean
  alternative_titles?: {
    titles: {
      title: string,
      iso_3166_1: string,
    }[]
  }
  backdrop_path: string | null
  belongs_to_collection: Collection | null
  budget: number
  genres: Genre[]
  homepage: string | null
  id: number
  imdb_id: string | null
  original_language: string
  original_title: string | null
  overview: string | null
  popularity: number
  poster_path: string | null
  production_companies: Company[]
  production_countries: Country[]
  release_date: string
  release_dates?: {
    results: {
      iso_3166_1: string,
      release_dates: {
        certification?: string,
        iso_639_1: string,
        release_date: string,
        type: number,
        note?: string,
      }[],
    }[]
  }
  revenue: number
  runtime: number
  spoken_languages: Language[]
  status: 'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled'
  tagline: string | null
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface Person {
  birthday: string | null
  known_for_department: string
  deathday: string | null
  id: number
  name: string
  also_known_as: string[]
  gender: 0 | 1 | 2
  biography: string | null
  popularity: number
  place_of_birth: string | null
  profile_path: string | null
  adult: boolean
  imdb_id: string | null
  homepage: string | null
}

export interface Cast {
  cast_id: number,
  character: string | null,
  credit_id: string | null,
  gender: number | null,
  id: number,
  name: string | null,
  order: number | null,
  profile_path: string | null,
}

export interface Crew {
  credit_id: string,
  department: string | null,
  gender: number | null,
  id: number,
  job: string | null,
  name: string | null,
  profile_path: string | null,
}
