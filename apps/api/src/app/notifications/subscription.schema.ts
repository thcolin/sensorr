import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose'
import mongoose, { Document } from 'mongoose'

@Schema({ collection: 'subscriptions' })
export class Subscription extends Document {
  declare _id: mongoose.Types.ObjectId

  @Prop({ required: true, unique: true })
  endpoint: string

  @Prop()
  expirationTime: number

  @Prop(raw({
    auth: { type: String },
    p256dh: { type: String },
  }))
  keys: Record<any, any>
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)
