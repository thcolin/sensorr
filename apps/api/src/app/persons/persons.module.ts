import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PersonsController } from './persons.controller'
import { PersonsService } from './persons.service'
import { Person, PersonSchema } from './person.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }])],
  controllers: [PersonsController],
  providers: [PersonsService],
})
export class PersonsModule {}
