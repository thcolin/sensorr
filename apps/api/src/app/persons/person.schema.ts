import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import pagination from 'mongoose-paginate-v2'

@Schema({ collection: 'persons' })
export class Person extends Document {
  @Prop()
  _id: number

  @Prop()
  birthday: Date

  @Prop()
  known_for_department: string

  @Prop()
  deathday: Date

  @Prop()
  id: number

  @Prop()
  name: string

  @Prop()
  also_known_as: string[]

  @Prop()
  gender: number

  @Prop()
  biography: string

  @Prop()
  popularity: number

  @Prop()
  place_of_birth: string

  @Prop()
  profile_path: string

  @Prop()
  adult: boolean

  @Prop()
  imdb_id: string

  @Prop()
  homepage: string

  @Prop()
  state: string

  @Prop()
  updated_at: number
}

export const PersonSchema = SchemaFactory.createForClass(Person)
PersonSchema.plugin(pagination as any)
