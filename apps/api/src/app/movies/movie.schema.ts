import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import pagination from 'mongoose-paginate-v2'

@Schema()
export class Movie extends Document {
  @Prop()
  _id: number

  @Prop()
  adult: boolean

  @Prop()
  backdrop_path: string

  @Prop(raw({
    id: { type: Number },
    name: { type: String },
    poster_path: { type: String },
    backdrop_path: { type: String },
  }))
  belongs_to_collection: Record<string, any>

  @Prop()
  budget: number

  @Prop([
    {
      id: Number,
      name: String,
    },
  ])
  genres: { id: number, name: String }[]

  @Prop()
  homepage: string

  @Prop()
  id: number

  @Prop()
  imdb_id: string

  @Prop()
  original_language: string

  @Prop()
  original_title: string

  @Prop()
  overview: string

  @Prop()
  popularity: number

  @Prop()
  poster_path: string

  @Prop([
    {
      id: Number,
      logo_path: String,
      name: String,
      origin_country: String,
    }
  ])
  production_companies: {
    id: number
    logo_path: string
    name: string
    origin_country: string
  }[]

  @Prop([
    {
      iso_3166_1: String,
      name: String,
    }
  ])
  production_countries: {
    iso_3166_1: string
    name: string
  }[]

  @Prop()
  release_date: Date

  @Prop()
  revenue: number

  @Prop()
  runtime: number

  @Prop([
    {
      iso_639_1: String,
      name: String,
    }
  ])
  spoken_languages: {
    iso_639_1: string
    name: string
  }[]

  @Prop()
  status: string

  @Prop()
  tagline: string

  @Prop()
  title: string

  @Prop()
  state: string

  @Prop()
  policy: string

  @Prop(raw({
    titles: [String],
    terms: [String],
    years: [String],
  }))
  query: Record<any, any>

  @Prop()
  video: boolean

  @Prop()
  vote_average: number

  @Prop()
  vote_count: number

  @Prop()
  updated_at: number

  @Prop(raw({
    titles: [
      {
        iso_3166_1: String,
        title: String,
        type: { type: String },
      }
    ]
  }))
  alternative_titles: Record<any, any>

  @Prop(raw({
    results: [
      {
        iso_3166_1: String,
        release_dates: [
          {
            certification: String,
            iso_639_1: String,
            note: String,
            release_date: Date,
            type: { type: Number },
          },
        ],
      },
    ],
  }))
  release_dates: Record<any, any>

  @Prop(raw({
    title: String,
    term: String,
    link: String,
    enclosure: String,
    publishDate: Date,
    size: Number,
    seeders: Number,
    peers: Number,
    grabs: Number,
    similarity: Number,
    score: Number,
    valid: Boolean,
    reason: String,
    warning: Number,
    znab: String,
    meta: {
      original: String,
      term: String,
      znab: String,
      language: String,
      source: String,
      encoding: String,
      resolution: String,
      dub: String,
      year: String,
      flags: [String] || null,
      season: Number || null,
      episode: Number || null,
      episodes: [Number],
      type : { type: String },
      group: String || null,
      title: String,
      generated: String,
      score: Number,
    },
  }))
  release: Record<any, any>
}

export const MovieSchema = SchemaFactory.createForClass(Movie)
MovieSchema.plugin(pagination as any)
