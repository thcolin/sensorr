import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import pagination from 'mongoose-paginate-v2'

@Schema({ collection: 'episodes' })
export class Episode extends Document {
  @Prop()
  declare _id: number

  @Prop()
  declare id: number

  @Prop()
  show_id: number

  @Prop()
  season_number: number

  @Prop()
  episode_number: number

  @Prop()
  name: string

  @Prop()
  overview: string

  @Prop()
  air_date: Date

  @Prop()
  runtime: number

  @Prop()
  still_path: string

  @Prop()
  monitored: boolean

  @Prop(raw([
    {
      _id: false,
      id: String,
      size: Number,
      title: String,
      original: String,
    }
  ]))
  files: Record<any, any>

  @Prop({ type: String })
  release: string | null
}

export const EpisodeSchema = SchemaFactory.createForClass(Episode)
EpisodeSchema.plugin(pagination as any)
EpisodeSchema.index({ show_id: 1, season_number: 1, episode_number: 1 })
EpisodeSchema.index({ air_date: 1 })
