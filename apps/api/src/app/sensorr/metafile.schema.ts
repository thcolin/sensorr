import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ collection: 'blackhole' })
export class Metafile extends Document {
  @Prop()
  declare _id: string

  @Prop()
  buffer: Buffer
}

export const MetafileSchema = SchemaFactory.createForClass(Metafile)
