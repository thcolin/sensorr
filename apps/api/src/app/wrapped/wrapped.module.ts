import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Guest, GuestSchema } from '../guests/guest.schema'
import { ConfigService } from '../config/config.service'
import { WrappedController } from './wrapped.controller'
import { WrappedService } from './wrapped.service'
import { Play, PlaySchema, Viewer, ViewerSchema, Title, TitleSchema, Edition, EditionSchema } from './wrapped.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Play.name, schema: PlaySchema },
      { name: Viewer.name, schema: ViewerSchema },
      { name: Title.name, schema: TitleSchema },
      { name: Edition.name, schema: EditionSchema },
      { name: Guest.name, schema: GuestSchema },
    ]),
  ],
  controllers: [WrappedController],
  providers: [WrappedService, ConfigService],
})
export class WrappedModule {}
