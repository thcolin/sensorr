import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import pagination from 'mongoose-paginate-v2'

@Schema({ collection: 'shows' })
export class Show extends Document {
  @Prop()
  declare _id: number

  @Prop()
  declare id: number

  @Prop()
  name: string

  @Prop()
  original_name: string

  @Prop()
  original_language: string

  @Prop()
  overview: string

  @Prop()
  first_air_date: Date

  @Prop()
  last_air_date: Date

  @Prop()
  status: string

  @Prop()
  type: string

  @Prop()
  in_production: boolean

  @Prop()
  number_of_seasons: number

  @Prop()
  number_of_episodes: number

  @Prop([Number])
  episode_run_time: number[]

  @Prop([
    {
      id: Number,
      name: String,
    },
  ])
  genres: { id: number, name: string }[]

  @Prop([
    {
      id: Number,
      name: String,
      logo_path: String,
    },
  ])
  networks: { id: number, name: string, logo_path: string }[]

  @Prop([String])
  origin_country: string[]

  @Prop()
  poster_path: string

  @Prop()
  backdrop_path: string

  @Prop()
  popularity: number

  @Prop()
  vote_average: number

  @Prop()
  vote_count: number

  @Prop(raw({
    imdb_id: { type: String },
    tvdb_id: { type: Number },
  }))
  external_ids: Record<string, any>

  @Prop(raw({
    results: [
      {
        iso_3166_1: String,
        title: String,
      }
    ]
  }))
  alternative_titles: Record<any, any>

  @Prop([
    {
      id: Number,
      season_number: Number,
      name: String,
      episode_count: Number,
      air_date: Date,
      poster_path: String,
    },
  ])
  seasons: {
    id: number
    season_number: number
    name: string
    episode_count: number
    air_date: Date
    poster_path: string
  }[]

  @Prop()
  state: string

  @Prop()
  monitored: boolean

  @Prop()
  monitor_new_seasons: boolean

  @Prop()
  policy: string

  @Prop({ type: Boolean })
  proposal_only: boolean | null

  @Prop()
  path: string

  @Prop()
  plex_guid: string

  @Prop(raw([String]))
  requested_by: Record<any, any>

  @Prop(raw([String]))
  banned_releases: Record<any, any>

  @Prop(raw([
    {
      id: String,
      title: String,
      original: String,
      from: String,
      job: String,
      proposal: Boolean,
      znab: String,
      link: String,
      enclosure: String,
      size: Number,
      replaces: [String],
      accepted_at: Number,
      overdue: Boolean,
      coverage: [
        {
          _id: false,
          season: Number,
          episode: Number,
        },
      ],
      torrent: {
        name: String,
        files: [
          {
            _id: false,
            path: String,
            size: Number,
          },
        ],
      },
      imported_at: Number,
    }
  ]))
  releases: Record<any, any>

  @Prop(raw({
    titles: [String],
    terms: [String],
    years: [String],
  }))
  query: Record<any, any>

  @Prop()
  refreshed_at: Date
}

export const ShowSchema = SchemaFactory.createForClass(Show)
ShowSchema.plugin(pagination as any)
