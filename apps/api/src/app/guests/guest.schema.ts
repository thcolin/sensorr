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
}

export const GuestSchema = SchemaFactory.createForClass(Guest)
GuestSchema.plugin(pagination as any)
