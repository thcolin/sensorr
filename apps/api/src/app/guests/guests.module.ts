import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { MailModule } from '../mail/mail.module'
import { WrappedModule } from '../wrapped/wrapped.module'
import { GuestsController } from './guests.controller'
import { GuestsService } from './guests.service'
import { Play, PlaySchema, Viewer, ViewerSchema } from '../wrapped/wrapped.schema'
import { Guest, GuestSchema } from './guest.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guest.name, schema: GuestSchema },
      { name: Viewer.name, schema: ViewerSchema },
      { name: Play.name, schema: PlaySchema },
    ]),
    MailModule,
    WrappedModule,
  ],
  controllers: [GuestsController],
  providers: [GuestsService, ConfigService],
})
export class GuestsModule {}
