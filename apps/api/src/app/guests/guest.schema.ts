import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document } from 'mongoose'
import pagination from 'mongoose-paginate-v2'

@Schema({ collection: 'guests' })
export class Guest extends Document {
  declare _id: mongoose.Types.ObjectId

  @Prop({ required: true, unique: true })
  email: string

  @Prop()
  name: string

  @Prop()
  avatar: string

  @Prop()
  plex_id: string

  @Prop()
  plex_token: string

  // Token health: Plex expires tokens on inactivity. Set to false when the token no longer works,
  // so a dead guest becomes visible/queryable instead of being silently skipped by keep-in-touch.
  @Prop({ default: true })
  plex_token_valid: boolean

  @Prop()
  plex_token_checked_at: number
}

export const GuestSchema = SchemaFactory.createForClass(Guest)
GuestSchema.plugin(pagination as any)
