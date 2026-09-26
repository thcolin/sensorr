import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document } from 'mongoose'

// One grouped row of the Tautulli history, `_id` is the id of its first session
@Schema({ collection: 'plays' })
export class Play extends Document {
  @Prop()
  declare _id: number

  @Prop({ required: true, index: true })
  user_id: number

  @Prop({ required: true })
  media_type: string

  @Prop({ required: true })
  title: string

  @Prop({ required: true, index: true })
  started: number

  @Prop()
  stopped: number

  @Prop()
  play_duration: number

  // The import run that last saw this row, what a complete run did not see is gone from Tautulli
  @Prop({ index: true })
  seen: string
}

export const PlaySchema = SchemaFactory.createForClass(Play)

@Schema({ collection: 'viewers' })
export class Viewer extends Document {
  @Prop()
  declare _id: number

  @Prop({ index: true })
  email: string

  @Prop()
  username: string

  @Prop()
  friendly_name: string
}

export const ViewerSchema = SchemaFactory.createForClass(Viewer)

// A movie or a show watched on Plex, `_id` is the `title` of its plays
@Schema({ collection: 'titles' })
export class Title extends Document {
  @Prop()
  declare _id: string

  @Prop({ required: true })
  media_type: string

  @Prop()
  title: string

  @Prop()
  year: number

  @Prop({ type: [String] })
  genres: string[]

  @Prop({ type: [String] })
  directors: string[]

  @Prop()
  tmdb_id: number

  @Prop()
  thumb: string

  @Prop()
  art: string

  @Prop()
  duration: number
}

export const TitleSchema = SchemaFactory.createForClass(Title)

@Schema({ collection: 'editions' })
export class Edition extends Document {
  declare _id: mongoose.Types.ObjectId

  @Prop({ required: true })
  year: number

  @Prop({ required: true })
  user_id: number

  @Prop({ type: mongoose.Schema.Types.Mixed })
  wrapped: any

  @Prop()
  frozen_at: number
}

export const EditionSchema = SchemaFactory.createForClass(Edition)
EditionSchema.index({ year: 1, user_id: 1 }, { unique: true })
