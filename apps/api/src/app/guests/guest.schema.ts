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

  // Opens this guest's wrapped without an account, replaced to revoke the previous link
  @Prop({ index: { unique: true, sparse: true } })
  wrapped_token: string

  // This friend's look of the wrapped and whether they may switch it, null keeps the edition's or the global one
  @Prop({ type: String, default: null })
  wrapped_theme: string | null

  @Prop({ type: Boolean, default: null })
  wrapped_choice: boolean | null

  // Opens the unsubscribe link of this guest's mails, created with the first mail that carries one
  @Prop({ index: { unique: true, sparse: true } })
  mail_token: string

  // The kinds of mail this guest stopped from their unsubscribe link
  @Prop({ type: [String], default: [] })
  mail_unsubscribed: string[]

  // Reconnect mails sent since the token died, the first one and its reminders, back to 0 once it works again
  @Prop({ default: 0 })
  reconnect_mails: number

  @Prop()
  reconnect_mailed_at: number

  @Prop()
  wrapped_mailed_at: number
}

export const GuestSchema = SchemaFactory.createForClass(Guest)
GuestSchema.plugin(pagination as any)
