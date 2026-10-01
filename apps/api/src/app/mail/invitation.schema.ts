import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

// The last invitation mailed to an address, so the Friends page tells who was already invited
@Schema({ collection: 'invitations' })
export class Invitation extends Document {
  // Lowercase, the case Plex and Tautulli give an address can differ
  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  invited_at: number
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation)
