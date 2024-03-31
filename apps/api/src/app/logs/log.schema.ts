import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { Document } from 'mongoose'
import pagination from 'mongoose-paginate-v2'

@Schema({ collection: 'log' })
export class Log extends Document {
  declare _id: mongoose.Types.ObjectId

  @Prop()
  timestamp: Date

  @Prop()
  level: string

  @Prop()
  message: string

  @Prop(raw({}))
  meta: Record<any, any>
}

export const LogSchema = SchemaFactory.createForClass(Log)
LogSchema.plugin(pagination as any)
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 1209600 }) // 2 weeks logs expiration
